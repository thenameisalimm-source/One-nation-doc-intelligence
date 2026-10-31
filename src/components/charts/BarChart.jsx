// Horizontal bars. items: [{ label, value, display? }]
export default function BarChart({ items, tone = "ai" }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const max = Math.max(...items.map((i) => Number(i.value) || 0), 1);

  return (
    <div className="barchart">
      {items.map((item, idx) => {
        const pct = Math.max(2, ((Number(item.value) || 0) / max) * 100);
        return (
          <div className="bar-row" key={idx}>
            <div className="bar-label truncate" title={item.label}>{item.label}</div>
            <div className="bar-track">
              <div className={"bar-fill bar-" + tone} style={{ width: pct + "%" }} />
            </div>
            <div className="bar-value">{item.display ?? item.value}</div>
          </div>
        );
      })}
    </div>
  );
}
