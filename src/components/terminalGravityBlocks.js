const THEME_PROPERTIES = [
  "color", "background-color", "background-image", "border-top-color", "border-right-color",
  "border-bottom-color", "border-left-color", "outline-color", "text-decoration-color",
  "box-shadow", "text-shadow", "fill", "stroke",
];
// Copy the visual/layout properties these cards use, rather than every CSS
// property (including hundreds of inherited variables and browser defaults).
const SNAPSHOT_PROPERTIES = [
  ...THEME_PROPERTIES, "display", "position", "z-index", "box-sizing", "visibility", "opacity",
  "width", "height", "min-width", "max-width", "min-height", "max-height",
  "top", "right", "bottom", "left", "margin", "padding", "border-width", "border-style", "border-radius",
  "background-size", "background-position", "background-repeat", "overflow", "overflow-x", "overflow-y",
  "font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing", "word-spacing",
  "white-space", "text-align", "text-transform", "text-decoration", "vertical-align",
  "flex-direction", "flex-wrap", "flex-grow", "flex-shrink", "flex-basis", "order", "gap",
  "align-items", "align-self", "justify-content", "justify-items", "justify-self",
  "grid-template-columns", "grid-template-rows", "grid-auto-flow", "grid-column", "grid-row",
  "transform", "transform-origin", "clip-path", "object-fit", "object-position", "aspect-ratio",
  "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "stroke-dashoffset", "fill-rule",
];

// Cards must leave their main/sidebar stacking contexts to cross the navigation.
// Keep the React-owned nodes in place and animate inert, styled visual copies.
export default function createGravityBlocks(blocks, dividers = []) {
  const layer = document.createElement("div");
  layer.className = "terminal-gravity-blocks";
  layer.setAttribute("aria-hidden", "true");
  layer.inert = true;
  const appearances = [];
  const detachedBorders = new Map();
  for (const divider of dividers) {
    if (!detachedBorders.has(divider.source)) detachedBorders.set(divider.source, []);
    detachedBorders.get(divider.source).push(divider.side);
  }

  // Finish all computed-style reads before inserting or hiding any elements.
  for (const block of blocks) {
    const source = block.element;
    const clone = source.cloneNode(true);
    const originals = [source, ...source.querySelectorAll("*")];
    const copies = [clone, ...clone.querySelectorAll("*")];
    const styles = originals.map((original) => {
      const style = getComputedStyle(original);
      return SNAPSHOT_PROPERTIES.map((name) => `${name}:${style.getPropertyValue(name)};`).join("");
    });
    appearances.push({ originals, copies, styles });
    block.source = source;
    block.element = clone;
    block.baseTransform = "none";
  }

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const { originals, copies, styles } = appearances[index];
    copies.forEach((copy, nodeIndex) => {
      copy.style.cssText = styles[nodeIndex];
      copy.style.setProperty("transition", "none", "important");
      copy.style.setProperty("animation", "none", "important");
      copy.style.pointerEvents = "none";
      for (const side of detachedBorders.get(originals[nodeIndex]) || []) {
        copy.style.setProperty(`border-${side}-color`, "transparent", "important");
      }
      copy.removeAttribute("id");
      copy.removeAttribute("autofocus");
      copy.removeAttribute("aria-labelledby");
      copy.removeAttribute("aria-describedby");
      copy.removeAttribute("aria-controls");
    });
    Object.assign(block.element.style, {
      position: "absolute", left: `${block.rect.left}px`, top: `${block.rect.top}px`,
      right: "auto", bottom: "auto", margin: "0", boxSizing: "border-box",
      width: `${block.rect.width}px`, height: `${block.rect.height}px`,
      minWidth: "0", maxWidth: "none", minHeight: "0", maxHeight: "none",
      transform: "none", transformOrigin: "center", willChange: "transform",
    });
    layer.append(block.element);
  }
  for (const divider of dividers) {
    const element = document.createElement("div");
    element.className = "terminal-gravity-divider";
    element.dataset.gravityDividerSide = divider.side;
    Object.assign(element.style, {
      position: "absolute", left: `${divider.rect.left}px`, top: `${divider.rect.top}px`,
      width: `${divider.rect.width}px`, height: `${divider.rect.height}px`,
      boxSizing: "border-box", borderTop: `${divider.rect.height}px ${divider.borderStyle} ${divider.color}`,
      transformOrigin: "center", willChange: "transform",
    });
    divider.element = element;
    divider.baseTransform = "none";
    layer.append(element);
  }
  document.body.append(layer);

  return {
    refreshTheme() {
      // Reveal border paint only while reading its new theme color. These
      // synchronous reads/writes finish before the browser paints a frame.
      for (const divider of dividers) divider.source.removeAttribute(`data-terminal-gravity-border-${divider.side}`);
      const dividerColors = dividers.map(({ source, side }) => getComputedStyle(source).getPropertyValue(`border-${side}-color`));
      for (let index = 0; index < dividers.length; index += 1) {
        const divider = dividers[index];
        divider.source.setAttribute(`data-terminal-gravity-border-${divider.side}`, "");
        divider.element.style.borderTopColor = dividerColors[index];
      }
      // Only paint properties change with the theme; geometry stays frozen.
      const colors = appearances.map(({ originals }) => originals.map((original) => {
        const style = getComputedStyle(original);
        return THEME_PROPERTIES.map((name) => style.getPropertyValue(name));
      }));
      appearances.forEach(({ copies }, index) => copies.forEach((copy, nodeIndex) => {
        THEME_PROPERTIES.forEach((name, propertyIndex) => {
          copy.style.setProperty(name, colors[index][nodeIndex][propertyIndex]);
        });
        for (const side of detachedBorders.get(appearances[index].originals[nodeIndex]) || []) {
          copy.style.setProperty(`border-${side}-color`, "transparent", "important");
        }
      }));
    },
    remove() { layer.remove(); },
  };
}
