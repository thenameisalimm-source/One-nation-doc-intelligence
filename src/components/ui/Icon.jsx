// Small inline icon set. Multiple paths are separated by "|".
const PATHS = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  trend: "M3 17l6-6 4 4 8-8|M15 7h6v6",
  flame: "M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z",
  users: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1|M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z|M21 20v-1a4 4 0 0 0-3-3.9|M16 4.1a3.5 3.5 0 0 1 0 6.8",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z|M21 21l-4.3-4.3",
  chart: "M4 20V10|M10 20V4|M16 20v-7|M2 20h20",
  sparkles: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z|M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  film: "M4 4h16v16H4z|M8 4v16|M16 4v16|M4 9h4|M4 15h4|M16 9h4|M16 15h4",
  type: "M4 7V5h16v2|M9 19h6|M12 5v14",
  coin: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z|M12 7v10|M14.5 9.5c-.5-.9-1.5-1.5-2.5-1.5-1.5 0-2.7.8-2.7 2s1.200 1.700 2.700 2c1.500.3 2.700.8 2.700 2s-1.200 2-2.700 2c-1 0-2-.6-2.500-1.500",
  bookmark: "M6 3h12v18l-6-4-6 4z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z|M12 7v5l3 2",
  sliders: "M4 6h10|M18 6h2|M4 12h4|M12 12h8|M4 18h12|M20 18h0|M14 4v4|M8 10v4|M16 16v4",
  more: "M5 12h.01|M12 12h.01|M19 12h.01",
  close: "M6 6l12 12|M18 6L6 18",
  alert: "M12 3l10 18H2z|M12 10v5|M12 18h.01",
};

export default function Icon({ name, size = 22, strokeWidth = 1.8, className }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {d.split("|").map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  );
}
