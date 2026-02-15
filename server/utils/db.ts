import { H3Event } from 'h3'

// Database utility for Cloudflare D1
// In development, we use a simple in-memory SQLite-compatible store
// In production, this connects to Cloudflare D1

export interface D1Database {
  prepare(query: string): D1PreparedStatement
  exec(query: string): Promise<D1ExecResult>
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(column?: string): Promise<T | null>
  all<T = unknown>(): Promise<D1Result<T>>
  run(): Promise<D1ExecResult>
}

interface D1Result<T = unknown> {
  results: T[]
  success: boolean
  meta: Record<string, unknown>
}

interface D1ExecResult {
  success: boolean
  meta: Record<string, unknown>
}

// In-memory store for development
const memoryStore: Map<string, unknown[]> = new Map()
let devDb: D1Database | null = null

class MemoryPreparedStatement implements D1PreparedStatement {
  private query: string
  private params: unknown[] = []

  constructor(query: string) {
    this.query = query
  }

  bind(...values: unknown[]): D1PreparedStatement {
    this.params = values
    return this
  }

  async first<T = unknown>(_column?: string): Promise<T | null> {
    const result = await this.all<T>()
    return result.results[0] || null
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    // Simple query parser for development
    const results = executeQuery<T>(this.query, this.params)
    return { results, success: true, meta: {} }
  }

  async run(): Promise<D1ExecResult> {
    executeQuery(this.query, this.params)
    return { success: true, meta: {} }
  }
}

// Tables store
const tables: Map<string, { columns: string[], rows: Map<string, Record<string, unknown>> }> = new Map()

function ensureTable(name: string, columns: string[]) {
  if (!tables.has(name)) {
    tables.set(name, { columns, rows: new Map() })
  }
}

// Initialize default tables
function initTables() {
  ensureTable('users', ['id', 'email', 'password_hash', 'name', 'avatar_url', 'plan', 'plan_status', 'plan_expires_at', 'storage_used_bytes', 'bandwidth_used_bytes', 'bandwidth_reset_at', 'api_key', 'crypto_wallet_address', 'created_at', 'updated_at'])
  ensureTable('videos', ['id', 'user_id', 'title', 'description', 'slug', 'status', 'visibility', 'r2_key', 'r2_hls_prefix', 'thumbnail_url', 'duration_seconds', 'file_size_bytes', 'width', 'height', 'codec', 'bitrate', 'fps', 'views_count', 'unique_viewers', 'total_watch_time_seconds', 'category', 'tags', 'password', 'allow_download', 'embed_enabled', 'created_at', 'updated_at'])
  ensureTable('video_analytics', ['id', 'video_id', 'viewer_id', 'session_id', 'event_type', 'timestamp', 'watch_duration_seconds', 'quality', 'country', 'device', 'browser', 'referrer', 'ip_hash'])
  ensureTable('upload_sessions', ['id', 'video_id', 'user_id', 'filename', 'file_size', 'chunk_size', 'total_chunks', 'uploaded_chunks', 'status', 'created_at', 'expires_at'])
  ensureTable('upload_chunks', ['id', 'upload_id', 'video_id', 'chunk_index', 'chunk_size', 'r2_key', 'status', 'created_at'])
  ensureTable('payments', ['id', 'user_id', 'type', 'plan', 'amount_usd', 'crypto_currency', 'crypto_amount', 'crypto_tx_hash', 'crypto_address', 'payment_provider', 'status', 'metadata', 'created_at', 'completed_at'])
  ensureTable('paygo_balance', ['user_id', 'balance_usd', 'total_deposited_usd', 'total_spent_usd', 'last_charge_at'])
  ensureTable('paygo_usage', ['id', 'user_id', 'type', 'amount', 'cost_usd', 'description', 'created_at'])
  ensureTable('api_keys', ['id', 'user_id', 'name', 'key_hash', 'key_prefix', 'permissions', 'last_used_at', 'expires_at', 'created_at'])
  ensureTable('embed_configs', ['id', 'video_id', 'user_id', 'allowed_domains', 'autoplay', 'muted', 'loop', 'controls', 'branding', 'color', 'responsive', 'max_width', 'created_at'])
}

initTables()

function executeQuery<T = unknown>(query: string, params: unknown[]): T[] {
  const trimmed = query.trim().toUpperCase()

  if (trimmed.startsWith('INSERT')) {
    return executeInsert(query, params) as T[]
  } else if (trimmed.startsWith('SELECT')) {
    return executeSelect(query, params) as T[]
  } else if (trimmed.startsWith('UPDATE')) {
    return executeUpdate(query, params) as T[]
  } else if (trimmed.startsWith('DELETE')) {
    return executeDelete(query, params) as T[]
  }

  return []
}

function executeInsert(query: string, params: unknown[]): unknown[] {
  const match = query.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i)
  if (!match) return []

  const tableName = match[1]
  const columns = match[2].split(',').map(c => c.trim())
  const table = tables.get(tableName)
  if (!table) return []

  const row: Record<string, unknown> = {}
  columns.forEach((col, i) => {
    row[col] = params[i] !== undefined ? params[i] : null
  })

  // Set defaults
  if (!row.created_at) row.created_at = new Date().toISOString()
  if (!row.updated_at) row.updated_at = new Date().toISOString()

  const id = (row.id || row.user_id) as string
  table.rows.set(id, row)

  return []
}

function executeSelect(query: string, params: unknown[]): unknown[] {
  const fromMatch = query.match(/FROM\s+(\w+)/i)
  if (!fromMatch) return []

  const tableName = fromMatch[1]
  const table = tables.get(tableName)
  if (!table) return []

  let results = Array.from(table.rows.values())

  // Handle WHERE clauses
  const whereMatch = query.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s+GROUP|\s*$)/i)
  if (whereMatch) {
    const conditions = whereMatch[1]
    let paramIndex = 0

    // Simple AND conditions
    const parts = conditions.split(/\s+AND\s+/i)
    for (const part of parts) {
      const condMatch = part.match(/(\w+)\s*(=|!=|<|>|<=|>=|LIKE|IN)\s*\?/i)
      if (condMatch) {
        const [, col, op] = condMatch
        const value = params[paramIndex++]
        results = results.filter(row => {
          const rowVal = (row as Record<string, unknown>)[col]
          switch (op.toUpperCase()) {
            case '=': return rowVal === value
            case '!=': return rowVal !== value
            case '<': return (rowVal as number) < (value as number)
            case '>': return (rowVal as number) > (value as number)
            case '<=': return (rowVal as number) <= (value as number)
            case '>=': return (rowVal as number) >= (value as number)
            case 'LIKE': return String(rowVal).includes(String(value).replace(/%/g, ''))
            default: return true
          }
        })
      }
    }
  }

  // Handle ORDER BY
  const orderMatch = query.match(/ORDER\s+BY\s+(\w+)\s*(ASC|DESC)?/i)
  if (orderMatch) {
    const [, col, dir] = orderMatch
    results.sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[col]
      const bVal = (b as Record<string, unknown>)[col]
      const cmp = String(aVal || '').localeCompare(String(bVal || ''))
      return dir?.toUpperCase() === 'DESC' ? -cmp : cmp
    })
  }

  // Handle LIMIT
  const limitMatch = query.match(/LIMIT\s+(\d+)/i)
  if (limitMatch) {
    const limit = parseInt(limitMatch[1])
    const offsetMatch = query.match(/OFFSET\s+(\d+)/i)
    const offset = offsetMatch ? parseInt(offsetMatch[1]) : 0
    results = results.slice(offset, offset + limit)
  }

  // Handle column selection
  const selectMatch = query.match(/SELECT\s+(.+?)\s+FROM/i)
  if (selectMatch && selectMatch[1].trim() !== '*') {
    if (selectMatch[1].includes('COUNT')) {
      return [{ count: results.length }] as unknown[]
    }
    const selectCols = selectMatch[1].split(',').map(c => c.trim())
    results = results.map(row => {
      const filtered: Record<string, unknown> = {}
      for (const col of selectCols) {
        filtered[col] = (row as Record<string, unknown>)[col]
      }
      return filtered
    })
  }

  return results as unknown[]
}

function executeUpdate(query: string, params: unknown[]): unknown[] {
  const match = query.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i)
  if (!match) return []

  const tableName = match[1]
  const table = tables.get(tableName)
  if (!table) return []

  const setClauses = match[2].split(',').map(c => c.trim())
  const whereClause = match[3]

  let paramIndex = 0
  const updates: Record<string, unknown> = {}
  for (const clause of setClauses) {
    const colMatch = clause.match(/(\w+)\s*=\s*\?/i)
    if (colMatch) {
      updates[colMatch[1]] = params[paramIndex++]
    }
  }

  // Find WHERE column
  const whereCol = whereClause.match(/(\w+)\s*=\s*\?/i)
  if (whereCol) {
    const whereValue = params[paramIndex]
    for (const [key, row] of table.rows) {
      if ((row as Record<string, unknown>)[whereCol[1]] === whereValue) {
        Object.assign(row as Record<string, unknown>, updates, { updated_at: new Date().toISOString() })
      }
    }
  }

  return []
}

function executeDelete(query: string, params: unknown[]): unknown[] {
  const match = query.match(/DELETE\s+FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*\?/i)
  if (!match) return []

  const tableName = match[1]
  const col = match[2]
  const table = tables.get(tableName)
  if (!table) return []

  for (const [key, row] of table.rows) {
    if ((row as Record<string, unknown>)[col] === params[0]) {
      table.rows.delete(key)
    }
  }

  return []
}

class MemoryDatabase implements D1Database {
  prepare(query: string): D1PreparedStatement {
    return new MemoryPreparedStatement(query)
  }

  async exec(query: string): Promise<D1ExecResult> {
    return { success: true, meta: {} }
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    const results: D1Result<T>[] = []
    for (const stmt of statements) {
      results.push(await stmt.all<T>())
    }
    return results
  }
}

export function getDb(event?: H3Event): D1Database {
  // In Cloudflare Pages, D1 is available through the platform binding
  if (event) {
    const cf = (event.context as any).cloudflare
    if (cf?.env?.DB) {
      return cf.env.DB as D1Database
    }
  }

  // Development fallback: in-memory database
  if (!devDb) {
    devDb = new MemoryDatabase()
  }
  return devDb
}
