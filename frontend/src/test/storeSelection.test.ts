import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearSelection,
  getSelection,
  LEGACY_STORE_SELECTION_KEY,
  setSelection,
  STORE_SELECTION_KEY,
} from '../modules/store/storeSelection';

const sample = {
  storeId: 'gp-leclerc-bas-du-fort',
  territory: 'gp',
  serviceMode: 'drive' as const,
  updatedAt: '2026-02-14T10:00:00.000Z',
};

describe('storeSelection storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when empty', () => {
    expect(getSelection()).toBeNull();
  });

  it('setSelection/getSelection round-trip', () => {
    setSelection(sample);
    expect(getSelection()).toEqual(sample);
  });

  it('clearSelection removes value', () => {
    setSelection(sample);
    clearSelection();
    expect(getSelection()).toBeNull();
  });

  it('migrates legacy key to v1', () => {
    localStorage.setItem(LEGACY_STORE_SELECTION_KEY, JSON.stringify(sample));
    expect(getSelection()).toEqual(sample);
    expect(localStorage.getItem(STORE_SELECTION_KEY)).toEqual(JSON.stringify(sample));
    expect(localStorage.getItem(LEGACY_STORE_SELECTION_KEY)).toBeNull();
  });
});
