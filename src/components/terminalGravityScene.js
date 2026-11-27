const BLOCK_SELECTOR = [
  ".hero-avatar",
  ".hero-socials > a", ".site-footer > a", ".detail-page__back", ".preview-heading > a",
  ".expertise-item", ".profile-facts > div", ".contact-card", ".project-gallery",
  ".featured-project-card", ".project-row__links > a",
  ".stack-preview__tools > *", ".contribution-strip > a",
  ".desktop-sidebar .brand", ".sidebar-toggle", ".sidebar-nav > a", ".sidebar-nav__terminal",
  ".sidebar-socials > a", ".sidebar-controls > button",
  ".sidebar-theme-picker .theme-picker", ".sidebar-bottom__email-row > *",
  "svg", "img",
].join(", ");
const TEXT_MEASUREMENT_BUDGET = 900;
const DIVIDER_SELECTOR = [
  ".content-section", ".build-stack-section", ".github-section", ".site-footer",
  ".hero-meta", ".hero-meta > div", ".profile-facts", ".profile-facts > div",
  ".expertise-list", ".expertise-item", ".build-stack__frame", ".build-stack__bar",
  ".build-stack__group", ".stack-list", ".stack-list > span", ".subsection-heading",
  ".project-row", ".sidebar-bottom",
].join(", ");
const MAX_DIVIDERS = 24;

function intersectsViewport(rect, width, height) {
  return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < width && rect.bottom > 0 && rect.top < height;
}

// Read geometry before changing any styles. Cards carry their own text, rather
// than spawning a second set of colliding letters inside the card's body.
export function measureScene(roots, width, height) {
  const blocks = [];
  for (const element of roots.flatMap((root) => [...root.querySelectorAll(BLOCK_SELECTOR)])) {
    if (element.closest(".terminal-window")) continue;
    if (blocks.some((block) => block.element.contains(element))) continue;
    const rect = element.getBoundingClientRect();
    if (!intersectsViewport(rect, width, height)) continue;
    const style = getComputedStyle(element);
    if (style.visibility !== "visible" || style.display === "none" || Number(style.opacity) === 0) continue;
    const scroller = element.closest(".sidebar-nav");
    if (scroller) {
      const viewport = scroller.getBoundingClientRect();
      if (rect.bottom <= viewport.top || rect.top >= viewport.bottom) continue;
    }
    blocks.push({ element, rect });
  }

  const dividers = [];
  for (const source of roots.flatMap((root) => [...root.querySelectorAll(DIVIDER_SELECTOR)])) {
    if (source.closest(".terminal-window")) continue;
    if (dividers.length >= MAX_DIVIDERS) break;
    const bounds = source.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.right <= 0 || bounds.left >= width) continue;
    const style = getComputedStyle(source);
    if (style.visibility !== "visible" || style.display === "none" || Number(style.opacity) === 0) continue;
    for (const side of ["top", "bottom"]) {
      if (dividers.length >= MAX_DIVIDERS) break;
      const thickness = parseFloat(style.getPropertyValue(`border-${side}-width`)) || 0;
      const borderStyle = style.getPropertyValue(`border-${side}-style`);
      const color = style.getPropertyValue(`border-${side}-color`);
      if (!thickness || !["solid", "dashed", "dotted", "double"].includes(borderStyle)
        || color === "transparent" || /^rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/.test(color)
        || /\/\s*0(?:\.0+)?\s*\)$/.test(color)) continue;
      const left = Math.max(0, bounds.left), right = Math.min(width, bounds.right);
      const top = side === "top" ? bounds.top : bounds.bottom - thickness;
      const rect = { left, right, top, bottom: top + thickness, width: right - left, height: thickness };
      if (!intersectsViewport(rect, width, height)) continue;
      dividers.push({ source, side, rect, color, borderStyle });
    }
  }

  const sources = new Map();
  const runs = [];
  const textNodes = [];
  const range = document.createRange();
  let smallCharacterCount = 0;
  for (const root of roots) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const source = node.parentElement;
      if (!source || !node.data.trim()) continue;
      if (!sources.has(source)) {
        const excluded = source.closest(".terminal-window, script, style, svg, [hidden]")
          || blocks.some((block) => block.element.contains(source));
        const rect = excluded ? null : source.getBoundingClientRect();
        const style = rect && intersectsViewport(rect, width, height) ? getComputedStyle(source) : null;
        sources.set(source, style && style.visibility !== "hidden" && style.display !== "none" ? {
          source,
          size: parseFloat(style.fontSize) || 14,
          font: `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
          color: style.color,
          textTransform: style.textTransform,
          letterSpacing: parseFloat(style.letterSpacing) || 0,
        } : null);
      }
      const appearance = sources.get(source);
      if (!appearance) continue;
      textNodes.push({ node, appearance });
      if (appearance.size < 24) smallCharacterCount += node.data.replace(/\s/g, "").length;
    }
  }
  // Small type will be grouped into the same physics body anyway. Measure
  // short shaped runs up front instead of forcing a layout query per letter.
  // Headings retain their individual letters, and wrapped runs fall back to
  // smaller pieces so line breaks and original positions remain accurate.
  const chunkSize = Math.min(8, Math.max(1, Math.ceil(smallCharacterCount / TEXT_MEASUREMENT_BUDGET)));
  for (const { node, appearance } of textNodes) {
    let line = null;
    const append = (char, rect) => {
      if (!rect || !intersectsViewport(rect, width, height)) return;
      if (appearance.textTransform === "uppercase") char = char.toUpperCase();
      if (appearance.textTransform === "lowercase") char = char.toLowerCase();
      if (!line || Math.abs(rect.top - line.top) > 1 || rect.left < line.glyphs.at(-1).left) {
        line = { ...appearance, top: rect.top, glyphs: [] };
        runs.push(line);
      }
      line.glyphs.push({ char, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom });
    };
    const size = appearance.size >= 24 || appearance.letterSpacing !== 0 ? 1 : chunkSize;
    const pieces = new RegExp(`\\S{1,${size}}`, "gu");
    for (const match of node.data.matchAll(pieces)) {
      range.setStart(node, match.index); range.setEnd(node, match.index + match[0].length);
      const rects = range.getClientRects();
      if (rects.length === 1) {
        append(match[0], rects[0]);
        continue;
      }
      let offset = match.index;
      for (const char of match[0]) {
        range.setStart(node, offset); range.setEnd(node, offset + char.length);
        append(char, range.getClientRects()[0]);
        offset += char.length;
      }
    }
  }
  return { blocks, runs, dividers };
}

// Keep headings as individual letters. On dense views, combine a few nearby
// small letters per body so the work stays bounded without dropping text.
export function textFragments(runs, budget) {
  const largeCount = runs.reduce((count, run) => count + (run.size >= 24 ? run.glyphs.length : 0), 0);
  const headingChunk = Math.max(1, Math.ceil(largeCount / Math.max(1, budget * 0.45)));
  const countBodies = (chunk) => runs.reduce((count, run) => count + Math.ceil(run.glyphs.length / (run.size >= 24 ? headingChunk : chunk)), 0);
  let chunk = 1;
  while (countBodies(chunk) > budget && chunk < 64) chunk += 1;
  const bySource = new Map();
  for (const run of runs) {
    const size = run.size >= 24 ? headingChunk : chunk;
    for (let start = 0; start < run.glyphs.length; start += size) {
      const glyphs = run.glyphs.slice(start, start + size);
      const left = glyphs[0].left, right = glyphs.at(-1).right;
      const top = glyphs[0].top, bottom = glyphs[0].bottom;
      const fragment = { ...run, glyphs, width: right - left, height: bottom - top,
        origin: { x: (left + right) / 2, y: (top + bottom) / 2 } };
      if (!bySource.has(run.source)) bySource.set(run.source, []);
      bySource.get(run.source).push(fragment);
    }
  }
  const fragments = [];
  for (const group of bySource.values()) {
    // Only hide a source when all of its visible text fits in the scene.
    if (fragments.length + group.length <= budget) fragments.push(...group);
  }
  return fragments;
}
