import { useState } from "react";
import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import ScoreRing from "../charts/ScoreRing.jsx";
import ScoreBreakdown from "./ScoreBreakdown.jsx";
import { formatCount, timeAgo } from "../../utils/formatters.js";

// video: { id, title, channelTitle, thumbnail, publishedAt, views, likes, comments, score? }
// views/likes/comments are MEASURED from YouTube. score is ESTIMATED.
export default function VideoCard({ video, rank, saved = false, onSave }) {
  const [open, setOpen] = useState(false);
  const url = "https://www.youtube.com/watch?v=" + encodeURIComponent(video.id);

  return (
    <Card className="video-card">
      <a className="vc-thumb" href={url} target="_blank" rel="noopener noreferrer">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt="" loading="lazy" />
        ) : (
          <div className="vc-thumb-empty">No thumbnail</div>
        )}
        {rank && <span className="vc-rank">#{rank}</span>}
      </a>

      <div className="vc-body">
        <a className="vc-title" href={url} target="_blank" rel="noopener noreferrer">
          {video.title}
        </a>
        <div className="faint truncate">
          {video.channelTitle} · {timeAgo(video.publishedAt)}
        </div>

        <div className="vc-stats">
          <Badge tone="live" title="Measured from the YouTube API">Measured</Badge>
          <span>{formatCount(video.views)} views</span>
          <span>{video.likes === null || video.likes === undefined ? "Likes hidden" : formatCount(video.likes) + " likes"}</span>
          <span>{video.comments === null || video.comments === undefined ? "Comments off" : formatCount(video.comments) + " comments"}</span>
        </div>

        {video.score && (
          <div className="vc-score">
            <ScoreRing score={video.score.score} size={56} />
            <div className="vc-score-text">
              <Badge tone="ai" title="Calculated by this app, not by YouTube">Estimated score</Badge>
              <button type="button" className="text-btn" onClick={() => setOpen((o) => !o)}>
                {open ? "Hide breakdown" : "How is this calculated?"}
              </button>
            </div>
          </div>
        )}

        {open && video.score && <ScoreBreakdown score={video.score} />}

        {onSave && (
          <Button variant={saved ? "ghost" : "secondary"} onClick={() => onSave(video)} block>
            {saved ? "Saved ✓" : "Save video"}
          </Button>
        )}
      </div>
    </Card>
  );
}
