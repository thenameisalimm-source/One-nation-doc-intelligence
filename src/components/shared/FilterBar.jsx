// filters: [{ key, label, options: [{ value, label }] }]
// values:  { [key]: value }
export default function FilterBar({ filters, values, onChange }) {
  return (
    <div className="filter-bar">
      {filters.map((f) => (
        <label key={f.key} className="filter-field">
          <span className="faint">{f.label}</span>
          <select
            value={values[f.key] ?? ""}
            onChange={(e) => onChange({ ...values, [f.key]: e.target.value })}
          >
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
