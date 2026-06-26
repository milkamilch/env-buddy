import "./Segmented.css";

export default function Segmented({ options, value, onChange, counts }) {
  return (
    <div className="segmented">
      {options.map((opt) => {
        const label = typeof opt === "string" ? opt : opt.label;
        const val   = typeof opt === "string" ? opt : opt.value;
        return (
          <button
            key={val}
            className={`seg-btn ${value === val ? "active" : ""}`}
            onClick={() => onChange(val)}
          >
            {label}
            {counts?.[val] != null && (
              <span className="seg-count">{counts[val]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
