# Branch Protection Setup

This document explains how to set up branch protection rules to ensure tests pass before merging into main.

## 🛡️ **Branch Protection Rules**

### **Step 1: Enable Branch Protection**

1. Go to your GitHub repository
2. Click **Settings** → **Branches**
3. Click **"Add rule"** or **"Add branch protection rule"**
4. In **"Branch name pattern"**, enter: `main`
5. Check the following options:

### **Step 2: Configure Protection Settings**

✅ **Require a pull request before merging**
- Check "Require a pull request before merging"
- Check "Require approvals" (set to 1 or more)
- Check "Dismiss stale PR approvals when new commits are pushed"

✅ **Require status checks to pass before merging**
- Check "Require status checks to pass before merging"
- Check "Require branches to be up to date before merging"
- Add the following status checks:
  - `Tests / test (18.x)`
  - `Tests / test (20.x)`
  - `Tests / type-check`

✅ **Additional Settings**
- Check "Restrict pushes that create files"
- Check "Restrict pushes that delete files"
- Check "Restrict pushes that force push"
- Check "Restrict pushes that update the base branch"

### **Step 3: Save the Rule**

Click **"Create"** or **"Save changes"**

## 🔄 **How It Works**

### **On Any Branch Push**
- ✅ Tests run automatically
- ✅ Type checking runs automatically
- ✅ Coverage reports are generated
- ✅ Status checks appear in PR

### **On Pull Request to Main**
- ✅ All status checks must pass
- ✅ PR must be up to date with main
- ✅ Required number of approvals needed
- ✅ Cannot merge until all checks pass

### **On Direct Push to Main**
- ✅ Tests run automatically
- ✅ Deployment runs (if configured)
- ✅ Code is protected from direct pushes

## 📊 **Status Checks**

The following status checks will appear:

1. **`Tests / test (18.x)`** - Tests on Node.js 18
2. **`Tests / test (20.x)`** - Tests on Node.js 20  
3. **`Tests / type-check`** - TypeScript type checking

## 🚨 **Troubleshooting**

### **If Status Checks Don't Appear**
1. Make sure the workflow files are in `.github/workflows/`
2. Check that Actions are enabled in repository settings
3. Verify the workflow syntax is correct
4. Check the Actions tab for any errors

### **If Tests Fail**
1. Run tests locally: `npm run test:ci`
2. Check the Actions logs for specific errors
3. Fix the issues and push again
4. The status checks will update automatically

### **If Type Checking Fails**
1. Run type check locally: `npm run type-check`
2. Fix TypeScript errors
3. Push the fixes
4. Status checks will update

## 🔧 **Local Testing**

Before pushing, you can test locally:

```bash
# Run the same tests as CI
npm run test:ci

# Run type checking
npm run type-check

# Run both (simulate CI)
npm run test:ci && npm run type-check
```

## 📈 **Benefits**

- ✅ **Prevents broken code** from reaching main
- ✅ **Ensures code quality** with automated checks
- ✅ **Provides feedback** on every PR
- ✅ **Maintains consistency** across the team
- ✅ **Automates deployment** when tests pass

## 🎯 **Next Steps**

1. **Set up branch protection** using the steps above
2. **Create a PR** from your current branch to main
3. **Verify status checks** appear and pass
4. **Merge only when** all checks pass
5. **Configure deployment** when ready 