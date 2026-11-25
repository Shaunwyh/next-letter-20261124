export const RECENT_UPLOAD_MS = 6 * 60 * 60 * 1000;

export function isRecentUpload(publishedAt, now = Date.now()) {
  const age = now - Date.parse(publishedAt);
  return Number.isFinite(age) && age >= 0 && age < RECENT_UPLOAD_MS;
}

const timestampFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
});

export function formatLibraryTimestamp(timestamp) {
  const parts = Object.fromEntries(timestampFormatter.formatToParts(new Date(timestamp)).map(p => [p.type, p.value]));
  return `${parts.year}.${parts.month}.${parts.day} ${parts.weekday} ${parts.hour}:${parts.minute}:${parts.second}`;
}
