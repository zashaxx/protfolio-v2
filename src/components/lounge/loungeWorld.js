// World coordinates match the reference's 36px tiles and 18px movement grid.
export const WORLD = { width: 864, height: 720, tile: 36, step: 18 };
export const ROOM_OBJECTS = [
  { id: "work-desk", type: "desk", label: "workbench", x: 108, y: 108, w: 72, h: 36 },
  { id: "meeting-table", type: "bigtable", label: "meeting table", x: 396, y: 108, w: 72, h: 72 },
  { id: "storage", type: "cabinet", label: "storage", x: 720, y: 108, w: 36, h: 36 },
  { id: "music", type: "music", label: "record player", verb: "play a little lo-fi", x: 288, y: 234, w: 72, h: 44, interactive: true },
  { id: "vending", type: "vending", label: "drinks machine", verb: "grab a cold drink", x: 540, y: 198, w: 40, h: 72, interactive: true },
  { id: "snacks", type: "snacks", label: "snacks machine", verb: "get something crunchy", x: 648, y: 198, w: 40, h: 72, interactive: true },
  { id: "plant", type: "plant", label: "thirsty plant", verb: "give it some water", x: 144, y: 324, w: 36, h: 44, interactive: true },
  { id: "sofa", type: "sofa", label: "comfy sofa", verb: "take a seat", x: 288, y: 396, w: 108, h: 48, interactive: true },
  { id: "chair", type: "chair", label: "reading chair", verb: "put your feet up", x: 450, y: 432, w: 40, h: 44, interactive: true },
  { id: "coffee", type: "coffee", label: "coffee station", verb: "brew a fresh cup", x: 540, y: 396, w: 58, h: 48, interactive: true },
  { id: "arcade", type: "arcade", label: "tiny arcade", verb: "chase a high score", x: 684, y: 414, w: 42, h: 64, interactive: true },
  { id: "books", type: "books", label: "bookshelf", verb: "read a random page", x: 180, y: 522, w: 58, h: 58, interactive: true },
  { id: "lamp", type: "lamp", label: "floor lamp", verb: "change the mood", x: 396, y: 540, w: 30, h: 58, interactive: true },
  { id: "computer", type: "computer", label: "spare computer", verb: "leave a little hello", x: 540, y: 576, w: 72, h: 36, interactive: true },
];

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const radius = 7;
const speed = 145;
const books = [
  "Small steps still move you forward.",
  "Make something just because it makes you happy.",
  "A little rest is part of the process.",
  "Stay curious. There is always another page.",
];

export function createLoungeWorld() {
  return {
    player: { x: 432, y: 342, dir: "down", moving: false, walkTime: 0, seated: null, held: null, heldUntil: 0 },
    objects: ROOM_OBJECTS,
    npcs: [
      { x: 216, y: 216, dir: "down", moving: false, walkTime: 0, name: "little bot", wait: 3, target: 0 },
      { x: 720, y: 558, dir: "left", moving: false, walkTime: 0, name: "quiet bot", wait: 5, target: 0 },
      { id: "motu", type: "motu", x: 432, y: 270, dir: "down", moving: false, walkTime: 0,
        name: "Motu", verb: "talk to Motu", interactive: true, stationary: true },
    ],
    time: 0, music: false, lamp: false, nearest: null,
    used: new Set(), animations: {}, effects: [], path: [], pending: null,
    message: "make yourself at home. everything here is a little break.",
    busyUntil: 0, stepAt: 0, collisionAt: 0, bookPage: 0, arcadeScore: 0,
    returnPosition: null,
  };
}

export function canStand(x, y, objects = ROOM_OBJECTS) {
  if (x < 36 || y < 54 || x > WORLD.width - 36 || y > WORLD.height - 36) return false;
  return !objects.some((o) => x + radius > o.x && x - radius < o.x + o.w
    && y + radius > o.y + 8 && y - radius < o.y + o.h - 4);
}

export function distanceToObject(player, object) {
  return Math.hypot(player.x - clamp(player.x, object.x, object.x + object.w),
    player.y - clamp(player.y, object.y, object.y + object.h));
}

// Actors use a feet anchor; interaction targets use the same visible bounds as
// furniture so keyboard proximity and pointer navigation share one target.
export function interactiveTargets(state) {
  return [
    ...state.objects.filter((object) => object.interactive),
    ...state.npcs.filter((npc) => npc.interactive).map((npc) => ({
      ...npc, label: npc.name, x: npc.x - 14, y: npc.y - 38, w: 28, h: 38,
    })),
  ];
}

export function nearestObject(state) {
  if (state.player.seated) return state.objects.find((o) => o.id === state.player.seated);
  let closest = null, distance = 52;
  for (const object of interactiveTargets(state)) {
    const d = distanceToObject(state.player, object);
    if (d < distance) { closest = object; distance = d; }
  }
  return closest;
}

export function interactionText(state, object = state.nearest) {
  if (state.player.seated) return "stand up";
  if (!object) return "walk up to something";
  if (object.id === "music" && state.music) return "pause the record";
  if (object.id === "lamp") return state.lamp ? "switch the lamp off" : "switch the lamp on";
  return object.verb;
}

function effect(state, object, text, kind = "spark") {
  state.effects.push({ x: object.x + object.w / 2, y: object.y - 8, text, kind, life: 2.2, maxLife: 2.2 });
}

export function standUp(state) {
  if (!state.player.seated) return false;
  if (state.returnPosition) Object.assign(state.player, state.returnPosition);
  state.player.seated = null;
  state.returnPosition = null;
  state.message = "feeling refreshed. where to next?";
  return true;
}

export function interact(state, object = nearestObject(state)) {
  const events = [];
  state.path = []; state.pending = null;
  if (state.player.seated) {
    standUp(state);
    return ["stand"];
  }
  if (!object || !object.interactive || distanceToObject(state.player, object) > 54) {
    state.message = "a little closer… WASD to walk, or click an object to walk over.";
    return events;
  }
  if (state.time < state.busyUntil) return events;
  state.used.add(object.id);
  state.animations[object.id] = { started: state.time, kind: object.type };
  state.player.moving = false;
  state.busyUntil = state.time + 0.4;
  switch (object.type) {
    case "motu":
      state.message = "Motu ♫";
      effect(state, object, "♪", "note");
      events.push("motu");
      break;
    case "music":
      state.music = !state.music;
      state.message = state.music ? "now spinning: a little time off · lo-fi, on repeat." : "record paused. enjoy the quiet.";
      effect(state, object, state.music ? "♪  now playing" : "record paused", "note");
      events.push("toggle");
      break;
    case "vending":
      state.player.held = "drink";
      state.player.heldUntil = state.time + 5;
      state.busyUntil = state.time + 1.1;
      state.message = "ka-chunk. one cold soda, on the house.";
      effect(state, object, "+1 cold drink");
      events.push("coin", "dispense");
      break;
    case "snacks":
      state.player.held = "snack";
      state.player.heldUntil = state.time + 5;
      state.busyUntil = state.time + 1.1;
      state.message = "a little crunch for your coding break. no coins needed.";
      effect(state, object, "+1 crunchy snack");
      events.push("snack");
      break;
    case "sofa":
    case "chair":
      state.returnPosition = { x: state.player.x, y: state.player.y, dir: state.player.dir };
      state.player.x = object.x + object.w / 2;
      state.player.y = object.y + object.h - 9;
      state.player.dir = "down";
      state.player.seated = object.id;
      state.message = "ahh, that's better. F / click to stand, or just start walking.";
      effect(state, object, "a well-earned break", "rest");
      events.push("sit");
      break;
    case "coffee":
      state.player.held = "coffee";
      state.player.heldUntil = state.time + 7;
      state.busyUntil = state.time + 1.2;
      state.message = "brewing… your fresh cup is ready. take it slow.";
      effect(state, object, "+1 fresh coffee", "steam");
      events.push("water");
      break;
    case "arcade":
      state.arcadeScore += 100 + Math.floor(Math.random() * 9) * 25;
      state.busyUntil = state.time + 1.2;
      state.message = `beep boop! tiny arcade score: ${state.arcadeScore}. one more round?`;
      effect(state, object, `${String(state.arcadeScore).padStart(5, "0")} pts`, "arcade");
      events.push("arcade");
      break;
    case "books":
      state.message = `a page from the bookshelf: “${books[state.bookPage++ % books.length]}”`;
      effect(state, object, "one more page…", "page");
      events.push("page");
      break;
    case "plant":
      state.busyUntil = state.time + 0.8;
      state.message = "a little water, a little love. your leafy friend says thanks.";
      effect(state, object, "a happy little plant", "water");
      events.push("plant");
      break;
    case "lamp":
      state.lamp = !state.lamp;
      state.message = state.lamp ? "a warm little pool of light. cozy mode: on." : "lights out. the room is still yours.";
      effect(state, object, state.lamp ? "cozy mode on" : "cozy mode off");
      events.push("toggle");
      break;
    case "computer":
      state.message = "guest@lounge:~$ echo 'hello, world!' → hello, you. glad you're here.";
      effect(state, object, "hello, world!", "page");
      events.push("hello");
      break;
    default: break;
  }
  state.nearest = nearestObject(state);
  return events;
}

// Breadth-first search is bounded to the tiny room. Clicking a furnishing walks
// to an accessible edge, so players never interact through a collision box.
export function pathTo(state, destination, object = null) {
  const step = WORLD.step;
  const cell = (x, y) => ({ x: Math.round(x / step) * step, y: Math.round(y / step) * step });
  const start = cell(state.player.x, state.player.y);
  const key = (p) => `${p.x},${p.y}`;
  const queue = [start], previous = new Map([[key(start), null]]);
  let found = null;
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    const reaches = object
      ? distanceToObject(p, object) <= 28 && p.y >= object.y + object.h + 7
      : Math.hypot(p.x - destination.x, p.y - destination.y) <= step * 0.8;
    if (reaches && canStand(p.x, p.y, state.objects)) { found = p; break; }
    for (const [dx, dy] of [[0, step], [step, 0], [0, -step], [-step, 0]]) {
      const next = { x: p.x + dx, y: p.y + dy };
      if (!previous.has(key(next)) && canStand(next.x, next.y, state.objects)) {
        previous.set(key(next), p); queue.push(next);
      }
    }
  }
  if (!found) return [];
  const path = [];
  for (let p = found; p; p = previous.get(key(p))) path.unshift(p);
  // Start at the current rounded cell rather than cutting across its corner.
  return path.filter((p) => Math.hypot(p.x - state.player.x, p.y - state.player.y) > 1);
}

export function walkToObject(state, object) {
  standUp(state);
  state.path = pathTo(state, null, object);
  state.pending = object.id;
  state.message = `walking to the ${object.label}…`;
  if (!state.path.length) {
    state.pending = null;
    if (distanceToObject(state.player, object) <= 54) return interact(state, object);
    state.message = "can't quite get there. try approaching from the other side.";
  }
  return [];
}

export function updateLounge(state, dt, keys) {
  const events = [];
  state.time += dt;
  const p = state.player;
  let dx = Number(keys.has("right")) - Number(keys.has("left"));
  let dy = Number(keys.has("down")) - Number(keys.has("up"));
  if (dx || dy) {
    if (standUp(state)) events.push("stand");
    state.path = []; state.pending = null;
    const norm = Math.hypot(dx, dy); dx /= norm; dy /= norm;
  } else if (state.path.length) {
    const target = state.path[0], tx = target.x - p.x, ty = target.y - p.y;
    const distance = Math.hypot(tx, ty);
    if (distance <= speed * dt) {
      p.x = target.x; p.y = target.y; state.path.shift();
    } else { dx = tx / distance; dy = ty / distance; }
  }
  const oldX = p.x, oldY = p.y;
  if (!p.seated && (dx || dy)) {
    p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
    if (canStand(p.x + dx * speed * dt, p.y, state.objects)) p.x += dx * speed * dt;
    if (canStand(p.x, p.y + dy * speed * dt, state.objects)) p.y += dy * speed * dt;
    p.moving = Math.hypot(p.x - oldX, p.y - oldY) > 0.01;
    if (!p.moving && state.time - state.collisionAt > 0.45) {
      events.push("collision"); state.collisionAt = state.time;
      // A manual nudge may resolve a corner; a stale auto-route must stop.
      state.path = []; state.pending = null;
    }
  } else p.moving = false;
  p.walkTime += dt;
  if (p.moving && state.time - state.stepAt > 0.22) { events.push("step"); state.stepAt = state.time; }
  if (!state.path.length && state.pending && state.time >= state.busyUntil) {
    const target = interactiveTargets(state).find((o) => o.id === state.pending);
    events.push(...interact(state, target));
  }
  if (p.held && state.time > p.heldUntil) p.held = null;
  state.effects = state.effects.filter((e) => { e.life -= dt; return e.life > 0; });
  for (const [id, animation] of Object.entries(state.animations)) {
    if (state.time - animation.started > 4) delete state.animations[id];
  }
  // Local ambient characters. These are explicitly bots, not online visitors.
  state.npcs.forEach((npc, index) => {
    npc.walkTime += dt; npc.moving = false;
    if (npc.stationary) return;
    npc.wait -= dt;
    if (npc.wait > 0) return;
    const routes = index === 0 ? [[216, 216], [216, 288], [108, 288], [108, 216]]
      : [[720, 558], [756, 558], [756, 630], [684, 630]];
    const [x, y] = routes[npc.target], vx = x - npc.x, vy = y - npc.y, d = Math.hypot(vx, vy);
    if (d < 2) { npc.target = (npc.target + 1) % routes.length; npc.wait = 2.5 + index; return; }
    npc.dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? "right" : "left") : (vy > 0 ? "down" : "up");
    const nx = npc.x + vx / d * 37 * dt, ny = npc.y + vy / d * 37 * dt;
    if (Math.hypot(nx - p.x, ny - p.y) > 28 && canStand(nx, ny, state.objects)) {
      npc.x = nx; npc.y = ny; npc.moving = true;
    }
  });
  state.nearest = nearestObject(state);
  return events;
}

export function loungeSnapshot(state) {
  return {
    message: state.message, nearest: state.nearest?.id ?? null,
    label: state.nearest?.label ?? "", action: interactionText(state),
    discovered: state.used.size, total: interactiveTargets(state).length,
    music: state.music, seated: Boolean(state.player.seated),
    walking: Boolean(state.path.length || state.pending), held: state.player.held,
  };
}
