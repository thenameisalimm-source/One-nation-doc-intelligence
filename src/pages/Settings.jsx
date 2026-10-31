import { useState } from "react";
import PageHeader from "../components/shared/PageHeader.jsx";
import Card, { CardHeader } from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";
import FilterBar from "../components/shared/FilterBar.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { useStatus } from "../hooks/useStatus.jsx";
import useLocalStorage from "../hooks/useLocalStorage.js";
import useSavedIdeas from "../hooks/useSavedIdeas.js";
import useHistory from "../hooks/useHistory.js";

const PREF_FILTERS = [
  {
    key: "mode",
    label: "Default research mode",
    options: [
      { value: "india", label: "India" },
      { value: "global", label: "Global" },
    ],
  },
];

function Row({ label, children }) {
  return (
    <div className="kv">
      <span className="muted">{label}</span>
      <span className="kv-value">{children}</span>
    </div>
  );
}

export default function Settings() {
  const toast = useToast();
  const { loading, error, data, refresh } = useStatus();
  const [prefs, setPrefs] = useLocalStorage("prefs", { mode: "india" });
  const { items: ideas, clear: clearIdeas } = useSavedIdeas();
  const { items: history, clear: clearHistory } = useHistory();
  const [confirm, setConfirm] = useState(null); // "ideas" | "history" | null

  const safePrefs = prefs && typeof prefs === "object" ? prefs : { mode: "india" };

  function keyBadge(on) {
    if (loading) return <Badge>Checking</Badge>;
    if (error) return <Badge tone="danger">Unknown</Badge>;
    return on ? <Badge tone="live">Configured</Badge> : <Badge tone="warn">Missing</Badge>;
  }

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      prefs: safePrefs,
      savedIdeas: ideas,
      history,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "one-nation-doc-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Export started.", "ok");
  }

  function doConfirm() {
    if (confirm === "ideas") clearIdeas();
    if (confirm === "history") clearHistory();
    setConfirm(null);
    toast("Cleared.", "ok");
  }

  return (
    <div className="stack">
      <PageHeader title="Settings" blurb="API status and preferences." />

      <Card>
        <CardHeader
          title="API status"
          subtitle="Read from the server. Keys are never shown or entered in the app."
          action={<Button onClick={refresh} loading={loading}>Recheck</Button>}
        />
        <Row label="Backend">
          {loading ? <Badge>Checking</Badge> : error ? <Badge tone="danger">Unreachable</Badge> : <Badge tone="live">Reachable</Badge>}
        </Row>
        {error && <p className="faint">{error}</p>}
        <Row label="YouTube API key">{keyBadge(data?.youtube)}</Row>
        <Row label="Anthropic API key">{keyBadge(data?.anthropic)}</Row>
        <Row label="Active AI model">
          {data?.model ? <code>{data.model}</code> : <span className="faint">Not set</span>}
        </Row>
        <p className="faint">
          To change keys or the model, edit YOUTUBE_API_KEY, ANTHROPIC_API_KEY and
          ANTHROPIC_MODEL in Netlify under Site configuration, Environment variables, then
          redeploy.
        </p>
      </Card>

      <Card>
        <CardHeader title="Preferences" />
        <FilterBar
          filters={PREF_FILTERS}
          values={safePrefs}
          onChange={(next) => {
            const ok = setPrefs(next);
            toast(ok ? "Preference saved." : "Could not save preference.", ok ? "ok" : "danger");
          }}
        />
        <p className="faint">Content language is natural Hinglish for all AI output.</p>
      </Card>

      <Card>
        <CardHeader title="Your data" subtitle="Stored only in this browser on this device." />
        <Row label="Saved ideas">{ideas.length}</Row>
        <Row label="History entries">{history.length}</Row>
        <div className="row" style={{ marginTop: 12 }}>
          <Button onClick={exportData}>Export JSON</Button>
          <Button variant="danger" onClick={() => setConfirm("ideas")} disabled={ideas.length === 0}>
            Clear saved
          </Button>
          <Button variant="danger" onClick={() => setConfirm("history")} disabled={history.length === 0}>
            Clear history
          </Button>
        </div>
      </Card>

      <Modal
        open={confirm !== null}
        title={confirm === "ideas" ? "Clear all saved ideas?" : "Clear all history?"}
        onClose={() => setConfirm(null)}
      >
        <div className="stack">
          <p className="muted">This cannot be undone. Consider exporting first.</p>
          <div className="row">
            <Button variant="danger" onClick={doConfirm}>Yes, clear</Button>
            <Button onClick={() => setConfirm(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
