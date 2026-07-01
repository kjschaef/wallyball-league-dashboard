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
  } catch {
    // Fallback or ignore
  }
  return 'kjschaef/wallyball-league-dashboard';
}

async function githubFetch(path: string, options: RequestInit & { ignoreErrors?: number[] } = {}) {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const { ignoreErrors, ...fetchOptions } = options;
  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      Authorization: GITHUB_TOKEN ? `token ${GITHUB_TOKEN}` : '',
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'PR-Babysitter-Bot',
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    if (ignoreErrors?.includes(response.status)) {
      return null;
    }
    const errorBody = await response.text();
    console.error(`GitHub API error: ${response.status} ${response.statusText}\n${errorBody}`);
    return null;
  }

  if (response.status === 204) {
    return true;
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

async function removeLabel(issueNumber: number, label: string) {
  console.log(`[Action] Removing label '${label}' from PR #${issueNumber}`);
  if (DRY_RUN) {
    console.log(`[Dry Run] Would remove label: ${label}`);
    return;
  }
  if (!GITHUB_TOKEN) {
    console.log('[Warning] No GITHUB_TOKEN found, skipping label removal.');
    return;
  }
  // GitHub API returns 404 if the label doesn't exist on the issue, which we can ignore
  await githubFetch(`/repos/${REPO}/issues/${issueNumber}/labels/${encodeURIComponent(label)}`, {
    method: 'DELETE',
    ignoreErrors: [404],
  });
}

async function getRequiredChecks(branchName: string): Promise<string[] | null> {
  // Attempt to fetch required status checks for the base branch
  const protection = await githubFetch(`/repos/${REPO}/branches/${encodeURIComponent(branchName)}/protection/required_status_checks`, {
    ignoreErrors: [404, 403], // 404 if no protection, 403 if lack of permissions
  });

  if (protection && Array.isArray(protection.contexts)) {
    return protection.contexts;
  }
  return null;
}

async function auditPRs() {
  console.log(`Auditing repo: ${REPO}`);
  if (DRY_RUN) console.log('Running in DRY_RUN mode.');

  let allPulls: any[] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const pulls: any[] = await githubFetch(`/repos/${REPO}/pulls?state=open&per_page=100&page=${page}`);
    if (!pulls || pulls.length === 0) {
      hasMore = false;
      break;
    }
    allPulls = allPulls.concat(pulls);
    if (pulls.length < 100) {
      hasMore = false;
    } else {
      page++;
    }
  }

  if (allPulls.length === 0) {
    console.log('No open pull requests found.');
    return;
  }

  console.log(`Found ${allPulls.length} open PRs.`);

  // Cache required checks for base branches to minimize API calls
  const requiredChecksCache = new Map<string, string[] | null>();

  for (const pr of allPulls) {
    if (pr.draft) {
      console.log(`Skipping draft PR #${pr.number}: ${pr.title}`);
      continue;
    }

    console.log(`Checking PR #${pr.number}: ${pr.title} (Author: @${pr.user.login})`);

    // 1. Audit CI/CD Status
    const checkRuns = await githubFetch(`/repos/${REPO}/commits/${pr.head.sha}/check-runs`);
    const statuses = await githubFetch(`/repos/${REPO}/commits/${pr.head.sha}/statuses`);

    if (!checkRuns || !statuses) {
      console.log(`  Could not retrieve check runs or statuses for PR #${pr.number}. Skipping.`);
      continue;
    }

    // Get required checks for the base branch
    const baseBranch = pr.base.ref;
    if (!requiredChecksCache.has(baseBranch)) {
      requiredChecksCache.set(baseBranch, await getRequiredChecks(baseBranch));
    }
    const requiredChecks = requiredChecksCache.get(baseBranch);

    if (requiredChecks) {
      console.log(`  Required checks for ${baseBranch}: ${requiredChecks.join(', ')}`);
    } else {
      console.log(`  No specific required checks found for ${baseBranch}, auditing all failures.`);
    }

    const failures: string[] = [];
    let pending = false;

    const observedContexts = new Set<string>();

    // Evaluate Check Runs (GitHub Actions)
    for (const run of checkRuns.check_runs) {
      observedContexts.add(run.name);
      const isRequired = !requiredChecks || requiredChecks.includes(run.name);

      if (run.status !== 'completed') {
        if (isRequired) pending = true;
      } else if (run.conclusion === 'failure' || run.conclusion === 'timed_out' || run.conclusion === 'action_required' || run.conclusion === 'cancelled' || run.conclusion === 'stale') {
        if (isRequired) {
          failures.push(`Check Run: ${run.name} (${run.conclusion})`);
        }
      }
    }

    // Evaluate Commit Statuses
    const latestStatuses = new Map<string, any>();
    for (const status of statuses) {
      if (!latestStatuses.has(status.context)) {
        latestStatuses.set(status.context, status);
      }
    }

    for (const status of latestStatuses.values()) {
      observedContexts.add(status.context);
      const isRequired = !requiredChecks || requiredChecks.includes(status.context);

      if (status.state === 'pending') {
        if (isRequired) pending = true;
      } else if (status.state === 'failure' || status.state === 'error') {
        if (isRequired) {
          failures.push(`Status: ${status.context}`);
        }
      }
    }

    // Treat missing required checks as pending
    if (requiredChecks) {
      for (const required of requiredChecks) {
        if (!observedContexts.has(required)) {
          console.log(`  Required check '${required}' has not reported yet. Treating as pending.`);
          pending = true;
        }
      }
    }

    const labels = pr.labels.map((l: any) => l.name);

    if (failures.length > 0) {
      if (labels.includes('status: ready-to-merge')) {
        await removeLabel(pr.number, 'status: ready-to-merge');
      }

      const commentBody = `⚠️ Hello @${pr.user.login}, it looks like some CI checks have failed on this PR:\n\n` +
        failures.map(f => `- ${f}`).join('\n') +
        `\n\nPlease address these failures so the PR can be moved toward a mergeable state.`;

      // Check if we already commented recently to avoid spam
      const comments = await githubFetch(`/repos/${REPO}/issues/${pr.number}/comments`);
      const alreadyCommented = Array.isArray(comments) && comments.some((c: any) =>
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
      if (labels.includes('status: ready-to-merge')) {
        await removeLabel(pr.number, 'status: ready-to-merge');
      }
      console.log(`  Required checks are still pending for PR #${pr.number}. Skipping.`);
      continue;
    }

    // 2. Verify Code Review Approvals
    const reviews = await githubFetch(`/repos/${REPO}/pulls/${pr.number}/reviews`);
    if (!reviews) {
      console.log(`  Could not retrieve reviews for PR #${pr.number}. Skipping.`);
      continue;
    }

    const latestReviews = new Map<string, string>();
    for (const review of reviews) {
      // Ignore comment-only reviews when deriving blockers/approvals
      if (review.state === 'COMMENTED') continue;
      latestReviews.set(review.user.login, review.state);
    }

    const states = Array.from(latestReviews.values());
    const approvals = states.filter(state => state === 'APPROVED').length;
    const changesRequested = states.some(state => state === 'CHANGES_REQUESTED');

    console.log(`  Approvals: ${approvals}/${MIN_APPROVALS}, Changes Requested: ${changesRequested}`);

    if (changesRequested || approvals < MIN_APPROVALS) {
      if (labels.includes('status: ready-to-merge')) {
        await removeLabel(pr.number, 'status: ready-to-merge');
      }

      if (changesRequested) {
        console.log(`  PR #${pr.number} has active 'Changes Requested'.`);
      } else {
        console.log(`  PR #${pr.number} does not have enough approvals yet.`);
      }
      continue;
    }

    // 3. Take Action on Ready PRs
    if (!labels.includes('status: ready-to-merge')) {
      await addLabel(pr.number, 'status: ready-to-merge');
    } else {
      console.log(`  PR #${pr.number} is already marked as status: ready-to-merge.`);
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
