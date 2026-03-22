/**
 * Legacy Action Mapper
 * Maps old action names to the canonical PointAction enum values.
 * Use this when integrating legacy code that still sends deprecated action names.
 */

import { PointAction } from '@prisma/client';

export type LegacyAction =
  | 'LEVEL_UP'
  | 'BADGE_UNLOCKED'
  | 'SUBMIT_PRICE'
  | 'VERIFY_PRICE';

export function mapToPointAction(a: LegacyAction): PointAction {
  switch (a) {
    case 'LEVEL_UP':
      return PointAction.LEVEL_UP;
    case 'BADGE_UNLOCKED':
      return PointAction.BADGE_EARNED;
    case 'SUBMIT_PRICE':
      return PointAction.PRICE_REPORT;
    case 'VERIFY_PRICE':
      return PointAction.PRICE_VERIFY;
  }
}
