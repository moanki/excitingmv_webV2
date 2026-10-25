export function csvEscape(value: string) {
  const text = String(value ?? "");
  const safe = /^[\s\u0000-\u001f]*[=+@\-＝＋＠－]/u.test(text) ? "'"+text : text;
  return `"${safe.replace(/"/g, '\"\"')}"`;
}
