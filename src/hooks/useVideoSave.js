import { useCallback } from "react";
import { useToast } from "../components/ui/Toast.jsx";
import useSavedIdeas from "./useSavedIdeas.js";
import { formatCount, formatDate } from "../utils/formatters.js";

// Save or unsave a YouTube video in Saved Ideas. Same video is never saved twice.
export default function useVideoSave() {
  const toast = useToast();
  const { add, remove, has } = useSavedIdeas();

  const isSaved = useCallback((video) => has("video:" + video.id), [has]);

  const toggle = useCallback(
    (video) => {
      const id = "video:" + video.id;
      if (has(id)) {
        remove(id);
        toast("Removed from saved.");
        return;
      }
      const ok = add({
        id,
        type: "video",
        title: video.title,
        body:
          video.channelTitle + " · " + formatCount(video.views) + " views · published " +
          formatDate(video.publishedAt),
        url: "https://www.youtube.com/watch?v=" + video.id,
      });
      toast(ok ? "Saved on this device." : "Could not save. Browser storage may be blocked.", ok ? "ok" : "danger");
    },
    [add, remove, has, toast]
  );

  return { isSaved, toggle };
}
