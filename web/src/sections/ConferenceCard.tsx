import type { Conference } from '@/types';
import { nextDeadline, countdownParts, formatBeijing, latestAcceptRate } from '@/lib/deadline';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Star, MapPin, CalendarDays, Timer } from 'lucide-react';

export function RankBadge({ rank, label = 'CCF' }: { rank: string; label?: string }) {
  const color =
    rank === 'A' ? 'bg-red-500/15 text-red-600 border-red-300 dark:text-red-400'
    : rank === 'B' ? 'bg-amber-500/15 text-amber-600 border-amber-300 dark:text-amber-400'
    : rank === 'C' ? 'bg-emerald-500/15 text-emerald-600 border-emerald-300 dark:text-emerald-400'
    : 'bg-muted text-muted-foreground';
  return (
    <Badge variant="outline" className={`${color} font-semibold`}>{label}-{rank}</Badge>
  );
}

export function Countdown({ ts, now }: { ts: number; now: number }) {
  const c = countdownParts(ts, now);
  if (c.past) return <span className="text-muted-foreground text-sm">已截止</span>;
  const urgent = c.days < 7;
  return (
    <span className={`font-mono tabular-nums font-semibold ${urgent ? 'text-red-500' : c.days < 30 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
      {c.days}天 {String(c.hours).padStart(2, '0')}:{String(c.mins).padStart(2, '0')}:{String(c.secs).padStart(2, '0')}
    </span>
  );
}

interface Props {
  conf: Conference;
  now: number;
  fav: boolean;
  onToggleFav: () => void;
  onOpen: () => void;
  categoryShort: string;
}

export default function ConferenceCard({ conf, now, fav, onToggleFav, onOpen, categoryShort }: Props) {
  const next = nextDeadline(conf, now);
  const rate = latestAcceptRate(conf);
  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all relative"
      onClick={onOpen}
    >
      <button
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-accent"
        onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
        aria-label="收藏"
      >
        <Star className={`w-5 h-5 ${fav ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
      </button>
      <div className="flex items-start gap-2 flex-wrap pr-8">
        <h3 className="text-lg font-bold leading-tight">{conf.title}</h3>
        <RankBadge rank={conf.rank.ccf} />
        <Badge variant="secondary">{categoryShort}</Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{conf.description}</p>
      <div className="mt-3 flex items-end justify-between gap-3 flex-wrap">
        {next ? (
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Timer className="w-3.5 h-3.5" />
              {next.kind === 'abstract' ? '摘要截止' : '投稿截止'}（北京时间）
            </div>
            <div className="text-sm font-medium mt-0.5">{formatBeijing(next.utcMs)}</div>
            <div className="mt-1"><Countdown ts={next.utcMs} now={now} /></div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">下一届截稿日期待公布</div>
        )}
        <div className="text-right text-xs text-muted-foreground space-y-0.5">
          {next?.edition.date && (
            <div className="flex items-center gap-1 justify-end"><CalendarDays className="w-3.5 h-3.5" />{next.edition.date}</div>
          )}
          {next?.edition.place && (
            <div className="flex items-center gap-1 justify-end"><MapPin className="w-3.5 h-3.5" />{next.edition.place}</div>
          )}
          {rate && <div>录取率 {rate.year}：{(rate.rate * 100).toFixed(1)}%</div>}
        </div>
      </div>
    </Card>
  );
}
