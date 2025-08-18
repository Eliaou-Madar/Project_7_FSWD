// server/utils/mysqlDate.js
export function toMySQLDate(input) {
  if (input == null) return null;
  if (typeof input === "string" && input.trim() === "") return null;

  // "YYYY-MM-DD" -> "YYYY-MM-DD 00:00:00"
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    return `${input.trim()} 00:00:00`;
  }

  const d = new Date(input); // gère ISO "2025-05-22T00:00:00.000Z" ou Date
  if (isNaN(d.getTime())) throw new Error("invalid_date");

  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm   = pad(d.getMonth() + 1);
  const dd   = pad(d.getDate());
  const hh   = pad(d.getHours());
  const mi   = pad(d.getMinutes());
  const ss   = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}
