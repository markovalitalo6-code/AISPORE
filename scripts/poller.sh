#!/bin/zsh
set -euo pipefail

REPO="${REPO:-markovalitalo6-code/AISPORE}"
LABEL="${LABEL:-run-agent}"

cd "$(dirname "$0")/.."

git checkout infra/agent-runner >/dev/null 2>&1 || true
git pull --ff-only >/dev/null 2>&1 || true

# Get latest open issues (no label filter = avoids broken label index)
JSON="$(gh issue list --repo "$REPO" --state open --limit 20 --json number,title,labels,updatedAt)"

NUM="$(echo "$JSON" | node -e '
const fs=require("fs");
const issues=JSON.parse(fs.readFileSync(0,"utf8"));
const label=process.env.LABEL || "run-agent";
const hit=issues.find(i => (i.labels||[]).some(l => l.name===label));
if(!hit){ process.exit(2); }
console.log(hit.number);
')"

if [[ -z "${NUM:-}" ]]; then
  echo "No issues found with label $LABEL (scanned latest 20 open issues)"
  exit 0
fi

echo "Found issue #$NUM with label $LABEL (scanned latest 20 open issues)"
./scripts/issue-to-pr.sh "$NUM"
