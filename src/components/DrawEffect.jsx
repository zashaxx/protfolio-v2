import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

function readInk() {
  return getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#151515";
}

export default function DrawEffect() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;

    const strokes = [];
    let activeStroke = null;
    let ratio = window.devicePixelRatio || 1;

    const redraw = () => {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.strokeStyle = readInk();
      context.fillStyle = readInk();
      context.lineWidth = 2.5;
      context.lineCap = "round";
      context.lineJoin = "round";

      for (const stroke of strokes) {
        if (stroke.length === 1) {
          context.beginPath();
          context.arc(stroke[0].x, stroke[0].y, 1.25, 0, Math.PI * 2);
          context.fill();
          continue;
        }
        context.beginPath();
        context.moveTo(stroke[0].x, stroke[0].y);
        for (let index = 1; index < stroke.length; index += 1) {
          const previous = stroke[index - 1];
          const point = stroke[index];
          context.quadraticCurveTo(
            previous.x,
            previous.y,
            (previous.x + point.x) / 2,
            (previous.y + point.y) / 2,
          );
        }
        const last = stroke.at(-1);
        context.lineTo(last.x, last.y);
        context.stroke();
      }
    };

    const resize = () => {
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.width = "0px";
      canvas.style.height = "0px";
      const width = Math.max(document.documentElement.scrollWidth, window.innerWidth);
      const height = Math.max(document.documentElement.scrollHeight, window.innerHeight);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      redraw();
    };
    const position = (event) => ({ x: event.pageX, y: event.pageY });
    const pointerDown = (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      activeStroke = [position(event)];
      strokes.push(activeStroke);
      context.beginPath();
      context.arc(activeStroke[0].x, activeStroke[0].y, 1.25, 0, Math.PI * 2);
      context.fill();
    };
    const pointerMove = (event) => {
      if (!activeStroke) return;
      const coalesced = event.getCoalescedEvents?.() ?? [event];
      for (const eventPoint of coalesced.length ? coalesced : [event]) {
        activeStroke.push(position(eventPoint));
        const index = activeStroke.length - 1;
        const previous = activeStroke[index - 1];
        const before = activeStroke[index - 2] ?? previous;
        const point = activeStroke[index];
        context.beginPath();
        context.moveTo((before.x + previous.x) / 2, (before.y + previous.y) / 2);
        context.quadraticCurveTo(previous.x, previous.y, (previous.x + point.x) / 2, (previous.y + point.y) / 2);
        context.stroke();
      }
    };
    const pointerUp = () => { activeStroke = null; };
    const themeObserver = new MutationObserver(redraw);
    const sizeObserver = new ResizeObserver(resize);

    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    sizeObserver.observe(document.body);
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);
    window.addEventListener("resize", resize);
    resize();

    return () => {
      themeObserver.disconnect();
      sizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", pointerUp);
    };
  }, []);

  return createPortal(
    <canvas className="terminal-effect terminal-effect--draw" ref={canvasRef} aria-label="Drawing canvas" />,
    document.body,
  );
}
