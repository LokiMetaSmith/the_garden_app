# 🧪 Testing Guide

This guide covers the comprehensive testing setup for the Garden App, including unit tests, integration tests, and testing best practices.

## 📋 Table of Contents

- [Overview](#overview)
- [Testing Architecture](#testing-architecture)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Garden App uses Jest as the primary testing framework with React Testing Library for component testing. The testing setup includes:

- **Unit Tests**: Testing individual functions and methods
- **Component Tests**: Testing React components in isolation
- **Service Tests**: Testing business logic and external integrations
- **API Tests**: Testing API routes and endpoints
- **Integration Tests**: Testing component interactions

## 🏗️ Testing Architecture

### Test Structure

```
__tests__/
├── components/          # React component tests
│   ├── payment-interface.test.tsx
│   ├── chat-interface.test.tsx
│   └── contractor-dashboard.test.tsx
├── lib/                # Service layer tests
│   ├── stripe-service.test.ts
│   ├── vector-db.test.ts
│   └── payment-service.test.ts
├── api/                # API route tests
│   └── stripe/
│       ├── payment-intent.test.ts
│       └── webhook.test.ts
└── utils/              # Test utilities and helpers
    └── test-utils.tsx
```

### Testing Stack

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers
- **@testing-library/user-event**: User interaction simulation
- **ts-jest**: TypeScript support for Jest

### Configuration Files

- `jest.config.js`: Jest configuration
- `jest.setup.js`: Global test setup and mocks
- `tsconfig.json`: TypeScript configuration for tests

## 🚀 Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI environment
npm run test:ci
```

### Test Runner Script

Use the custom test runner for organized test execution:

```bash
# Run specific test suites
npm run test:runner unit
npm run test:runner components
npm run test:runner services
npm run test:runner api
npm run test:runner stripe

# Run all tests
npm run test:runner all

# Run tests in watch mode
npm run test:runner watch

# Run tests for CI
npm run test:runner ci
```

### Individual Test Suites

```bash
# Run specific test categories
npm run test:unit
npm run test:components
npm run test:services
npm run test:api
npm run test:stripe
```

### Coverage Reports

After running tests with coverage, view the detailed report:

```bash
npm run test:coverage
```

The coverage report will show:
- **Statements**: Percentage of code statements executed
- **Branches**: Percentage of conditional branches executed
- **Functions**: Percentage of functions called
- **Lines**: Percentage of lines executed

## ✍️ Writing Tests

### Test File Naming Convention

- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.ts`
- End-to-end tests: `*.e2e.test.ts`

### Test Structure

```typescript
import { render, screen, fireEvent } from '@tests__/utils/test-utils'
import ComponentName from '@/path/to/component'

describe('ComponentName', () => {
  const defaultProps = {
    // Component props
  }

  beforeEach(() => {
    // Setup before each test
  })

  describe('rendering', () => {
    it('should render correctly', () => {
      render(<ComponentName {...defaultProps} />)
      expect(screen.getByText('Expected Text')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('should handle user interactions', () => {
      render(<ComponentName {...defaultProps} />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(screen.getByText('Result')).toBeInTheDocument()
    })
  })
})
```

### Testing React Components

#### Basic Component Test

```typescript
import { render, screen } from '@tests__/utils/test-utils'
import PaymentInterface from '@/app/components/payment-interface'

describe('PaymentInterface', () => {
  it('should render payment form', () => {
    render(<PaymentInterface projectId="123" customerId="456" />)
    
    expect(screen.getByText('Payment Management')).toBeInTheDocument()
    expect(screen.getByLabelText('Project Amount ($)')).toBeInTheDocument()
  })
})
```

#### Testing User Interactions

```typescript
import { render, screen, fireEvent, waitFor } from '@tests__/utils/test-utils'

it('should handle form submission', async () => {
  render(<PaymentInterface {...props} />)
  
  const amountInput = screen.getByLabelText('Project Amount ($)')
  const submitButton = screen.getByText('Create Payment Intent')
  
  fireEvent.change(amountInput, { target: { value: '1000' } })
  fireEvent.click(submitButton)
  
  await waitFor(() => {
    expect(screen.getByText('Payment intent created')).toBeInTheDocument()
  })
})
```

#### Testing Async Operations

```typescript
it('should handle API calls', async () => {
  const mockService = jest.fn().mockResolvedValue({ success: true })
  
  render(<Component service={mockService} />)
  
  const button = screen.getByText('Submit')
  fireEvent.click(button)
  
  await waitFor(() => {
    expect(mockService).toHaveBeenCalledWith(expectedData)
  })
})
```

### Testing Services

#### Service Layer Test

```typescript
import { StripeService } from '@/lib/stripe-service'

describe('StripeService', () => {
  let stripeService: StripeService

  beforeEach(() => {
    stripeService = new StripeService()
  })

  it('should create payment intent', async () => {
    const result = await stripeService.createCustomerPaymentIntent(
      1000, 'USD', 'customer_123', 'project_456'
    )
    
    expect(result.amount).toBe(1000)
    expect(result.currency).toBe('USD')
  })
})
```

#### Mocking External Dependencies

```typescript
jest.mock('@/lib/stripe-service', () => ({
  stripeService: {
    createCustomerPaymentIntent: jest.fn(),
    captureCustomerPayment: jest.fn(),
  },
}))

const mockStripeService = stripeService as jest.Mocked<typeof stripeService>

beforeEach(() => {
  jest.clearAllMocks()
})
```

### Testing API Routes

#### API Route Test

```typescript
import { POST } from '@/app/api/stripe/payment-intent/route'

describe('Payment Intent API', () => {
  it('should create payment intent', async () => {
    const request = createMockRequest({
      amount: 1000,
      currency: 'USD',
      customerId: 'customer_123',
      projectId: 'project_456'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
```

## 📊 Test Coverage

### Coverage Goals

The project aims for:
- **Statements**: 80% minimum
- **Branches**: 80% minimum
- **Functions**: 80% minimum
- **Lines**: 80% minimum

### Coverage Reports

Generate coverage reports:

```bash
npm run test:coverage
```

View coverage in browser:
```bash
# Coverage report opens automatically
# Or navigate to coverage/lcov-report/index.html
```

### Coverage Configuration

Coverage settings in `jest.config.js`:

```javascript
collectCoverageFrom: [
  'app/**/*.{js,jsx,ts,tsx}',
  'lib/**/*.{js,jsx,ts,tsx}',
  'components/**/*.{js,jsx,ts,tsx}',
  '!**/*.d.ts',
  '!**/node_modules/**',
],
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
},
```

## 🎯 Best Practices

### Test Organization

1. **Group related tests** using `describe` blocks
2. **Use descriptive test names** that explain the expected behavior
3. **Follow the AAA pattern**: Arrange, Act, Assert
4. **Keep tests focused** on a single piece of functionality

### Test Data Management

1. **Use mock data** from `test-utils.tsx`
2. **Create realistic test scenarios**
3. **Avoid hardcoded values** in tests
4. **Use factories** for complex test data

### Mocking Strategy

1. **Mock external dependencies** (APIs, services)
2. **Use jest.fn()** for simple mocks
3. **Create mock implementations** for complex services
4. **Reset mocks** between tests

### Async Testing

1. **Use `waitFor`** for asynchronous operations
2. **Handle promises correctly** in tests
3. **Test error scenarios** for async operations
4. **Use proper cleanup** for async tests

### Component Testing

1. **Test user interactions** not implementation details
2. **Use accessible queries** (getByRole, getByLabelText)
3. **Test component integration** with services
4. **Verify side effects** of user actions

## 🔧 Troubleshooting

### Common Issues

#### Test Environment Setup

```bash
# Clear Jest cache
npx jest --clearCache

# Reset node_modules
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors

```bash
# Check TypeScript configuration
npx tsc --noEmit

# Verify Jest TypeScript setup
npx jest --showConfig
```

#### Mock Issues

```bash
# Clear all mocks
jest.clearAllMocks()

# Reset mock implementations
jest.resetAllMocks()
```

#### Coverage Issues

```bash
# Force coverage collection
npx jest --coverage --forceExit

# Check coverage configuration
npx jest --showConfig | grep coverage
```

### Debug Mode

Enable Jest debug mode:

```bash
# Run tests with debug output
DEBUG=jest:* npm test

# Run specific test with debug
DEBUG=jest:* npm test -- --testNamePattern="ComponentName"
```

### Performance Issues

```bash
# Run tests with performance monitoring
npm test -- --verbose --detectOpenHandles

# Check for memory leaks
npm test -- --runInBand --logHeapUsage
```

## 📚 Additional Resources

### Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)

### Examples

- See existing test files in `__tests__/` directory
- Check `test-utils.tsx` for common testing patterns
- Review component tests for UI testing examples

### Tools

- **Jest Inspector**: Debug tests in VS Code
- **Coverage Badges**: Generate coverage status badges
- **Test Watchers**: Monitor test files for changes

## 🚀 Continuous Integration

### CI Configuration

Tests run automatically in CI:

```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: npm run test:ci
```

### Pre-commit Hooks

Consider adding pre-commit hooks:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:unit"
    }
  }
}
```

---

**Happy Testing! 🧪✨**

For questions or issues, check the project's issue tracker or documentation.

