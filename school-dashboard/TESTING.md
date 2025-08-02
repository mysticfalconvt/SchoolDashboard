# Testing Setup and Guidelines

This project uses Jest and React Testing Library for testing React components and hooks.

## Setup

The testing infrastructure has been set up with the following:

- **Jest**: Test runner and assertion library
- **React Testing Library**: Utilities for testing React components
- **@testing-library/jest-dom**: Custom Jest matchers for DOM testing
- **@testing-library/user-event**: Utilities for simulating user interactions
- **jest-environment-jsdom**: DOM environment for Jest

## Configuration Files

- `jest.config.js`: Jest configuration with Next.js integration
- `jest.setup.js`: Global test setup and mocks
- `lib/test-utils.tsx`: Common testing utilities and helpers

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci

# Run specific test file
npm test -- path/to/test/file.test.ts
```

## Test File Structure

Tests should be placed in `__tests__` directories next to the components they test:

```
components/
  PBIS/
    __tests__/
      useV3PbisCollection.test.ts
      pbisLogic.test.ts
    useV3PbisCollection.ts
```

## Writing Tests

### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react'

describe('useMyHook', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useMyHook())
    
    expect(result.current.value).toBe(defaultValue)
  })

  it('should update state when action is called', () => {
    const { result } = renderHook(() => useMyHook())
    
    act(() => {
      result.current.updateValue('new value')
    })
    
    expect(result.current.value).toBe('new value')
  })
})
```

### Testing Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should handle user interactions', () => {
    render(<MyComponent />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(screen.getByText('Clicked!')).toBeInTheDocument()
  })
})
```

### Mocking

#### Mocking Modules

```typescript
// Mock at the top of the test file
jest.mock('graphql-request', () => ({
  GraphQLClient: jest.fn().mockImplementation(() => ({
    request: jest.fn(),
  })),
}))
```

#### Mocking Hooks

```typescript
jest.mock('../../../lib/useGqlQuery', () => ({
  useGQLQuery: jest.fn(),
}))

const mockUseGQLQuery = require('../../../lib/useGqlQuery').useGQLQuery
```

## Test Utilities

The `lib/test-utils.tsx` file provides common testing utilities:

- `render`: Custom render function with providers
- `mockUser`, `mockStudent`, `mockTeacher`: Common test data
- `createMockGraphQLResponse`, `createMockGraphQLError`: GraphQL mock helpers

## Coverage

The project is configured to collect coverage from:
- `components/**/*.{js,jsx,ts,tsx}`
- `lib/**/*.{js,jsx,ts,tsx}`
- `pages/**/*.{js,jsx,ts,tsx}`

Coverage thresholds are set to 70% for branches, functions, lines, and statements.

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how it does it
2. **Use Semantic Queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Test User Interactions**: Test how users interact with your components
4. **Mock External Dependencies**: Mock GraphQL, API calls, and external services
5. **Keep Tests Simple**: Each test should have a single responsibility
6. **Use Descriptive Test Names**: Test names should clearly describe what is being tested

## Example Test Files

### Logic Tests (`pbisLogic.test.ts`)
Tests for pure functions and business logic without React dependencies.

### Hook Tests (`useV3PbisCollection.test.ts`)
Tests for custom React hooks using `renderHook`.

### Component Tests
Tests for React components using `render` and user interaction utilities.

## Troubleshooting

### Module Resolution Issues
If you encounter module resolution issues:
1. Check that the module is properly installed
2. Ensure mocks are defined before imports
3. Use `jest.mock()` at the top of test files

### GraphQL Testing
For GraphQL operations:
1. Mock the GraphQL client
2. Mock the query hooks
3. Test the expected data transformations

### Async Testing
For async operations:
1. Use `waitFor` for async assertions
2. Use `act` for state updates
3. Mock promises appropriately 
