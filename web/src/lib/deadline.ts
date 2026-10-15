import type { Conference, ConfEdition, TimelineEntry } from '@/types';

/** Parse "yyyy-mm-dd hh:mm:ss" wall time in a named/offset timezone into a UTC epoch ms. */
export function wallTimeToUTC(wall: string, tz: string): number | null {
  if (!wall || wall === 'TBD' || wall === 'None') return null;
  const m = wall.trim().match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) {
    const d = wall.trim().match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!d) return null;
    return wallPartsToUTC(+d[1], +d[2] - 1, +d[3], 23, 59, 59, tz);
  }
  return wallPartsToUTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0), tz);
}

function wallPartsToUTC(y: number, mo: number, d: number, h: number, mi: number, s: number, tz: string): number {
  const utcGuess = Date.UTC(y, mo, d, h, mi, s);
  const off = tz.match(/^UTC([+-])(\d{1,2})$/);
  if (off) {
    const hours = parseInt(off[2], 10) * (off[1] === '+' ? 1 : -1);
    return utcGuess - hours * 3600_000;
  }
  if (tz === 'AoE') return utcGuess + 12 * 3600_000; // AoE == UTC-12
  const zone = tz === 'PT' ? 'America/Los_Angeles' : tz;
  // Generic IANA zone: iterate offset correction
  let ts = utcGuess;
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: zone, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    for (let i = 0; i < 3; i++) {
      const parts = dtf.formatToParts(new Date(ts));
      const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? '0', 10);
      const wallAtTs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
      const diff = utcGuess - wallAtTs;
      if (diff === 0) break;
      ts += diff;
    }
  } catch {
    // unknown zone: assume UTC
  }
  return ts;
}

const BEIJING_FMT = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', hour12: false,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit',
});

export function formatBeijing(ts: number): string {
  return BEIJING_FMT.format(new Date(ts));
}

export interface UpcomingDeadline {
  edition: ConfEdition;
  entry: TimelineEntry;
  utcMs: number;
  kind: 'abstract' | 'submission';
}

/** Find the soonest future deadline (abstract or submission) across all editions. */
export function nextDeadline(conf: Conference, now = Date.now()): UpcomingDeadline | null {
  let best: UpcomingDeadline | null = null;
  for (const edition of conf.confs) {
    for (const entry of edition.timeline) {
      for (const kind of ['abstract', 'submission'] as const) {
        const raw = kind === 'abstract' ? entry.abstract_deadline : entry.deadline;
        const ts = raw ? wallTimeToUTC(raw, edition.timezone) : null;
        if (ts && ts > now && (!best || ts < best.utcMs)) {
          best = { edition, entry, utcMs: ts, kind };
        }
      }
    }
  }
  return best;
}

/** All future deadlines for a conference, sorted ascending. */
export function upcomingDeadlines(conf: Conference, now = Date.now()): UpcomingDeadline[] {
  const out: UpcomingDeadline[] = [];
  for (const edition of conf.confs) {
    for (const entry of edition.timeline) {
      for (const kind of ['abstract', 'submission'] as const) {
        const raw = kind === 'abstract' ? entry.abstract_deadline : entry.deadline;
        const ts = raw ? wallTimeToUTC(raw, edition.timezone) : null;
        if (ts && ts > now) out.push({ edition, entry, utcMs: ts, kind });
      }
    }
  }
  return out.sort((a, b) => a.utcMs - b.utcMs);
}

export function countdownParts(ts: number, now = Date.now()) {
  const diff = Math.max(0, ts - now);
  const days = Math.floor(diff / 86400_000);
  const hours = Math.floor((diff % 86400_000) / 3600_000);
  const mins = Math.floor((diff % 3600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1000);
  return { days, hours, mins, secs, past: ts <= now };
}

export function latestAcceptRate(conf: Conference) {
  if (!conf.accept_rates?.length) return null;
  return conf.accept_rates.reduce((a, b) => (a.year > b.year ? a : b));
}
