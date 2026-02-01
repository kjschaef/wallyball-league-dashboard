---
description: Create an isolated git worktree for this agent thread
---

# Git Worktree Setup for Agent Thread

This workflow creates an isolated git worktree for the current agent conversation to prevent conflicts with other concurrent agent threads.

## Setup Steps

### 1. Check for existing worktree
```bash
cd /Users/keith.schaefer/Documents/GitHub/wallyball-league-dashboard
git worktree list | grep "agent-$(echo $CONVERSATION_ID | cut -c1-8)" || echo "No existing worktree found"
```

### 2. Create a new worktree with unique branch
```bash
cd /Users/keith.schaefer/Documents/GitHub/wallyball-league-dashboard
BRANCH_NAME="agent/$(date +%Y%m%d-%H%M%S)-$(echo $CONVERSATION_ID | cut -c1-8)"
WORKTREE_PATH="../wallyball-agent-$(echo $CONVERSATION_ID | cut -c1-8)"
git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME"
```

This creates:
- A new branch named like `agent/20260131-185500-6dfcf628`
- A worktree directory at `../wallyball-agent-6dfcf628`

### 3. Navigate to the worktree
```bash
cd "$WORKTREE_PATH"
```

### 4. Install dependencies (if needed)
```bash
npm install
```

### 5. Start development server (if needed)
```bash
npm run dev
```

## Making Changes

All code changes should now be made in the worktree directory (`$WORKTREE_PATH`), not the main workspace. This ensures complete isolation from other agent threads.

## Cleanup After Work is Complete

### 1. Stop any running processes
Stop the dev server if running in this worktree.

### 2. Commit and push changes
```bash
cd "$WORKTREE_PATH"
git add .
git commit -m "Descriptive commit message"
git push -u origin "$BRANCH_NAME"
```

### 3. Return to main workspace
```bash
cd /Users/keith.schaefer/Documents/GitHub/wallyball-league-dashboard
```

### 4. Remove the worktree
```bash
git worktree remove "$WORKTREE_PATH"
```

### 5. (Optional) Delete the branch after merging
```bash
# After PR is merged, delete the branch
git branch -d "$BRANCH_NAME"
git push origin --delete "$BRANCH_NAME"
```

## Troubleshooting

### Worktree already exists
If the worktree already exists from a previous session:
```bash
# List all worktrees
git worktree list

# Remove stale worktree
git worktree remove <path> --force
```

### Branch already exists
If the branch name already exists:
```bash
# Use a different timestamp or append random suffix
BRANCH_NAME="agent/$(date +%Y%m%d-%H%M%S)-$RANDOM"
```

## Environment Variables Used

- `$CONVERSATION_ID` - The current conversation ID (automatically available in agent context)
- `$BRANCH_NAME` - Generated branch name for this agent thread
- `$WORKTREE_PATH` - Path to the worktree directory
