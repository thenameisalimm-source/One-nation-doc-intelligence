import FeaturePage from "../components/shared/FeaturePage.jsx";
import { MODE_OPTIONS } from "../utils/constants.js";

const FIELDS = [
  { key: "topic", label: "Topic", type: "text", required: true, placeholder: "e.g. Nalanda University destruction" },
  { key: "mode", label: "Research mode", type: "select", options: MODE_OPTIONS },
];

export default function TopicResearch() {
  return (
    <FeaturePage
      title="Topic Research"
      blurb="Compare existing videos on one topic and spot gaps."
      requires="youtube"
      endpoint="/api/youtube-search"
      historyType="research"
      fields={FIELDS}
      submitLabel="Research topic"
    />
  );
}
