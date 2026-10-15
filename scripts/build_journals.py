#!/usr/bin/env python3
"""Fetch the CCF recommended journal catalog and build web/src/data/journals.json.

Source page embeds the catalog as a JS array (const allData = [...]).
"""
import json
import os
import re
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
HTML = os.path.join(DATA, "ccf_catalog.html")
URL = "https://lijfrank.github.io/attaches/CCF.html"
OUT = os.path.join(ROOT, "web", "src", "data", "journals.json")

DIR_MAP = {
    "系统": ("DS", "计算机体系结构/并行与分布计算/存储系统"),
    "网络": ("NW", "计算机网络"),
    "安全": ("SC", "网络与信息安全"),
    "软件": ("SE", "软件工程/系统软件/程序设计语言"),
    "数据": ("DB", "数据库/数据挖掘/内容检索"),
    "理论": ("CT", "计算机科学理论"),
    "媒体": ("CG", "计算机图形学与多媒体"),
    "智能": ("AI", "人工智能"),
    "人机": ("HI", "人机交互与普适计算"),
    "交叉": ("MX", "交叉/综合/新兴"),
}

PUBLISHER_LINKS = {
    "ACM": "https://dl.acm.org",
    "IEEE": "https://ieeexplore.ieee.org",
    "Springer": "https://link.springer.com",
    "Elsevier": "https://www.sciencedirect.com",
    "Wiley": "https://onlinelibrary.wiley.com",
}

ENTRY_RE = re.compile(
    r"\{direction: '((?:[^'\\]|\\.)*)', level: '((?:[^'\\]|\\.)*)', type: '((?:[^'\\]|\\.)*)', "
    r"no: '((?:[^'\\]|\\.)*)', abbr: '((?:[^'\\]|\\.)*)', full: '((?:[^'\\]|\\.)*)', "
    r"publisher: '((?:[^'\\]|\\.)*)', url: '((?:[^'\\]|\\.)*)'\}"
)


def unescape(s: str) -> str:
    return s.replace("\\'", "'").replace("\\\\", "\\")


def ensure_html():
    if os.path.exists(HTML):
        return
    os.makedirs(DATA, exist_ok=True)
    print("downloading CCF catalog page...")
    urllib.request.urlretrieve(URL, HTML)


def main():
    ensure_html()
    html = open(HTML, encoding="utf-8").read()
    m = re.search(r"const allData = (\[[\s\S]*?\]);", html)
    if not m:
        raise SystemExit("allData not found in catalog page")

    journals = []
    for e in ENTRY_RE.finditer(m.group(1)):
        direction, level, typ, _no, abbr, full, publisher, url = [unescape(x) for x in e.groups()]
        if typ != "期刊":
            continue
        sub, cat = DIR_MAP[direction]
        journals.append({
            "abbr": abbr,
            "full": full,
            "publisher": publisher,
            "sub": sub,
            "category": cat,
            "rank": level,
            "dblp": url,
            "link": PUBLISHER_LINKS.get(publisher, "") or url,
        })

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"updated": "2026-10-15", "source": "CCF推荐国际学术刊物目录（第七版）", "journals": journals}, f, ensure_ascii=False, separators=(",", ":"))
    print(f"wrote {len(journals)} journals -> {OUT}")


if __name__ == "__main__":
    main()
