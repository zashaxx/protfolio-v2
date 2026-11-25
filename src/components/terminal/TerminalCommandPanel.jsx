export default function TerminalCommandPanel({ bodyRef, commands, entries, runCommand, submit, input, inputRef, caretRef, caretPrefixRef, onInputChange, handleInputKey, updateCaret }) {
  return (
    <div className="terminal-window__body" ref={bodyRef} aria-live="polite">
      <p className="terminal-window__hint">available commands:</p>
      <div className="terminal-window__commands" aria-label="Available terminal commands">
        {commands.map((command) => (
          <button type="button" key={command} onClick={() => runCommand(`/${command}`)}>
            /{command}
          </button>
        ))}
      </div>
      {entries.map((entry) => (
        <p className={`terminal-window__entry terminal-window__entry--${entry.type}`} key={entry.id}>
          {entry.type === "command" && <span>guest@zashaxx:~$&nbsp;</span>}
          {entry.text}
        </p>
      ))}
      <form className="terminal-window__form" onSubmit={submit}>
        <label className="terminal-window__prompt" htmlFor="terminal-command">
          <span>guest@zashaxx:~$</span>
        </label>
        <div className="terminal-window__input">
          <input
            id="terminal-command"
            ref={inputRef}
            type="text"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            enterKeyHint="go"
            value={input}
            onChange={onInputChange}
            onKeyDown={handleInputKey}
            onSelect={updateCaret}
            onScroll={updateCaret}
            onFocus={updateCaret}
            aria-label="Enter a terminal command"
          />
          <span className="terminal-window__caret-prefix" ref={caretPrefixRef} aria-hidden="true" />
          <span className="terminal-window__caret" ref={caretRef} aria-hidden="true" />
        </div>
      </form>
    </div>
  );
}
