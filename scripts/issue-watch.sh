#!/usr/bin/env bash
set -euo pipefail

REPO="markovalitalo6-code/AISPORE"

echo "== Latest issue with label: run-agent =="
gh issue list --repo "$REPO" --label "run-agent" --limit 1

echo
echo "== Details =="
NUMBER="$(gh issue list --repo "$REPO" --label "run-agent" --limit 1 --json number -q '.[0].number' || true)"

if [[ -z "${NUMBER}" || "${NUMBER}" == "null" ]]; then
  echo "No issues found with label run-agent."
  exit 0
fi

gh issue view "$NUMBER" --repo "$REPO" --json number,title,body,labels,url,author,createdAt
