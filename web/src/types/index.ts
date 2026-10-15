export interface TimelineEntry {
  abstract_deadline: string | null;
  deadline: string | null;
  rebuttal_deadline: string | null;
  decision_deadline: string | null;
  comment: string;
}

export interface ConfEdition {
  year: number;
  id: string;
  link: string;
  timeline: TimelineEntry[];
  timezone: string;
  date: string;
  place: string;
}

export interface AcceptRate {
  year: number;
  submitted: number;
  accepted: number;
  str: string;
  rate: number;
  source?: string;
}

export interface Conference {
  title: string;
  description: string;
  sub: string;
  category: string;
  rank: { ccf: string; core: string; thcpl: string };
  dblp: string;
  confs: ConfEdition[];
  accept_rates: AcceptRate[];
}

export interface Journal {
  abbr: string;
  full: string;
  publisher: string;
  sub: string;
  category: string;
  rank: string; // A | B | C
  dblp: string;
  link: string;
}

export type VenueType = 'conference' | 'journal';

export const CATEGORIES: { code: string; name: string; short: string }[] = [
  { code: 'DS', name: '计算机体系结构/并行与分布计算/存储系统', short: '体系结构' },
  { code: 'NW', name: '计算机网络', short: '网络' },
  { code: 'SC', name: '网络与信息安全', short: '安全' },
  { code: 'SE', name: '软件工程/系统软件/程序设计语言', short: '软件工程' },
  { code: 'DB', name: '数据库/数据挖掘/内容检索', short: '数据库' },
  { code: 'CT', name: '计算机科学理论', short: '理论' },
  { code: 'CG', name: '计算机图形学与多媒体', short: '图形多媒体' },
  { code: 'AI', name: '人工智能', short: '人工智能' },
  { code: 'HI', name: '人机交互与普适计算', short: '人机交互' },
  { code: 'MX', name: '交叉/综合/新兴', short: '交叉' },
];
