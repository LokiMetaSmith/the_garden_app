#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const testCommands = {
  'unit': 'jest --testPathPattern="__tests__/.*\\.test\\." --coverage',
  'integration': 'jest --testPathPattern="__tests__/.*\\.integration\\." --coverage',
  'e2e': 'jest --testPathPattern="__tests__/.*\\.e2e\\." --coverage',
  'all': 'jest --coverage',
  'watch': 'jest --watch',
  'ci': 'jest --ci --coverage --watchAll=false --maxWorkers=2'
};

const testSuites = {
  'stripe': 'jest --testPathPattern="stripe" --coverage',
  'components': 'jest --testPathPattern="components" --coverage',
  'services': 'jest --testPathPattern="lib" --coverage',
  'api': 'jest --testPathPattern="api" --coverage'
};

function runTests(command) {
  try {
    console.log(`🚀 Running tests: ${command}`);
    console.log('='.repeat(50));
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('='.repeat(50));
    console.log('✅ Tests completed successfully!');
  } catch (error) {
    console.error('❌ Tests failed!');
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🧪 Garden App Test Runner

Usage: npm run test:runner [command]

Commands:
  unit        Run unit tests only
  integration Run integration tests only
  e2e         Run end-to-end tests only
  all         Run all tests
  watch       Run tests in watch mode
  ci          Run tests for CI environment

Test Suites:
  stripe      Run Stripe-related tests
  components  Run React component tests
  services    Run service layer tests
  api         Run API route tests

Examples:
  npm run test:runner unit
  npm run test:runner stripe
  npm run test:runner watch
  `);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  if (testCommands[command]) {
    runTests(testCommands[command]);
  } else if (testSuites[command]) {
    runTests(testSuites[command]);
  } else {
    console.error(`❌ Unknown command: ${command}`);
    console.log('Use --help to see available commands');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runTests, testCommands, testSuites };
