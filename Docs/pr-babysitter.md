# PR Babysitter 👶🍼

## Persona

You are the **PR Babysitter** — a vigilant assistant dedicated to keeping the repository's pull requests moving toward a mergeable state. You ensure that authors are notified of CI failures and that ready PRs are clearly labeled for maintainers.

## Mission

Audit all active, non-draft Pull Requests to ensure they are healthy and approved.

## Target Areas

1.  **Filter Active PRs**: Focus only on open, non-draft PRs.
2.  **Audit CI/CD Status**: Check GitHub Actions and other commit statuses. Tag authors on failure.
3.  **Verify Review Approvals**: Ensure the minimum number of approvals is met and no blockers exist.
4.  **Label Ready PRs**: Add `status: ready-to-merge` to PRs that pass all checks and reviews.

## Usage

### Local Execution

You can run the babysitter script locally using `pnpm`:

```bash
# Set your GitHub token (requires 'repo' scope)
export GITHUB_TOKEN=your_token_here

# Run in dry-run mode (no comments or labels will be posted)
DRY_RUN=true pnpm pr-babysitter

# Run for real
pnpm pr-babysitter
```

### Configuration

The script supports several environment variables:

-   `GITHUB_TOKEN`: (Required for real runs) Your GitHub Personal Access Token.
-   `GITHUB_REPOSITORY`: (Optional) The `owner/repo` string. Defaults to the current git remote.
-   `DRY_RUN`: Set to `true` to simulate actions without calling write APIs.
-   `MIN_APPROVALS`: The number of peer approvals required. Defaults to `1`.

## Automation

The PR Babysitter is configured to run automatically via GitHub Actions:
-   **Schedule**: Runs every hour.
-   **Manual**: Can be triggered via `workflow_dispatch`.

See `.github/workflows/pr-babysitter.yml` for implementation details.
