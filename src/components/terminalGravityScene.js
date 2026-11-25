const BLOCK_SELECTOR = [
  ".expertise-item", ".profile-facts > div", ".contact-card", ".project-gallery",
  ".stack-preview__tools > *", ".contribution-strip > a",
  ".desktop-sidebar .brand", ".sidebar-toggle", ".sidebar-nav > a",
  ".sidebar-socials > a", ".sidebar-controls > button",
  ".sidebar-theme-picker .theme-picker > button", ".sidebar-bottom__email-row > *",
].join(", ");

function intersectsViewport(rect, width, height) {
  return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < width && rect.bottom > 0 && rect.top < height;
}

// Read geometry before changing any styles. Cards carry their own text, rather
// than spawning a second set of colliding letters inside the card's body.
export function measureScene(roots, width, height) {
  const blocks = [];
  for (const element of roots.flatMap((root) => [...root.querySelectorAll(BLOCK_SELECTOR)])) {
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
    blocks.push({ element, rect, baseTransform: style.transform, saved: {
      transform: element.style.transform,
      transition: element.style.transition,
      willChange: element.style.willChange,
    } });
  }

  const sources = new Map();
  const runs = [];
  const range = document.createRange();
  for (const root of roots) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const source = node.parentElement;
      if (!source || !node.data.trim()) continue;
      if (!sources.has(source)) {
        const excluded = source.closest(".terminal-widget, script, style, svg, [hidden], [aria-hidden='true']")
          || blocks.some((block) => block.element.contains(source));
        const rect = excluded ? null : source.getBoundingClientRect();
        const style = rect && intersectsViewport(rect, width, height) ? getComputedStyle(source) : null;
        sources.set(source, style && style.visibility !== "hidden" && style.display !== "none" ? {
          source,
          size: parseFloat(style.fontSize) || 14,
          font: `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
          color: style.color,
          textTransform: style.textTransform,
        } : null);
      }
      const appearance = sources.get(source);
      if (!appearance) continue;
      let line = null;
      for (let index = 0; index < node.length; index += 1) {
        let char = node.data[index];
        if (/\s/.test(char)) continue;
        range.setStart(node, index); range.setEnd(node, index + 1);
        const rect = range.getClientRects()[0];
        if (!rect || !intersectsViewport(rect, width, height)) continue;
        if (appearance.textTransform === "uppercase") char = char.toUpperCase();
        if (appearance.textTransform === "lowercase") char = char.toLowerCase();
        if (!line || Math.abs(rect.top - line.top) > 1 || rect.left < line.glyphs.at(-1).left) {
          line = { ...appearance, top: rect.top, glyphs: [] };
          runs.push(line);
        }
        line.glyphs.push({ char, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom });
      }
    }
  }
  return { blocks, runs };
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
