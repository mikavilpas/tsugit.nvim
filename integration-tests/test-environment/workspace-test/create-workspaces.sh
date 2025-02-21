#! /bin/bash

# Initialize a new Git repository
mkdir my-repo && cd my-repo
git init

# Create an initial commit (Git requires a commit before adding worktrees)
echo "Main workspace file" >main.txt
git add main.txt
git commit -m "Initial commit with main.txt"

# Create two branches for the worktrees
git branch workspace1
git branch workspace2

# Create worktrees
mkdir workspaces
git worktree add workspaces/workspace1 workspace1
git worktree add workspaces/workspace2 workspace2

# Add a file to each workspace
echo "This is workspace 1" >workspaces/workspace1/workspace1.txt
echo "This is workspace 2" >workspaces/workspace2/workspace2.txt

# Commit changes in each workspace
(cd workspaces/workspace1 && git add workspace1.txt && git commit -m "Add workspace1.txt")
(cd workspaces/workspace2 && git add workspace2.txt && git commit -m "Add workspace2.txt")

echo "Git repository with two worktrees set up successfully!"
