#!/usr/bin/env bash
# Runs only after validation; never changes or replaces an existing release/tag.
set -euo pipefail
: "${GITHUB_REPOSITORY:?Missing repository}"
: "${GITHUB_SHA:?Missing validated commit}"
: "${GH_TOKEN:?Missing workflow token}"
tag="v$(python3 -c 'import json; print(json.load(open("package.json"))["version"])')"
if [[ ! "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+-beta\.[0-9]+$ ]]; then
  echo "Only beta prerelease versions can be published: $tag" >&2
  exit 1
fi
if [[ "${GITHUB_REF:-}" == refs/tags/* && "${GITHUB_REF_NAME:-}" != "$tag" ]]; then
  echo "Pushed tag does not match package.json: $tag" >&2
  exit 1
fi
if gh release view "$tag" --repo "$GITHUB_REPOSITORY" >/dev/null 2>&1; then
  echo "Release $tag already exists; leaving it unchanged."
  exit 0
fi
if [[ -n "$(git ls-remote origin "refs/tags/$tag")" ]]; then
  git fetch --no-tags origin "tag" "$tag"
  if [[ "$(git rev-parse "$tag^{commit}")" != "$GITHUB_SHA" ]]; then
    echo "Tag $tag points to another commit. Bump the beta version instead of replacing it." >&2
    exit 1
  fi
fi
notes="$(mktemp)"
trap 'rm -f "$notes"' EXIT
python3 - "$tag" "$notes" <<'PY'
import pathlib,sys
version=sys.argv[1][1:]
text=pathlib.Path('CHANGELOG.md').read_text()
marker='## '+version+'\n'
if marker not in text:
    raise SystemExit('Add changelog notes for '+version+' before publishing')
section=text.split(marker,1)[1].split('\n## ',1)[0].strip()
pathlib.Path(sys.argv[2]).write_text(section+'\n')
PY
gh release create "$tag" --repo "$GITHUB_REPOSITORY" --target "$GITHUB_SHA" \
  --prerelease --latest=false --title "Mobile Dashboard Starter $tag" --notes-file "$notes"
