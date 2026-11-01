import { useEffect, useRef, useState } from "react";
import PageHeader from "../components/shared/PageHeader.jsx";
import Card, { CardHeader } from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { useStatus } from "../hooks/useStatus.jsx";
import useHistory from "../hooks/useHistory.js";
import useSavedIdeas from "../hooks/useSavedIdeas.js";
import { generateOutline, generateSectionText, aiBlockedReason } from "../services/aiService.js";
import "../styles/forms.css";
import "../styles/ai.css";

const LENGTH_OPTIONS = [
  { value: "5", label: "About 5 minutes (4 sections)" },
  { value: "10", label: "About 10 minutes (8 sections)" },
  { value: "20", label: "About 20 minutes (16 sections)" },
];

export default function ScriptGenerator() {
  const toast = useToast();
  const status = useStatus();
  const hist = useHistory();
  const saved = useSavedIdeas();
  const reason = aiBlockedReason(status);

  const [topic, setTopic] = useState("");
  const [length, setLength] = useState("10");
  const [notes, setNotes] = useState("");

  const [job, setJob] = useState(null); // inputs used for the current outline
  const [outline, setOutline] = useState(null); // { title, hook, sections }
  const [texts, setTexts] = useState([]); // written text per section, or null
  const [cut, setCut] = useState({}); // sections the model cut off at its length limit
  const [model, setModel] = useState(null);
  const [busy, setBusy] = useState(null); // "outline" | "script" | null
  const [current, setCurrent] = useState(-1);
  const [error, setError] = useState(null);

  // Job identifier. Every new outline and every Start over moves it forward.
  // A request may only update the screen if the identifier it started with is still current.
  const jobIdRef = useRef(0);
  // "Stop" flag for the current writing loop only.
  const stopRef = useRef(false);

  // Invalidate everything in flight when leaving the page.
  useEffect(() => {
    return () => {
      jobIdRef.current += 1;
      stopRef.current = true;
    };
  }, []);

  const total = outline ? outline.sections.length : 0;
  const doneCount = texts.filter(Boolean).length;
  const nextIndex = texts.findIndex((t) => !t);

  async function makeOutline(e) {
    e.preventDefault();
    if (reason || busy) return;
    const t = topic.trim();
    if (!t) {
      toast("Please enter a documentary topic.", "danger");
      return;
    }
    const n = notes.trim();

    const myId = ++jobIdRef.current;
    stopRef.current = false;

    setBusy("outline");
    setError(null);
    setOutline(null);
    setTexts([]);
    setCut({});
    setCurrent(-1);
    try {
      const data = await generateOutline({ topic: t, length, notes: n });
      if (myId !== jobIdRef.current) return; // stale: a newer job or Start over replaced this one
      setJob({ topic: t, length, notes: n });
      setOutline(data.outline);
      setTexts(new Array(data.outline.sections.length).fill(null));
      setModel(data.meta && data.meta.model);
      hist.add({
        type: "script",
        query: t,
        summary: "Outline: " + data.outline.sections.length + " sections",
      });
    } catch (err) {
      if (myId !== jobIdRef.current) return;
      setError(err.message);
    } finally {
      if (myId === jobIdRef.current) setBusy(null);
    }
  }

  // Writes sections one request at a time. `single` writes only section `start`.
  async function writeFrom(start, single = false) {
    if (reason || busy || !outline || !job) return;
    const myId = jobIdRef.current;
    stopRef.current = false;
    setBusy("script");
    setError(null);

    const working = [...texts];
    try {
      for (let i = start; i < outline.sections.length; i += 1) {
        if (myId !== jobIdRef.current || stopRef.current) break;
        setCurrent(i);
        const previous = i > 0 && working[i - 1] ? working[i - 1].slice(-350) : "";
        const data = await generateSectionText({
          topic: job.topic,
          notes: job.notes,
          sections: outline.sections,
          index: i,
          previous,
        });
        if (myId !== jobIdRef.current) return; // stale: discard this response
        working[i] = data.text;
        setTexts([...working]);
        setCut((c) => ({ ...c, [i]: Boolean(data.meta && data.meta.truncated) }));
        if (data.meta && data.meta.model) setModel(data.meta.model);
        if (single) break;
      }
    } catch (err) {
      if (myId !== jobIdRef.current) return;
      setError(err.message);
    } finally {
      if (myId === jobIdRef.current) {
        setBusy(null);
        setCurrent(-1);
      }
    }
  }

  function stop() {
    stopRef.current = true;
    toast("Stopping after the current section.");
  }

  function startOver() {
    jobIdRef.current += 1; // anything still in flight is now stale
    stopRef.current = true;
    setOutline(null);
    setTexts([]);
    setCut({});
    setJob(null);
    setError(null);
    setBusy(null);
    setCurrent(-1);
  }

  function fullScript() {
    const parts = [outline.title || job.topic];
    if (outline.hook) parts.push("Hook: " + outline.hook);
    outline.sections.forEach((s, i) => {
      if (texts[i]) parts.push(i + 1 + ". " + s.title + "\n\n" + texts[i]);
    });
    return parts.join("\n\n");
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied.", "ok");
    } catch {
      toast("Copy is blocked by this browser. Select the text and copy it manually.", "danger");
    }
  }

  function saveScript() {
    const remaining = total - doneCount;
    const complete = remaining === 0;

    let body = fullScript();
    if (!complete) {
      const unwritten = outline.sections
        .map((s, i) => (texts[i] ? null : i + 1 + ". " + s.title))
        .filter(Boolean)
        .join("\n");
      const header =
        "INCOMPLETE SCRIPT: " + doneCount + " of " + total + " sections written. " +
        remaining + (remaining === 1 ? " section is" : " sections are") + " still unwritten.";
      const footer =
        "--- END OF PARTIAL SCRIPT ---\n" +
        remaining + (remaining === 1 ? " section" : " sections") + " not written yet:\n" + unwritten;
      body = header + "\n\n" + body + "\n\n" + footer;
    }

    const ok = saved.add({
      type: "idea",
      title: (complete ? "Script: " : "Partial script: ") + job.topic,
      body,
    });
    toast(ok ? "Saved on this device." : "Could not save. Browser storage may be blocked.", ok ? "ok" : "danger");
  }

  const writing = busy === "script";
  const progressPct = total ? Math.max(2, (doneCount / total) * 100) : 0;

  return (
    <div className="stack">
      <PageHeader
        title="Script Generator"
        blurb="Outline first, then a natural Hinglish script written one section at a time."
      />

      <Card>
        <form className="stack" onSubmit={makeOutline}>
          <label className="form-field">
            <span>Documentary topic *</span>
            <input
              type="text"
              value={topic}
              maxLength={200}
              placeholder="e.g. The fall of Vijayanagara"
              onChange={(e) => setTopic(e.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Target length</span>
            <select value={length} onChange={(e) => setLength(e.target.value)}>
              {LENGTH_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Notes (optional)</span>
            <textarea
              value={notes}
              maxLength={1000}
              placeholder="Tone, key facts, sources to include"
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          {reason && (
            <div className="blocked-note" role="status">
              <Icon name="alert" size={18} />
              <div><strong>Not available right now.</strong> {reason}</div>
            </div>
          )}

          <p className="faint">
            Step 1 creates an outline. Step 2 writes the script section by section, so each request stays
            short enough for the server. AI output can contain mistakes, so verify every fact.
          </p>

          <Button
            type="submit"
            variant="ai"
            loading={busy === "outline"}
            disabled={Boolean(reason) || writing}
            block
          >
            {busy === "outline" ? "Planning outline…" : "Step 1: Create outline"}
          </Button>
        </form>
      </Card>

      {busy === "outline" && (
        <Card>
          <div className="skeleton" style={{ height: 18, width: "60%" }} />
          <div className="skeleton" style={{ height: 90, marginTop: 12 }} />
        </Card>
      )}

      {error && (
        <ErrorState
          title="Request failed"
          message={
            error +
            (outline && doneCount > 0 ? " Your finished sections are kept below." : "")
          }
          onRetry={outline ? () => setError(null) : undefined}
        />
      )}

      {outline && (
        <Card glow>
          <div className="ai-meta">
            <Badge tone="ai">AI generated</Badge>
            {model && <span className="faint">Model: {model}</span>}
          </div>
          <CardHeader title={outline.title || job.topic} subtitle={outline.hook || undefined} />

          <ol className="outline-list">
            {outline.sections.map((s, i) => (
              <li key={i}>
                <strong>{s.title}</strong>
                {s.summary && <span className="muted">{s.summary}</span>}
              </li>
            ))}
          </ol>

          <div className="script-progress" style={{ marginTop: 16 }}>
            <div className="row-between">
              <span className="faint">
                {writing
                  ? "Writing section " + (current + 1) + " of " + total + "…"
                  : doneCount + " of " + total + " sections written"}
              </span>
            </div>
            <div className="bar-track">
              <div className="bar-fill bar-ai" style={{ width: (doneCount ? progressPct : 0) + "%" }} />
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            {!writing && nextIndex !== -1 && (
              <Button variant="ai" onClick={() => writeFrom(nextIndex)} disabled={Boolean(reason)}>
                {doneCount === 0
                  ? "Step 2: Write full script"
                  : "Continue from section " + (nextIndex + 1)}
              </Button>
            )}
            {writing && <Button onClick={stop}>Stop</Button>}
            <Button variant="danger" onClick={startOver}>Start over</Button>
          </div>

          <p className="faint" style={{ marginTop: 12 }}>
            The outline cannot be edited here. To change it, use Start over and adjust your notes.
          </p>
        </Card>
      )}

      {outline &&
        texts.map((text, i) =>
          text ? (
            <Card key={i} className="script-section">
              <div className="script-section-head">
                <h3>{i + 1}. {outline.sections[i].title}</h3>
              </div>
              {cut[i] && (
                <div className="ai-warn" role="status">
                  This section was cut off at the length limit. Use Rewrite to try again.
                </div>
              )}
              <p className="result-text ai-text">{text}</p>
              <div className="row">
                <Button onClick={() => copyText(text)}>Copy</Button>
                <Button onClick={() => writeFrom(i, true)} disabled={Boolean(busy) || Boolean(reason)}>
                  Rewrite section
                </Button>
              </div>
            </Card>
          ) : null
        )}

      {outline && doneCount > 0 && (
        <Card>
          <CardHeader
            title="Full script"
            subtitle={doneCount < total ? "Partial: " + doneCount + " of " + total + " sections" : "All sections written"}
          />
          <div className="row">
            <Button onClick={() => copyText(fullScript())}>Copy all</Button>
            <Button onClick={saveScript}>Save script</Button>
          </div>
          <p className="faint" style={{ marginTop: 12 }}>
            Each section was written separately, so read the whole script once for flow. Verify every fact,
            name and date before recording.
          </p>
        </Card>
      )}
    </div>
  );
  }
