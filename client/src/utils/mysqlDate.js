// server/utils/mysqlDate.js
export function toMySQLDateTime(input) {
  if (!input && input !== 0) return null;            // null, undefined, "", 0 -> null sauf 0 stringifié
  if (typeof input === "string" && input.trim() === "") return null;

  const d = new Date(input);                          // accepte ISO, Date, "YYYY-MM-DD"
  if (isNaN(d.getTime())) throw new Error("invalid_date");

  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm   = pad(d.getMonth() + 1);
  const dd   = pad(d.getDate());
  const hh   = pad(d.getHours());
  const mi   = pad(d.getMinutes());
  const ss   = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;     // format MySQL DATETIME
}

// "YYYY-MM-DD" -> "YYYY-MM-DD 00:00:00", sinon toMySQLDateTime
export function toMySQLDate(input) {
  if (input == null || (typeof input === "string" && input.trim() === "")) return null;
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    return `${input.trim()} 00:00:00`;
  }
  return toMySQLDateTime(input);
}
