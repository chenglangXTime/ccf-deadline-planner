import type { Journal } from '@/types';
import { RankBadge } from './ConferenceCard';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Star, BookOpen } from 'lucide-react';

interface CardProps {
  journal: Journal;
  fav: boolean;
  onToggleFav: () => void;
  onOpen: () => void;
  categoryShort: string;
}

export function JournalCard({ journal, fav, onToggleFav, onOpen, categoryShort }: CardProps) {
  return (
    <Card className="p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all relative" onClick={onOpen}>
      <button
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-accent"
        onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
        aria-label="收藏"
      >
        <Star className={`w-5 h-5 ${fav ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
      </button>
      <div className="flex items-start gap-2 flex-wrap pr-8">
        <h3 className="text-lg font-bold leading-tight">{journal.abbr || journal.full}</h3>
        <RankBadge rank={journal.rank} />
        <Badge variant="secondary">{categoryShort}</Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{journal.full}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{journal.publisher}</span>
        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />常年滚动投稿</span>
      </div>
    </Card>
  );
}

interface DetailProps {
  journal: Journal | null;
  fav: boolean;
  onToggleFav: () => void;
  onClose: () => void;
}

export function JournalDetail({ journal, fav, onToggleFav, onClose }: DetailProps) {
  if (!journal) return null;
  return (
    <Dialog open={!!journal} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap text-xl">
            {journal.abbr || journal.full}
            <RankBadge rank={journal.rank} />
            <Badge variant="secondary">{journal.category}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">{journal.full}</p>
          <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">出版社</span><span>{journal.publisher}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">CCF 等级</span><span className="font-semibold">CCF-{journal.rank}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">投稿方式</span><span>常年滚动投稿，无固定截稿日期</span></div>
          <div className="flex flex-wrap gap-2 pt-2">
            {journal.dblp && (
              <Button size="sm" variant="outline" asChild>
                <a href={journal.dblp} target="_blank" rel="noreferrer">DBLP 收录 <ExternalLink className="w-3.5 h-3.5 ml-1" /></a>
              </Button>
            )}
            <Button size="sm" variant={fav ? 'default' : 'outline'} onClick={onToggleFav}>
              <Star className={`w-4 h-4 mr-1 ${fav ? 'fill-current' : ''}`} /> {fav ? '已收藏' : '收藏'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
