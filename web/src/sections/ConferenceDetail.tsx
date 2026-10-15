import type { Conference } from '@/types';
import { upcomingDeadlines, formatBeijing, countdownParts, wallTimeToUTC } from '@/lib/deadline';
import { RankBadge, Countdown } from './ConferenceCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, Star, MapPin, CalendarDays, CalendarPlus } from 'lucide-react';
import venueNotes from '@/data/venue_notes.json';
import { buildICS, confToIcsEvents, downloadICS } from '@/lib/ics';

const NOTES: Record<string, string> = (venueNotes as unknown as { venues: Record<string, string> }).venues;

interface Props {
  conf: Conference | null;
  now: number;
  fav: boolean;
  onToggleFav: () => void;
  onClose: () => void;
}

function RateBars({ conf }: { conf: Conference }) {
  const rates = [...(conf.accept_rates ?? [])].sort((a, b) => a.year - b.year).slice(-6);
  if (!rates.length) return <p className="text-sm text-muted-foreground">暂无录取率数据</p>;
  const max = Math.max(...rates.map((r) => r.submitted), 1);
  return (
    <div className="space-y-1.5">
      {rates.map((r) => (
        <div key={r.year} className="flex items-center gap-2 text-xs">
          <span className="w-10 shrink-0 text-muted-foreground">{r.year}</span>
          <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
            <div
              className="h-full bg-primary/70"
              style={{ width: `${Math.max(4, (r.submitted / max) * 100)}%` }}
              title={`投稿 ${r.submitted}`}
            />
          </div>
          <span className="w-28 shrink-0 tabular-nums">
            {(r.rate * 100).toFixed(1)}% <span className="text-muted-foreground">({r.accepted}/{r.submitted})</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ConferenceDetail({ conf, now, fav, onToggleFav, onClose }: Props) {
  if (!conf) return null;
  const ups = upcomingDeadlines(conf, now);
  const latest = conf.confs.reduce((a, b) => ((a?.year ?? 0) > (b?.year ?? 0) ? a : b), conf.confs[0]);
  const note = NOTES[conf.title];
  return (
    <Dialog open={!!conf} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <ScrollArea className="max-h-[85vh]">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 flex-wrap text-xl pr-8">
                {conf.title}
                <RankBadge rank={conf.rank.ccf} />
                {conf.rank.core && conf.rank.core !== 'N' && <RankBadge rank={conf.rank.core} label="CORE" />}
                <Badge variant="secondary">{conf.category}</Badge>
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mt-2">{conf.description}</p>

            {/* countdown to next deadline */}
            {ups.length > 0 && (
              <div className="mt-4 rounded-lg border bg-accent/40 p-4">
                <div className="text-xs text-muted-foreground">
                  距离{ups[0].kind === 'abstract' ? '摘要' : '投稿'}截止（{ups[0].edition.id}）
                </div>
                <div className="mt-1 text-lg"><Countdown ts={ups[0].utcMs} now={now} /></div>
                <div className="text-sm mt-1">{formatBeijing(ups[0].utcMs)}（北京时间）</div>
              </div>
            )}

            {/* edition info */}
            {latest && (
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                {latest.date && <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4" />{latest.date}</span>}
                {latest.place && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{latest.place}</span>}
              </div>
            )}

            {/* all upcoming deadlines */}
            <div className="mt-5">
              <h4 className="font-semibold text-sm mb-2">截稿时间线</h4>
              {ups.length === 0 && <p className="text-sm text-muted-foreground">暂无未来截稿日期，等待官方公布。</p>}
              <div className="space-y-2">
                {ups.slice(0, 8).map((u, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium">{u.edition.id}</span>
                      <span className="mx-2 text-muted-foreground">·</span>
                      <span>{u.kind === 'abstract' ? '摘要截止' : '投稿截止'}</span>
                      {u.entry.comment && <span className="ml-2 text-xs text-muted-foreground">({u.entry.comment})</span>}
                    </div>
                    <div className="text-right">
                      <div className="tabular-nums">{formatBeijing(u.utcMs)}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        剩 {countdownParts(u.utcMs, now).days} 天 · 原时区 {u.edition.timezone}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* rebuttal / decision for upcoming rounds */}
            {ups.some((u) => u.entry.rebuttal_deadline || u.entry.decision_deadline) && (
              <div className="mt-4 text-sm space-y-1">
                <h4 className="font-semibold text-sm">评审节点</h4>
                {ups.slice(0, 4).map((u, i) => (
                  <div key={i} className="text-muted-foreground text-xs space-x-3">
                    <span className="font-medium text-foreground">{u.edition.id}</span>
                    {u.entry.rebuttal_deadline && wallTimeToUTC(u.entry.rebuttal_deadline, u.edition.timezone) && (
                      <span>Rebuttal: {formatBeijing(wallTimeToUTC(u.entry.rebuttal_deadline, u.edition.timezone)!)}</span>
                    )}
                    {u.entry.decision_deadline && wallTimeToUTC(u.entry.decision_deadline, u.edition.timezone) && (
                      <span>录用通知: {formatBeijing(wallTimeToUTC(u.entry.decision_deadline, u.edition.timezone)!)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* venue characteristics */}
            <div className="mt-5">
              <h4 className="font-semibold text-sm mb-1.5">会议特点与投稿偏好</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {note ?? '该会议暂无社区经验总结，可参考官方 CFP 与往年录取论文风格。'}
              </p>
            </div>

            {/* acceptance rates */}
            <div className="mt-5">
              <h4 className="font-semibold text-sm mb-2">历年录取率</h4>
              <RateBars conf={conf} />
            </div>

            {/* actions */}
            <div className="mt-6 flex flex-wrap gap-2">
              {latest?.link && (
                <Button size="sm" asChild>
                  <a href={latest.link} target="_blank" rel="noreferrer">
                    会议官网 <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                </Button>
              )}
              {conf.dblp && (
                <Button size="sm" variant="outline" asChild>
                  <a href={`https://dblp.org/db/conf/${conf.dblp}`} target="_blank" rel="noreferrer">
                    DBLP 收录 <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                </Button>
              )}
              <Button size="sm" variant={fav ? 'default' : 'outline'} onClick={onToggleFav}>
                <Star className={`w-4 h-4 mr-1 ${fav ? 'fill-current' : ''}`} /> {fav ? '已收藏' : '收藏'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={ups.length === 0}
                title="导出该会议所有未来截稿日期为 .ics，含截止前 7 天/1 天/3 小时提醒"
                onClick={() => downloadICS(`${conf.title}-DDL.ics`, buildICS(confToIcsEvents(conf, now)))}
              >
                <CalendarPlus className="w-4 h-4 mr-1" /> 导出 DDL 到日历
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
