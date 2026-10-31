// tone: "neutral" | "live" | "ai" | "warn" | "danger" | "ok"
export default function Badge({ children, tone = "neutral", title }) {
  return (
    <span className={"badge badge-" + tone} title={title}>
      {children}
    </span>
  );
}
