import { expect, Page } from '@playwright/test';

type GateOptions = {
  allowConsoleWarnings?: boolean;
};

type RuntimeIssue = {
  source: 'console' | 'pageerror' | 'requestfailed' | 'response';
  message: string;
};

export function createConsoleGate(page: Page, options: GateOptions = {}) {
  const issues: RuntimeIssue[] = [];
  const allowConsoleWarnings = options.allowConsoleWarnings ?? true;

  page.on('console', (msg) => {
    if (msg.type() === 'error' || (!allowConsoleWarnings && msg.type() === 'warning')) {
      issues.push({
        source: 'console',
        message: msg.text(),
      });
    }
  });

  page.on('pageerror', (error) => {
    issues.push({
      source: 'pageerror',
      message: error.message,
    });
  });

  page.on('requestfailed', (request) => {
    const isCriticalResource = ['document', 'script', 'xhr', 'fetch'].includes(request.resourceType());
    if (isCriticalResource) {
      issues.push({
        source: 'requestfailed',
        message: `${request.method()} ${request.url()} => ${request.failure()?.errorText ?? 'request failed'}`,
      });
    }
  });

  page.on('response', (response) => {
    const request = response.request();
    const url = response.url();
    const isLocal = url.startsWith('http://127.0.0.1') || url.startsWith('http://localhost');
    const isCriticalCall = ['document', 'xhr', 'fetch'].includes(request.resourceType());
    if (isLocal && isCriticalCall && response.status() >= 500) {
      issues.push({
        source: 'response',
        message: `${request.method()} ${url} => HTTP ${response.status()}`,
      });
    }
  });

  return {
    expectClean: () => {
      const summary = issues.map((issue) => `- [${issue.source}] ${issue.message}`).join('\n');
      expect(
        issues,
        summary ? `Runtime errors detected:\n${summary}` : 'Runtime should not emit critical errors.',
      ).toHaveLength(0);
    },
  };
}
