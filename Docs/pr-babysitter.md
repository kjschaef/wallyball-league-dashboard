# PR Babysitter

The PR Babysitter is an automation script designed to audit active, non-draft Pull Requests in the repository. Its primary goal is to ensure PRs are moving toward a mergeable state by monitoring CI/CD status and code review approvals.

## How it Works

The script iterates through all open, non-draft PRs and performs the following checks:

1.  **CI/CD Audit**: Retrieves the latest check runs (GitHub Actions) and commit statuses for the head SHA of the PR.
    *   If any required check has failed, it posts a comment tagging the PR author with a summary of the failing jobs.
    *   If checks are still pending or running, it skips the PR to let them finish.
2.  **Code Review Verification**: Retrieves the review states for the PR.
    *   Ensures the PR has met the minimum required number of peer approvals (default is 1).
    *   Verifies there are no active "Changes Requested" blocks.
3.  **Automated Labeling**:
    *   If all CI/CD checks have passed AND the PR has the required approvals, it adds the `status: ready-to-merge` label.
    *   If a PR previously had the label but now fails checks or has changes requested, the label is removed.

## Running the Script

### Locally

To run the script locally, you need a GitHub personal access token with `repo` scope.

```bash
export GITHUB_TOKEN=your_token_here
export GITHUB_REPOSITORY=owner/repo # Optional, defaults to remote origin
export MIN_APPROVALS=1 # Optional, defaults to 1
export DRY_RUN=true # Set to true to see actions without making changes
tsx scripts/pr-babysitter.ts
```

### GitHub Actions

The script is configured to run automatically via GitHub Actions as defined in `.github/workflows/pr-babysitter.yml`. It runs on a schedule and can be triggered manually via `workflow_dispatch`.

## Configuration

*   `GITHUB_TOKEN`: (Required) A GitHub token to interact with the API.
*   `GITHUB_REPOSITORY`: (Optional) The repository to audit in the format `owner/repo`.
*   `MIN_APPROVALS`: (Optional) The minimum number of approvals required (default: `1`).
*   `DRY_RUN`: (Optional) If set to `true`, the script will log actions instead of performing them.
