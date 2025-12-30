# Merge Queue Setup

This repository uses the [autifyhq/merge-queue-action](https://github.com/autifyhq/merge-queue-action) to automatically and safely merge pull requests in a queued, sequential manner.

## Required Repository Labels

The following labels must be created in the GitHub repository for the merge queue to function properly:

1. **`command:queue-for-merging`** - Add this label to a PR to queue it for merging
2. **`bot:merging`** - Automatically added to the PR currently being merged
3. **`bot:queued`** - Automatically added to PRs waiting in the queue

## How to Create Labels

Repository administrators can create these labels via:

### Using GitHub UI:
1. Go to `https://github.com/teetee971/akiprisaye-web/labels`
2. Click "New label"
3. Create each of the three labels above with appropriate colors

### Using GitHub CLI:
```bash
gh label create "command:queue-for-merging" --description "Add this PR to queue for merging" --color "0E8A16"
gh label create "bot:merging" --description "This PR is currently being merged" --color "FFA500"
gh label create "bot:queued" --description "This PR is queued for merging" --color "FBCA04"
```

## How to Use

1. **Queue a PR for merging**: Add the `command:queue-for-merging` label to your pull request
   - If no PR is currently being merged, your PR will immediately get the `bot:merging` label
   - If another PR is being merged, your PR will get the `bot:queued` label

2. **The action will automatically**:
   - Merge the PR if it's up-to-date with the base branch and passes all required checks
   - Update the PR if it's not up-to-date
   - Move to the next PR in the queue if the current one fails checks

## Workflow Configuration

The merge queue workflow is defined in `.github/workflows/merge-queue.yml` and triggers on:
- `status` events (when CI checks complete)
- `pull_request` events with type `labeled`

## Requirements

- The `GITHUB_TOKEN` secret is automatically provided by GitHub Actions
- Base branch must have required status checks configured
- PRs must pass all required checks before they can be merged

## Limitations

- Currently supports required checks from CircleCI
- Only works with base branches that have required checks configured

## Troubleshooting

If a PR is stuck in the queue:
1. Verify all required checks are passing
2. Ensure the PR is up-to-date with the base branch
3. Check that the required labels exist in the repository
4. Review the workflow run logs in the Actions tab
