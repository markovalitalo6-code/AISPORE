#!/usr/bin/env bash
set -euo pipefail

# Default allowlist (can be overridden per run)
ALLOW="${ALLOW_PATHS:-README.md scripts/}"

# List changed files
CHANGED="$(git diff --name-only)"

if [[ -z "$CHANGED" ]]; then
  echo "✅ safety-check: no changes"
  exit 0
fi

ok=1
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  matched=0
  for a in $ALLOW; do
    # normalize token once (keep original meaning)
    aa="$a"
    aa="${aa%/}"
    # exact file allow
    if [[ "$f" == "$aa" ]]; then matched=1; break; fi
    # directory allow: 'docs' or 'docs/' should allow docs/**
    if [[ "$f" == "$aa/"* ]]; then matched=1; break; fi
  done
  if [[ $matched -eq 0 ]]; then
    echo "❌ safety-check: disallowed change: $f"
    ok=0
  fi
done <<< "$CHANGED"

if [[ $ok -eq 0 ]]; then
  echo
  echo "Allowed paths: $ALLOW"
  echo "Fix: restrict agent output or adjust ALLOW_PATHS explicitly."
  exit 1
fi

echo "✅ safety-check: all changes allowed"
