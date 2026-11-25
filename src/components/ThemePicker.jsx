import { themeOptions } from "../data/portfolio";

export default function ThemePicker({ value, onChange, compact = false }) {
  return (
    <div
      className={`theme-picker ${compact ? "theme-picker--compact" : ""}`}
      aria-label="Choose appearance"
      role="group"
    >
      {themeOptions.map((option) => {
        const Icon = option.icon;

        return (
          <button
            className={value === option.value ? "is-active" : ""}
            key={option.value}
            type="button"
            onClick={(event) => onChange(option.value, event)}
            aria-pressed={value === option.value}
            title={`${option.label} theme`}
          >
            <Icon size={13} strokeWidth={1.7} aria-hidden="true" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
