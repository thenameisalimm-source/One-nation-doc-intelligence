import FeaturePage from "../components/shared/FeaturePage.jsx";

const FIELDS = [
  { key: "channel", label: "Channel name, handle or URL", type: "text", required: true, placeholder: "e.g. @channelhandle" },
];

export default function ChannelAnalytics() {
  return (
    <FeaturePage
      title="Channel Analytics"
      blurb="Public statistics only: subscribers, total views, video count and recent uploads."
      requires="youtube"
      endpoint="/api/youtube-channel"
      historyType="channel"
      fields={FIELDS}
      submitLabel="Load channel stats"
      note="Watch time, revenue and click-through rate are private to the channel owner and cannot be read from public data."
    />
  );
}
