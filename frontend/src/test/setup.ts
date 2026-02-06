// src/test/setup.ts

/**
 * Global test setup for Vitest
 * - Compatible Vitest v4
 * - Compatible React Testing Library
 * - No globals
 * - No fake timers
 */

import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});