import assert from 'node:assert/strict';
import { onRequest } from '../together-worker/pages-proxy/functions/youtube/[[path]].js';

let received;
const env = { SELAH_AUDIO: { fetch: async request => {
  received = request;
  return Response.json({ forwarded: true });
} } };

const get = await onRequest({
  request: new Request('https://gateway.pages.dev/youtube/audio-catalog?locale=ko', {
    headers: { Origin: 'https://delight0517.github.io' }
  }), env
});
assert.deepEqual(await get.json(), { forwarded: true });
assert.equal(received.url, 'https://selah-together/youtube/audio-catalog?locale=ko');
assert.equal(received.headers.get('origin'), 'https://delight0517.github.io');

const post = await onRequest({ request: new Request('https://gateway.pages.dev/youtube/search', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"locale":"en"}'
}), env });
assert.equal(post.status, 200);
assert.equal(await received.text(), '{"locale":"en"}');

assert.equal((await onRequest({ request: new Request('https://gateway.pages.dev/other'), env })).status, 404);
assert.equal((await onRequest({ request: new Request('https://gateway.pages.dev/youtube/search', { method: 'DELETE' }), env })).status, 405);
console.log('Pages audio proxy forwarding checks passed.');
