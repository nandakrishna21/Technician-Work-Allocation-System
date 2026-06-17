export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr.trim() + 'Z');
    if (isNaN(date.getTime())) return dateStr;
    const dateOpts = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata', ...options };
    if (options.time !== false) {
      dateOpts.hour = '2-digit';
      dateOpts.minute = '2-digit';
    }
    return date.toLocaleDateString('en-IN', dateOpts);
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr) {
  return formatDate(dateStr, { time: false });
}

export function formatDateTime(dateStr) {
  return formatDate(dateStr);
}
