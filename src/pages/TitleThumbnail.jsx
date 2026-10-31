import FeaturePage from "../components/shared/FeaturePage.jsx";

const FIELDS = [
  { key: "topic", label: "Topic or working title", type: "text", required: true, placeholder: "e.g. Lost city of Dwarka" },
  { key: "angle", label: "Angle (optional)", type: "textarea", placeholder: "Mystery, shocking fact, what-if..." },
];

export default function TitleThumbnail() {
  return (
    <FeaturePage
      title="Title & Thumbnail"
      blurb="Title options and thumbnail concepts for your video."
      requires="anthropic"
      endpoint="/api/ai-generate"
      task="titles"
      historyType="titles"
      fields={FIELDS}
      submitLabel="Suggest titles"
      note="Suggestions are ideas, not predictions. Test them against real audience response."
    />
  );
}
