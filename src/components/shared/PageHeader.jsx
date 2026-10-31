export default function PageHeader({ title, blurb, action }) {
  return (
    <div className="page-head">
      <div className="page-head-text">
        <h1>{title}</h1>
        {blurb && <p className="muted">{blurb}</p>}
      </div>
      {action}
    </div>
  );
}
