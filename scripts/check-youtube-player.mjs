import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../youtube-player.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'hosted player script exists');

function loadPlayer(query) {
  const messages = [], calls = [];
  let onMessage;
  const parent = { postMessage: (data, origin) => messages.push({ data, origin }) };
  const window = { parent, location: { search: query, origin: 'https://selah.example' }, addEventListener: (_type, listener) => { onMessage = listener; } };
  class Player {
    constructor(_target, options) {
      this.options = options;
      calls.playerOptions = options;
      options.events.onReady({ target: this });
    }
    cuePlaylist(...args) { calls.push(['cuePlaylist', ...args]); }
    cueVideoById(...args) { calls.push(['cueVideoById', ...args]); }
    playVideo() { calls.push(['playVideo']); }
  }
  const YT = { Player, PlayerState: { PLAYING: 1 } };
  const document = {
    createElement: () => ({}),
    head: { append: () => window.onYouTubeIframeAPIReady() },
  };
  vm.runInNewContext(script, { window, document, location: window.location, URL, URLSearchParams, YT, setInterval, clearInterval });
  return { calls, messages, playerOptions: calls.playerOptions, cueQueue: (token, data) => onMessage({ source: parent, origin: 'https://selah.example', data: { channel: 'selah-youtube-player', token, command: 'cuePlaylist', ...data } }) };
}

const playlist = loadPlayer('?playlist=PLfixture&index=7&token=t&parentOrigin=https%3A%2F%2Fselah.example');
assert.equal(JSON.stringify(playlist.calls), JSON.stringify([['cuePlaylist', { listType: 'playlist', list: 'PLfixture', index: 7, startSeconds: 0 }]]));
assert.equal(Object.hasOwn(playlist.playerOptions, 'videoId'), false, 'playlist initialization omits an undefined videoId');
assert.equal(playlist.playerOptions.playerVars.autoplay, 0);
assert.equal(playlist.messages.at(-1).data.type, 'ready');
const video = loadPlayer('?video=abcdefghijk&token=t&parentOrigin=https%3A%2F%2Fselah.example');
assert.equal(video.calls.length, 0);
assert.equal(video.playerOptions.videoId, 'abcdefghijk');
assert.equal(video.playerOptions.playerVars.autoplay, 0);
const timestampedVideo = loadPlayer('?video=abcdefghijk&startSeconds=754&token=t&parentOrigin=https%3A%2F%2Fselah.example');
assert.deepEqual(JSON.parse(JSON.stringify(timestampedVideo.calls)), [['cueVideoById', { videoId: 'abcdefghijk', startSeconds: 754 }]], 'a directly selected playlist video is cued at its verified passage timestamp');
assert.equal(timestampedVideo.playerOptions.playerVars.autoplay, 0, 'timestamp cue still waits for standard user playback controls');
const autoplayVideo = loadPlayer('?video=abcdefghijk&startSeconds=754&autoplay=1&token=t&parentOrigin=https%3A%2F%2Fselah.example');
assert.equal(autoplayVideo.playerOptions.playerVars.autoplay, 1, 'an explicit reader play request asks YouTube to start playback');
assert.equal(autoplayVideo.playerOptions.playerVars.start, 754, 'explicit autoplay preserves the selected passage timestamp');
assert.equal(autoplayVideo.playerOptions.playerVars.controls, 1, 'YouTube controls remain available if autoplay is blocked');
assert.equal(autoplayVideo.calls.length, 0, 'autoplay initialization is not overwritten by a later cue');
const autoplayPlaylist = loadPlayer('?playlist=PLfixture&index=7&startSeconds=23&autoplay=1&token=t&parentOrigin=https%3A%2F%2Fselah.example');
assert.equal(autoplayPlaylist.playerOptions.playerVars.autoplay, 1);
assert.equal(autoplayPlaylist.playerOptions.playerVars.index, 7, 'explicit autoplay selects the passage-matched playlist item');
assert.equal(autoplayPlaylist.playerOptions.playerVars.start, 23, 'explicit autoplay keeps the verified playlist timestamp');
assert.equal(autoplayPlaylist.playerOptions.playerVars.controls, 1);
assert.equal(autoplayPlaylist.calls.length, 0, 'autoplay playlist initialization is not overwritten by a later cue');
const queued = loadPlayer('?video=abcdefghijk&token=t&parentOrigin=https%3A%2F%2Fselah.example');
assert.equal(queued.calls.length, 0);
queued.cueQueue('t', { videoIds: ['abcdefghijk', '12345678901'], index: 1, startSeconds: 80 });
assert.equal(JSON.stringify(queued.calls), JSON.stringify([['cuePlaylist', ['abcdefghijk', '12345678901'], 1, 80]]));
queued.cueQueue('wrong-token', { videoIds: ['abcdefghijk'], index: 0, startSeconds: 0 });
assert.equal(queued.calls.length, 1, 'rejects a queue from another player token');
assert.equal(queued.playerOptions.playerVars.autoplay, 0);
console.log('PASS: hosted player preserves user-started defaults and requests playback only for explicit reader autoplay, retaining passage cues and YouTube controls');
