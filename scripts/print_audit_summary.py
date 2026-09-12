import json
import os

with open(r'c:\SIH\SIH2026\docs\ai-ml\audit_dump.json') as f:
    data = json.load(f)

print(f"Total CSV datasets audited: {len(data)}\n")
for d in data:
    path = d['rel_path']
    rows = d['rows']
    cols = d['cols']
    null_pct = d['null_pct']
    dups = d['duplicates']
    col_names = ", ".join(list(d['columns'].keys())[:6]) + ("..." if cols > 6 else "")
    print(f"{path:<55} | {rows:>6} rows | {cols:>2} cols | Nulls: {null_pct:>4}% | Dups: {dups} | {col_names}")

