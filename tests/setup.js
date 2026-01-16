// Jest setup file for backend tests
// This file is required by jest.config.js

// Set up any global test configuration here
global.console = {
  ...console,
  // Suppress console.log during tests unless needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};