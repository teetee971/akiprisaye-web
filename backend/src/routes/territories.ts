/**
 * GET /api/territories
 *
 * Returns the list of DROM-COM territories supported by the platform,
 * with display metadata (name, flag, code).
 *
 * No auth required — public endpoint.
 */

import { Router, Request, Response } from 'express';

const router = Router();

const TERRITORIES = [
  { code: 'GP', name: 'Guadeloupe',           flag: '🇬🇵', active: true  },
  { code: 'MQ', name: 'Martinique',            flag: '🇲🇶', active: true  },
  { code: 'GF', name: 'Guyane',                flag: '🇬🇫', active: true  },
  { code: 'RE', name: 'La Réunion',            flag: '🇷🇪', active: true  },
  { code: 'YT', name: 'Mayotte',               flag: '🇾🇹', active: true  },
  { code: 'PM', name: 'Saint-Pierre-et-Miquelon', flag: '🇵🇲', active: false },
  { code: 'BL', name: 'Saint-Barthélemy',      flag: '🇧🇱', active: false },
  { code: 'MF', name: 'Saint-Martin',          flag: '🇲🇫', active: false },
  { code: 'NC', name: 'Nouvelle-Calédonie',    flag: '🇳🇨', active: false },
  { code: 'PF', name: 'Polynésie française',   flag: '🇵🇫', active: false },
  { code: 'WF', name: 'Wallis-et-Futuna',      flag: '🇼🇫', active: false },
];

router.get('/', (_req: Request, res: Response) => {
  res.json({ territories: TERRITORIES });
});

export default router;
