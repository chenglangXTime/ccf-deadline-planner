import { CATEGORIES } from '@/types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Star, RotateCcw } from 'lucide-react';

export interface FilterState {
  query: string;
  ranks: string[]; // A/B/C/N
  categories: string[]; // sub codes
  withinDays: number; // 0 = 全部
  favOnly: boolean;
}

export const DEFAULT_FILTER: FilterState = {
  query: '',
  ranks: ['A', 'B', 'C'],
  categories: [],
  withinDays: 0,
  favOnly: false,
};

const RANKS = ['A', 'B', 'C', 'N'];
const WINDOWS = [
  { v: '0', label: '全部时间' },
  { v: '30', label: '30 天内截止' },
  { v: '60', label: '60 天内截止' },
  { v: '90', label: '90 天内截止' },
  { v: '180', label: '半年内截止' },
];

interface Props {
  filter: FilterState;
  onChange: (f: FilterState) => void;
  showDeadlineWindow?: boolean;
}

export default function FilterBar({ filter, onChange, showDeadlineWindow = true }: Props) {
  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="搜索会议/期刊名称、全称…"
            value={filter.query}
            onChange={(e) => onChange({ ...filter, query: e.target.value })}
          />
        </div>
        {showDeadlineWindow && (
          <Select
            value={String(filter.withinDays)}
            onValueChange={(v) => onChange({ ...filter, withinDays: parseInt(v, 10) })}
          >
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {WINDOWS.map((w) => <SelectItem key={w.v} value={w.v}>{w.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button
          variant={filter.favOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange({ ...filter, favOnly: !filter.favOnly })}
        >
          <Star className={`w-4 h-4 mr-1 ${filter.favOnly ? 'fill-current' : ''}`} /> 只看收藏
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_FILTER)}>
          <RotateCcw className="w-4 h-4 mr-1" /> 重置
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-muted-foreground mr-1">CCF 等级</span>
        {RANKS.map((r) => (
          <Badge
            key={r}
            variant={filter.ranks.includes(r) ? 'default' : 'outline'}
            className="cursor-pointer select-none"
            onClick={() => onChange({ ...filter, ranks: toggle(filter.ranks, r) })}
          >
            {r === 'N' ? '未收录' : `CCF-${r}`}
          </Badge>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-muted-foreground mr-1">领域类别</span>
        {CATEGORIES.map((c) => (
          <Badge
            key={c.code}
            variant={filter.categories.includes(c.code) ? 'default' : 'outline'}
            className="cursor-pointer select-none"
            title={c.name}
            onClick={() => onChange({ ...filter, categories: toggle(filter.categories, c.code) })}
          >
            {c.short}
          </Badge>
        ))}
      </div>
    </div>
  );
}
