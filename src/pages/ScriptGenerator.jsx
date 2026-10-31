import FeaturePage from "../components/shared/FeaturePage.jsx";

const FIELDS = [
  { key: "topic", label: "Documentary topic", type: "text", required: true, placeholder: "e.g. The fall of Vijayanagara" },
  {
    key: "format",
    label: "Output",
    type: "select",
    options: [
      { value: "outline", label: "Outline" },
      { value: "script", label: "Hinglish script (one section)" },
    ],
  },
  {
    key: "length",
    label: "Target length",
    type: "select",
    options: [
      { value: "5", label: "About 5 minutes" },
      { value: "10", label: "About 10 minutes" },
      { value: "20", label: "About 20 minutes" },
    ],
  },
  { key: "notes", label: "Notes (optional)", type: "textarea", placeholder: "Tone, key facts, sources to include" },
];

export default function ScriptGenerator() {
  return (
    <FeaturePage
      title="Script Generator"
      blurb="Documentary outlines and natural Hinglish scripts."
      requires="anthropic"
      endpoint="/api/ai-generate"
      task="script"
      historyType="script"
      fields={FIELDS}
      submitLabel="Generate"
      note="Long scripts are written section by section to stay within server time limits."
    />
  );
}
