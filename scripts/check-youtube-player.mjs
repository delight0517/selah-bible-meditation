import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../youtube-player.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'hosted player script exists');

function loadPlayer(query) {
  const messages = [], calls = [];
  const parent = { postMessage: (data, origin) => messages.push({ data, origin }) };
  const window = { parent, location: { search: query, origin: 'https://selah.example' }, addEventListener() {} };
  class Player {
    constructor(_target, options) {
      this.options = options;
      calls.playerOptions = options;
      options.events.onReady({ target: this });
    }
    cuePlaylist(value) { calls.push(['cuePlaylist', value]); }
    playVideo() { calls.push(['playVideo']); }
  }
  const YT = { Player, PlayerState: { PLAYING: 1 } };
  const document = {
    createElement: () => ({}),
    head: { append: () => window.onYouTubeIframeAPIReady() },
  };
  vm.runInNewContext(script, { window, document, location: window.location, URL, URLSearchParams, YT, setInterval, clearInterval });
  return { calls, messages, playerOptions: calls.playerOptions };
}

const playlist = loadPlayer('?playlist=PLfixture&index=7&token=t&parentOrigin=https%3A%2F%2Fselah.example');
assert.equal(JSON.stringify(playlist.calls), JSON.stringify([['cuePlaylist', { listType: 'playlist', list: 'PLfixture', index: 7 }]]));
assert.equal(playlist.playerOptions.playerVars.autoplay, 0);
assert.equal(playlist.messages.at(-1).data.type, 'ready');
const video = loadPlayer('?video=abcdefghijk&token=t&parentOrigin=https%3A%2F%2Fselah.example');
assert.equal(video.calls.length, 0);
assert.equal(video.playerOptions.videoId, 'abcdefghijk');
assert.equal(video.playerOptions.playerVars.autoplay, 0);
console.log('PASS: hosted player cues the selected playlist index without autoplay and loads standalone videos with YouTube controls');
