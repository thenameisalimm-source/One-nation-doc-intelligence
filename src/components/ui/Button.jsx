// variant: "ai" (purple gradient) | "secondary" | "ghost" | "danger"
export default function Button({
  children,
  variant = "secondary",
  loading = false,
  disabled = false,
  block = false,
  type = "button",
  className = "",
  ...rest
}) {
  const cls =
    "btn btn-" + variant + (block ? " btn-block" : "") + (className ? " " + className : "");
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading} {...rest}>
      {loading && <span className="spinner" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}
