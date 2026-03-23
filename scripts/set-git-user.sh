#!/usr/bin/env bash
# Sets git user.name and user.email for this repo or globally.
#
# Usage:
#   ./scripts/set-git-user.sh "Jane Doe" "jane@example.com"
#   ./scripts/set-git-user.sh --global "Jane Doe" "jane@example.com"
# Or run with no args to be prompted.

set -euo pipefail

SCOPE=(--local)
if [[ "${1:-}" == "--global" ]]; then
  SCOPE=(--global)
  shift
fi

NAME="${1:-}"
EMAIL="${2:-}"

if [[ -z "$NAME" ]]; then
  read -r -p "Git user.name: " NAME
fi
if [[ -z "$EMAIL" ]]; then
  read -r -p "Git user.email: " EMAIL
fi

if [[ -z "${NAME// }" ]]; then
  echo "user.name cannot be empty." >&2
  exit 1
fi
if [[ -z "${EMAIL// }" ]]; then
  echo "user.email cannot be empty." >&2
  exit 1
fi

git config "${SCOPE[@]}" user.name "$(echo "$NAME" | xargs)"
git config "${SCOPE[@]}" user.email "$(echo "$EMAIL" | xargs)"

echo "Set (${SCOPE[*]}):"
echo "  user.name  = $(git config "${SCOPE[@]}" user.name)"
echo "  user.email = $(git config "${SCOPE[@]}" user.email)"
