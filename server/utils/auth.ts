import { H3Event, createError, getCookie, setCookie, deleteCookie } from 'h3'

const JWT_HEADER = { alg: 'HS256', typ: 'JWT' }

function base64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return atob(str)
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return base64url(String.fromCharCode(...new Uint8Array(signature)))
}

async function hmacVerify(data: string, signature: string, secret: string): Promise<boolean> {
  const expected = await hmacSign(data, secret)
  return expected === signature
}

export interface JWTPayload {
  sub: string
  email: string
  name: string
  plan: string
  iat: number
  exp: number
}

export async function createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, secret: string, expiresInHours = 72): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + (expiresInHours * 3600),
  }
  const header = base64url(JSON.stringify(JWT_HEADER))
  const body = base64url(JSON.stringify(fullPayload))
  const signature = await hmacSign(`${header}.${body}`, secret)
  return `${header}.${body}.${signature}`
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [header, body, signature] = parts
    const valid = await hmacVerify(`${header}.${body}`, signature, secret)
    if (!valid) return null

    const payload: JWTPayload = JSON.parse(base64urlDecode(body))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')

  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${saltHex}:${hashHex}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, expectedHash] = storedHash.split(':')
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))

  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex === expectedHash
}

export async function requireAuth(event: H3Event): Promise<JWTPayload> {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'sv_token') || getHeader(event, 'authorization')?.replace('Bearer ', '')

  if (!token) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const payload = await verifyJWT(token, config.jwtSecret)
  if (!payload) {
    throw createError({ statusCode: 401, message: 'Invalid or expired token' })
  }

  return payload
}

export function setAuthCookie(event: H3Event, token: string) {
  setCookie(event, 'sv_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 72 * 60 * 60,
    path: '/',
  })
}

export function clearAuthCookie(event: H3Event) {
  deleteCookie(event, 'sv_token', { path: '/' })
}

function getHeader(event: H3Event, name: string): string | undefined {
  return event.node.req.headers[name] as string | undefined
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function generateApiKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return 'sv_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}
