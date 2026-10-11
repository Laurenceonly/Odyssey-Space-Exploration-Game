import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const timestamp = (date) => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
}).format(new Date(date));
const commits = git('log', '--format=%H').split('\n');
const sections = commits.map((hash) => {
  const committed = git('show', '-s', '--format=%cI', hash);
  const authored = git('show', '-s', '--format=%aI', hash);
  const subject = git('show', '-s', '--format=%s', hash);
  const body = git('show', '-s', '--format=%b', hash);
  const files = git('diff-tree', '--root', '--no-commit-id', '--name-status', '-r', hash);
  const changes = subject.startsWith('- ') ? subject.slice(2).split(' - ') : [subject];
  const lines = [
    `## ${timestamp(committed)} — ${hash.slice(0, 7)}`, '',
    `[View commit](https://github.com/Laurenceonly/Odyssey-Space-Exploration-Game/commit/${hash})`, '',
    ...changes.map((change) => `- ${change}`),
  ];
  if (body) lines.push('', body);
  if (authored !== committed) lines.push('', `Original author time: ${timestamp(authored)} (Asia/Manila).`);
  if (files) lines.push('', '<details>', '<summary>Files changed (A = added, M = modified, D = deleted)</summary>', '', '```text', files, '```', '', '</details>');
  return lines.join('\n');
});
const intro = [
  '# Odyssey commit history', '',
  'All dates and times use **Asia/Manila (UTC+08:00)**. Entries appear newest first in Git history order and use the commit timestamp; rebased commits also show their original author time when it differs.', '',
  'This file is generated from local Git history. Commit messages describe the work as recorded at the time; they do not prove a deployment or test result. Uncommitted edits are recorded separately in [the work log](docs/WORK_LOG.md).', '',
  'Refresh after committing changes:', '',
  '```sh', 'node scripts/update-commit-history.mjs', '```', '',
  'The snapshot includes commits present when the command runs. A commit that adds this snapshot will appear on the next refresh.', '',
];
writeFileSync(new URL('../CHANGELOG.md', import.meta.url), `${intro.join('\n')}\n${sections.join('\n\n')}\n`);
console.log(`Recorded ${commits.length} commits in CHANGELOG.md.`);
