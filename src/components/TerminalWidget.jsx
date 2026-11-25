import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import TerminalGame from "./TerminalGame";
import TerminalWindow from "./terminal/TerminalWindow";
import TerminalCommandPanel from "./terminal/TerminalCommandPanel";
import useTerminalWindow from "../hooks/useTerminalWindow";
import useTerminalSounds from "./useTerminalSounds";

const commands = ["play", "gravity", "draw", "tour", "coffee"];
const games = ["runner", "snake", "pong"];
const gameNames = { runner: "coffee run", snake: "pen tool", pong: "ping" };

export default function TerminalWidget({ activeMode, onModeChange, soundEnabled, onVisibilityChange, windowState, onWindowStateChange, launcherRef, controllerRef }) {
  const isOpen = windowState === "open";
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState([]);
  const [gameKind, setGameKind] = useState(null);
  const inputRef = useRef(null);
  const caretRef = useRef(null);
  const caretPrefixRef = useRef(null);
  const bodyRef = useRef(null);
  const entryIdRef = useRef(0);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const draftRef = useRef("");
  const { playTyping, playClose } = useTerminalSounds(soundEnabled);

  const updateCaret = useCallback(() => {
    const field = inputRef.current;
    const caret = caretRef.current;
    const prefix = caretPrefixRef.current;
    if (!field || !caret || !prefix) return;
    prefix.textContent = field.value.slice(0, field.selectionStart ?? 0);
    const offset = prefix.getBoundingClientRect().width - field.scrollLeft;
    caret.style.left = `${Math.max(0, Math.min(offset, field.clientWidth - 2))}px`;
    caret.hidden = field.selectionStart !== field.selectionEnd;
  }, []);

  useLayoutEffect(updateCaret, [input, isOpen, activeMode, updateCaret]);

  const appendOutput = useCallback((text) => {
    const entry = { id: entryIdRef.current++, type: "output", text };
    setEntries((current) => [...current, entry].slice(-60));
  }, []);

  const exitMode = useCallback(() => {
    if (!activeMode) return;
    onModeChange(null);
    appendOutput(`exited /${activeMode}`);
  }, [activeMode, appendOutput, onModeChange]);

  const { position, windowRef, closeTerminal, minimizeTerminal, toggleTerminal, dragHandlers } = useTerminalWindow({
    activeMode, exitMode, playClose, windowState, onWindowStateChange, onVisibilityChange, launcherRef,
  });

  useEffect(() => {
    if (isOpen && activeMode !== "play") inputRef.current?.focus({ preventScroll: true });
  }, [activeMode, isOpen]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [entries, activeMode]);

  const runCommand = (line) => {
    const raw = line.trim();
    if (!raw) return;
    const normalized = raw.toLowerCase().replace(/^\/+/, "");
    const command = normalized.split(/\s+/)[0];
    const commandEntry = { id: entryIdRef.current++, type: "command", text: raw };

    setEntries((current) => [...current, commandEntry].slice(-60));
    setInput("");
    historyRef.current = [raw, ...historyRef.current].slice(0, 30);
    historyIndexRef.current = -1;
    draftRef.current = "";

    if (normalized === "clear") {
      setEntries([]);
      return;
    }

    if (normalized === "help") {
      appendOutput(`try ${commands.map((item) => `/${item}`).join(", ")}. esc exits.`);
      return;
    }

    if (normalized === "exit") {
      if (activeMode) {
        exitMode();
      } else {
        appendOutput("nothing to exit");
      }
      return;
    }

    if (command === "sudo") {
      appendOutput("guest is not in the sudoers file.");
      return;
    }

    if (!commands.includes(normalized)) {
      appendOutput(`command not found: ${raw}`);
      return;
    }

    let nextGame = gameKind;
    if (normalized === "play") {
      const choices = games.filter((game) => game !== gameKind);
      nextGame = choices[Math.floor(Math.random() * choices.length)];
      setGameKind(nextGame);
    }
    onModeChange(normalized);

    const responses = {
      play: `loading ${gameNames[nextGame]}`,
      gravity: "gravity on. drag things around",
      draw: "pen out. draw anywhere",
      tour: "starting the guided tour",
      coffee: "brewing a fresh one",
    };
    appendOutput(`${responses[normalized]} · esc to exit`);
    if (normalized === "tour") minimizeTerminal();
  };

  const submit = (event) => {
    event.preventDefault();
    runCommand(input);
  };

  const handleInputKey = (event) => {
    if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.nativeEvent.isComposing
      && (event.key.length === 1 || ["Backspace", "Delete", "Enter", "Tab"].includes(event.key))) {
      playTyping(event.key);
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
      event.preventDefault();
      setEntries([]);
      return;
    }
    if (event.ctrlKey && event.key.toLowerCase() === "c") {
      event.preventDefault();
      setInput("");
      exitMode();
      return;
    }
    if (event.key === "Tab" && !event.shiftKey && input.trim()) {
      const prefix = input.toLowerCase().replace(/^\//, "");
      const match = commands.find((command) => command.startsWith(prefix));
      if (match) {
        event.preventDefault();
        setInput(`${input.startsWith("/") ? "/" : ""}${match}`);
      }
      return;
    }
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    const previousCommands = historyRef.current;
    if (!previousCommands.length) return;
    event.preventDefault();
    if (historyIndexRef.current === -1) draftRef.current = input;
    const nextIndex = event.key === "ArrowUp"
      ? Math.min(previousCommands.length - 1, historyIndexRef.current + 1)
      : Math.max(-1, historyIndexRef.current - 1);
    historyIndexRef.current = nextIndex;
    setInput(nextIndex === -1 ? draftRef.current : previousCommands[nextIndex]);
  };

  useImperativeHandle(controllerRef, () => ({ toggle: toggleTerminal }));

  return (
    <TerminalWindow
      windowState={windowState}
      windowRef={windowRef}
      position={position}
      dragHandlers={dragHandlers}
      onClose={closeTerminal}
      onMinimize={minimizeTerminal}
      activeMode={activeMode}
      onExitMode={exitMode}
    >
      {activeMode === "play" && gameKind ? (
        <TerminalGame kind={gameKind} paused={!isOpen} />
      ) : (
        <TerminalCommandPanel
          bodyRef={bodyRef}
          commands={commands}
          entries={entries}
          runCommand={runCommand}
          submit={submit}
          input={input}
          inputRef={inputRef}
          caretRef={caretRef}
          caretPrefixRef={caretPrefixRef}
          onInputChange={(event) => setInput(event.target.value)}
          handleInputKey={handleInputKey}
          updateCaret={updateCaret}
        />
      )}
    </TerminalWindow>
  );
}
