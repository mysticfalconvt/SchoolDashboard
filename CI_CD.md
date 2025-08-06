# CI/CD Setup

This project uses GitHub Actions for continuous integration and deployment.

## Workflows

### Tests (`/.github/workflows/test.yml`)

Runs on:
- Push to `main` or `master` branch
- Pull requests to `main` or `master` branch

**Jobs:**

1. **Test** (runs on Node.js 18.x and 20.x)
   - Installs dependencies with `npm ci`
   - Runs tests with `npm run test:ci`
   - Uploads coverage reports to Codecov
   - Matrix strategy tests compatibility across Node versions

2. **Type Check** (runs on Node.js 20.x)
   - Installs dependencies with `npm ci`
   - Runs TypeScript type checking with `npm run type-check`
   - Ensures type safety across the codebase

## Status Badges

Add these badges to your README.md:

```markdown
![Tests](https://github.com/{owner}/{repo}/workflows/Tests/badge.svg)
![Type Check](https://github.com/{owner}/{repo}/workflows/Tests/badge.svg?job=type-check)
```

## Coverage Reports

Coverage reports are automatically uploaded to Codecov on each test run. You can view detailed coverage reports at:
- https://codecov.io/gh/{owner}/{repo}

## Local Development

### Running Tests Locally

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode (same as GitHub Actions)
npm run test:ci
```

### Type Checking

```bash
# Run TypeScript type check
npm run type-check
```

### Linting (when configured)

```bash
# Run ESLint
npm run lint

# Run ESLint with auto-fix
npm run lint:fix
```

## Workflow Triggers

The test workflow is triggered by:

1. **Push Events**: Any push to `main` or `master` branch
2. **Pull Request Events**: Any PR targeting `main` or `master` branch

## Required Status Checks

To enable required status checks for your repository:

1. Go to your repository settings
2. Navigate to "Branches"
3. Add a branch protection rule for `main`/`master`
4. Enable "Require status checks to pass before merging"
5. Select the following status checks:
   - `Tests / test (18.x)`
   - `Tests / test (20.x)`
   - `Tests / type-check`

## Troubleshooting

### Common Issues

1. **Tests failing in CI but passing locally**
   - Check Node.js version differences
   - Ensure all dependencies are properly installed
   - Verify environment variables are set correctly

2. **Type checking failing**
   - Run `npm run type-check` locally to see errors
   - Fix TypeScript errors before pushing

3. **Coverage upload failing**
   - This is non-blocking (fail_ci_if_error: false)
   - Check Codecov configuration
   - Verify coverage files are generated

### Debugging

To debug workflow issues:

1. Check the "Actions" tab in your GitHub repository
2. Click on the failing workflow run
3. Examine the logs for each step
4. Use the "Re-run jobs" feature to retry failed jobs

## Adding New Workflows

To add new workflows:

1. Create a new `.yml` file in `.github/workflows/`
2. Follow the GitHub Actions syntax
3. Test locally with `act` if needed
4. Push to trigger the workflow

## Environment Variables

If your tests require environment variables:

1. Go to repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Add repository secrets
4. Reference them in workflows with `${{ secrets.SECRET_NAME }}`

## Performance Optimization

- Uses `npm ci` for faster, reliable installs
- Caches Node.js dependencies
- Runs jobs in parallel where possible
- Uses matrix strategy for Node.js version testing 
