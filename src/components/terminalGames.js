// Game state uses logical coordinates; the host supplies a high-DPI canvas.
const avatarHeight = 14;
const cup = { kind: "cup", width: 9, height: 8 };
const pen = { kind: "pen", width: 5, height: 9 };
const folder = { kind: "folder", width: 9, height: 7 };
const pointer = { kind: "pointer", width: 8, height: 9 };
const clutter = [cup, pen, folder, pointer];
const directions = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const opposite = { up: "down", down: "up", left: "right", right: "left" };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function rounded(context, x, y, width, height, radius, fill, stroke) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  if (fill) { context.fillStyle = fill; context.fill(); }
  if (stroke) { context.strokeStyle = stroke; context.stroke(); }
}

function disc(context, x, y, radius, color) {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
}

function line(context, x1, y1, x2, y2, color, width = 1) {
  context.beginPath();
  context.moveTo(x1, y1); context.lineTo(x2, y2);
  context.strokeStyle = color; context.lineWidth = width; context.stroke();
}

// Static gradients, grids and skyline details are rasterized once per layout.
function layer(width, height, paint) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * 2); canvas.height = Math.ceil(height * 2);
  const context = canvas.getContext("2d");
  context.scale(2, 2);
  paint(context);
  return canvas;
}

function runner(width, height) {
  let score, distance, y, vy, obstacles, gap, dead;
  let backdrop = null, floorGradient = null;
  const ground = () => height - 14;
  const reset = () => { score = distance = y = vy = 0; obstacles = []; gap = 115; dead = false; };
  reset();

  const createBackdrop = () => layer(width, height, (context) => {
    const sky = context.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#101d30"); sky.addColorStop(0.7, "#102c37"); sky.addColorStop(1, "#173a3b");
    context.fillStyle = sky; context.fillRect(0, 0, width, height);
    const haze = context.createRadialGradient(width * 0.76, height * 0.35, 2, width * 0.76, height * 0.35, width * 0.42);
    haze.addColorStop(0, "#3e535833"); haze.addColorStop(1, "#26404b00");
    context.fillStyle = haze; context.fillRect(0, 0, width, height);
    for (let index = 0; index < 32; index += 1) {
      const x = (index * 71 + 23) % width, y = 9 + (index * 37) % Math.max(12, height * 0.57);
      disc(context, x, y, index % 4 ? 0.45 : 0.8, index % 3 ? "#a2c8d56b" : "#cbe2dc9c");
    }
    disc(context, width * 0.79, height * 0.26, 16, "#d7e7dc08");
    disc(context, width * 0.79, height * 0.26, 10, "#d4e5d5");
    disc(context, width * 0.79 + 4, height * 0.26 - 3, 9, "#142a3b");
    context.fillStyle = "#142d3a";
    context.beginPath(); context.moveTo(0, ground() - 14);
    for (let x = 0; x <= width + 30; x += 30) context.lineTo(x, ground() - 36 - ((x * 7) % 43));
    context.lineTo(width, ground()); context.lineTo(0, ground()); context.fill();
  });

  const drawRobot = (context, time, quiet) => {
    const groundY = ground() + y;
    const step = !quiet && !dead && y === 0 ? Math.sin(distance * 0.55) * 1.5 : 0;
    context.save(); context.lineCap = "round";
    context.globalAlpha = Math.max(0.1, 0.35 + y / 100);
    context.fillStyle = "#030b15";
    context.beginPath(); context.ellipse(22, ground() + 2, 9 + y / 18, 1.9, 0, 0, Math.PI * 2); context.fill();
    context.globalAlpha = 1;
    context.save();
    context.translate(22, groundY); context.scale(0.9, 0.65); context.translate(-22, -groundY);
    // Small boots, a jacket, and an illuminated visor make the runner readable.
    rounded(context, 17 + step, groundY - 3, 5, 3, 1, "#e7b876");
    rounded(context, 24 - step, groundY - 3, 5, 3, 1, "#e7b876");
    rounded(context, 17, groundY - 10, 11, 8, 2, "#67c7ad");
    rounded(context, 19, groundY - 9, 3, 6, 1, "#a5f2cd");
    rounded(context, 16.5, groundY - 19, 12, 10, 3, "#91d8ce");
    rounded(context, 18, groundY - 17.5, 9.5, 6, 2, "#142d3a");
    if (dead) {
      line(context, 20, groundY - 16, 22, groundY - 14, "#ffac96", 0.8);
      line(context, 22, groundY - 16, 20, groundY - 14, "#ffac96", 0.8);
      line(context, 24, groundY - 16, 26, groundY - 14, "#ffac96", 0.8);
      line(context, 26, groundY - 16, 24, groundY - 14, "#ffac96", 0.8);
    } else {
      rounded(context, 20, groundY - 16, 1.6, 2.6, 0.6, "#c0ffe3");
      rounded(context, 24, groundY - 16, 1.6, 2.6, 0.6, "#c0ffe3");
    }
    line(context, 22.5, groundY - 19, 22.5, groundY - 21, "#79b2b3", 0.8);
    disc(context, 22.5, groundY - 21.5, 1.15, "#ffc477");
    line(context, 28, groundY - 8, 30, groundY - 5 + step / 2, "#91d8ce", 2);
    line(context, 17, groundY - 8, 14, groundY - 6 - step / 2, "#91d8ce", 2);
    context.restore();
    if (!quiet && !dead && y === 0) {
      for (let index = 0; index < 3; index += 1) {
        const drift = (time * 17 + index * 4) % 12;
        disc(context, 14 - drift, ground() - drift * 0.12, 0.4 + drift / 18, `rgba(148,203,193,${(1 - drift / 12) * 0.35})`);
      }
    }
    context.restore();
  };

  const drawObstacle = (context, item, time, quiet) => {
    const px = item.x, py = item.y;
    disc(context, px + 4, py + item.type.height - 1, 6, "#ffbf6910");
    if (item.type === cup) {
      rounded(context, px + 1, py + 2, 6, 5, 1, "#efc58d");
      rounded(context, px + 2, py + 3, 4, 3, 0.6, "#ba7e51");
      rounded(context, px + 6, py + 3, 2, 3, 0.7, null, "#efc58d");
      line(context, px + 2, py + 1.5, px + 6, py + 1.5, "#f9e7c5", 0.7);
      if (!quiet) {
        for (let index = 0; index < 2; index += 1) {
          const rise = (time * 6 + index * 2) % 4;
          line(context, px + 2 + index * 2, py + 0.5 - rise, px + 2.6 + index * 2, py - 0.7 - rise, "#d9dfd477", 0.6);
        }
      }
    } else if (item.type === folder) {
      rounded(context, px, py + 1, 8.5, 6, 0.8, "#dfae63");
      rounded(context, px + 0.5, py, 3.5, 2, 0.5, "#eccc89");
      line(context, px + 1, py + 3, px + 7.5, py + 3, "#f8dda8", 0.8);
    } else if (item.type === pen) {
      rounded(context, px + 1, py, 3, 7, 0.8, "#a6b9ff");
      rounded(context, px + 1.5, py + 1, 1, 5, 0.3, "#d2dcff");
      context.fillStyle = "#f4d7b6"; context.beginPath(); context.moveTo(px + 1, py + 7); context.lineTo(px + 4, py + 7); context.lineTo(px + 2.5, py + 9); context.fill();
    } else {
      context.fillStyle = "#e1e9ee"; context.strokeStyle = "#65839d"; context.lineWidth = 0.6;
      context.beginPath(); context.moveTo(px, py); context.lineTo(px + 7, py + 6); context.lineTo(px + 4, py + 6); context.lineTo(px + 3, py + 9); context.closePath(); context.fill(); context.stroke();
    }
  };

  return {
    reset,
    score: () => score,
    update(delta) {
      const speed = 82 + 90 * (1 - Math.exp(-score / 650));
      const travelled = speed * delta;
      distance += travelled;
      score = distance / 9;
      if (y < 0 || vy < 0) {
        vy += 1120 * delta;
        y = Math.min(0, y + vy * delta);
        if (y === 0) vy = 0;
      }
      gap -= travelled;
      if (gap <= 0) {
        const type = clutter[Math.floor(Math.random() * clutter.length)];
        const lift = type === pointer && score > 150 ? [0, 10, 20][Math.floor(Math.random() * 3)] : 0;
        obstacles.push({ x: width + 6, y: ground() - type.height - lift, type });
        gap = speed * (0.7 + Math.random() * 0.7) + 38;
      }
      obstacles.forEach((item) => { item.x -= travelled; });
      obstacles = obstacles.filter((item) => item.x + item.type.width > -2);
      const playerY = ground() - avatarHeight + y;
      dead = obstacles.some((item) => (
        20 < item.x + item.type.width - 1 && 28 > item.x + 1
        && playerY + 2 < item.y + item.type.height && playerY + avatarHeight > item.y + 1
      ));
      return !dead;
    },
    render(painter, state) {
      const context = painter.context;
      if (!backdrop) backdrop = createBackdrop();
      context.save();
      context.drawImage(backdrop, 0, 0, width, height);
      const quiet = painter.reducedMotion || state !== "running";
      // Two skyline speeds add depth without expensive filters or image assets.
      for (let level = 0; level < 2; level += 1) {
        const stride = level ? 34 : 23;
        const travel = distance * (level ? 0.2 : 0.08);
        const offset = travel % stride;
        const firstBuilding = Math.floor(travel / stride);
        for (let index = -1; index < Math.ceil(width / stride) + 1; index += 1) {
          const building = index + firstBuilding;
          const bx = index * stride - offset;
          const buildingHeight = 13 + ((building + 22) * (level ? 17 : 11)) % (level ? 24 : 36);
          const top = ground() - buildingHeight;
          rounded(context, bx, top, stride - 4, buildingHeight, 1, level ? "#12252e" : "#1a3640");
          if ((building + 22) % 3 !== 0) {
            for (let wy = top + 5; wy < ground() - 5; wy += 7) {
              context.fillStyle = level ? "#c0b27742" : "#46707b66";
              context.fillRect(bx + 5, wy, 2, 2); context.fillRect(bx + 12, wy, 2, 2);
            }
          }
        }
      }
      if (!floorGradient) {
        floorGradient = context.createLinearGradient(0, ground(), 0, height);
        floorGradient.addColorStop(0, "#1a4546"); floorGradient.addColorStop(1, "#0d202a");
      }
      context.fillStyle = floorGradient; context.fillRect(0, ground(), width, height - ground());
      line(context, 0, ground(), width, ground(), "#a0e4ca", 0.8);
      line(context, 0, ground() + 2.5, width, ground() + 2.5, "#65b9ae55", 0.6);
      for (let index = -1; index < Math.ceil(width / 18) + 1; index += 1) {
        const px = index * 18 - distance % 18;
        line(context, px, ground() + 6, px + 5, height, "#29535b", 0.65);
      }
      obstacles.forEach((item) => drawObstacle(context, item, painter.time, quiet));
      drawRobot(context, painter.time, quiet);
      context.restore();
    },
    input(event) {
      if ((event.type === "press" && (!event.dir || event.dir === "up") || event.type === "pointerdown") && y === 0) vy = -305;
      if (event.type === "release" && vy < -110) vy = -110;
    },
    resize(nextWidth, nextHeight) { width = nextWidth; height = nextHeight; backdrop = floorGradient = null; reset(); },
  };
}

function snake(width, height) {
  let columns, rows, x, y, segments, previousSegments, direction, queue, food, score, elapsed, swipeStart, particles, crashed;
  let backdrop = null, bodyGradient = null;
  const interval = () => 0.06 + 0.075 * Math.exp(-score / 150);
  const layout = () => {
    columns = Math.max(8, Math.floor((width - 8) / 6));
    rows = Math.max(6, Math.floor((height - 24) / 6));
    x = Math.floor((width - columns * 6) / 2);
    y = 20 + Math.floor((height - 24 - rows * 6) / 2);
  };
  const placeFood = () => {
    const empty = [];
    for (let col = 0; col < columns; col += 1) {
      for (let row = 0; row < rows; row += 1) {
        if (!segments.some((segment) => segment.x === col && segment.y === row)) empty.push({ x: col, y: row });
      }
    }
    food = empty[Math.floor(Math.random() * empty.length)] ?? null;
  };
  const reset = () => {
    layout();
    const middle = { x: Math.floor(columns / 3), y: Math.floor(rows / 2) };
    segments = [0, 1, 2, 3].map((offset) => ({ x: middle.x - offset, y: middle.y }));
    previousSegments = segments;
    direction = "right"; queue = []; score = elapsed = 0; swipeStart = null; particles = []; crashed = false; placeFood();
  };
  const steer = (next) => {
    const previous = queue.at(-1) ?? direction;
    if (next !== previous && next !== opposite[previous] && queue.length < 2) queue.push(next);
  };
  reset();

  const createBackdrop = () => layer(width, height, (context) => {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#0d2428"); gradient.addColorStop(1, "#09151f");
    context.fillStyle = gradient; context.fillRect(0, 0, width, height);
    context.lineWidth = 0.5;
    rounded(context, x - 2, y - 2, columns * 6 + 3, rows * 6 + 3, 3, "#0a191f", "#385a5a");
    context.fillStyle = "#9dd8c50f";
    for (let col = 0; col < columns; col += 1) {
      for (let row = 0; row < rows; row += 1) context.fillRect(x + col * 6 + 2.25, y + row * 6 + 2.25, 0.5, 0.5);
    }
    const length = Math.min(10, columns);
    line(context, x - 2, y + length, x - 2, y - 2, "#6cae9c", 0.7);
    line(context, x - 2, y - 2, x + length, y - 2, "#6cae9c", 0.7);
    line(context, x + columns * 6 + 1, y + rows * 6 - length, x + columns * 6 + 1, y + rows * 6 + 1, "#527d90", 0.7);
    line(context, x + columns * 6 + 1, y + rows * 6 + 1, x + columns * 6 - length, y + rows * 6 + 1, "#527d90", 0.7);
  });

  return {
    reset,
    score: () => score,
    update(delta) {
      particles.forEach((particle) => { particle.age += delta; });
      particles = particles.filter((particle) => particle.age < 0.4);
      elapsed += delta;
      while (elapsed >= interval()) {
        elapsed -= interval();
        if (queue.length) direction = queue.shift();
        const [dx, dy] = directions[direction];
        const head = { x: segments[0].x + dx, y: segments[0].y + dy };
        const eats = food && head.x === food.x && head.y === food.y;
        if (head.x < 0 || head.x >= columns || head.y < 0 || head.y >= rows
          || segments.slice(0, eats ? segments.length : -1).some((segment) => segment.x === head.x && segment.y === head.y)) {
          crashed = true; return false;
        }
        previousSegments = segments.slice();
        segments.unshift(head);
        if (eats) {
          particles.push({ x: x + head.x * 6 + 2.5, y: y + head.y * 6 + 2.5, age: 0 });
          particles = particles.slice(-4);
          score += 10; placeFood(); if (!food) return false;
        } else segments.pop();
      }
      return true;
    },
    render(painter, state) {
      const context = painter.context;
      if (!backdrop) backdrop = createBackdrop();
      if (!bodyGradient) {
        bodyGradient = context.createLinearGradient(x, y, x + columns * 6, y + rows * 6);
        bodyGradient.addColorStop(0, "#a4efbd"); bodyGradient.addColorStop(0.5, "#6edbb5"); bodyGradient.addColorStop(1, "#5fbcd5");
      }
      context.save(); context.drawImage(backdrop, 0, 0, width, height);
      if (food) {
        const px = x + food.x * 6 + 2.5, py = y + food.y * 6 + 2.5;
        const pulse = painter.reducedMotion ? 0 : Math.sin(painter.time * 4) * 0.35;
        disc(context, px, py, 6.5 + pulse, "#ffb39b10");
        disc(context, px, py, 4.3 + pulse, "#ffb39b18");
        context.fillStyle = "#ffb29a"; context.beginPath();
        context.moveTo(px, py - 3); context.lineTo(px + 2.6, py); context.lineTo(px, py + 3); context.lineTo(px - 2.6, py); context.closePath(); context.fill();
        disc(context, px, py, 0.8, "#ffe5bd");
        line(context, px + 4.7, py - 3.2, px + 6.7, py - 3.2, "#e7cabb", 0.5);
        line(context, px + 5.7, py - 4.2, px + 5.7, py - 2.2, "#e7cabb", 0.5);
      }
      const progress = state === "running" ? clamp(elapsed / interval(), 0, 1) : 1;
      const points = segments.map((segment, index) => {
        const previous = previousSegments[index] ?? previousSegments.at(-1) ?? segment;
        return { x: x + (previous.x + (segment.x - previous.x) * progress) * 6 + 2.5,
          y: y + (previous.y + (segment.y - previous.y) * progress) * 6 + 2.5 };
      });
      const bodyPath = () => {
        context.beginPath();
        points.forEach((point, index) => { if (index) context.lineTo(point.x, point.y); else context.moveTo(point.x, point.y); });
      };
      context.lineCap = context.lineJoin = "round";
      bodyPath(); context.strokeStyle = "#00000030"; context.lineWidth = 7.8; context.stroke();
      bodyPath(); context.strokeStyle = bodyGradient; context.lineWidth = 5.1; context.stroke();
      bodyPath(); context.strokeStyle = "#e0ffe530"; context.lineWidth = 1.1; context.stroke();
      const head = points[0], [dx, dy] = directions[direction];
      context.translate(head.x, head.y); context.rotate(Math.atan2(dy, dx));
      rounded(context, -2.9, -2.9, 5.8, 5.8, 2, crashed ? "#eaa697" : "#b6f3c9");
      for (const eyeY of [-1.6, 1.6]) {
        disc(context, 1, eyeY, 1.0, "#0b3033"); disc(context, 1.25, eyeY - 0.15, 0.3, "#effff4");
      }
      context.restore();
      if (!painter.reducedMotion) {
        context.save();
        for (const particle of particles) {
          context.globalAlpha = Math.max(0, 1 - particle.age / 0.4);
          for (let index = 0; index < 8; index += 1) {
            const angle = index * Math.PI / 4, radius = 3 + particle.age * 24;
            disc(context, particle.x + Math.cos(angle) * radius, particle.y + Math.sin(angle) * radius, 0.65, index % 2 ? "#ffd4aa" : "#8ae7c3");
          }
        }
        context.restore();
      }
    },
    input(event) {
      if (event.type === "press" && event.dir) steer(event.dir);
      if (event.type === "pointerdown") swipeStart = { x: event.x, y: event.y };
      if (event.type === "pointerup") swipeStart = null;
      if (event.type === "pointermove" && event.down && swipeStart) {
        const dx = event.x - swipeStart.x, dy = event.y - swipeStart.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) >= 5) {
          steer(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "right" : "left" : dy > 0 ? "down" : "up");
          swipeStart = { x: event.x, y: event.y };
        }
      }
    },
    resize(nextWidth, nextHeight) { width = nextWidth; height = nextHeight; backdrop = bodyGradient = null; reset(); },
  };
}

function pong(width, height) {
  let player, target, cpu, ball, trail, score, held, impacts;
  let backdrop = null;
  const middle = () => (18 + height - 6) / 2;
  const limit = (value) => clamp(value, 28, height - 16);
  const hit = (x, y, color) => { impacts.push({ x, y, color, age: 0 }); impacts = impacts.slice(-6); };
  const serve = () => {
    const speed = ball ? Math.max(85, ball.speed * 0.85) : 85;
    const angle = (Math.random() - 0.5) * 0.8;
    ball = { x: width / 2, y: middle(), vx: -Math.cos(angle) * speed, vy: Math.sin(angle) * speed, speed };
    trail = [];
  };
  const reset = () => { player = target = cpu = middle(); score = held = 0; ball = null; impacts = []; serve(); };
  const bounce = (paddle, sign) => {
    const impact = clamp((ball.y - paddle) / 12, -1, 1);
    ball.speed = Math.min(190, ball.speed + 4);
    ball.vx = Math.cos(impact * 0.95) * ball.speed * sign;
    ball.vy = Math.sin(impact * 0.95) * ball.speed;
    hit(ball.x, ball.y, sign > 0 ? "#92edce" : "#90dafa");
  };
  reset();

  const createBackdrop = () => layer(width, height, (context) => {
    const background = context.createRadialGradient(width / 2, middle(), 8, width / 2, middle(), width * 0.6);
    background.addColorStop(0, "#142b38"); background.addColorStop(1, "#0a1421");
    context.fillStyle = background; context.fillRect(0, 0, width, height);
    context.lineWidth = 0.65;
    rounded(context, 5, 17, width - 10, height - 23, 4, "#0b182280", "#315565");
    rounded(context, 7, 19, width - 14, height - 27, 3, null, "#b6efff0a");
    const radius = Math.min(28, height * 0.2);
    context.beginPath(); context.arc(width / 2, middle(), radius, 0, Math.PI * 2);
    context.strokeStyle = "#658e9f22"; context.stroke();
    for (let py = 22; py < height - 9; py += 7) rounded(context, width / 2 - 0.5, py, 1, 3.4, 0.5, "#8ab9c447");
    disc(context, width / 2, middle(), 1, "#9ccad455");
    line(context, 7, 17, width * 0.33, 17, "#65a795", 0.75);
    line(context, width * 0.67, height - 6, width - 7, height - 6, "#598bb4", 0.75);
    context.font = "4.5px ui-monospace, monospace"; context.textBaseline = "top";
    context.fillStyle = "#668e8a"; context.fillText("YOU", 10, 7);
    context.textAlign = "right"; context.fillStyle = "#668b9f"; context.fillText("CPU", width - 10, 7);
  });

  return {
    reset,
    score: () => score,
    update(delta) {
      impacts.forEach((impact) => { impact.age += delta; });
      impacts = impacts.filter((impact) => impact.age < 0.35);
      if (held) target = player + held * 170 * delta;
      target = limit(target);
      player += (target - player) * (1 - Math.exp(-22 * delta));
      const cpuTarget = ball.vx > 0 ? ball.y : middle();
      const cpuSpeed = 60 + ball.speed * 0.5;
      cpu = limit(cpu + clamp(cpuTarget - cpu, -cpuSpeed * delta, cpuSpeed * delta));
      trail.unshift({ x: ball.x, y: ball.y }); trail = trail.slice(0, 18);
      ball.x += ball.vx * delta; ball.y += ball.vy * delta;
      if (ball.y < 20) { ball.y = 20; ball.vy = Math.abs(ball.vy); hit(ball.x, ball.y, "#9cbac9"); }
      if (ball.y > height - 8) { ball.y = height - 8; ball.vy = -Math.abs(ball.vy); hit(ball.x, ball.y, "#9cbac9"); }
      if (ball.vx < 0 && ball.x <= 14 && ball.x > 7 && Math.abs(ball.y - player) <= 13) {
        ball.x = 14; bounce(player, 1); score += 1;
      }
      if (ball.vx > 0 && ball.x >= width - 14 && ball.x < width - 7 && Math.abs(ball.y - cpu) <= 13) {
        ball.x = width - 14; bounce(cpu, -1);
      }
      if (ball.x < -4) return false;
      if (ball.x > width + 4) { score += 3; serve(); }
      return true;
    },
    render(painter) {
      const context = painter.context;
      if (!backdrop) backdrop = createBackdrop();
      context.save(); context.drawImage(backdrop, 0, 0, width, height);
      context.lineCap = context.lineJoin = "round";
      if (trail.length > 1) {
        context.beginPath();
        trail.slice().reverse().forEach((point, index) => { if (index) context.lineTo(point.x, point.y); else context.moveTo(point.x, point.y); });
        context.strokeStyle = "#91ddf21b"; context.lineWidth = 3; context.stroke();
        for (let index = 0; index < trail.length; index += 3) {
          const point = trail[index];
          disc(context, point.x, point.y, Math.max(0.5, 1.4 - index / 18), `rgba(139,222,235,${(1 - index / trail.length) * 0.35})`);
        }
      }
      rounded(context, 7.5, player - 13, 7, 26, 3.5, "#91e8c910");
      rounded(context, 9.5, player - 10, 3, 20, 1.5, "#87ddbe");
      line(context, 10.3, player - 8, 10.3, player + 8, "#ddfff0", 0.65);
      rounded(context, width - 14.5, cpu - 13, 7, 26, 3.5, "#81d8fa10");
      rounded(context, width - 12.5, cpu - 10, 3, 20, 1.5, "#80c8ee");
      line(context, width - 10.3, cpu - 8, width - 10.3, cpu + 8, "#dbf6ff", 0.65);
      disc(context, ball.x, ball.y, 6.5, "#c0efff08");
      disc(context, ball.x, ball.y, 4, "#b5eaff13");
      disc(context, ball.x, ball.y, 2.3, "#d7f5f4");
      disc(context, ball.x - 0.5, ball.y - 0.5, 1, "#ffffff");
      if (!painter.reducedMotion) {
        for (const impact of impacts) {
          context.globalAlpha = Math.max(0, 1 - impact.age / 0.35) * 0.7;
          context.beginPath(); context.arc(impact.x, impact.y, 3 + impact.age * 26, 0, Math.PI * 2);
          context.strokeStyle = impact.color; context.lineWidth = 0.65; context.stroke();
        }
      }
      context.restore();
    },
    input(event) {
      if (event.type === "press" && (event.dir === "up" || event.dir === "down")) held = event.dir === "up" ? -1 : 1;
      if (event.type === "release") held = 0;
      if (event.type === "pointermove" || event.type === "pointerdown") { held = 0; target = event.y; }
    },
    resize(nextWidth, nextHeight) { width = nextWidth; height = nextHeight; backdrop = null; reset(); },
  };
}

export const gameCatalog = {
  runner: { title: "COFFEE RUN", subtitle: "Night shift sprint", accent: "#ffc477", hint: "SPACE / TAP TO JUMP", milestone: 100, create: runner },
  snake: { title: "PEN TOOL", subtitle: "Find your flow", accent: "#7de2b8", hint: "ARROWS / WASD TO STEER", milestone: 100, create: snake },
  pong: { title: "PING", subtitle: "Neon rally", accent: "#80d8ff", hint: "MOVE / DRAG TO RETURN", milestone: 10, create: pong },
};
