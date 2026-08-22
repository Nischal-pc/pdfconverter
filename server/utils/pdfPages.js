/**
 * Advanced page selection: all, 1-5, 1,3,8-10, first, last, custom
 */
function parsePageSpec(spec, totalPages) {
  if (!spec || String(spec).toLowerCase() === 'all' || spec === '*') {
    return [...Array(totalPages).keys()];
  }

  const indices = new Set();
  const parts = String(spec).split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-').map((s) => s.trim());
      const start = Math.max(0, parseInt(startStr, 10) - 1);
      const end = endStr
        ? Math.min(totalPages - 1, parseInt(endStr, 10) - 1)
        : totalPages - 1;
      if (!Number.isNaN(start)) {
        for (let i = start; i <= end && i < totalPages; i++) indices.add(i);
      }
    } else {
      const n = parseInt(trimmed, 10) - 1;
      if (!Number.isNaN(n) && n >= 0 && n < totalPages) indices.add(n);
    }
  }

  return [...indices].sort((a, b) => a - b);
}

function resolvePageScope(scope, customSpec, totalPages) {
  const total = Math.max(0, totalPages);
  if (total === 0) return [];

  switch (String(scope || 'all').toLowerCase()) {
    case 'first':
      return [0];
    case 'last':
      return [total - 1];
    case 'custom':
      return parsePageSpec(customSpec, total);
    case 'all':
    default:
      return [...Array(total).keys()];
  }
}

module.exports = { parsePageSpec, resolvePageScope };
