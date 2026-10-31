import FeaturePage from "../components/shared/FeaturePage.jsx";
import { CATEGORY_OPTIONS, MODE_OPTIONS } from "../utils/constants.js";

const FIELDS = [
  { key: "category", label: "Category", type: "select", options: CATEGORY_OPTIONS },
  { key: "mode", label: "Audience focus", type: "select", options: MODE_OPTIONS },
  { key: "angle", label: "Angle or theme (optional)", type: "textarea", placeholder: "e.g. forgotten women rulers" },
];

export default function IdeaGenerator() {
  return (
    <FeaturePage
      title="AI Idea Generator"
      blurb="Documentary ideas and research hypotheses in natural Hinglish."
      requires="anthropic"
      endpoint="/api/ai-generate"
      task="ideas"
      historyType="ideas"
      fields={FIELDS}
      submitLabel="Generate ideas"
      note="AI output can contain mistakes. Verify every fact before publishing."
    />
  );
}
