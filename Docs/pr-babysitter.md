# PR Babysitter 👶🍼

A suite of dedicated, lightweight bash scripts designed to help agents audit pull requests for CI/CD status and review approvals.

## Scripts

### 1. `bin/pr-list`
Lists all open, active (non-draft) PRs.
*   **Usage**: `./bin/pr-list`
*   **Output**: Tabs-separated list of `PR_NUMBER` and `TITLE`.

### 2. `bin/pr-audit-status <pr-number>`
Audits the CI/CD status rollup for a specific PR.
*   **Usage**: `./bin/pr-audit-status <pr-number>`
*   **Exit Codes**:
    *   `0`: All checks passed.
    *   `1`: One or more checks have failed. Prints details to stdout.
    *   `2`: Required checks are pending/in-progress.

### 3. `bin/pr-audit-reviews <pr-number> [min-approvals]`
Audits the code review approvals and blockers for a specific PR.
*   **Usage**: `./bin/pr-audit-reviews <pr-number> [min-approvals]` (Defaults to `0` minimum approvals)
*   **Exit Codes**:
    *   `0`: Approved and ready.
    *   `1`: Active `CHANGES_REQUESTED` present. Prints author of block to stdout.
    *   `2`: Insufficient number of approvals.

### 4. `bin/pr-comment <pr-number> <comment-body>`
Comments on the specified PR.
*   **Usage**: `./bin/pr-comment <pr-number> "Comment text goes here"`

### 5. `bin/pr-label-ready <pr-number>`
Applies the `status: ready-to-merge` label to the PR.
*   **Usage**: `./bin/pr-label-ready <pr-number>`

### 6. `bin/pr-label-remove <pr-number>`
Removes the `status: ready-to-merge` label from the PR.
*   **Usage**: `./bin/pr-label-remove <pr-number>`
