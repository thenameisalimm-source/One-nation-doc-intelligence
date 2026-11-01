import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import { useToast } from "../ui/Toast.jsx";
import "../../styles/ai.css";

function when(iso) {
  if (!iso) return "unknown time";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown time";
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// text: AI answer. meta: { model, generatedAt, truncated } from /api/ai-generate.
export default function AiResult({ text, meta, onSave, saveLabel = "Save result" }) {
  const toast = useToast();
  const info = meta || {};

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied.", "ok");
    } catch {
      toast("Copy is blocked by this browser. Select the text and copy it manually.", "danger");
    }
  }

  return (
    <Card glow>
      <div className="ai-meta">
        <Badge tone="ai">AI generated</Badge>
        {info.model && <span className="faint">Model: {info.model}</span>}
        <span className="faint">{when(info.generatedAt)}</span>
      </div>

      {info.truncated && (
        <div className="ai-warn" role="status">
          This answer was cut off because it reached the length limit. Try again, or use a narrower topic.
        </div>
      )}

      <p className="result-text ai-text">{text}</p>

      <div className="row" style={{ marginTop: 12 }}>
        <Button onClick={copy}>Copy</Button>
        {onSave && <Button onClick={onSave}>{saveLabel}</Button>}
      </div>

      <p className="faint" style={{ marginTop: 12 }}>
        AI can make mistakes and has no live data. Verify every fact, name and date before publishing.
      </p>
    </Card>
  );
}
