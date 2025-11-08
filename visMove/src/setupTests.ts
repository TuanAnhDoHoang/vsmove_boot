import '@testing-library/jest-dom';

// Mock environment variables
process.env.NEXT_PUBLIC_PACKAGE_ID = '0x123456789abcdef';
process.env.NEXT_PUBLIC_REGISTRY_ID = '0xabcdef123456789';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/'
  })
}));

// Mock Sui wallet adapter
jest.mock('@mysten/dapp-kit', () => ({
  useCurrentAccount: jest.fn(),
  useSignAndExecuteTransaction: jest.fn(),
  useSuiClient: jest.fn(),
  ConnectButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>
}));

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});