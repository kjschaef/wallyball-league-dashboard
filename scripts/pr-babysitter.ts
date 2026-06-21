import { execSync } from 'child_process';

/**
 * PR Babysitter
 * Audits open pull requests for CI/CD status and review approvals.
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY || getRepoFromGitConfig();
const DRY_RUN = process.env.DRY_RUN === 'true';
const MIN_APPROVALS = parseInt(process.env.MIN_APPROVALS || '1', 10);
const API_URL = 'https://api.github.com';

function getRepoFromGitConfig(): string {
  try {
    const remote = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
    const match = remote.match(/github\.com[/:](.+\/.+?)(?:\.git)?$/);
    if (match) return match[1];
  } catch (e) {
    // Fallback or ignore
  }
  return 'kjschaef/wallyball-league-dashboard';
}

async function githubFetch(path: string, options: RequestInit = {}) {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'PR-Babysitter-Bot',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`GitHub API error: ${response.status} ${response.statusText}\n${errorBody}`);
    return null;
  }

  return response.json();
}

async function postComment(issueNumber: number, body: string) {
  console.log(`[Action] Posting comment to PR #${issueNumber}`);
  if (DRY_RUN) {
    console.log(`[Dry Run] Would post: ${body}`);
    return;
  }
  if (!GITHUB_TOKEN) {
    console.log('[Warning] No GITHUB_TOKEN found, skipping comment.');
    return;
  }
  await githubFetch(`/repos/${REPO}/issues/${issueNumber}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

async function addLabel(issueNumber: number, label: string) {
  console.log(`[Action] Adding label '${label}' to PR #${issueNumber}`);
  if (DRY_RUN) {
    console.log(`[Dry Run] Would add label: ${label}`);
    return;
  }
  if (!GITHUB_TOKEN) {
    console.log('[Warning] No GITHUB_TOKEN found, skipping label.');
    return;
  }
  await githubFetch(`/repos/${REPO}/issues/${issueNumber}/labels`, {
    method: 'POST',
    body: JSON.stringify({ labels: [label] }),
  });
}

async function auditPRs() {
  console.log(`Auditing repo: ${REPO}`);
  if (DRY_RUN) console.log('Running in DRY_RUN mode.');

  const pulls = await githubFetch(`/repos/${REPO}/pulls?state=open`);
  if (!pulls) return;

  for (const pr of pulls) {
    if (pr.draft) {
      console.log(`Skipping draft PR #${pr.number}: ${pr.title}`);
      continue;
    }

    console.log(`Checking PR #${pr.number}: ${pr.title} (Author: @${pr.user.login})`);

    // 1. Audit CI/CD Status
    const checkRuns = await githubFetch(`/repos/${REPO}/commits/${pr.head.sha}/check-runs`);
    const statuses = await githubFetch(`/repos/${REPO}/commits/${pr.head.sha}/statuses`);

    if (!checkRuns || !statuses) continue;

    const allCheckRuns = checkRuns.check_runs;
    const combinedStatuses = statuses;

    const failures: string[] = [];
    let pending = false;

    // Evaluate Check Runs (GitHub Actions)
    for (const run of allCheckRuns) {
      if (run.status !== 'completed') {
        pending = true;
      } else if (run.conclusion === 'failure' || run.conclusion === 'timed_out' || run.conclusion === 'action_required') {
        failures.push(`Check Run: ${run.name}`);
      }
    }

    // Evaluate Commit Statuses (External CI, older integrations)
    // Note: status API returns all statuses, we usually care about the latest for each context
    const latestStatuses = new Map<string, any>();
    for (const status of combinedStatuses) {
      if (!latestStatuses.has(status.context)) {
        latestStatuses.set(status.context, status);
      }
    }

    for (const status of latestStatuses.values()) {
      if (status.state === 'pending') {
        pending = true;
      } else if (status.state === 'failure' || status.state === 'error') {
        failures.push(`Status: ${status.context}`);
      }
    }

    if (failures.length > 0) {
      const commentBody = `⚠️ Hello @${pr.user.login}, it looks like some CI checks have failed on this PR:\n\n` +
        failures.map(f => `- ${f}`).join('\n') +
        `\n\nPlease address these failures so the PR can be moved toward a mergeable state.`;

      // Check if we already commented recently to avoid spam (basic heuristic)
      const comments = await githubFetch(`/repos/${REPO}/issues/${pr.number}/comments`);
      const alreadyCommented = comments?.some((c: any) =>
        c.body.includes('CI checks have failed') &&
        (c.user.login === 'PR-Babysitter-Bot' || c.user.login === 'github-actions[bot]')
      );

      if (!alreadyCommented) {
        await postComment(pr.number, commentBody);
      } else {
        console.log(`  Failures found, but already commented on PR #${pr.number}`);
      }
      continue;
    }

    if (pending) {
      console.log(`  Checks are still pending for PR #${pr.number}. Skipping.`);
      continue;
    }

    // 2. Verify Code Review Approvals
    const reviews = await githubFetch(`/repos/${REPO}/pulls/${pr.number}/reviews`);
    if (!reviews) continue;

    const latestReviews = new Map<string, string>();
    for (const review of reviews) {
      // Only keep the latest review state for each user
      latestReviews.set(review.user.login, review.state);
    }

    const approvals = Array.from(latestReviews.values()).filter(state => state === 'APPROVED').length;
    const changesRequested = Array.from(latestReviews.values()).some(state => state === 'CHANGES_REQUESTED');

    console.log(`  Approvals: ${approvals}/${MIN_APPROVALS}, Changes Requested: ${changesRequested}`);

    if (changesRequested) {
      console.log(`  PR #${pr.number} has active 'Changes Requested'.`);
      continue;
    }

    // 3. Take Action on Ready PRs
    if (approvals >= MIN_APPROVALS) {
      const labels = pr.labels.map((l: any) => l.name);
      if (!labels.includes('status: ready-to-merge')) {
        await addLabel(pr.number, 'status: ready-to-merge');
      } else {
        console.log(`  PR #${pr.number} is already marked as status: ready-to-merge.`);
      }
    } else {
      console.log(`  PR #${pr.number} does not have enough approvals yet.`);
    }
  }
}

if (require.main === module || (process.argv[1] && process.argv[1].endsWith('pr-babysitter.ts'))) {
  auditPRs().catch(err => {
    console.error('Fatal error in PR Babysitter:');
    console.error(err);
    process.exit(1);
  });
}
