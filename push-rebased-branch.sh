#!/bin/bash
# Script to push the rebased branch to GitHub
# Run this script from the repository root

set -e

echo "🚀 Pushing rebased interactive map branch..."
echo ""

# Check if we're in the right directory
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check if the branch exists
if ! git show-ref --verify --quiet refs/heads/copilot/add-interactive-store-map-rebased; then
    echo "❌ Error: Branch copilot/add-interactive-store-map-rebased not found"
    exit 1
fi

# Checkout the branch
echo "📍 Checking out copilot/add-interactive-store-map-rebased..."
git checkout copilot/add-interactive-store-map-rebased

# Show the commits
echo ""
echo "📝 Commits to be pushed:"
git log --oneline main..HEAD
echo ""

# Show the summary
echo "📊 Changes summary:"
git diff main --stat | tail -5
echo ""

# Ask for confirmation
read -p "Do you want to push this branch to origin? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Pushing branch..."
    
    # Try to push
    if git push origin copilot/add-interactive-store-map-rebased --force-with-lease; then
        echo ""
        echo "✅ Branch pushed successfully!"
        echo ""
        echo "📋 Next steps:"
        echo "1. Go to GitHub: https://github.com/teetee971/akiprisaye-web"
        echo "2. Create a new PR or update PR #841"
        echo "3. Use the title: 'Add interactive store map with price visualization'"
        echo "4. Reference the rebase summary in REBASE_SUMMARY_PR841.md"
        echo ""
        echo "🔗 Direct PR link:"
        echo "   https://github.com/teetee971/akiprisaye-web/compare/main...copilot/add-interactive-store-map-rebased"
    else
        echo ""
        echo "❌ Push failed. Possible reasons:"
        echo "   - Git credentials not configured"
        echo "   - No permission to push to the repository"
        echo "   - Network issues"
        echo ""
        echo "💡 Try one of these alternatives:"
        echo ""
        echo "   Option 1: Configure git credentials"
        echo "   $ git config --global credential.helper store"
        echo "   $ git push origin copilot/add-interactive-store-map-rebased --force-with-lease"
        echo ""
        echo "   Option 2: Use GitHub CLI"
        echo "   $ gh auth login"
        echo "   $ git push origin copilot/add-interactive-store-map-rebased --force-with-lease"
        echo ""
        echo "   Option 3: Use the patch files"
        echo "   $ cd /path/to/clean/repo"
        echo "   $ git checkout main"
        echo "   $ git pull"
        echo "   $ git checkout -b copilot/add-interactive-store-map-rebased"
        echo "   $ git am /tmp/interactive-map-patches/*.patch"
        echo "   $ git push origin copilot/add-interactive-store-map-rebased"
        exit 1
    fi
else
    echo "❌ Push cancelled"
    exit 0
fi
