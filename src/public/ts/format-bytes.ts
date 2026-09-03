// T37.21 defect-3 — THE ONE human-readable byte formatter. Consolidates the ad-hoc `Math.round(size/1024) KB` /
// `(size/1024).toFixed(1) KB` copies (RoomView, rb-file-detail) and the raw-integer bytes the sunburst was rendering
// (10916416, 43, 4717922 — the exact numbers Tron saw). Pure + node-testable. A grep-lint (check-raw-bytes-format.mjs)
// REDs on any new `/ 1024` size-format outside this module so a 4th copy cannot drift back in.
export function formatBytes(n: number | null | undefined): string {
  const b = Math.max(0, Math.floor(Number(n) || 0));
  if (b < 1024) return `${b} B`;
  const units = ['KB', 'MB', 'GB', 'TB', 'PB'];
  let v = b / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  const s = v.toFixed(1); // 1 decimal, then drop a trailing .0 → "1 KB", "1.5 KB", "10.4 MB", "4.5 MB"
  return `${s.endsWith('.0') ? s.slice(0, -2) : s} ${units[i]}`;
}
