import FeaturePage from "../components/shared/FeaturePage.jsx";
import { MODE_OPTIONS, LANGUAGE_OPTIONS, TIMEFRAME_OPTIONS } from "../utils/constants.js";

const FIELDS = [
  { key: "keyword", label: "Keyword", type: "text", required: true, placeholder: "e.g. Kohinoor diamond mystery" },
  { key: "mode", label: "Research mode", type: "select", options: MODE_OPTIONS },
  { key: "language", label: "Language", type: "select", options: LANGUAGE_OPTIONS },
  { key: "days", label: "Published within", type: "select", options: TIMEFRAME_OPTIONS },
];

export default function ViralDiscovery() {
  return (
    <FeaturePage
      title="Viral Video Discovery"
      blurb="Find videos that outperform their channel size on any topic."
      requires="youtube"
      endpoint="/api/youtube-search"
      historyType="viral"
      fields={FIELDS}
      submitLabel="Find outperformers"
    />
  );
}
