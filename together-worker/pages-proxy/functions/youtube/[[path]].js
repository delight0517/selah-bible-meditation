const audioRoutes = new Set([
  "/youtube/search",
  "/youtube/playlist-coverage",
  "/youtube/audio-catalog"
]);
const allowedMethods = new Set(["GET", "POST", "OPTIONS"]);

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  if (!audioRoutes.has(url.pathname)) return new Response("Not found", { status: 404 });
  if (!allowedMethods.has(request.method)) {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, POST, OPTIONS" } });
  }

  const target = new URL(`${url.pathname}${url.search}`, "https://selah-together");
  return env.SELAH_AUDIO.fetch(new Request(target, request));
}
