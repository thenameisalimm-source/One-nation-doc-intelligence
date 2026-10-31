import FeaturePage from "../components/shared/FeaturePage.jsx";

const FIELDS = [
  { key: "niche", label: "Channel niche", type: "text", required: true, placeholder: "e.g. Indian history documentaries" },
  {
    key: "stage",
    label: "Channel stage",
    type: "select",
    options: [
      { value: "new", label: "Just starting" },
      { value: "growing", label: "Growing (under 10K subscribers)" },
      { value: "established", label: "Established (10K+ subscribers)" },
    ],
  },
  { key: "notes", label: "Notes (optional)", type: "textarea", placeholder: "Current income sources, goals" },
];

export default function Monetization() {
  return (
    <FeaturePage
      title="Monetization"
      blurb="Revenue strategy ideas for your channel."
      requires="anthropic"
      endpoint="/api/ai-generate"
      task="monetization"
      historyType="monetization"
      fields={FIELDS}
      submitLabel="Build strategy"
      note="This is AI strategy advice, not an earnings estimate. Actual income depends on your private channel data."
    />
  );
}
