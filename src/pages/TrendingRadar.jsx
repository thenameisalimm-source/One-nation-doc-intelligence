import FeaturePage from "../components/shared/FeaturePage.jsx";
import { MODE_OPTIONS, TIMEFRAME_OPTIONS } from "../utils/constants.js";

const FIELDS = [
  { key: "topic", label: "Topic or keyword", type: "text", required: true, placeholder: "e.g. Indus Valley civilisation" },
  { key: "mode", label: "Research mode", type: "select", options: MODE_OPTIONS },
  { key: "days", label: "Published within", type: "select", options: TIMEFRAME_OPTIONS },
];

export default function TrendingRadar() {
  return (
    <FeaturePage
      title="Trending Radar"
      blurb="Rank recent videos by an estimated opportunity score."
      requires="youtube"
      endpoint="/api/youtube-search"
      historyType="trending"
      fields={FIELDS}
      submitLabel="Scan topic"
      note="Scores are estimates from public data. Real view velocity needs stored observations over time."
    />
  );
}
