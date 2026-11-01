 import { useEffect, useRef, useState } from "react";
import PageHeader from "./PageHeader.jsx";
import VideoResults from "./VideoResults.jsx";
import ChannelResults from "./ChannelResults.jsx";
import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import Icon from "../ui/Icon.jsx";
import { CardSkeleton } from "../ui/Skeleton.jsx";
import { useToast } from "../ui/Toast.jsx";
import { useStatus } from "../../hooks/useStatus.jsx";
import useLocalStorage from "../../hooks/useLocalStorage.js";
import useHistory from "../../hooks/useHistory.js";
import useSavedIdeas from "../../hooks/useSavedIdeas.js";
import { apiPost } from "../../services/apiClient.js";
import { formatCount } from "../../utils/formatters.js";
import "../../styles/forms.css";
import "../../styles/results.css";

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

function summaryFor(data) {
  if (typeof data.text === "string") return data.text.slice(0, 160);
  if (data.channel && data.channel.title) {
    const subs = data.channel.subscribers;
    return "Channel: " + data.channel.title + (typeof subs === "number" ? " · " + formatCount(subs) + " subscribers" : "");
  }
  if (Array.isArray(data.videos)) {
    return data.videos.length + " videos found" + (data.meta && data.meta.mode ? " · " + data.meta.mode + " mode" : "");
  }
  return undefined;
}

// config: { title, blurb, requires: "youtube"|"anthropic", endpoint, task?, historyType,
//           fields: [...], submitLabel, note?,
//           resultView?: "videos" | "channel", viewKind?: "trending"|"viral"|"research"|"competitor"|"analytics" }
// The first field is treated as the main query and is logged to history.
export default function FeaturePage({
  title, blurb, requires, endpoint, task, historyType, fields, submitLabel, note,
  resultView, viewKind,
}) {
  const toast = useToast();
  const status = useStatus();
  const [prefs] = useLocalStorage("prefs", { mode: "india" });
  const hist = useHistory();
  const saved = useSavedIdeas();
  const resultRef = useRef(null);

  const [values, setValues] = useState(() => initialValues(fields, prefs));
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [lastQuery, setLastQuery] = useState("");

  const reason = blockedReason(status, requires);

  // Bring new results into view on small screens.
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  function setField(key, value) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function run() {
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
      hist.add({ type: historyType, query: primary, summary: summaryFor(data) });
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    run();
  }

  function saveResult() {
    const ok = saved.add({
      type: "idea",
      title: title + ": " + lastQuery,
      body: result.text,
    });
    toast(ok ? "Saved on this device." : "Could not save. Browser storage may be blocked.", ok ? "ok" : "danger");
  }

  const isVideos = resultView === "videos" && result && Array.isArray(result.videos);
  const isChannel = resultView === "channel" && result && result.channel && typeof result.channel === "object";
  const hasText = result && typeof result.text === "string";

  return (
    <div className="stack">
      <PageHeader title={title} blurb={blurb} />

      <Card>
        <form className="stack" onSubmit={onSubmit}>
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

      {running &&
        (resultView ? (
          <CardSkeleton count={2} />
        ) : (
          <Card>
            <div className="skeleton" style={{ height: 18, width: "60%" }} />
            <div className="skeleton" style={{ height: 90, marginTop: 12 }} />
          </Card>
        ))}

      {error && <ErrorState title="Request failed" message={error} onRetry={run} />}

      {result && (
        <div ref={resultRef} className="results-anchor stack">
          {isVideos && (
            <VideoResults
              key={(result.meta && result.meta.fetchedAt) || "r"}
              data={result}
              kind={viewKind}
            />
          )}

          {isChannel && <ChannelResults data={result} kind={viewKind} />}

          {!isVideos && !isChannel && (
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
                  <p className="faint">Raw response. The server sent a shape this screen does not recognise.</p>
                  <pre className="raw">{JSON.stringify(result, null, 2)}</pre>
                </>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
