import { v4 as uuidv4 } from 'uuid';

/**
 * Converts both mobile and desktop Lighthouse results into the Report shape.
 *
 * Scores are extracted independently for each device.
 * Failing audits from both runs are merged and deduplicated by audit id —
 * so an issue that appears on both devices is listed only once.
 *
 * @param {string} url
 * @param {{ mobile: object, desktop: object }} lhrs
 */
export function transformReport(url, { mobile, desktop }) {
  const mobileScore = Math.round((mobile.categories?.performance?.score ?? 0) * 100);
  const desktopScore = Math.round((desktop.categories?.performance?.score ?? 0) * 100);

  // Walk both result sets and collect every failing audit, deduped by id.
  const seen = new Map();

  for (const lhr of [mobile, desktop]) {
    for (const [key, audit] of Object.entries(lhr.audits)) {
      if (audit.score === null || audit.score >= 0.9 || seen.has(key)) continue;

      seen.set(key, {
        id: key,
        title: audit.title ?? key,
        description: stripMarkdown(audit.description ?? ''),
        displayValue: audit.displayValue ?? null,
        // Audits that measured something carry a displayValue or structured
        // details; the rest are opportunity hints without hard metrics.
        _hasMeasurement: !!(audit.displayValue || audit.details),
      });
    }
  }

  const issues = [];
  const suggestions = [];

  for (const { _hasMeasurement, ...item } of seen.values()) {
    if (_hasMeasurement) {
      issues.push(item);
    } else {
      suggestions.push(item);
    }
  }

  return { id: uuidv4(), url, mobileScore, desktopScore, issues, suggestions };
}

function stripMarkdown(text) {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}
