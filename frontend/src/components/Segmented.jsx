import "./Segmented.css";

export default function Segmented({ options, value, onChange, counts, label = "Filter" }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((opt) => {
        const optLabel = typeof opt === "string" ? opt : opt.label;
        const val      = typeof opt === "string" ? opt : opt.value;
        return (
          <button
            key={val}
            type="button"
            aria-pressed={value === val}
            className={`seg-btn ${value === val ? "active" : ""}`}
            onClick={() => onChange(val)}
          >
            {optLabel}
            {counts?.[val] != null && (
              <span className="seg-count">{counts[val]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
