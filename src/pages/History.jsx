import { useState } from "react";
import PageHeader from "../components/shared/PageHeader.jsx";
import Card from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import FilterBar from "../components/shared/FilterBar.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import useHistory from "../hooks/useHistory.js";
import { timeAgo, formatDate } from "../utils/formatters.js";

export default function History() {
  const toast = useToast();
  const { items, remove, clear } = useHistory();
  const [filters, setFilters] = useState({ type: "all" });
  const [confirm, setConfirm] = useState(false);

  const types = [...new Set(items.map((i) => i.type))];
  const filterDefs = [
    {
      key: "type",
      label: "Module",
      options: [{ value: "all", label: "All" }, ...types.map((t) => ({ value: t, label: t }))],
    },
  ];

  const shown = filters.type === "all" ? items : items.filter((i) => i.type === filters.type);

  return (
    <div className="stack">
      <PageHeader
        title="Research History"
        blurb="The latest 100 research runs, stored on this device."
        action={
          items.length > 0 ? (
            <Button variant="danger" onClick={() => setConfirm(true)}>Clear all</Button>
          ) : null
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon="clock"
          title="No history yet"
          message="Each search or AI run is logged here once live research connects in Phase 3 and Phase 4."
        />
      ) : (
        <>
          <FilterBar filters={filterDefs} values={filters} onChange={setFilters} />
          <div className="stack">
            {shown.map((h) => (
              <Card key={h.id} className="stack-sm">
                <div className="row">
                  <Badge tone="ai">{h.type}</Badge>
                  <span className="faint" title={formatDate(h.at)}>{timeAgo(h.at)}</span>
                </div>
                <h3>{h.query}</h3>
                {h.summary && <p className="muted note-body">{h.summary}</p>}
                <div className="row">
                  <Button variant="danger" onClick={() => { remove(h.id); toast("Removed."); }}>
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal open={confirm} title="Clear all history?" onClose={() => setConfirm(false)}>
        <div className="stack">
          <p className="muted">This permanently deletes every research entry on this device.</p>
          <div className="row">
            <Button
              variant="danger"
              onClick={() => { clear(); setConfirm(false); toast("History cleared.", "ok"); }}
            >
              Yes, clear it
            </Button>
            <Button onClick={() => setConfirm(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
