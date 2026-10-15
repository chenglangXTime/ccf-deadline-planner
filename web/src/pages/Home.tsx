import { useEffect, useMemo, useState } from 'react';
import confData from '@/data/conferences.json';
import journalData from '@/data/journals.json';
import type { Conference, Journal } from '@/types';
import { CATEGORIES } from '@/types';
import { nextDeadline } from '@/lib/deadline';
import FilterBar, { DEFAULT_FILTER, type FilterState } from '@/sections/FilterBar';
import ConferenceCard from '@/sections/ConferenceCard';
import ConferenceDetail from '@/sections/ConferenceDetail';
import { JournalCard, JournalDetail } from '@/sections/JournalSection';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { GraduationCap, Github, CalendarPlus } from 'lucide-react';
import { buildICS, confToIcsEvents, downloadICS } from '@/lib/ics';

const CONFERENCES = (confData as unknown as { conferences: Conference[] }).conferences;
const JOURNALS = (journalData as unknown as { journals: Journal[] }).journals;

const FAV_KEY = 'ccfddl-planner-favs';

function loadFavs(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

const catShort = (sub: string) => CATEGORIES.find((c) => c.code === sub)?.short ?? sub;
// 存在同名会议（如 FSE 同时是 CCF-A 软工会议与 CCF-B 密码会议），用 sub+title 作为唯一 id
const confKey = (c: Conference) => `${c.sub}:${c.title}`;
const journalKey = (j: Journal) => `${j.sub}:${j.abbr || j.full}`;

export default function Home() {
  const [tab, setTab] = useState<'conference' | 'journal'>('conference');
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [favs, setFavs] = useState<Set<string>>(loadFavs);
  const [now, setNow] = useState(() => Date.now());
  const [openConf, setOpenConf] = useState<Conference | null>(null);
  const [openJournal, setOpenJournal] = useState<Journal | null>(null);
  const [exportMsg, setExportMsg] = useState('');

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const toggleFav = (key: string) => {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      localStorage.setItem(FAV_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const filteredConfs = useMemo(() => {
    const q = filter.query.trim().toLowerCase();
    const list = CONFERENCES.filter((c) => {
      if (filter.ranks.length && !filter.ranks.includes(c.rank.ccf)) return false;
      if (filter.categories.length && !filter.categories.includes(c.sub)) return false;
      if (filter.favOnly && !favs.has('c:' + confKey(c))) return false;
      if (q && !(c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))) return false;
      if (filter.withinDays > 0) {
        const next = nextDeadline(c, now);
        if (!next || next.utcMs - now > filter.withinDays * 86400_000) return false;
      }
      return true;
    });
    return list.sort((a, b) => {
      const na = nextDeadline(a, now)?.utcMs ?? Infinity;
      const nb = nextDeadline(b, now)?.utcMs ?? Infinity;
      if (na !== nb) return na - nb;
      const order = (r: string) => ({ A: 0, B: 1, C: 2 } as Record<string, number>)[r] ?? 3;
      return order(a.rank.ccf) - order(b.rank.ccf);
    });
  }, [filter, favs, now]);

  const filteredJournals = useMemo(() => {
    const q = filter.query.trim().toLowerCase();
    const list = JOURNALS.filter((j) => {
      if (filter.ranks.length && !filter.ranks.includes(j.rank)) return false;
      if (filter.categories.length && !filter.categories.includes(j.sub)) return false;
      if (filter.favOnly && !favs.has('j:' + journalKey(j))) return false;
      if (q && !(j.abbr.toLowerCase().includes(q) || j.full.toLowerCase().includes(q))) return false;
      return true;
    });
    const order = (r: string) => ({ A: 0, B: 1, C: 2 } as Record<string, number>)[r] ?? 3;
    return list.sort((a, b) => order(a.rank) - order(b.rank) || (a.abbr || a.full).localeCompare(b.abbr || b.full));
  }, [filter, favs]);

  const upcomingCount = useMemo(
    () => CONFERENCES.filter((c) => nextDeadline(c, now)).length,
    [now]
  );

  const favConfCount = useMemo(
    () => CONFERENCES.filter((c) => favs.has('c:' + confKey(c))).length,
    [favs]
  );

  const exportFavDeadlines = () => {
    const events = CONFERENCES
      .filter((c) => favs.has('c:' + confKey(c)))
      .flatMap((c) => confToIcsEvents(c, now));
    if (!events.length) {
      setExportMsg(favConfCount === 0 ? '请先收藏感兴趣的会议（卡片右上角 ★），再导出日历' : '收藏的会议暂无未来截稿日期');
      setTimeout(() => setExportMsg(''), 4000);
      return;
    }
    downloadICS('ccf-deadlines.ics', buildICS(events));
    setExportMsg(`已导出 ${events.length} 个截稿提醒，打开下载的 .ics 文件即可导入日历`);
    setTimeout(() => setExportMsg(''), 4000);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <GraduationCap className="w-6 h-6 text-primary" />
          <div className="flex-1">
            <h1 className="text-lg font-bold leading-tight">CCF 学术投递规划</h1>
            <p className="text-xs text-muted-foreground">
              {CONFERENCES.length} 个会议 · {JOURNALS.length} 个期刊 · {upcomingCount} 个进行中 DDL · 数据源自 ccfddl
            </p>
            {exportMsg && <p className="text-xs text-primary font-medium mt-0.5">{exportMsg}</p>}
          </div>
          <Button variant="outline" size="sm" onClick={exportFavDeadlines} title={`把收藏会议（${favConfCount} 个）的未来截稿日期导出为 .ics 日历文件，含截止前 7 天/1 天/3 小时提醒`}>
            <CalendarPlus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">导出日历</span>{favConfCount > 0 && `（${favConfCount}）`}
          </Button>
          <a
            href="https://github.com/ccfddl/ccf-deadlines"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground"
            title="数据源：ccfddl/ccf-deadlines"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5 space-y-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="conference">会议（{filteredConfs.length}）</TabsTrigger>
            <TabsTrigger value="journal">期刊（{filteredJournals.length}）</TabsTrigger>
          </TabsList>
        </Tabs>

        <FilterBar filter={filter} onChange={setFilter} showDeadlineWindow={tab === 'conference'} />

        {tab === 'conference' ? (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredConfs.map((c) => (
              <ConferenceCard
                key={confKey(c)}
                conf={c}
                now={now}
                fav={favs.has('c:' + confKey(c))}
                onToggleFav={() => toggleFav('c:' + confKey(c))}
                onOpen={() => setOpenConf(c)}
                categoryShort={catShort(c.sub)}
              />
            ))}
            {filteredConfs.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-2 text-center py-12">没有符合条件的会议，试试放宽筛选条件。</p>
            )}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredJournals.map((j) => (
              <JournalCard
                key={journalKey(j)}
                journal={j}
                fav={favs.has('j:' + journalKey(j))}
                onToggleFav={() => toggleFav('j:' + journalKey(j))}
                onOpen={() => setOpenJournal(j)}
                categoryShort={catShort(j.sub)}
              />
            ))}
            {filteredJournals.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-2 text-center py-12">没有符合条件的期刊，试试放宽筛选条件。</p>
            )}
          </div>
        )}

        <footer className="text-xs text-muted-foreground pt-6 pb-10 space-y-1">
          <p>会议截止日期与录取率数据来自开源项目 ccfddl/ccf-deadlines（社区维护），期刊目录来自 CCF 推荐国际学术刊物目录（第七版）。</p>
          <p>所有截稿时间已换算为北京时间；会议特点与偏好为社区经验总结，投稿前请以官方 CFP 为准。</p>
        </footer>
      </main>

      <ConferenceDetail
        conf={openConf}
        now={now}
        fav={openConf ? favs.has('c:' + confKey(openConf)) : false}
        onToggleFav={() => openConf && toggleFav('c:' + confKey(openConf))}
        onClose={() => setOpenConf(null)}
      />
      <JournalDetail
        journal={openJournal}
        fav={openJournal ? favs.has('j:' + journalKey(openJournal)) : false}
        onToggleFav={() => openJournal && toggleFav('j:' + journalKey(openJournal))}
        onClose={() => setOpenJournal(null)}
      />
    </div>
  );
}
