#!/usr/bin/env bash
set -euo pipefail
# Positional arguments come from subprocess argv, never from generated shell code.
infra_dir="$1"
project_dir="$2"
shift 2
infra_dir="$(cygpath -u "$infra_dir")"
project_dir="$(cygpath -u "$project_dir")"
export PATH="$infra_dir/.runtime/bin:$PATH"
cd "$project_dir"
exec bash "$infra_dir/vendor/pragmatic-orchestration/scripts/porch" "$@"
