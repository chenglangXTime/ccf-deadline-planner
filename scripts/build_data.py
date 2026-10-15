#!/usr/bin/env python3
"""Fetch ccfddl/ccf-deadlines and build web/src/data/conferences.json.

- Downloads the upstream repo tarball if not present locally.
- Keeps only the latest edition per conference (the app only displays
  upcoming deadlines; acceptance-rate history is kept in full).
"""
import json
import os
import tarfile
import urllib.request

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
REPO = os.path.join(DATA, "ccf-deadlines-main")
TARBALL = os.path.join(DATA, "ccf-deadlines.tar.gz")
URL = "https://github.com/ccfddl/ccf-deadlines/archive/refs/heads/main.tar.gz"
OUT = os.path.join(ROOT, "web", "src", "data", "conferences.json")

CATEGORY_NAMES = {
    "DS": "计算机体系结构/并行与分布计算/存储系统",
    "NW": "计算机网络",
    "SC": "网络与信息安全",
    "SE": "软件工程/系统软件/程序设计语言",
    "DB": "数据库/数据挖掘/内容检索",
    "CT": "计算机科学理论",
    "CG": "计算机图形学与多媒体",
    "AI": "人工智能",
    "HI": "人机交互与普适计算",
    "MX": "交叉/综合/新兴",
}


def ensure_repo():
    if os.path.isdir(REPO):
        return
    os.makedirs(DATA, exist_ok=True)
    print("downloading ccf-deadlines tarball...")
    urllib.request.urlretrieve(URL, TARBALL)
    with tarfile.open(TARBALL, "r:gz") as t:
        t.extractall(DATA)


def load_yaml(path):
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def main():
    ensure_repo()

    accept_map = {}
    for sub in sorted(os.listdir(os.path.join(REPO, "accept_rates"))):
        d = os.path.join(REPO, "accept_rates", sub)
        if not os.path.isdir(d):
            continue
        for fn in os.listdir(d):
            if not fn.endswith(".yml"):
                continue
            for entry in load_yaml(os.path.join(d, fn)) or []:
                title = (entry.get("title") or "").upper()
                accept_map[title] = entry.get("accept_rates") or []

    conferences = []
    for sub in sorted(os.listdir(os.path.join(REPO, "conference"))):
        d = os.path.join(REPO, "conference", sub)
        if not os.path.isdir(d):
            continue
        for fn in sorted(os.listdir(d)):
            if not fn.endswith(".yml"):
                continue
            for entry in load_yaml(os.path.join(d, fn)) or []:
                rank = entry.get("rank") or {}
                if isinstance(rank, str):
                    rank = {"ccf": rank}
                confs = []
                for c in entry.get("confs") or []:
                    timeline = [{
                        "abstract_deadline": str(t["abstract_deadline"]) if t.get("abstract_deadline") else None,
                        "deadline": str(t["deadline"]) if t.get("deadline") else None,
                        "rebuttal_deadline": str(t["rebuttal_deadline"]) if t.get("rebuttal_deadline") else None,
                        "decision_deadline": str(t["decision_deadline"]) if t.get("decision_deadline") else None,
                        "comment": t.get("comment") or "",
                    } for t in c.get("timeline") or []]
                    confs.append({
                        "year": c.get("year"),
                        "id": c.get("id"),
                        "link": c.get("link"),
                        "timeline": timeline,
                        "timezone": c.get("timezone") or "AoE",
                        "date": c.get("date") or "",
                        "place": c.get("place") or "",
                    })
                # keep only the latest edition
                if confs:
                    latest = max(c["year"] for c in confs)
                    confs = [c for c in confs if c["year"] == latest]
                title = entry.get("title") or ""
                conferences.append({
                    "title": title,
                    "description": entry.get("description") or "",
                    "sub": entry.get("sub") or sub,
                    "category": CATEGORY_NAMES.get(entry.get("sub") or sub, sub),
                    "rank": {
                        "ccf": rank.get("ccf") or "N",
                        "core": rank.get("core") or "N",
                        "thcpl": rank.get("thcpl") or "N",
                    },
                    "dblp": entry.get("dblp") or "",
                    "confs": confs,
                    "accept_rates": accept_map.get(title.upper(), []),
                })

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"updated": "2026-10-15", "conferences": conferences}, f, ensure_ascii=False, separators=(",", ":"))
    size = os.path.getsize(OUT)
    print(f"wrote {len(conferences)} conferences -> {OUT} ({size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
