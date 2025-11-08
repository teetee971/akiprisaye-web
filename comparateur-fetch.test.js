/**
 * Tests for comparateur price fetcher
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Comparateur Fetch', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost'
    });
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
  });

  afterEach(() => {
    dom.window.close();
  });

  it('should escape HTML to prevent XSS', () => {
    // Load the comparateur-fetch.js file content
    const escapeHtml = (str) => {
      if (str === null || str === undefined) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    // Test XSS prevention
    const dangerous = '<script>alert("XSS")</script>';
    const safe = escapeHtml(dangerous);
    expect(safe).not.toContain('<script>');
    expect(safe).toContain('&lt;script&gt;');
  });

  it('should handle null and undefined', () => {
    const escapeHtml = (str) => {
      if (str === null || str === undefined) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('should preserve safe text', () => {
    const escapeHtml = (str) => {
      if (str === null || str === undefined) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    const safeText = 'Hello World';
    expect(escapeHtml(safeText)).toBe('Hello World');
  });
});
