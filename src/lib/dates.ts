export function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return { year: "", month: "", day: "" };
  return { year: match[1], month: match[2], day: match[3] };
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function toIsoDate(year: string, month: string, day: string) {
  if (!year || !month || !day) return "";
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!y || !m || !d) return "";
  const maxDay = daysInMonth(y, m);
  if (d > maxDay) return "";
  const iso = `${year}-${month.padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return iso;
}

export function isValidBirthDate(iso: string) {
  if (!iso) return true;
  const parsed = parseIsoDate(iso);
  if (!parsed.year || !parsed.month || !parsed.day) return false;
  const rebuilt = toIsoDate(parsed.year, parsed.month, parsed.day);
  if (rebuilt !== iso) return false;
  const date = new Date(`${iso}T12:00:00`);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date.getTime() > today.getTime()) return false;
  if (Number(parsed.year) < 1920) return false;
  return true;
}

/** Idade em anos completos a partir de ISO `YYYY-MM-DD`. */
export function ageFromBirthDate(iso: string, on = new Date()) {
  const parsed = parseIsoDate(iso);
  if (!parsed.year || !parsed.month || !parsed.day) return null;
  const y = Number(parsed.year);
  const m = Number(parsed.month);
  const d = Number(parsed.day);
  let age = on.getFullYear() - y;
  const month = on.getMonth() + 1;
  const day = on.getDate();
  if (month < m || (month === m && day < d)) age -= 1;
  return age;
}

export function isMinorBirthDate(iso: string) {
  const age = ageFromBirthDate(iso);
  return age != null && age < 18;
}

export function isValidIsoDate(iso: string) {
  if (!iso) return true;
  const parsed = parseIsoDate(iso);
  if (!parsed.year || !parsed.month || !parsed.day) return false;
  return toIsoDate(parsed.year, parsed.month, parsed.day) === iso;
}
