# CCF Deadline Planner · CCF 学术投递规划

[![Deploy to GitHub Pages](https://github.com/chenglangXTime/ccf-deadline-planner/actions/workflows/deploy.yml/badge.svg)](https://github.com/chenglangXTime/ccf-deadline-planner/actions/workflows/deploy.yml)
[![Update CCF deadline data](https://github.com/chenglangXTime/ccf-deadline-planner/actions/workflows/update-data.yml/badge.svg)](https://github.com/chenglangXTime/ccf-deadline-planner/actions/workflows/update-data.yml)

面向计算机学科研究者的会议/期刊投稿规划工具，覆盖 CCF 推荐目录全部十大领域的 **376 个会议 + 295 个期刊**。

## 🌐 在线使用

**https://chenglangxtime.github.io/ccf-deadline-planner/**

无需登录、打开即用，电脑和手机浏览器均可访问。

## ✨ 功能

- **DDL 倒计时**：摘要/投稿截止时间自动换算为北京时间，秒级动态倒计时，7 天内高亮预警
- **导出到日历**：一键把收藏会议的截稿日期导出为 `.ics` 文件（含截止前 7 天 / 1 天 / 3 小时三档提醒），可直接导入系统日历、Outlook、Google Calendar；也支持在会议详情中单独导出
- **会议详情**：完整截稿时间线（多轮截止）、rebuttal 与录用通知节点、历年录取率、会议特点与投稿偏好（社区经验）、官网与 DBLP 直达
- **期刊目录**：CCF 推荐国际学术刊物（第七版）全量收录，标注出版社与等级
- **组合筛选**：关键词搜索 × CCF 等级（A/B/C）× 十大领域 × 截稿窗口（30/60/90/180 天）× 收藏，可任意组合
- **收藏**：本地持久化（localStorage），跨会话保留，各访客数据互不影响
- **数据自动更新**：GitHub Action 每周一从 [ccfddl/ccf-deadlines](https://github.com/ccfddl/ccf-deadlines) 拉取最新数据并自动提交

## 🛠 技术栈

React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui，纯静态站点，托管于 GitHub Pages。

## 🚀 本地运行

```bash
# 1. 生成数据（首次需要；也可以直接 git pull 获取 CI 已提交的数据）
pip install pyyaml
python3 scripts/build_data.py       # 会议截止日期 + 录取率
python3 scripts/build_journals.py   # CCF 期刊目录

# 2. 启动开发服务器
cd web
npm install
npm run dev

# 构建产物（web/dist）
npm run build
```

## 📁 目录结构

```
├── .github/workflows/
│   ├── deploy.yml        # push 到 main 后自动构建并发布到 GitHub Pages
│   └── update-data.yml   # 每周一自动刷新会议/期刊数据并提交
├── scripts/
│   ├── build_data.py     # 抓取 ccfddl/ccf-deadlines，生成 conferences.json
│   └── build_journals.py # 解析 CCF 期刊目录，生成 journals.json
└── web/                  # Vite 前端应用
    └── src/
        ├── data/         # 生成的数据 + 手写 venue_notes.json
        ├── lib/          # 时区换算/倒计时（deadline.ts）、ICS 日历导出（ics.ts）
        ├── pages/        # 主页
        └── sections/     # 筛选栏、会议卡片、详情弹窗、期刊
```

## 🤖 自动化

| 工作流 | 触发 | 作用 |
| --- | --- | --- |
| `update-data.yml` | 每周一 10:23（北京时间）/ 手动 | 重新抓取数据，有变化则自动 commit 到 main |
| `deploy.yml` | `web/**` 有改动 push 到 main / 手动 | 构建并部署到 GitHub Pages |

## 📚 数据来源

- 会议截止日期与录取率：[ccfddl/ccf-deadlines](https://github.com/ccfddl/ccf-deadlines)（社区维护的开源数据）
- 期刊目录：[CCF 推荐国际学术刊物目录（第七版）](https://lijfrank.github.io/attaches/CCF.html)
- 会议特点与偏好：[`web/src/data/venue_notes.json`](web/src/data/venue_notes.json)，社区经验总结，欢迎 PR 补充

> ⚠️ 所有截稿时间请以官方 CFP 为准；录取率与会议偏好信息仅供参考。
