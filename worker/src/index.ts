import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { cache } from 'hono/cache'

type Bindings = {
  R2_BUCKET: R2Bucket
  DB: D1Database
  KV_CACHE: KVNamespace
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS middleware
app.use('*', cors({
  origin: ['*'],
  allowMethods: ['GET', 'HEAD', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Range', 'Authorization'],
  exposeHeaders: ['Content-Range', 'Content-Length', 'Accept-Ranges'],
  maxAge: 86400,
}))

// Health check
app.get('/', (c) => {
  return c.json({ service: 'StreamVault Edge', status: 'healthy', version: '1.0.0' })
})

// Video stream endpoint - supports range requests for seeking
app.get('/stream/:videoId', async (c) => {
  const videoId = c.req.param('videoId')
  const bucket = c.env.R2_BUCKET
  const db = c.env.DB

  // Get video metadata from D1
  const video = await db.prepare(`
    SELECT id, r2_key, file_size_bytes, status, visibility, user_id
    FROM videos WHERE id = ? AND status = 'ready'
  `).bind(videoId).first<{
    id: string
    r2_key: string
    file_size_bytes: number
    status: string
    visibility: string
    user_id: string
  }>()

  if (!video || !video.r2_key) {
    return c.json({ error: 'Video not found' }, 404)
  }

  // Track view asynchronously (don't block streaming)
  c.executionCtx.waitUntil(
    db.prepare(`
      UPDATE videos SET views_count = views_count + 1 WHERE id = ?
    `).bind(videoId).run()
  )

  const rangeHeader = c.req.header('range')
  const fileSize = video.file_size_bytes

  if (rangeHeader) {
    const [rangeStart, rangeEnd] = rangeHeader.replace('bytes=', '').split('-')
    const start = parseInt(rangeStart) || 0
    const end = rangeEnd
      ? parseInt(rangeEnd)
      : Math.min(start + 5 * 1024 * 1024 - 1, fileSize - 1) // 5MB default chunk
    const contentLength = end - start + 1

    const object = await bucket.get(video.r2_key, {
      range: { offset: start, length: contentLength },
    })

    if (!object) {
      return c.json({ error: 'Video file not found in storage' }, 404)
    }

    return new Response(object.body, {
      status: 206,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': String(contentLength),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
      },
    })
  }

  // Full file request
  const object = await bucket.get(video.r2_key)
  if (!object) {
    return c.json({ error: 'Video file not found in storage' }, 404)
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': String(fileSize),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
})

// HLS manifest endpoint
app.get('/hls/:videoId/master.m3u8', async (c) => {
  const videoId = c.req.param('videoId')
  const bucket = c.env.R2_BUCKET
  const db = c.env.DB

  const video = await db.prepare(`
    SELECT id, r2_hls_prefix, status, visibility FROM videos
    WHERE id = ? AND status = 'ready'
  `).bind(videoId).first<{
    id: string
    r2_hls_prefix: string
    status: string
    visibility: string
  }>()

  if (!video) {
    return c.json({ error: 'Video not found' }, 404)
  }

  // If HLS manifest exists, serve from R2
  if (video.r2_hls_prefix) {
    const manifest = await bucket.get(`${video.r2_hls_prefix}master.m3u8`)
    if (manifest) {
      return new Response(manifest.body, {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }
  }

  // Generate a simple HLS-like manifest pointing to the raw MP4
  // This enables basic adaptive streaming from the raw file
  const workerUrl = new URL(c.req.url).origin
  const manifest = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1920x1080,NAME="1080p"
${workerUrl}/hls/${videoId}/stream.m3u8
`

  return new Response(manifest, {
    headers: {
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
})

// HLS segment playlist
app.get('/hls/:videoId/stream.m3u8', async (c) => {
  const videoId = c.req.param('videoId')
  const db = c.env.DB

  const video = await db.prepare(`
    SELECT id, r2_key, r2_hls_prefix, duration_seconds, file_size_bytes, status
    FROM videos WHERE id = ? AND status = 'ready'
  `).bind(videoId).first<{
    id: string
    r2_key: string
    r2_hls_prefix: string
    duration_seconds: number
    file_size_bytes: number
    status: string
  }>()

  if (!video) {
    return c.json({ error: 'Video not found' }, 404)
  }

  // If pre-segmented HLS exists, serve from R2
  if (video.r2_hls_prefix) {
    const bucket = c.env.R2_BUCKET
    const playlist = await bucket.get(`${video.r2_hls_prefix}stream.m3u8`)
    if (playlist) {
      return new Response(playlist.body, {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }
  }

  // Generate pseudo-HLS from the MP4 using byte-range addressing
  const duration = video.duration_seconds || 120 // Assume 2 min if unknown
  const segmentDuration = 10 // 10-second segments
  const segmentCount = Math.ceil(duration / segmentDuration)
  const bytesPerSegment = Math.ceil(video.file_size_bytes / segmentCount)

  let playlist = `#EXTM3U
#EXT-X-VERSION:4
#EXT-X-TARGETDURATION:${segmentDuration}
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
`

  const workerUrl = new URL(c.req.url).origin
  for (let i = 0; i < segmentCount; i++) {
    const offset = i * bytesPerSegment
    const length = Math.min(bytesPerSegment, video.file_size_bytes - offset)
    const segDuration = (i === segmentCount - 1) ? (duration - (i * segmentDuration)) : segmentDuration

    playlist += `#EXTINF:${segDuration.toFixed(3)},
#EXT-X-BYTERANGE:${length}@${offset}
${workerUrl}/stream/${videoId}
`
  }

  playlist += '#EXT-X-ENDLIST\n'

  return new Response(playlist, {
    headers: {
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
})

// HLS segment serving (for pre-segmented content)
app.get('/hls/:videoId/:segment', async (c) => {
  const videoId = c.req.param('videoId')
  const segment = c.req.param('segment')
  const bucket = c.env.R2_BUCKET
  const db = c.env.DB

  const video = await db.prepare(`
    SELECT r2_hls_prefix FROM videos WHERE id = ? AND status = 'ready'
  `).bind(videoId).first<{ r2_hls_prefix: string }>()

  if (!video || !video.r2_hls_prefix) {
    return c.json({ error: 'Segment not found' }, 404)
  }

  const object = await bucket.get(`${video.r2_hls_prefix}${segment}`)
  if (!object) {
    return c.json({ error: 'Segment not found' }, 404)
  }

  const contentType = segment.endsWith('.ts')
    ? 'video/mp2t'
    : segment.endsWith('.m4s')
      ? 'video/iso.segment'
      : 'application/octet-stream'

  return new Response(object.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  })
})

// Thumbnail endpoint
app.get('/thumbnail/:videoId', async (c) => {
  const videoId = c.req.param('videoId')
  const bucket = c.env.R2_BUCKET
  const db = c.env.DB

  const video = await db.prepare(`
    SELECT thumbnail_url, user_id FROM videos WHERE id = ? AND status = 'ready'
  `).bind(videoId).first<{ thumbnail_url: string; user_id: string }>()

  if (!video || !video.thumbnail_url) {
    // Return a placeholder SVG
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" fill="#18181b">
      <rect width="1920" height="1080"/>
      <text x="960" y="540" text-anchor="middle" fill="#71717a" font-family="sans-serif" font-size="48">No Thumbnail</text>
    </svg>`
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  const object = await bucket.get(video.thumbnail_url)
  if (!object) {
    return c.json({ error: 'Thumbnail not found' }, 404)
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
})

// Analytics ingestion endpoint
app.post('/analytics', async (c) => {
  const db = c.env.DB
  const body = await c.req.json<{
    videoId: string
    eventType: string
    sessionId?: string
    watchDuration?: number
    quality?: string
  }>()

  if (!body.videoId || !body.eventType) {
    return c.json({ error: 'videoId and eventType are required' }, 400)
  }

  const id = crypto.randomUUID()
  const country = c.req.header('cf-ipcountry') || 'unknown'
  const device = parseDevice(c.req.header('user-agent') || '')
  const referrer = c.req.header('referer') || ''

  // Hash the IP for privacy
  const ip = c.req.header('cf-connecting-ip') || ''
  const ipHash = ip ? await hashString(ip) : ''

  c.executionCtx.waitUntil(
    db.prepare(`
      INSERT INTO video_analytics (id, video_id, session_id, event_type, watch_duration_seconds, quality, country, device, referrer, ip_hash, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.videoId, body.sessionId || '', body.eventType,
      body.watchDuration || 0, body.quality || '', country, device,
      referrer, ipHash, new Date().toISOString()
    ).run()
  )

  return c.json({ success: true })
})

// Embed player page
app.get('/embed/:videoId', async (c) => {
  const videoId = c.req.param('videoId')
  const db = c.env.DB
  const workerUrl = new URL(c.req.url).origin

  const video = await db.prepare(`
    SELECT id, title, visibility, embed_enabled FROM videos
    WHERE id = ? AND status = 'ready'
  `).bind(videoId).first<{
    id: string
    title: string
    visibility: string
    embed_enabled: number
  }>()

  if (!video || !video.embed_enabled) {
    return c.html('<html><body style="background:#000;color:#666;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><p>Video unavailable</p></body></html>')
  }

  const embedConfig = await db.prepare(`
    SELECT * FROM embed_configs WHERE video_id = ?
  `).bind(videoId).first<Record<string, unknown>>()

  const autoplay = embedConfig?.autoplay ? 'autoplay' : ''
  const muted = embedConfig?.muted ? 'muted' : ''
  const loop = embedConfig?.loop ? 'loop' : ''
  const controls = embedConfig?.controls !== 0 ? 'controls' : ''
  const color = (embedConfig?.color as string) || '#6366f1'

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${video.title} - StreamVault</title>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;background:#000;overflow:hidden}
    video{width:100%;height:100%;object-fit:contain}
    .sv-controls{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.8));padding:12px 16px;display:flex;align-items:center;gap:12px;opacity:0;transition:opacity .3s}
    .sv-player:hover .sv-controls{opacity:1}
    .sv-player{position:relative;width:100%;height:100%}
    .sv-progress{flex:1;height:4px;background:rgba(255,255,255,.2);border-radius:2px;cursor:pointer;position:relative}
    .sv-progress-fill{height:100%;background:${color};border-radius:2px;transition:width .1s}
    .sv-btn{background:none;border:none;color:#fff;cursor:pointer;padding:4px;display:flex;align-items:center}
    .sv-time{color:#fff;font-size:12px;font-family:monospace}
    .sv-brand{position:absolute;top:12px;right:12px;color:rgba(255,255,255,.4);font-size:11px;font-family:sans-serif;text-decoration:none}
    .sv-brand:hover{color:rgba(255,255,255,.8)}
  </style>
</head>
<body>
  <div class="sv-player" id="player">
    <video id="video" playsinline ${autoplay} ${muted} ${loop} ${controls}></video>
    ${embedConfig?.branding !== 0 ? '<a class="sv-brand" href="https://streamvault.dev" target="_blank">StreamVault</a>' : ''}
  </div>
  <script>
    const video = document.getElementById('video');
    const src = '${workerUrl}/hls/${videoId}/master.m3u8';
    if (Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 30, maxMaxBufferLength: 60 });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { ${autoplay ? 'video.play().catch(()=>{})' : ''} });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      ${autoplay ? 'video.play().catch(()=>{})' : ''}
    } else {
      video.src = '${workerUrl}/stream/${videoId}';
      ${autoplay ? 'video.play().catch(()=>{})' : ''}
    }

    // Analytics
    fetch('${workerUrl}/analytics', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({videoId:'${videoId}',eventType:'view',sessionId:crypto.randomUUID()})
    }).catch(()=>{});
  </script>
</body>
</html>`

  return c.html(html)
})

// Helper functions
function parseDevice(ua: string): string {
  if (/mobile/i.test(ua)) return 'mobile'
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  if (/smart-tv|smarttv|tv/i.test(ua)) return 'tv'
  return 'desktop'
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}

export default app
