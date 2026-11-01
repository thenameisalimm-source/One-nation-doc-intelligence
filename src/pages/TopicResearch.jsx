import FeaturePage from "../components/shared/FeaturePage.jsx";
import { MODE_OPTIONS, TIMEFRAME_OPTIONS } from "../utils/constants.js";

const FIELDS = [
  { key: "topic", label: "Topic", type: "text", required: true, placeholder: "e.g. Nalanda University destruction" },
  { key: "mode", label: "Research mode", type: "select", options: MODE_OPTIONS },
  { key: "days", label: "Published within", type: "select", options: TIMEFRAME_OPTIONS, default: "90" },
];

export default function TopicResearch() {
  return (
    <FeaturePage
      title="Topic Research"
      blurb="Compare existing videos on one topic and see who already covers it."
      requires="youtube"
      endpoint="/api/youtube-search"
      historyType="research"
      fields={FIELDS}
      submitLabel="Research topic"
      resultView="videos"
      viewKind="research"
    />
  );
}
