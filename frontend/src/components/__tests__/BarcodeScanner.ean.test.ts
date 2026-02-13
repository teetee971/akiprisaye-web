import { isAcceptedEanCode, normalizeDetectedCode } from '../../utils/eanScan';

// Typecheck guard file kept in TS so strict CI scripts can lint/typecheck changed paths.
const normalized = normalizeDetectedCode(' 3292 0900 0001 6 ');
const accepted = isAcceptedEanCode(normalized);

void accepted;
