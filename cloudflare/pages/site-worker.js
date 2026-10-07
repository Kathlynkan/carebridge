// The front door of the web link. Anything under /api goes to the CareBridge API Worker (with "/api" taken off);
// everything else is the website itself.
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/')) {
      url.pathname = url.pathname.slice('/api'.length)
      return env.API.fetch(new Request(url, request))
    }
    return env.ASSETS.fetch(request)
  },
}
