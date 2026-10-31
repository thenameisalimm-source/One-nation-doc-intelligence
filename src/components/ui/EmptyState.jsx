import Icon from "./Icon.jsx";

export default function EmptyState({ icon = "search", title, message, action }) {
  return (
    <div className="empty-block">
      <Icon name={icon} size={34} />
      <h2>{title}</h2>
      {message && <p className="muted">{message}</p>}
      {action}
    </div>
  );
}
