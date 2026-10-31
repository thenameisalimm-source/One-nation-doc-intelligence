import Icon from "../ui/Icon.jsx";

// Honest placeholder shown only while a page file does not exist yet.
export default function PagePlaceholder({ route }) {
  return (
    <div className="stack">
      <div>
        <h1>{route.label}</h1>
        <p className="muted">{route.blurb}</p>
      </div>
      <div className="empty-block">
        <Icon name={route.icon} size={36} />
        <h2>Page not built yet</h2>
        <p className="muted">
          This module's page file (<code>src/pages/{route.file}.jsx</code>) has not been
          added. It arrives in Batch 4. No data is shown here.
        </p>
      </div>
    </div>
  );
}
