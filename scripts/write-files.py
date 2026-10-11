import json, sys
from pathlib import Path
root = Path(__file__).resolve().parent.parent
for name, content in json.load(sys.stdin).items():
    target = (root / name).resolve()
    if not target.is_relative_to(root):
        raise ValueError('Path outside workspace')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding='utf-8')
