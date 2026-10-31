import { useState } from "react";
import PageHeader from "../components/shared/PageHeader.jsx";
import Card from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import FilterBar from "../components/shared/FilterBar.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import useSavedIdeas from "../hooks/useSavedIdeas.js";
import { formatDate } from "../utils/formatters.js";

const FILTERS = [
  {
    key: "type",
    label: "Type",
    options: [
      { value: "all", label: "All" },
      { value: "idea", label: "AI ideas" },
      { value: "video", label: "Videos" },
      { value: "note", label: "My notes" },
    ],
  },
];

const TYPE_LABEL = { idea: "AI idea", video: "Video", note: "Note" };

export default function SavedIdeas() {
  const toast = useToast();
  const { items, add, remove } = useSavedIdeas();
  const [filters, setFilters] = useState({ type: "all" });
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const q = search.trim().toLowerCase();
  const shown = items.filter((i) => {
    if (filters.type !== "all" && i.type !== filters.type) return false;
    if (!q) return true;
    return (i.title || "").toLowerCase().includes(q) || (i.body || "").toLowerCase().includes(q);
  });

  function saveNote(e) {
    e.preventDefault();
    if (!title.trim()) {
      toast("Please enter a title.", "danger");
      return;
    }
    const ok = add({ type: "note", title: title.trim(), body: body.trim() });
    if (ok) {
      toast("Saved on this device.", "ok");
      setTitle("");
      setBody("");
    } else {
      toast("Could not save. Browser storage may be full or blocked.", "danger");
    }
  }

  async function copy(item) {
    const text = item.title + (item.body ? "\n\n" + item.body : "");
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied.", "ok");
    } catch {
      toast("Copy is blocked by this browser.", "danger");
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Saved Ideas"
        blurb="Stored on this device only. Clearing browser data will remove them."
      />

      <Card>
        <form className="stack-sm" onSubmit={saveNote}>
          <h2>Add a note</h2>
          <input
            type="text"
            placeholder="Title"
            value={title}
            maxLength={150}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="Details (optional)"
            value={body}
            maxLength={2000}
            onChange={(e) => setBody(e.target.value)}
          />
          <Button type="submit" variant="ai" block>Save note</Button>
        </form>
      </Card>

      <div className="stack-sm">
        <input
          type="search"
          placeholder="Search saved items"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FilterBar filters={FILTERS} values={filters} onChange={setFilters} />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title="Nothing saved yet"
          message="Add a note above. AI ideas and videos you save from other modules will appear here."
        />
      ) : shown.length === 0 ? (
        <EmptyState icon="search" title="No matches" message="Try a different search or filter." />
      ) : (
        <div className="stack">
          {shown.map((item) => (
            <Card key={item.id} className="stack-sm">
              <div className="row">
                <Badge tone="ai">{TYPE_LABEL[item.type] || item.type}</Badge>
                <span className="faint">{formatDate(item.createdAt)}</span>
              </div>
              <h3>{item.title}</h3>
              {item.body && <p className="note-body muted">{item.body}</p>}
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer">Open link</a>
              )}
              <div className="row">
                <Button onClick={() => copy(item)}>Copy</Button>
                <Button variant="danger" onClick={() => { remove(item.id); toast("Deleted."); }}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
