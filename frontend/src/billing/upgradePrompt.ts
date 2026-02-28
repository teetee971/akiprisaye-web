import { FeatureId } from './plans';

const UPGRADE_PROMPT_EVENT = 'akiprisaye:upgrade-prompt';

export type UpgradePromptDetail = {
  featureId?: FeatureId;
  quotaName?: 'maxItems' | 'refreshPerDay' | 'maxTerritories';
  message?: string;
};

export function emitUpgradePrompt(detail: UpgradePromptDetail) {
  window.dispatchEvent(new CustomEvent(UPGRADE_PROMPT_EVENT, { detail }));
}

export function subscribeUpgradePrompt(callback: (detail: UpgradePromptDetail) => void) {
  const listener = (event: Event) => callback((event as CustomEvent<UpgradePromptDetail>).detail);
  window.addEventListener(UPGRADE_PROMPT_EVENT, listener);
  return () => window.removeEventListener(UPGRADE_PROMPT_EVENT, listener);
}
