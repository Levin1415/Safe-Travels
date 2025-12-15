# GitHub Setup Instructions

## Step 1: Install Git

If Git is not installed on your system:

### Windows:
1. Download Git from: https://git-scm.com/download/win
2. Run the installer and follow the setup wizard
3. Restart your terminal/PowerShell

### Verify Installation:
```bash
git --version
```

## Step 2: Configure Git (First Time Only)

```bash
git config --global user.name "Levin Thummalapalli"
git config --global user.email "your-email@example.com"
```

## Step 3: Initialize Git Repository

Navigate to your project directory:
```bash
cd C:\Users\panda\Desktop\Safe-Travels
```

Initialize git:
```bash
git init
```

## Step 4: Add All Files

```bash
git add .
```

## Step 5: Create Initial Commit

```bash
git commit -m "Initial commit: Safe Travels booking system with Bus, Train, and Flight support"
```

## Step 6: Create Repository on GitHub

1. Go to https://github.com/Levin1415
2. Click "New repository" or go to https://github.com/new
3. Repository name: `Safe-Travels` (or any name you prefer)
4. Description: "Multi-transport booking system with Razorpay payment integration"
5. Choose Public or Private
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 7: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
git remote add origin https://github.com/Levin1415/Safe-Travels.git
```

(Replace `Safe-Travels` with your actual repository name if different)

## Step 8: Push to GitHub

```bash
git branch -M main
git push -u origin main
```

You'll be prompted for your GitHub username and password (or personal access token).

## Step 9: Set Up Personal Access Token (If Needed)

If password authentication fails:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "Safe-Travels"
4. Select scopes: `repo` (full control of private repositories)
5. Click "Generate token"
6. Copy the token and use it as password when pushing

## Alternative: Using GitHub Desktop

If you prefer a GUI:

1. Download GitHub Desktop: https://desktop.github.com/
2. Sign in with your GitHub account
3. File → Add Local Repository
4. Select your Safe-Travels folder
5. Click "Publish repository"
6. Choose name and visibility
7. Click "Publish repository"

## Troubleshooting

### If you get "remote origin already exists":
```bash
git remote remove origin
git remote add origin https://github.com/Levin1415/Safe-Travels.git
```

### If you need to update existing repository:
```bash
git add .
git commit -m "Update: Added Train and Flight booking support"
git push origin main
```

## Future Updates

To push future changes:

```bash
git add .
git commit -m "Description of changes"
git push origin main
```

