import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const script=path.resolve('tools/publish-beta.sh');
function run(mode,version='0.1.0-beta.2'){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mds-release-')),bin=path.join(dir,'bin');fs.mkdirSync(bin);
 fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({version}));fs.writeFileSync(path.join(dir,'CHANGELOG.md'),'# Changelog\n\n## '+version+'\n\n- New beta notes\n\n## 0.0.1-beta.1\n\n- Old notes\n');
 fs.writeFileSync(path.join(bin,'gh'),'#!/bin/sh\nif [ "$2" = view ]; then [ "$RELEASE_TEST_MODE" = exists ]; exit $?; fi\nif [ "$2" = create ]; then [ "$RELEASE_TEST_MODE" = fail ] && exit 17; printf "%s\\n" "$@"; while [ "$#" -gt 0 ]; do if [ "$1" = --notes-file ]; then shift; cat "$1"; break; fi; shift; done; exit 0; fi\nexit 1\n',{mode:0o755});
 fs.writeFileSync(path.join(bin,'git'),'#!/bin/sh\ncase "$1" in ls-remote) [ "$RELEASE_TEST_MODE" = conflict ] && echo "other refs/tags/existing"; exit 0;; fetch) exit 0;; rev-parse) echo other-sha; exit 0;; esac\nexit 1\n',{mode:0o755});
 const result=spawnSync('bash',[script],{cwd:dir,encoding:'utf8',env:{...process.env,PATH:bin+path.delimiter+process.env.PATH,GH_TOKEN:'test-workflow-token',GITHUB_SHA:'validated-sha',GITHUB_REPOSITORY:'example/starter',GITHUB_REF:'refs/heads/main',RELEASE_TEST_MODE:mode}});fs.rmSync(dir,{recursive:true,force:true});return result;
}
test('release automation publishes only the validated beta and current changelog section',()=>{const r=run('new');assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/--prerelease/);assert.match(r.stdout,/--latest=false/);assert.match(r.stdout,/validated-sha/);assert.match(r.stdout,/New beta notes/);assert.doesNotMatch(r.stdout,/Old notes/);});
test('release automation leaves existing releases unchanged',()=>{const r=run('exists');assert.equal(r.status,0);assert.match(r.stdout,/leaving it unchanged/);assert.doesNotMatch(r.stdout,/--prerelease/);});
test('release automation rejects stable versions and conflicting tags',()=>{const stable=run('new','1.0.0');assert.notEqual(stable.status,0);assert.match(stable.stderr,/Only beta/);const conflict=run('conflict');assert.notEqual(conflict.status,0);assert.match(conflict.stderr,/another commit/);});
test('release publication failures propagate to CI',()=>{assert.equal(run('fail').status,17);});
