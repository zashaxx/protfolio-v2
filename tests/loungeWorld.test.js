import test from "node:test";
import assert from "node:assert/strict";
import { canStand, createLoungeWorld, interact, interactiveTargets, loungeSnapshot, nearestObject, ROOM_OBJECTS, standUp, updateLounge, walkToObject } from "../src/components/lounge/loungeWorld.js";

const noKeys = new Set();
const interactables = interactiveTargets(createLoungeWorld());
function arrive(state, object) {
  const events = walkToObject(state, object);
  for (let i = 0; i < 2400 && (state.path.length || state.pending); i++) {
    events.push(...updateLounge(state, 1 / 60, noKeys));
    if (!state.player.seated) assert.ok(canStand(state.player.x, state.player.y), "route must stay on walkable floor");
  }
  return events;
}

test("every object is reachable from every other object without crossing furniture", () => {
  for (const from of interactables) {
    for (const to of interactables) {
      const state = createLoungeWorld();
      arrive(state, from);
      standUp(state);
      updateLounge(state, 2, noKeys);
      arrive(state, to);
      assert.ok(state.used.has(to.id), `${from.id} → ${to.id} should interact on arrival`);
      assert.equal(state.pending, null);
    }
  }
});

test("WASD stops at room boundaries and furniture", () => {
  const state = createLoungeWorld();
  for (const direction of ["up", "right", "down", "left"]) {
    for (let frame = 0; frame < 900; frame++) {
      updateLounge(state, 1 / 60, new Set([direction]));
      assert.ok(canStand(state.player.x, state.player.y));
    }
  }
});

test("diagonal movement has the same speed as straight movement", () => {
  const straight = createLoungeWorld(), diagonal = createLoungeWorld();
  updateLounge(straight, 0.1, new Set(["right"]));
  updateLounge(diagonal, 0.1, new Set(["down", "right"]));
  const travelled = (s) => Math.hypot(s.player.x - 432, s.player.y - 342);
  assert.ok(Math.abs(travelled(straight) - travelled(diagonal)) < 0.001);
});

test("objects cannot be used from across the room", () => {
  const state = createLoungeWorld();
  const vending = interactables.find((o) => o.id === "vending");
  assert.deepEqual(interact(state, vending), []);
  assert.equal(state.used.size, 0);
  assert.equal(state.player.held, null);
});

test("both seats let the player stand using F or movement", () => {
  for (const id of ["sofa", "chair"]) {
    const state = createLoungeWorld(), seat = interactables.find((o) => o.id === id);
    arrive(state, seat);
    assert.equal(state.player.seated, id);
    assert.deepEqual(interact(state), ["stand"]);
    assert.equal(state.player.seated, null);
    assert.ok(canStand(state.player.x, state.player.y));
    updateLounge(state, 1, noKeys);
    arrive(state, seat);
    updateLounge(state, 1 / 60, new Set(["down"]));
    assert.equal(state.player.seated, null);
    assert.ok(canStand(state.player.x, state.player.y));
  }
});

test("consumables are carried temporarily and machines debounce repeated use", () => {
  const state = createLoungeWorld();
  const machine = interactables.find((o) => o.id === "vending");
  arrive(state, machine);
  assert.equal(state.player.held, "drink");
  assert.deepEqual(interact(state, machine), []);
  updateLounge(state, 6, noKeys);
  assert.equal(state.player.held, null);
  assert.ok(interact(state, machine).includes("dispense"));
});

test("a queued machine interaction waits for the previous dispense to finish", () => {
  const state = createLoungeWorld();
  arrive(state, interactables.find((o) => o.id === "vending"));
  arrive(state, interactables.find((o) => o.id === "snacks"));
  assert.equal(state.player.held, "snack");
  assert.ok(state.used.has("snacks"));
  assert.equal(state.pending, null);
});

test("WASD cancels click navigation and discovering the same object counts once", () => {
  const state = createLoungeWorld(), music = interactables.find((o) => o.id === "music");
  walkToObject(state, music);
  assert.ok(state.path.length);
  updateLounge(state, 1 / 60, new Set(["down"]));
  assert.equal(state.path.length, 0);
  assert.equal(state.pending, null);
  arrive(state, music);
  assert.equal(state.music, true);
  updateLounge(state, 1, noKeys);
  interact(state, music);
  assert.equal(state.music, false);
  assert.equal(state.used.size, 1);
});

test("Motu is reachable by click navigation and triggers her audio on arrival", () => {
  const state = createLoungeWorld();
  const motu = interactiveTargets(state).find((target) => target.id === "motu");
  const npc = state.npcs.find((character) => character.id === "motu");
  assert.equal(state.npcs.length, 3);
  assert.equal(motu.label, "Motu");
  assert.equal(motu.x + motu.w / 2, npc.x);
  assert.equal(motu.y + motu.h, npc.y);
  assert.ok(arrive(state, motu).includes("motu"));
  assert.equal(state.pending, null);
  assert.equal(nearestObject(state).id, "motu");
  assert.equal(loungeSnapshot(state).action, "talk to Motu");
  assert.equal(loungeSnapshot(state).total, ROOM_OBJECTS.filter((object) => object.interactive).length + 1);
});

test("Motu only plays nearby and debounces repeated interaction", () => {
  const state = createLoungeWorld();
  const motu = interactiveTargets(state).find((target) => target.id === "motu");
  assert.deepEqual(interact(state, motu), []);
  assert.equal(state.used.has("motu"), false);
  arrive(state, motu);
  assert.deepEqual(interact(state), []);
  updateLounge(state, 0.5, noKeys);
  assert.deepEqual(interact(state), ["motu"]);
  assert.equal(state.used.size, 1);
});

test("Motu walks away after a close interaction without requiring the player to move", () => {
  const state = createLoungeWorld();
  const npc = state.npcs.find((character) => character.id === "motu");
  arrive(state, interactiveTargets(state).find((target) => target.id === "motu"));
  const position = { x: npc.x, y: npc.y };
  assert.ok(Math.hypot(npc.x - state.player.x, npc.y - state.player.y) < 28);
  for (let frame = 0; frame < 300; frame++) updateLounge(state, 1 / 60, noKeys);
  assert.ok(Math.hypot(npc.x - position.x, npc.y - position.y) > 30);
});

test("WASD cancels a pending visit to Motu before her audio plays", () => {
  const state = createLoungeWorld();
  const motu = interactiveTargets(state).find((target) => target.id === "motu");
  walkToObject(state, motu);
  assert.equal(state.pending, "motu");
  assert.ok(state.path.length);
  const events = updateLounge(state, 1 / 60, new Set(["down"]));
  assert.equal(state.pending, null);
  assert.equal(state.path.length, 0);
  assert.equal(events.includes("motu"), false);
  assert.equal(state.used.has("motu"), false);
});

test("Motu roams around the room on walkable floor with live interaction bounds", () => {
  const state = createLoungeWorld();
  const npc = state.npcs.find((character) => character.id === "motu");
  let travelled = 0, minX = npc.x, maxX = npc.x, minY = npc.y, maxY = npc.y;
  for (let frame = 0; frame < 7200; frame++) {
    const previous = { x: npc.x, y: npc.y };
    updateLounge(state, 1 / 60, noKeys);
    travelled += Math.hypot(npc.x - previous.x, npc.y - previous.y);
    minX = Math.min(minX, npc.x); maxX = Math.max(maxX, npc.x);
    minY = Math.min(minY, npc.y); maxY = Math.max(maxY, npc.y);
    assert.ok(canStand(npc.x, npc.y), "Motu never crosses furniture or room boundaries");
    const target = interactiveTargets(state).find((character) => character.id === "motu");
    assert.equal(target.x + target.w / 2, npc.x);
    assert.equal(target.y + target.h, npc.y);
  }
  assert.ok(travelled > 1000, "Motu keeps roaming over several circuits");
  assert.ok(maxX - minX > 80 && maxY - minY > 60, "Motu walks in both directions");
});

test("clicking a roaming Motu uses her current position and holds her until arrival", () => {
  const state = createLoungeWorld();
  const oldTarget = interactiveTargets(state).find((target) => target.id === "motu");
  const npc = state.npcs.find((character) => character.id === "motu");
  for (let frame = 0; frame < 240; frame++) updateLounge(state, 1 / 60, noKeys);
  assert.ok(npc.x - (oldTarget.x + oldTarget.w / 2) > 50, "Motu moved away from her previous bounds");
  state.player.x = 72; state.player.y = 648;
  const clickedPosition = { x: npc.x, y: npc.y };
  walkToObject(state, oldTarget);
  const events = [];
  for (let frame = 0; frame < 2400 && state.pending; frame++) {
    events.push(...updateLounge(state, 1 / 60, noKeys));
    assert.deepEqual({ x: npc.x, y: npc.y }, clickedPosition, "Motu waits for her approaching visitor");
  }
  assert.equal(events.filter((event) => event === "motu").length, 1);
  assert.equal(state.pending, null);
  assert.ok(state.used.has("motu"));
  for (let frame = 0; frame < 600; frame++) updateLounge(state, 1 / 60, noKeys);
  assert.notDeepEqual({ x: npc.x, y: npc.y }, clickedPosition, "Motu resumes roaming after talking");
});

test("interacting with Motu checks her current position instead of stale bounds", () => {
  const state = createLoungeWorld();
  const oldTarget = interactiveTargets(state).find((target) => target.id === "motu");
  const npc = state.npcs.find((character) => character.id === "motu");
  for (let frame = 0; frame < 240; frame++) updateLounge(state, 1 / 60, noKeys);
  state.player.x = oldTarget.x + oldTarget.w / 2; state.player.y = oldTarget.y + oldTarget.h + 18;
  assert.deepEqual(interact(state, oldTarget), [], "Motu has left the old interaction range");
  state.player.x = npc.x; state.player.y = npc.y + 18;
  assert.deepEqual(interact(state, oldTarget), ["motu"], "Motu can be used at her new position");
});

test("canceling a visit releases Motu to roam again without playing audio", () => {
  const state = createLoungeWorld();
  state.player.x = 72; state.player.y = 648;
  const npc = state.npcs.find((character) => character.id === "motu");
  const start = { x: npc.x, y: npc.y };
  walkToObject(state, interactiveTargets(state).find((target) => target.id === "motu"));
  for (let frame = 0; frame < 60; frame++) updateLounge(state, 1 / 60, noKeys);
  assert.equal(state.pending, "motu");
  assert.deepEqual({ x: npc.x, y: npc.y }, start);
  const events = updateLounge(state, 1 / 60, new Set(["down"]));
  for (let frame = 0; frame < 360; frame++) events.push(...updateLounge(state, 1 / 60, noKeys));
  assert.equal(state.pending, null);
  assert.equal(events.includes("motu"), false);
  assert.ok(Math.hypot(npc.x - start.x, npc.y - start.y) > 20);
});

test("Motu stops before the player and continues when the way clears", () => {
  const state = createLoungeWorld();
  const npc = state.npcs.find((character) => character.id === "motu");
  state.player.x = npc.x + 29; state.player.y = npc.y;
  for (let frame = 0; frame < 360; frame++) {
    updateLounge(state, 1 / 60, noKeys);
    assert.ok(Math.hypot(npc.x - state.player.x, npc.y - state.player.y) >= 28);
    assert.ok(npc.x < state.player.x, "Motu never crosses through the player");
  }
  const blockedX = npc.x;
  state.player.x = 432; state.player.y = 342;
  for (let frame = 0; frame < 120; frame++) updateLounge(state, 1 / 60, noKeys);
  assert.ok(npc.x > blockedX + 50);
});
