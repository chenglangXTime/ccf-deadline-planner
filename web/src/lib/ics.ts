import type { Conference } from '@/types';
import { upcomingDeadlines } from './deadline';

export interface IcsEvent {
  uid: string;
  title: string;
  utcMs: number;
  description?: string;
  url?: string;
}

/** Format epoch ms as iCalendar UTC datetime: 20260315T160000Z */
function icsDateUTC(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

/** RFC 5545 text escaping */
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** 提醒策略：截止前 7 天、前 1 天、前 3 小时 各提醒一次 */
const ALARM_TRIGGERS = ['-P7D', '-P1D', '-PT3H'];

export function buildICS(events: IcsEvent[]): string {
  const now = icsDateUTC(Date.now());
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ccf-deadline-planner//CCF DDL Planner//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:CCF 学术会议截稿提醒',
    'X-WR-TIMEZONE:Asia/Shanghai',
  ];
  for (const e of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${e.uid}@ccf-deadline-planner`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${icsDateUTC(e.utcMs)}`);
    lines.push(`DTEND:${icsDateUTC(e.utcMs + 30 * 60_000)}`);
    lines.push(`SUMMARY:${esc(e.title)}`);
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    for (const trig of ALARM_TRIGGERS) {
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:${esc(e.title)}`);
      lines.push(`TRIGGER:${trig}`);
      lines.push('END:VALARM');
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICS(filename: string, ics: string): void {
  const blob = new Blob(['\ufeff' + ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** A conference's future deadlines (abstract + submission, all rounds) as calendar events. */
export function confToIcsEvents(conf: Conference, now = Date.now()): IcsEvent[] {
  return upcomingDeadlines(conf, now).map((u) => ({
    uid: `${conf.title}-${u.edition.id}-${u.kind}`.toLowerCase().replace(/[^a-z0-9_-]+/g, '-'),
    title: `${conf.title} ${u.edition.id} ${u.kind === 'abstract' ? '摘要' : '投稿'}截止`,
    utcMs: u.utcMs,
    description: [
      conf.description,
      `CCF-${conf.rank.ccf}`,
      `原时区 ${u.edition.timezone}`,
      u.entry.comment,
    ].filter(Boolean).join(' | '),
    url: u.edition.link || undefined,
  }));
}
