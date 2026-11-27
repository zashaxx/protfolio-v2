import test from "node:test";
import assert from "node:assert/strict";
import { createLoungeAudio } from "../src/components/lounge/loungeAudio.js";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function audioHarness(t, { delayed = false, fail = false } = {}) {
  const contexts = [], requests = [];
  let release;
  const response = { ok: !fail, arrayBuffer: async () => new ArrayBuffer(8) };
  const responsePromise = delayed ? new Promise((resolve) => { release = () => resolve(response); }) : Promise.resolve(response);
  const parameter = () => ({ value: 0, cancelScheduledValues() {}, setTargetAtTime() {} });
  const node = () => ({ connect(target) { return target; }, disconnect() {} });
  class AudioContextStub {
    constructor() {
      this.state = "suspended";
      this.currentTime = 0;
      this.sampleRate = 48000;
      this.destination = node();
      this.sources = [];
      this.decoded = { duration: 2 };
      contexts.push(this);
    }
    createGain() { return { ...node(), gain: parameter() }; }
    createBuffer() { return { getChannelData: () => new Float32Array(8) }; }
    decodeAudioData() { return Promise.resolve(this.decoded); }
    resume() { this.state = "running"; return Promise.resolve(); }
    close() { this.state = "closed"; return Promise.resolve(); }
    createBufferSource() {
      const source = {
        ...node(), starts: 0, stops: 0,
        start() { this.starts += 1; },
        stop() { this.stops += 1; this.onended?.(); },
      };
      this.sources.push(source);
      return source;
    }
  }
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: { AudioContext: AudioContextStub } });
  t.after(() => {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else delete globalThis.window;
  });
  t.mock.method(globalThis, "fetch", (url, options) => {
    requests.push({ url, options });
    return responsePromise;
  });
  const audio = createLoungeAudio();
  t.after(() => audio.dispose());
  return { audio, contexts, requests, release };
}

test("Motu plays on the first interaction after audio unlock and reuses the decoded local clip", async (t) => {
  const { audio, contexts, requests } = audioHarness(t);
  assert.equal(contexts.length, 0, "audio remains behind a user gesture");
  audio.setEnabled(true);
  void audio.unlock();
  audio.play("motu");
  await flush();
  assert.equal(contexts[0].sources.length, 1);
  const first = contexts[0].sources[0];
  assert.equal(first.buffer, contexts[0].decoded);
  assert.equal(first.starts, 1);
  assert.equal(requests[0].url, "/aileyho.mpeg");
  audio.play("motu");
  await flush();
  assert.equal(requests.length, 1, "replays use the cached clip");
  assert.equal(first.stops, 1, "replays stop the previous voice");
  assert.equal(contexts[0].sources[1].starts, 1);
});

test("Motu respects mute and pause, then permits a fresh interaction after resuming", async (t) => {
  const { audio, contexts } = audioHarness(t);
  await audio.unlock();
  audio.play("motu");
  await flush();
  assert.equal(contexts[0].sources.length, 0, "muted interactions stay silent");
  audio.setEnabled(true);
  audio.play("motu");
  await flush();
  assert.equal(contexts[0].sources.length, 1);
  audio.setPaused(true);
  assert.equal(contexts[0].sources[0].stops, 1);
  audio.play("motu");
  await flush();
  assert.equal(contexts[0].sources.length, 1, "paused interactions stay silent");
  audio.setPaused(false);
  audio.play("motu");
  await flush();
  assert.equal(contexts[0].sources.length, 2);
  audio.setEnabled(false);
  assert.equal(contexts[0].sources[1].stops, 1);
});

test("muting or pausing during loading cancels queued playback", async (t) => {
  for (const change of ["setEnabled", "setPaused"]) {
    await t.test(change, async (subtest) => {
      const { audio, contexts, release } = audioHarness(subtest, { delayed: true });
      audio.setEnabled(true);
      void audio.unlock();
      audio.play("motu");
      audio[change](change === "setPaused");
      release();
      await flush();
      assert.equal(contexts[0].sources.length, 0);
    });
  }
});

test("disposing aborts a pending clip request and cannot play late audio", async (t) => {
  const { audio, contexts, requests, release } = audioHarness(t, { delayed: true });
  audio.setEnabled(true);
  void audio.unlock();
  audio.play("motu");
  audio.dispose();
  assert.equal(requests[0].options.signal.aborted, true);
  assert.equal(contexts[0].state, "closed");
  release();
  await flush();
  audio.play("motu");
  assert.equal(contexts[0].sources.length, 0);
});

test("a missing clip stays silent without rejecting the interaction", async (t) => {
  const { audio, contexts } = audioHarness(t, { fail: true });
  audio.setEnabled(true);
  await audio.unlock();
  audio.play("motu");
  await flush();
  assert.equal(contexts[0].sources.length, 0);
});
