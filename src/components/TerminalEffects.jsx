import { useEffect } from "react";
import DrawEffect from "./DrawEffect";
import startGravity from "./terminalGravity";
import TerminalClone from "./TerminalClone";
import TerminalCoffee from "./TerminalCoffee";
import "./TerminalEffects.css";

function GravityEffect({ onExit }) {
  useEffect(() => startGravity(onExit), [onExit]);
  return null;
}

export default function TerminalEffects({ mode, onExit, onType }) {
  if (mode === "draw") return <DrawEffect />;
  if (mode === "gravity") return <GravityEffect onExit={onExit} />;
  if (mode === "tour") return <TerminalClone onExit={onExit} onType={onType} />;
  if (mode === "coffee") return <TerminalCoffee />;
  return null;
}
