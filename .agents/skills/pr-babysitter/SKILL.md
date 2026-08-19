---
name: pr-babysitter
description: Run the repository PR babysitter flow to audit open PRs, report CI failures, check approvals, and fix or label them.
---

# PR Babysitter Skill

Audits open Pull Requests for CI/CD failures and review approvals, and automatically takes action to fix them or update their status labels.

## Steps

1. **List open PRs**:
   Run `./bin/pr-list` to get all active, non-draft PRs.

2. **Audit each PR**:
   For each PR, run:
   - CI Status check: `./bin/pr-audit-status <pr-number>`
   - Reviews check: `./bin/pr-audit-reviews <pr-number> 0` (using 0 approvals since it's a single-dev repo)
   
3. **Handle Audit Results**:
   - **If Status Check fails (exits 1)**:
     - Check out the PR branch: `gh pr checkout <pr-number>`
     - Investigate the logs and run tests locally (`pnpm test`, `pnpm lint`, etc.) to find the failure.
     - Fix the broken code or tests.
     - Run validation commands to verify the fix (`pnpm build`, `pnpm test`, `pnpm lint`, `pnpm run context:check`).
     - Commit and push the fixes directly to the PR branch.
     - Notify the user of the fix.
   - **If Reviews Check fails (exits 1 or 2)**:
     - Check for active changes requested or other blockers. Report to the user.
   - **If all checks pass (exits 0)**:
     - Label the PR as ready: `./bin/pr-label-ready <pr-number>`
   - **If checks fail on a previously ready PR**:
     - Remove the ready label: `./bin/pr-label-remove <pr-number>`

4. **Conclusion**:
   Report the summary of audited PRs, which ones were fixed/updated, and return to the main branch.
