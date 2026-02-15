import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  clearAuthCookie(event)
  return { success: true }
})
