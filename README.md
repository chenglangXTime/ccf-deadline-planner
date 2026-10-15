# CCF Deadline Planner · CCF 学术投递规划

面向计算机学科研究者的会议/期刊投稿规划工具，覆盖 CCF 推荐目录全部十大领域的 **376 个会议 + 295 个期刊**。

## 功能

- **DDL 倒计时**：摘要/投稿截止时间自动换算为北京时间，秒级动态倒计时，7 天内红色预警
- **会议详情**：完整截稿时间线（多轮截止）、rebuttal 与录用通知节点、历年录取率、会议特点与投稿偏好（社区经验）、官网与 DBLP 直达
- **期刊目录**：CCF 推荐国际学术刊物（第七版）全量收录，标注出版社与等级
- **组合筛选**：关键词搜索 × CCF 等级（A/B/C）× 十大领域 × 截稿窗口（30/60/90 天）× 收藏
- **收藏**：本地持久化，跨会话保留
- **数据自动更新**：GitHub Action 每周一从 [ccfddl/ccf-deadlines](https://github.com/ccfddl/ccf-deadlines) 拉取最新数据并自动提交

## 技术栈

React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui

## 本地运行

```bash
# 1. 生成数据（首次需要；也可以直接 git pull 获取 CI 提交的数据）
pip install pyyaml
python scripts/build_data.py       # 会议截止日期 + 录取率
python scripts/build_journals.py   # CCF 期刊目录

# 2. 启动
cd web
npm install
npm run dev
```

## 数据来源

- 会议截止日期与录取率：[ccfddl/ccf-deadlines](https://github.com/ccfddl/ccf-deadlines)（社区维护的开源数据）
- 期刊目录：[CCF 推荐国际学术刊物目录（第七版）](https://lijfrank.github.io/attaches/CCF.html)
- 会议特点与偏好：`web/src/data/venue_notes.json`，社区经验总结，欢迎 PR 补充

> 所有截稿时间以官方 CFP 为准。
