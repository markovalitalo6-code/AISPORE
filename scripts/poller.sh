#!/bin/zsh
set -euo pipefail

REPO="${REPO:-markovalitalo6-code/AISPORE}"
LABEL="${LABEL:-run-agent}"

cd "$(dirname "$0")/.."

git checkout infra/agent-runner >/dev/null 2>&1 || true
git pull --ff-only >/dev/null 2>&1 || true

while true; do
  if gh issue list --repo "$REPO" --label "$LABEL" --limit 1 | rg -q '^#'; then
    ./scripts/issue-to-pr.sh
    echo "----"
  else
    echo "No issues found with label $LABEL"
    break
  fi
done
