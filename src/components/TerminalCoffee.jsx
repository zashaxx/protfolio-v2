import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const mug = ["1111111...", "100000111.", "100000101.", "100000101.", "100000111.", "1000001...", ".11111....", "11111111.."];

export default function TerminalCoffee() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current, context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;
    const root = document.documentElement;
    const pointer = { x: innerWidth / 2, y: innerHeight / 2 };
    const cursor = { x: pointer.x + 14, y: pointer.y + 18 };
    const steam = [];
    let ratio, ink, paper, frame = 0, lastFrame = performance.now(), elapsed = 0;
    const resize = () => {
      ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(innerWidth * ratio); canvas.height = Math.round(innerHeight * ratio);
      canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`;
    };
    const colors = () => {
      const style = getComputedStyle(root);
      ink = style.getPropertyValue("--ink").trim() || "#151515";
      paper = style.getPropertyValue("--background").trim() || "#eee";
    };
    const move = (event) => { pointer.x = event.clientX; pointer.y = event.clientY; };
    const animate = (now) => {
      const delta = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000)); lastFrame = now;
      const easing = 1 - Math.exp(-22 * delta);
      cursor.x += (pointer.x + 14 - cursor.x) * easing; cursor.y += (pointer.y + 18 - cursor.y) * easing;
      elapsed += delta;
      while (elapsed > 0.075) {
        elapsed -= 0.075;
        steam.push({ x: cursor.x + (1 + Math.random() * 4) * 2, y: cursor.y - 2,
          age: 0, life: 1.1 + Math.random() * 0.7, phase: Math.random() * Math.PI * 2, drift: (Math.random() - 0.5) * 6 });
      }
      context.setTransform(1, 0, 0, 1, 0, 0); context.clearRect(0, 0, canvas.width, canvas.height);
      context.setTransform(ratio, 0, 0, ratio, 0, 0); context.fillStyle = ink;
      for (let index = steam.length - 1; index >= 0; index -= 1) {
        const particle = steam[index]; particle.age += delta;
        if (particle.age >= particle.life) { steam.splice(index, 1); continue; }
        particle.y -= 26 * delta;
        particle.x += (10 * Math.sin(particle.age * 4 + particle.phase) + particle.drift) * delta;
        context.globalAlpha = (1 - particle.age / particle.life) * 0.75;
        context.fillRect(Math.round(particle.x / 2) * 2, Math.round(particle.y / 2) * 2, 2, 2);
      }
      context.globalAlpha = 1;
      const x = Math.round(cursor.x / 2) * 2, y = Math.round(cursor.y / 2) * 2;
      mug.forEach((row, dy) => {
        for (let dx = 0; dx < row.length; dx += 1) {
          if (row[dx] !== ".") {
            context.fillStyle = row[dx] === "1" ? ink : paper;
            context.fillRect(x + dx * 2, y + dy * 2, 2, 2);
          }
        }
      });
      frame = requestAnimationFrame(animate);
    };
    resize(); colors();
    const observer = new MutationObserver(colors);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("pointermove", move, { passive: true }); window.addEventListener("pointerdown", move, { passive: true });
    window.addEventListener("resize", resize); frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerdown", move); window.removeEventListener("resize", resize);
    };
  }, []);

  return createPortal(<canvas className="terminal-effect terminal-effect--coffee" ref={canvasRef} aria-hidden="true" />, document.body);
}
