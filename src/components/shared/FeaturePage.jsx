import { useState } from "react";
import PageHeader from "./PageHeader.jsx";
import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import Icon from "../ui/Icon.jsx";
import { useToast } from "../ui/Toast.jsx";
import { useStatus } from "../../hooks/useStatus.jsx";
import useLocalStorage from "../../hooks/useLocalStorage.js";
import useHistory from "../../hooks/useHistory.js";
import useSavedIdeas from "../../hooks/useSavedIdeas.js";
import { apiPost } from "../../services/apiClient.js";
import "../../styles/forms.css";

const SERVICE_LABEL = { youtube: "YouTube API key", anthropic: "Anthropic API key" };

function initialValues(fields, prefs) {
  const out = {};
  for (const f of fields) {
    if (f.key === "mode" && prefs && prefs.mode) out[f.key] = prefs.mode;
    else if (f.default !== undefined) out[f.key] = f.default;
    else if (f.type === "select") out[f.key] = f.options[0].value;
    else out[f.key] = "";
  }
  return out;
}

function blockedReason(status, requires) {
  if (status.loading) return "Checking backend status…";
  if (status.error) return "Backend not reachable. " + status.error;
  if (!status.data || !status.data[requires]) {
    return "Needs the " + SERVICE_LABEL[requires] + ". Add it in Netlify environment variables, then redeploy.";
  }
  return null;
}

// config: { title, blurb, requires: "youtube"|"anthropic", endpoint, task?, historyType,
//           fields: [{ key, label, type: "text"|"textarea"|"select", options?, placeholder?, required?, hint? }],
//           submitLabel, note? }
// The first field is treated as the main query and is logged to history.
export default function FeaturePage({
  title, blurb, requires, endpoint, task, historyType, fields, submitLabel, note,
}) {
  const toast = useToast();
  const status = useStatus();
  const [prefs] = useLocalStorage("prefs", { mode: "india" });
  const hist = useHistory();
  const saved = useSavedIdeas();

  const [values, setValues] = useState(() => initialValues(fields, prefs));
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [lastQuery, setLastQuery] = useState("");

  const reason = blockedReason(status, requires);

  function setField(key, value) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    if (reason) return;

    const trimmed = {};
    for (const f of fields) trimmed[f.key] = String(values[f.key] || "").trim();

    const missing = fields.find((f) => f.required && !trimmed[f.key]);
    if (missing) {
      toast("Please fill in: " + missing.label, "danger");
      return;
    }

    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const body = task ? { task, ...trimmed } : trimmed;
      const data = await apiPost(endpoint, body);
      const primary = trimmed[fields[0].key];
      setResult(data);
      setLastQuery(primary);
      hist.add({
        type: historyType,
        query: primary,
        summary: typeof data.text === "string" ? data.text.slice(0, 160) : undefined,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  function saveResult() {
    const ok = saved.add({
      type: "idea",
      title: title + ": " + lastQuery,
      body: result.text,
    });
    toast(ok ? "Saved on this device." : "Could not save. Browser storage may be blocked.", ok ? "ok" : "danger");
  }

  const hasText = result && typeof result.text === "string";

  return (
    <div className="stack">
      <PageHeader title={title} blurb={blurb} />

      <Card>
        <form className="stack" onSubmit={submit}>
          {fields.map((f) => (
            <label key={f.key} className="form-field">
              <span>{f.label}{f.required ? " *" : ""}</span>
              {f.type === "select" ? (
                <select value={values[f.key]} onChange={(e) => setField(f.key, e.target.value)}>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  value={values[f.key]}
                  placeholder={f.placeholder}
                  maxLength={1500}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  value={values[f.key]}
                  placeholder={f.placeholder}
                  maxLength={200}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
              )}
              {f.hint && <span className="form-hint">{f.hint}</span>}
            </label>
          ))}

          {reason && (
            <div className="blocked-note" role="status">
              <Icon name="alert" size={18} />
              <div><strong>Not available right now.</strong> {reason}</div>
            </div>
          )}

          {note && <p className="faint">{note}</p>}

          <Button
            type="submit"
            variant={requires === "anthropic" ? "ai" : "secondary"}
            loading={running}
            disabled={Boolean(reason)}
            block
          >
            {submitLabel}
          </Button>
        </form>
      </Card>

      {running && (
        <Card>
          <div className="skeleton" style={{ height: 18, width: "60%" }} />
          <div className="skeleton" style={{ height: 90, marginTop: 12 }} />
        </Card>
      )}

      {error && <ErrorState title="Request failed" message={error} onRetry={() => setError(null)} />}

      {result && (
        <Card glow>
          <div className="row" style={{ marginBottom: 12 }}>
            <Badge tone={requires === "anthropic" ? "ai" : "live"}>
              {requires === "anthropic" ? "AI generated" : "Live YouTube data"}
            </Badge>
          </div>
          {hasText ? (
            <>
              <p className="result-text">{result.text}</p>
              <div className="row" style={{ marginTop: 12 }}>
                <Button onClick={saveResult}>Save result</Button>
              </div>
            </>
          ) : (
            <>
              <p className="faint">Raw response. A formatted view arrives with the next backend phase.</p>
              <pre className="raw">{JSON.stringify(result, null, 2)}</pre>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
