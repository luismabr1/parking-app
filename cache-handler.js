// Custom cache handler for Next.js to disable caching for API routes
module.exports = {
  async get(key) {
    // If the key is for an API route, return null to bypass cache
    if (key.includes("/api/")) {
      return null
    }
    // For other routes, return null to use default behavior
    return null
  },

  async set(key, data, ctx) {
    // Don't cache API routes
    if (key.includes("/api/")) {
      return
    }
    // For other routes, do nothing (let Next.js handle it)
  },

  async revalidateTag(tag) {
    // Implement if needed
  },
}
