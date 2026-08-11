module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm --filter @ceasaminas/portal exec next start -p 3100',
      startServerReadyPattern: 'Ready',
      startServerReadyTimeout: 120000,
      url: [
        'http://localhost:3100/',
        'http://localhost:3100/institucional',
        'http://localhost:3100/contato',
      ],
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--headless --no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
