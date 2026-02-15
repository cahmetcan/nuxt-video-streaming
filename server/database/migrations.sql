-- StreamVault Database Schema for Cloudflare D1

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK(plan IN ('free', 'starter', 'pro', 'enterprise', 'paygo')),
  plan_status TEXT DEFAULT 'active' CHECK(plan_status IN ('active', 'cancelled', 'past_due', 'trialing')),
  plan_expires_at TEXT,
  storage_used_bytes INTEGER DEFAULT 0,
  bandwidth_used_bytes INTEGER DEFAULT 0,
  bandwidth_reset_at TEXT,
  api_key TEXT UNIQUE,
  crypto_wallet_address TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT,
  status TEXT DEFAULT 'uploading' CHECK(status IN ('uploading', 'processing', 'ready', 'error', 'deleted')),
  visibility TEXT DEFAULT 'private' CHECK(visibility IN ('public', 'unlisted', 'private')),
  r2_key TEXT,
  r2_hls_prefix TEXT,
  thumbnail_url TEXT,
  duration_seconds REAL,
  file_size_bytes INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  codec TEXT,
  bitrate INTEGER,
  fps REAL,
  views_count INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  total_watch_time_seconds REAL DEFAULT 0,
  category TEXT,
  tags TEXT,
  password TEXT,
  allow_download INTEGER DEFAULT 0,
  embed_enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Video analytics table
CREATE TABLE IF NOT EXISTS video_analytics (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL,
  viewer_id TEXT,
  session_id TEXT,
  event_type TEXT NOT NULL CHECK(event_type IN ('view', 'play', 'pause', 'seek', 'buffer', 'quality_change', 'complete', 'error')),
  timestamp TEXT DEFAULT (datetime('now')),
  watch_duration_seconds REAL DEFAULT 0,
  quality TEXT,
  country TEXT,
  device TEXT,
  browser TEXT,
  referrer TEXT,
  ip_hash TEXT,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- Upload chunks tracking for resumable uploads
CREATE TABLE IF NOT EXISTS upload_chunks (
  id TEXT PRIMARY KEY,
  upload_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_size INTEGER NOT NULL,
  r2_key TEXT NOT NULL,
  status TEXT DEFAULT 'uploaded' CHECK(status IN ('uploading', 'uploaded', 'merged')),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(upload_id, chunk_index)
);

-- Upload sessions for resumable uploads
CREATE TABLE IF NOT EXISTS upload_sessions (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  chunk_size INTEGER NOT NULL DEFAULT 10485760,
  total_chunks INTEGER NOT NULL,
  uploaded_chunks INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled', 'expired')),
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('subscription', 'paygo_topup', 'one_time')),
  plan TEXT,
  amount_usd REAL NOT NULL,
  crypto_currency TEXT,
  crypto_amount TEXT,
  crypto_tx_hash TEXT,
  crypto_address TEXT,
  payment_provider TEXT DEFAULT 'crypto',
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirming', 'completed', 'failed', 'refunded', 'expired')),
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Pay-as-you-go balance
CREATE TABLE IF NOT EXISTS paygo_balance (
  user_id TEXT PRIMARY KEY,
  balance_usd REAL DEFAULT 0,
  total_deposited_usd REAL DEFAULT 0,
  total_spent_usd REAL DEFAULT 0,
  last_charge_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Pay-as-you-go usage log
CREATE TABLE IF NOT EXISTS paygo_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('storage', 'bandwidth', 'transcode', 'api_call')),
  amount REAL NOT NULL,
  cost_usd REAL NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- API keys for programmatic access
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions TEXT DEFAULT 'read',
  last_used_at TEXT,
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Embed configurations
CREATE TABLE IF NOT EXISTS embed_configs (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  allowed_domains TEXT,
  autoplay INTEGER DEFAULT 0,
  muted INTEGER DEFAULT 0,
  loop INTEGER DEFAULT 0,
  controls INTEGER DEFAULT 1,
  branding INTEGER DEFAULT 1,
  color TEXT DEFAULT '#6366f1',
  responsive INTEGER DEFAULT 1,
  max_width INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_visibility ON videos(visibility);
CREATE INDEX IF NOT EXISTS idx_videos_slug ON videos(slug);
CREATE INDEX IF NOT EXISTS idx_video_analytics_video_id ON video_analytics(video_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_timestamp ON video_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_upload_chunks_upload_id ON upload_chunks(upload_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_user_id ON upload_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_paygo_usage_user_id ON paygo_usage(user_id);
