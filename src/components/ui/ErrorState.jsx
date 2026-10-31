import Icon from "./Icon.jsx";
import Button from "./Button.jsx";

export default function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <div className="error-block" role="alert">
      <Icon name="alert" size={30} />
      <h2>{title}</h2>
      {message && <p className="muted">{message}</p>}
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
    </div>
  );
}
