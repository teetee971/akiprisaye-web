#!/bin/bash
# Script to push merge resolution commits for PR #838

set -e  # Exit on error

echo "======================================"
echo "PR #838 Merge Resolution - Push Script"
echo "======================================"
echo

# Check current directory
if [ ! -d ".git" ]; then
    echo "Error: Must run from repository root"
    exit 1
fi

echo "Step 1: Checking out the PR branch..."
git checkout copilot/implement-auto-update-system

echo
echo "Step 2: Verifying local commits..."
LOCAL_HEAD=$(git rev-parse HEAD)
echo "Local HEAD: $LOCAL_HEAD"

EXPECTED_HEAD="47d55d1"
if [[ $LOCAL_HEAD == ${EXPECTED_HEAD}* ]]; then
    echo "✅ Local HEAD matches expected commit"
else
    echo "⚠️ Warning: Local HEAD does not match expected commit"
    echo "Expected: ${EXPECTED_HEAD}"
    echo "Got: ${LOCAL_HEAD:0:7}"
fi

echo
echo "Step 3: Showing commits to be pushed..."
git log --oneline origin/copilot/implement-auto-update-system..HEAD 2>/dev/null || {
    echo "Cannot compare with remote (may not exist yet)"
    echo "Local commits:"
    git log --oneline -5
}

echo
echo "Step 4: Pushing to GitHub..."
echo "Running: git push origin copilot/implement-auto-update-system"
echo

# Attempt push
if git push origin copilot/implement-auto-update-system; then
    echo
    echo "======================================"
    echo "✅ SUCCESS!"
    echo "======================================"
    echo
    echo "Commits have been pushed to GitHub."
    echo "PR #838 should now be mergeable."
    echo
    echo "Next steps:"
    echo "1. Check PR #838 on GitHub"
    echo "2. Verify mergeable status"
    echo "3. Review and merge if ready"
else
    echo
    echo "======================================"
    echo "❌ PUSH FAILED"
    echo "======================================"
    echo
    echo "Possible reasons:"
    echo "1. No push access to the repository"
    echo "2. Authentication not configured"
    echo "3. Branch protection rules"
    echo
    echo "Manual push required:"
    echo "  git push origin copilot/implement-auto-update-system"
    exit 1
fi
