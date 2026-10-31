import FeaturePage from "../components/shared/FeaturePage.jsx";

const FIELDS = [
  { key: "channel", label: "Channel name, handle or URL", type: "text", required: true, placeholder: "e.g. @channelhandle", hint: "Public data only." },
];

export default function Competitors() {
  return (
    <FeaturePage
      title="Competitor Intelligence"
      blurb="Study a rival channel's public videos and statistics."
      requires="youtube"
      endpoint="/api/youtube-channel"
      historyType="competitor"
      fields={FIELDS}
      submitLabel="Analyse channel"
    />
  );
}
