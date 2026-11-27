const TRACE_DURATION = 750;
const GUIDE_DURATION = 1000;
const RETRACT_DURATION = 630;
const DASH = [4, 4];

const clamp = (value) => Math.max(0, Math.min(1, value));
const easeOut = (value) => 1 - (1 - clamp(value)) ** 3;
const easeInOut = (value) => {
  const progress = clamp(value);
  return progress < 0.5
    ? 4 * progress ** 3
    : 1 - (-2 * progress + 2) ** 3 / 2;
};

function roundedOutline({ x, y, width, height, radius }) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  const points = [{ x: x + r, y }];
  const corner = (centerX, centerY, startAngle) => {
    for (let step = 0; step <= 6; step += 1) {
      const angle = startAngle + (step / 6) * (Math.PI / 2);
      points.push({ x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r });
    }
  };

  corner(x + width - r, y + r, -Math.PI / 2);
  corner(x + width - r, y + height - r, 0);
  corner(x + r, y + height - r, Math.PI / 2);
  corner(x + r, y + r, Math.PI);

  const lengths = [0];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    lengths.push(lengths[index - 1] + Math.hypot(current.x - previous.x, current.y - previous.y));
  }
  return { points, lengths, length: lengths.at(-1) };
}

// Drawing just the visible interval lets an outline trace in and erase in the
// same direction without changing the spacing of its dashes.
function strokeInterval(context, path, from, to, scrollY = 0) {
  if (to <= from || path.length < 1) return;
  const start = clamp(from) * path.length;
  const end = clamp(to) * path.length;
  let drawing = false;
  context.beginPath();
  context.lineDashOffset = -(start % (DASH[0] + DASH[1]));

  for (let index = 1; index < path.points.length; index += 1) {
    const segmentStart = path.lengths[index - 1];
    const segmentEnd = path.lengths[index];
    if (segmentEnd <= start || segmentStart >= end || segmentEnd === segmentStart) continue;

    const previous = path.points[index - 1];
    const current = path.points[index];
    const distance = segmentEnd - segmentStart;
    const begin = Math.max(0, (start - segmentStart) / distance);
    const finish = Math.min(1, (end - segmentStart) / distance);
    if (!drawing) {
      context.moveTo(
        previous.x + (current.x - previous.x) * begin,
        previous.y + (current.y - previous.y) * begin - scrollY,
      );
      drawing = true;
    }
    context.lineTo(
      previous.x + (current.x - previous.x) * finish,
      previous.y + (current.y - previous.y) * finish - scrollY,
    );
  }
  if (drawing) context.stroke();
}

function linePath(x1, y1, x2, y2) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  return { points: [{ x: x1, y: y1 }, { x: x2, y: y2 }], lengths: [0, length], length };
}

function readStrokeColor() {
  const style = getComputedStyle(document.documentElement);
  const context = document.createElement("canvas").getContext("2d");
  if (!context) return "rgba(128, 128, 128, 0.3)";
  const resolve = (color) => {
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
  };
  const background = resolve(style.getPropertyValue("--background").trim() || "#eeeeee");
  const ink = resolve(style.getPropertyValue("--ink").trim() || "#0a0a0a");
  return `rgb(${background.map((channel, index) => Math.round(channel + (ink[index] - channel) * 0.18)).join(", ")})`;
}

export default function createSkeletonCanvas(canvas, elements, { onComplete } = {}) {
  const context = canvas.getContext("2d");
  if (!context) {
    return { stop() {}, refresh() {}, retract() { onComplete?.(); } };
  }

  let targets = Array.from(elements);
  const main = document.querySelector("#main-content");
  const startedAt = performance.now();
  let retractAt = null;
  let frame = 0;
  let stopped = false;
  let outlines = [];
  let rows = [];
  let column = { left: 0, right: window.innerWidth };
  let mainLeft = 0;
  let width = 0;
  let height = 0;
  let ratio = 1;
  let step = 0;
  let color = "";

  const measure = () => {
    width = document.documentElement.clientWidth;
    height = window.innerHeight;
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    color = readStrokeColor();

    const content = main?.querySelector(".content-wrap") ?? main;
    const columnRect = content?.getBoundingClientRect();
    const mainRect = main?.getBoundingClientRect();
    mainLeft = Math.max(0, mainRect?.left ?? 0);
    column = {
      left: columnRect?.left ?? 24,
      right: columnRect?.right ?? width - 24,
    };

    const scrollY = window.scrollY;
    const rectangles = targets.flatMap((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1 || rect.top >= height || rect.bottom <= 0
        || rect.left >= width || rect.right <= mainLeft) return [];
      const radius = Number.parseFloat(element.dataset.skel)
        || Number.parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0;
      return [{
        x: Math.round(rect.left) + 0.5,
        y: Math.round(rect.top + scrollY) + 0.5,
        width: Math.max(0, Math.round(rect.width) - 1),
        height: Math.max(0, Math.round(rect.height) - 1),
        radius,
      }];
    }).sort((first, second) => first.y - second.y || first.x - second.x);

    outlines = rectangles.map(roundedOutline);
    step = outlines.length > 1 ? Math.min(50, 500 / (outlines.length - 1)) : 0;
    rows = [];
    for (const rect of rectangles) {
      if (rows.length >= 9) break;
      if (rect.y - scrollY < 4 || rect.y - scrollY > height - 4) continue;
      const insideAnother = rectangles.some((other) => rect.y > other.y + 1
        && rect.y < other.y + other.height - 1);
      if (!insideAnother && rows.every((row) => Math.abs(row - rect.y) > 10)) rows.push(rect.y);
    }
  };

  const stop = () => {
    if (stopped) return;
    stopped = true;
    window.cancelAnimationFrame(frame);
    window.removeEventListener("resize", measure);
    resizeObserver.disconnect();
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const draw = (now) => {
    if (stopped) return;
    const elapsed = now - startedAt;
    const retractElapsed = retractAt === null ? 0 : now - retractAt;
    const retractSpread = Math.max(0, outlines.length - 1) * step / 2;
    if (retractAt !== null && retractElapsed >= RETRACT_DURATION + retractSpread) {
      stop();
      onComplete?.();
      return;
    }

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.strokeStyle = color;
    context.lineWidth = 1;
    context.setLineDash(DASH);

    const guideTrace = easeOut(elapsed / GUIDE_DURATION);
    const guideErase = retractAt === null
      ? 0 : easeInOut(retractElapsed / (RETRACT_DURATION + retractSpread));
    const middleX = (column.left + column.right) / 2;
    const middleY = height / 2;
    for (const x of [column.left, column.right]) {
      const alignedX = Math.round(x) + 0.5;
      strokeInterval(context, linePath(alignedX, middleY, alignedX, 24), guideErase, guideTrace);
      strokeInterval(context, linePath(alignedX, middleY, alignedX, height - 24), guideErase, guideTrace);
    }
    for (const row of rows) {
      const y = row - window.scrollY;
      strokeInterval(context, linePath(middleX, y, mainLeft + 24, y), guideErase, guideTrace);
      strokeInterval(context, linePath(middleX, y, width - 24, y), guideErase, guideTrace);
    }
    outlines.forEach((outline, index) => {
      const trace = easeOut((elapsed - index * step) / TRACE_DURATION);
      const erase = retractAt === null
        ? 0 : easeInOut((retractElapsed - index * step / 2) / RETRACT_DURATION);
      strokeInterval(context, outline, erase, trace, window.scrollY);
    });
    frame = window.requestAnimationFrame(draw);
  };

  const resizeObserver = new ResizeObserver(measure);
  if (main) resizeObserver.observe(main);
  measure();
  window.addEventListener("resize", measure);
  frame = window.requestAnimationFrame(draw);

  return {
    stop,
    refresh(nextElements) {
      if (nextElements) targets = Array.from(nextElements);
      measure();
    },
    retract() {
      if (!stopped && retractAt === null) retractAt = performance.now();
    },
  };
}
