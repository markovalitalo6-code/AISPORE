#!/usr/bin/env bash
set -euo pipefail

cd /Users/omistaja/hub/AI-WorkSpace/01_projects/ai-spore

# Always sync infra branch before checking for work
git fetch origin >/dev/null 2>&1 || true
git checkout infra/agent-runner >/dev/null 2>&1 || true
git pull --ff-only || true

# Run once (issue-to-pr will no-op if no run-agent issues exist)
./scripts/issue-to-pr.sh
