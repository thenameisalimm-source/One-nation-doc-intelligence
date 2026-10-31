export default function Card({ children, className = "", as: Tag = "section", glow = false, ...rest }) {
  return (
    <Tag className={"card" + (glow ? " card-glow" : "") + (className ? " " + className : "")} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="card-head">
      <div className="card-head-text">
        <h2>{title}</h2>
        {subtitle && <p className="faint">{subtitle}</p>}
      </div>
      {action && <div className="card-head-action">{action}</div>}
    </div>
  );
}
