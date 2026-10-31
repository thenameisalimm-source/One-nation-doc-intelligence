// Indian-style compact numbers: K, L (lakh), Cr (crore).
export function formatCount(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  const trim = (x) => x.toFixed(1).replace(/\.0$/, "");
  if (n >= 1e7) return trim(n / 1e7) + " Cr";
  if (n >= 1e5) return trim(n / 1e5) + " L";
  if (n >= 1e3) return trim(n / 1e3) + " K";
  return String(Math.round(n));
}

export function ageInDays(iso) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, (Date.now() - t) / 86400000);
}

export function timeAgo(iso) {
  const days = ageInDays(iso);
  if (days === null) return "Unknown date";
  if (days < 1) {
    const hours = Math.max(1, Math.round(days * 24));
    return hours + (hours === 1 ? " hour ago" : " hours ago");
  }
  if (days < 30) {
    const d = Math.floor(days);
    return d + (d === 1 ? " day ago" : " days ago");
  }
  if (days < 365) {
    const m = Math.floor(days / 30);
    return m + (m === 1 ? " month ago" : " months ago");
  }
  const y = Math.floor(days / 365);
  return y + (y === 1 ? " year ago" : " years ago");
}

export function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
