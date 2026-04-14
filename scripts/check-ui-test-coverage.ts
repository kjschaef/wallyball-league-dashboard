import { execSync } from "child_process";

/**
 * Checks if UI files were changed without corresponding updates to e2e tests.
 * Outputs a GitHub Action warning if coverage is deemed missing.
 * Exits with 0 to safely warn without failing the pipeline (as per user request).
 */
function checkUITestCoverage() {
  console.log("Running UI Test Coverage Check...");

  // Determine base branch. In GitHub Actions pull requests, github.base_ref can be used.
  // Locally, we default to origin/main or main.
  const baseBranch = process.env.BASE_BRANCH || "origin/main";
  
  let changedFilesStr = "";
  try {
    // Attempt to get changed files using git diff against the merge base.
    changedFilesStr = execSync(`git diff --name-only $(git merge-base HEAD ${baseBranch})..HEAD`, { encoding: "utf8" });
  } catch (error) {
    console.error(`Failed to execute git diff. Make sure the base branch '${baseBranch}' exists and history is fetched.`);
    console.error(error);
    // Exit gracefully so we don't break CI randomly on shallow clones
    process.exit(0);
  }

  const changedFiles = changedFilesStr.split("\n").filter(f => f.trim().length > 0);
  
  const uiFilesChanged = changedFiles.filter(f => 
    f.startsWith("app/") && f.endsWith(".tsx")
  );
  
  const e2eFilesChanged = changedFiles.filter(f => 
    f.startsWith("tests/e2e/") && f.endsWith(".spec.ts")
  );

  console.log(`Found ${uiFilesChanged.length} modified UI file(s).`);
  console.log(`Found ${e2eFilesChanged.length} modified E2E test file(s).`);

  if (uiFilesChanged.length > 0 && e2eFilesChanged.length === 0) {
    const message = "New UI components or pages were modified without updating e2e tests. Please consider adding or updating automated UI tests.";
    
    // Using GitHub Actions warning annotation format
    // https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#setting-a-warning-message
    if (process.env.CI || process.env.GITHUB_ACTIONS) {
      console.log(`::warning::${message}`);
      // Also log the list of UI files that caused this warning
      console.log(`::warning::Modified UI files:\n${uiFilesChanged.join("\n")}`);
    } else {
      console.warn(`WARNING: ${message}`);
      console.warn(`Modified UI files:\n - ${uiFilesChanged.join("\n - ")}`);
    }
  } else if (uiFilesChanged.length > 0 && e2eFilesChanged.length > 0) {
    console.log("Awesome! You updated UI files and E2E tests together.");
  } else {
    console.log("No UI files changed. Skipping strict test coverage check.");
  }
}

checkUITestCoverage();
