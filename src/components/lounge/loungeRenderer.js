// The original playground sprites are kept at their native pixel resolution.
// Additional furniture uses the same small grayscale palette and hard edges.
import { WORLD } from "./loungeWorld";

const { width: WORLD_WIDTH, height: WORLD_HEIGHT, tile: TILE } = WORLD;
const SPRITES = ["character", "character_shadow", "desk", "table", "computer", "big_table", "cabinet_1"];
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export async function loadLoungeAssets() {
  const base = `${import.meta.env.BASE_URL}game/lounge/`;
  return Object.fromEntries(await Promise.all(SPRITES.map((name) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve([name, image]);
    image.onerror = () => reject(new Error(`Could not load lounge sprite: ${name}`));
    image.src = `${base}${name}.png`;
  }))));
}

export function cameraFor(state, width, height) {
  return {
    x: Math.round(width > WORLD_WIDTH ? (WORLD_WIDTH - width) / 2 : clamp(state.player.x - width / 2, 0, WORLD_WIDTH - width)),
    y: Math.round(height > WORLD_HEIGHT ? (WORLD_HEIGHT - height) / 2 : clamp(state.player.y - height / 2, 0, WORLD_HEIGHT - height)),
  };
}

function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function line(ctx, x, y, x2, y2, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(Math.round(x) + 0.5, Math.round(y) + 0.5);
  ctx.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
  ctx.stroke();
}

function circle(ctx, x, y, radius, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

// A clipped-corner rectangle retains the original sprites' pixel silhouette.
function panel(ctx, x, y, w, h, fill, edge = "#575757", corner = 2) {
  rect(ctx, x + corner, y, w - corner * 2, h, edge);
  rect(ctx, x, y + corner, w, h - corner * 2, edge);
  rect(ctx, x + 1 + corner, y + 1, w - 2 - corner * 2, h - 2, fill);
  rect(ctx, x + 1, y + 1 + corner, w - 2, h - 2 - corner * 2, fill);
}

function text(ctx, value, x, y, color, size = 9, align = "center") {
  ctx.font = `500 ${size}px "Geist Mono", "SFMono-Regular", Consolas, monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(value, Math.round(x), Math.round(y));
}

function sprite(ctx, image, x, y, w, h) {
  if (image?.complete && image.naturalWidth) ctx.drawImage(image, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function steam(ctx, x, y, time, quiet, color) {
  for (let index = 0; index < 3; index += 1) {
    const rise = quiet ? index * 3 : (time * 11 + index * 4) % 15;
    ctx.save();
    ctx.globalAlpha *= (1 - rise / 18) * 0.55;
    line(ctx, x + index * 4 + Math.sin(rise * 0.4), y - rise, x + index * 4 + 2 + Math.sin(rise * 0.4), y - rise - 3, color);
    ctx.restore();
  }
}

function note(ctx, x, y, color, size = 1) {
  rect(ctx, x + 3 * size, y - 7 * size, size, 8 * size, color);
  rect(ctx, x, y, 4 * size, 2 * size, color);
  rect(ctx, x + size, y - size, 3 * size, size, color);
  rect(ctx, x + 4 * size, y - 7 * size, 3 * size, 2 * size, color);
}

function drink(ctx, x, y, kind = "drink") {
  if (kind === "snack") {
    panel(ctx, x - 3, y - 5, 7, 9, "#bcbcbc", "#555", 1);
    rect(ctx, x - 2, y - 4, 5, 1, "#e7e7e7");
    rect(ctx, x - 1, y - 1, 3, 3, "#777");
  } else if (kind === "coffee") {
    panel(ctx, x - 3, y - 4, 7, 7, "#d3d3d3", "#555", 1);
    rect(ctx, x + 4, y - 2, 2, 3, "#999");
    rect(ctx, x - 2, y - 3, 5, 1, "#666");
  } else {
    panel(ctx, x - 2, y - 5, 6, 10, "#bdbdbd", "#525252", 1);
    rect(ctx, x - 1, y - 4, 4, 1, "#e8e8e8");
    rect(ctx, x - 1, y - 1, 4, 3, "#777");
  }
}

function drawMusic(ctx, o, state, quiet, palette) {
  const { x, y, w, h } = o;
  const top = y - 4;
  panel(ctx, x, top, w, h + 4, "#929292");
  rect(ctx, x + 2, top + 2, w - 4, 3, "#bdbdbd");
  const speaker = Math.max(12, Math.round(w * 0.23));
  for (const sx of [x + 4, x + w - speaker - 4]) {
    panel(ctx, sx, top + 8, speaker, h - 7, "#424242", "#535353", 1);
    circle(ctx, sx + speaker / 2, top + h * 0.6, speaker * 0.36, "#2a2a2a");
    circle(ctx, sx + speaker / 2, top + h * 0.6, speaker * 0.2, "#737373");
    circle(ctx, sx + speaker / 2, top + 13, 2, "#8b8b8b");
  }
  const mx = x + w / 2;
  circle(ctx, mx, top + 19, Math.min(11, w * 0.14), "#333");
  circle(ctx, mx, top + 19, 5, "#6f6f6f");
  circle(ctx, mx, top + 19, 1.5, "#c7c7c7");
  const spin = state.music && !quiet ? state.time * 2.6 : 0.6;
  line(ctx, mx + Math.cos(spin) * 6, top + 19 + Math.sin(spin) * 6, mx + Math.cos(spin) * 8, top + 19 + Math.sin(spin) * 8, "#999");
  line(ctx, mx + 11, top + 9, mx + 9, top + 21, "#c2c2c2", 2);
  rect(ctx, mx - 9, top + h - 6, 18, 4, "#414141");
  for (let i = 0; i < 6; i += 1) {
    const level = state.music ? (quiet ? 2 : 1 + Math.floor((Math.sin(state.time * 5 + i * 1.8) + 1) * 1.2)) : 1;
    rect(ctx, mx - 7 + i * 3, top + h - 2 - level, 1, level, "#cfcfcf");
  }
  rect(ctx, x + 4, y + h, 5, 3, "#515151");
  rect(ctx, x + w - 9, y + h, 5, 3, "#515151");
  if (state.music) {
    for (let i = 0; i < 3; i += 1) {
      const rise = quiet ? i * 8 : (state.time * 12 + i * 13) % 38;
      ctx.save();
      ctx.globalAlpha = (1 - rise / 42) * 0.75;
      note(ctx, mx - 17 + i * 16 + (quiet ? 0 : Math.sin(state.time * 1.5 + i) * 4), top - 6 - rise, palette.soft);
      ctx.restore();
    }
  }
}

function drawMachine(ctx, o, state, quiet) {
  const { x, y, w, h } = o;
  const snack = o.type === "snacks";
  const animation = state.animations[o.id];
  const age = animation ? state.time - animation.started : 10;
  const shaking = !quiet && age >= 0 && age < 0.6;
  ctx.save();
  if (shaking) ctx.translate(Math.round(Math.sin(age * 60) * 1.5), 0);
  panel(ctx, x, y - 8, w, h + 8, "#a6a6a6");
  rect(ctx, x + 2, y - 6, w - 4, 6, "#cecece");
  text(ctx, snack ? "SNACKS" : "DRINKS", x + w / 2, y - 3, "#515151", Math.min(6, w / 6));
  panel(ctx, x + 4, y + 3, w - 14, h - 16, "#353535", "#666", 1);
  const cols = snack ? 2 : 3;
  for (let row = 0; row < 3; row += 1) {
    const yy = y + 6 + row * ((h - 21) / 3);
    for (let col = 0; col < cols; col += 1) {
      const xx = x + 6 + col * ((w - 19) / cols);
      if (snack) {
        rect(ctx, xx, yy, 5, 7, ["#9f9f9f", "#c1c1c1", "#888"][row]);
        rect(ctx, xx + 1, yy + 2, 3, 2, "#575757");
      } else {
        rect(ctx, xx, yy, 3, 6, col % 2 ? "#e0e0e0" : "#929292");
        rect(ctx, xx, yy, 3, 1, "#d7d7d7");
      }
    }
    line(ctx, x + 5, yy + 8, x + w - 12, yy + 8, "#747474");
  }
  rect(ctx, x + w - 8, y + 5, 4, 6, "#e2e2e2");
  rect(ctx, x + w - 8, y + 15, 4, 2, "#484848");
  rect(ctx, x + w - 7, y + 22, 2, 2, "#dedede");
  panel(ctx, x + 6, y + h - 10, w - 12, 7, "#353535", "#797979", 1);
  rect(ctx, x + 3, y + h, 5, 3, "#4d4d4d");
  rect(ctx, x + w - 8, y + h, 5, 3, "#4d4d4d");
  if (age >= 0 && age < 1.4) {
    const fall = quiet ? 1 : clamp((age - 0.25) * 3, 0, 1);
    drink(ctx, x + w / 2, y + h - 12 + fall * 17, snack ? "snack" : "drink");
  }
  ctx.restore();
}

function drawSofa(ctx, o, single) {
  const { x, y, w, h } = o;
  panel(ctx, x + 3, y - 6, w - 6, h + 3, "#737373", "#525252", 3);
  panel(ctx, x + 5, y - 3, w - 10, Math.round(h * 0.6), "#b2b2b2", "#888", 2);
  line(ctx, x + 8, y - 1, x + w - 8, y - 1, "#ccc");
  const count = single ? 1 : 3;
  const cushion = (w - 16) / count;
  for (let i = 0; i < count; i += 1) {
    panel(ctx, x + 8 + i * cushion, y + h * 0.4, cushion - 1, h * 0.45, "#a0a0a0", "#777", 1);
    line(ctx, x + 10 + i * cushion, y + h * 0.4 + 2, x + 5 + (i + 1) * cushion, y + h * 0.4 + 2, "#bdbdbd");
  }
  panel(ctx, x, y + 5, 8, h - 5, "#929292", "#5e5e5e", 2);
  panel(ctx, x + w - 8, y + 5, 8, h - 5, "#929292", "#5e5e5e", 2);
  rect(ctx, x + 8, y + h - 3, w - 16, 4, "#6c6c6c");
  rect(ctx, x + 5, y + h, 5, 3, "#444");
  rect(ctx, x + w - 10, y + h, 5, 3, "#444");
}

function drawCoffee(ctx, o, state, quiet, palette) {
  const { x, y, w, h } = o;
  panel(ctx, x, y + h - 11, w, 10, "#888", "#535353", 1);
  rect(ctx, x + 3, y + h - 1, 4, 5, "#4d4d4d");
  rect(ctx, x + w - 7, y + h - 1, 4, 5, "#4d4d4d");
  panel(ctx, x + 6, y - 4, w - 23, h - 8, "#aaa", "#555", 2);
  rect(ctx, x + 9, y - 2, w - 29, 4, "#d3d3d3");
  rect(ctx, x + 10, y + 6, w - 31, 6, "#686868");
  circle(ctx, x + 15, y + 9, 2, "#d3d3d3");
  rect(ctx, x + w - 26, y + 8, 3, 2, "#d7d7d7");
  rect(ctx, x + 13, y + 14, 3, 6, "#494949");
  rect(ctx, x + 16, y + 16, 9, 2, "#494949");
  panel(ctx, x + 11, y + h - 14, w - 33, 5, "#505050", "#777", 1);
  drink(ctx, x + 18, y + h - 17, "coffee");
  drink(ctx, x + w - 9, y + h - 14, "coffee");
  const animation = state.animations[o.id];
  const brewing = animation && state.time - animation.started < 2.4;
  if (brewing) {
    if (!quiet) rect(ctx, x + 14, y + 20, 1, Math.max(1, h - 37), "#757575");
    steam(ctx, x + 13, y + h - 22, state.time, quiet, palette.soft);
  } else {
    steam(ctx, x + w - 13, y + h - 20, state.time * 0.6, quiet, palette.soft);
  }
}

function drawArcade(ctx, o, state, quiet) {
  const { x, y, w, h } = o;
  const age = state.animations[o.id] ? state.time - state.animations[o.id].started : 99;
  panel(ctx, x + 2, y - 9, w - 4, h + 9, "#898989", "#505050", 2);
  panel(ctx, x, y - 11, w, 9, "#bebebe", "#555", 1);
  text(ctx, "ARCADE", x + w / 2, y - 7, "#5e5e5e", Math.min(6, w / 6));
  panel(ctx, x + 5, y + 1, w - 10, h * 0.46, "#2c2c2c", "#b0b0b0", 1);
  if (age < 2.5) {
    for (let j = 0; j < 8; j += 1) {
      const yy = y + 5 + ((j * 7 + (quiet ? 0 : state.time * 15)) % (h * 0.32));
      rect(ctx, x + 8 + (j * 11) % Math.max(1, w - 20), yy, 2, 2, "#c8c8c8");
    }
  } else {
    rect(ctx, x + w / 2 - 6, y + 9, 3, 3, "#999");
    rect(ctx, x + w / 2 + 3, y + 9, 3, 3, "#999");
    rect(ctx, x + w / 2 - 3, y + 14, 6, 2, "#999");
  }
  panel(ctx, x, y + h * 0.48, w, 10, "#aaa", "#555", 1);
  rect(ctx, x + 8, y + h * 0.48 + 2, 2, 4, "#454545");
  rect(ctx, x + 6, y + h * 0.48 + 1, 6, 2, "#454545");
  rect(ctx, x + w - 13, y + h * 0.48 + 4, 3, 2, "#e0e0e0");
  rect(ctx, x + w - 8, y + h * 0.48 + 2, 3, 2, "#666");
  rect(ctx, x + w / 2 - 4, y + h - 11, 8, 3, "#444");
  rect(ctx, x + 3, y + h, 5, 3, "#444");
  rect(ctx, x + w - 8, y + h, 5, 3, "#444");
}

function drawBooks(ctx, o) {
  const { x, y, w, h } = o;
  panel(ctx, x, y - 7, w, h + 7, "#888", "#535353", 1);
  for (let row = 0; row < 3; row += 1) {
    const yy = y - 3 + row * (h / 3);
    rect(ctx, x + 3, yy, w - 6, h / 3 - 3, "#494949");
    let xx = x + 5;
    for (let i = 0; i < 6 && xx < x + w - 6; i += 1) {
      const bw = 2 + (i * 3 + row) % 4;
      const bh = h / 3 - 6 - i % 3;
      rect(ctx, xx, yy + h / 3 - 4 - bh, bw, bh, ["#aaa", "#d0d0d0", "#777", "#bcbcbc"][(i + row) % 4]);
      rect(ctx, xx, yy + h / 3 - 7, bw, 1, "#6f6f6f");
      xx += bw + 2;
    }
  }
}

function drawPlant(ctx, o, state, quiet, palette) {
  const { x, y, w, h } = o;
  const cx = x + w / 2;
  const sway = quiet ? 0 : Math.round(Math.sin(state.time * 1.5 + x) * 0.7);
  panel(ctx, cx - w * 0.3, y + h * 0.46, w * 0.6, h * 0.54, "#aaa", "#5b5b5b", 2);
  rect(ctx, cx - w * 0.34, y + h * 0.43, w * 0.68, 4, "#bfbfbf");
  rect(ctx, cx - 1 + sway, y - 13, 2, h * 0.5 + 13, "#666");
  const leaves = [[-9, -10, 9, 5], [1, -18, 9, 6], [-10, -23, 9, 6], [1, -4, 10, 5], [-7, -3, 7, 5], [-2, -29, 5, 8]];
  leaves.forEach(([lx, ly, lw, lh], i) => {
    rect(ctx, cx + lx + sway, y + ly + 12, lw, lh, i % 2 ? "#8b8b8b" : "#686868");
    rect(ctx, cx + lx + sway + 1, y + ly + 12, lw - 2, 1, "#a4a4a4");
  });
  const a = state.animations[o.id];
  if (a && state.time - a.started < 2.3) {
    const age = state.time - a.started;
    for (let i = 0; i < 6; i += 1) {
      const yy = quiet ? i * 3 : ((age * 38 + i * 9) % 35);
      rect(ctx, cx - 12 + i * 5, y - 32 + yy, 1, 3, palette.soft);
    }
  }
}

function drawLamp(ctx, o, state, palette) {
  const { x, y, w, h } = o;
  const cx = x + w / 2;
  if (state.lamp) {
    const glow = ctx.createRadialGradient(cx, y, 0, cx, y, 65);
    glow.addColorStop(0, palette.dark ? "#ffffff13" : "#ffffffb0");
    glow.addColorStop(1, "#ffffff00");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 65, y - 65, 130, 130);
  }
  panel(ctx, cx - 10, y + h - 6, 20, 6, "#888", "#565656", 2);
  rect(ctx, cx - 1, y - 17, 3, h + 12, "#686868");
  rect(ctx, cx, y - 16, 1, h + 9, "#aaa");
  panel(ctx, cx - w / 2 + 3, y - 25, w - 6, 14, state.lamp ? "#dedede" : "#aaa", "#5e5e5e", 2);
  rect(ctx, cx - w / 2 + 1, y - 13, w - 2, 3, state.lamp ? "#eee" : "#b5b5b5");
  rect(ctx, cx + w / 2 - 4, y - 10, 1, 7, "#888");
}

function drawObject(ctx, o, state, assets, quiet, palette) {
  ctx.save();
  // Furniture casts the same small, hard-edged shadow as the reference world.
  rect(ctx, o.x + 3, o.y + o.h - 5, o.w, 8, palette.shadow);
  switch (o.type) {
    case "music": drawMusic(ctx, o, state, quiet, palette); break;
    case "vending": case "snacks": drawMachine(ctx, o, state, quiet); break;
    case "sofa": case "chair": drawSofa(ctx, o, o.type === "chair"); break;
    case "coffee": drawCoffee(ctx, o, state, quiet, palette); break;
    case "arcade": drawArcade(ctx, o, state, quiet); break;
    case "books": drawBooks(ctx, o); break;
    case "plant": drawPlant(ctx, o, state, quiet, palette); break;
    case "lamp": drawLamp(ctx, o, state, palette); break;
    case "computer":
      sprite(ctx, assets.table, o.x, o.y, o.w, o.h);
      sprite(ctx, assets.computer, o.x, o.y - o.h * 0.62, o.w, o.h);
      break;
    case "desk": sprite(ctx, assets.desk, o.x, o.y, o.w, o.h); break;
    case "bigtable": sprite(ctx, assets.big_table, o.x, o.y, o.w, o.h); break;
    case "cabinet": sprite(ctx, assets.cabinet_1, o.x, o.y, o.w, o.h); break;
    default: sprite(ctx, assets.table, o.x, o.y, o.w, o.h);
  }
  ctx.restore();
}

function actor(ctx, a, state, assets, palette, quiet, npc = false) {
  const dir = a.dir || "down";
  const walking = a.moving && !a.seated;
  const row = (walking ? 96 : 0) + (dir === "up" ? 64 : dir === "left" || dir === "right" ? 32 : 0);
  const count = walking ? 4 : 2;
  const seconds = a.walkTime ?? state.time;
  const frame = quiet ? 0 : Math.floor(seconds / (walking ? 0.15 : 0.8)) % count;
  const size = 64;
  const px = Math.round(a.x - size / 2);
  // Visible pixels occupy the middle of each 32px sprite cell; the final
  // transparent ten rows are excluded when placing the actor's feet.
  const py = Math.round(a.y - 48 - (a.seated ? 5 : 0));
  ctx.save();
  ctx.globalAlpha = npc ? 0.53 : 1;
  if (dir === "left") {
    ctx.translate(px + size, py);
    ctx.scale(-1, 1);
  } else ctx.translate(px, py);
  if (!a.seated && assets.character_shadow?.complete && assets.character_shadow.naturalWidth) {
    ctx.save();
    ctx.globalAlpha *= 0.65;
    ctx.drawImage(assets.character_shadow, frame * 32, row, 32, 32, 0, 0, size, size);
    ctx.restore();
  }
  if (assets.character?.complete && assets.character.naturalWidth) {
    if (a.seated) {
      // Keep the familiar sprite's face and torso; bent legs give the seat a
      // clear pose without using the sheet's unrelated death animation rows.
      ctx.drawImage(assets.character, 0, 0, 32, 21, 0, 0, size, 42);
      rect(ctx, 24, 40, 7, 4, "#606060");
      rect(ctx, 34, 40, 7, 4, "#606060");
      rect(ctx, 24, 43, 7, 3, "#404040");
      rect(ctx, 34, 43, 7, 3, "#404040");
    } else ctx.drawImage(assets.character, frame * 32, row, 32, 32, 0, 0, size, size);
  } else {
    panel(ctx, 24, 17, 17, 22, "#777", "#454545", 2);
    rect(ctx, 27, 23, 2, 2, "#333");
    rect(ctx, 35, 23, 2, 2, "#333");
    rect(ctx, 24, 39, 5, 5, "#555");
    rect(ctx, 36, 39, 5, 5, "#555");
  }
  ctx.restore();
  if (!npc && a.held) {
    const handX = a.x + (dir === "left" ? -12 : 12);
    drink(ctx, handX, a.y - 12 - (a.seated ? 5 : 0), a.held);
    if (a.held === "coffee") steam(ctx, handX - 3, a.y - 20, state.time, quiet, palette.soft);
  }
  const label = npc ? a.name : "you";
  if (label) {
    ctx.save();
    ctx.shadowColor = palette.back;
    ctx.shadowBlur = 3;
    text(ctx, label, a.x, a.y - 44 - (a.seated ? 5 : 0), npc ? palette.muted : palette.ink, 9);
    ctx.restore();
  }
}

function drawNearest(ctx, state, palette) {
  const o = state.nearest;
  if (!o) return;
  ctx.save();
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.strokeRect(Math.round(o.x - 6) + 0.5, Math.round(o.y - 9) + 0.5, o.w + 12, o.h + 16);
  ctx.setLineDash([]);
  const label = state.player.seated === o.id ? "stand up" : o.label || "interact";
  ctx.font = '500 9px "Geist Mono", "SFMono-Regular", Consolas, monospace';
  const labelWidth = ctx.measureText(label).width;
  const width = labelWidth + 32;
  const x = o.x + o.w / 2 - width / 2;
  const y = o.y + o.h + 12;
  panel(ctx, x, y, width, 20, palette.back, palette.outline, 2);
  panel(ctx, x + 4, y + 4, 13, 12, palette.key, palette.outline, 1);
  text(ctx, "F", x + 10, y + 10, palette.ink, 8);
  text(ctx, label, x + 23, y + 10, palette.ink, 9, "left");
  ctx.restore();
}

function drawEffects(ctx, state, palette, quiet) {
  for (const effect of state.effects) {
    const progress = 1 - clamp(effect.life / (effect.maxLife || 1.5), 0, 1);
    ctx.save();
    ctx.globalAlpha = clamp(effect.life * 1.8, 0, 1);
    const rise = quiet ? 0 : progress * 20;
    if (effect.text) {
      ctx.font = '500 9px "Geist Mono", "SFMono-Regular", Consolas, monospace';
      const width = ctx.measureText(effect.text).width + 16;
      panel(ctx, effect.x - width / 2, effect.y - 45 - rise, width, 20, palette.back, palette.outline, 2);
      text(ctx, effect.text, effect.x, effect.y - 35 - rise, palette.ink, 9);
    } else {
      rect(ctx, effect.x - 2, effect.y - rise, 5, 1, palette.soft);
      rect(ctx, effect.x, effect.y - 2 - rise, 1, 5, palette.soft);
    }
    ctx.restore();
  }
}

export function renderLounge(ctx, state, { width, height, dark, reducedMotion }, assets) {
  const palette = dark ? {
    dark: true, back: "#101013", ink: "#e9e9e9", muted: "#888", soft: "#c4c4c4",
    grid: "rgba(240,240,245,0.075)", shadow: "rgba(0,0,0,0.28)", outline: "#515151", key: "#272727",
  } : {
    dark: false, back: "#f8f8fa", ink: "#343434", muted: "#8a8a8a", soft: "#6f6f6f",
    grid: "rgba(10,10,12,0.065)", shadow: "rgba(0,0,0,0.11)", outline: "#cbcbcb", key: "#ededed",
  };
  const camera = cameraFor(state, width, height);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = palette.back;
  ctx.fillRect(0, 0, width, height);
  ctx.translate(-camera.x, -camera.y);
  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = Math.max(0, Math.floor(camera.x / TILE) * TILE); x <= Math.min(WORLD_WIDTH, camera.x + width); x += TILE) {
    ctx.moveTo(x + 0.5, Math.max(0, camera.y));
    ctx.lineTo(x + 0.5, Math.min(WORLD_HEIGHT, camera.y + height));
  }
  for (let y = Math.max(0, Math.floor(camera.y / TILE) * TILE); y <= Math.min(WORLD_HEIGHT, camera.y + height); y += TILE) {
    ctx.moveTo(Math.max(0, camera.x), y + 0.5);
    ctx.lineTo(Math.min(WORLD_WIDTH, camera.x + width), y + 0.5);
  }
  ctx.stroke();
  const drawables = state.objects.map((o) => ({
    y: o.y + o.h,
    draw: () => drawObject(ctx, o, state, assets, reducedMotion, palette),
  }));
  for (const a of state.npcs) {
    drawables.push({ y: a.y, draw: () => actor(ctx, a, state, assets, palette, reducedMotion, true) });
  }
  const seat = state.objects.find((o) => o.id === state.player.seated);
  drawables.push({
    y: seat ? seat.y + seat.h + 1 : state.player.y,
    draw: () => actor(ctx, state.player, state, assets, palette, reducedMotion),
  });
  drawables.sort((a, b) => a.y - b.y);
  for (const drawable of drawables) drawable.draw();
  drawNearest(ctx, state, palette);
  drawEffects(ctx, state, palette, reducedMotion);
  ctx.restore();

  // The reference world disappears into the surrounding page at its edges.
  // Use a shallow fade so controls and nearby objects remain easy to read.
  ctx.save();
  const edge = Math.min(34, width * 0.06, height * 0.08);
  const transparent = dark ? "#10101300" : "#f8f8fa00";
  for (const [x1, y1, x2, y2, x, y, w, h] of [
    [0, 0, edge, 0, 0, 0, edge, height],
    [width, 0, width - edge, 0, width - edge, 0, edge, height],
    [0, 0, 0, edge, 0, 0, width, edge],
    [0, height, 0, height - edge, 0, height - edge, width, edge],
  ]) {
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, palette.back);
    gradient.addColorStop(1, transparent);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}
