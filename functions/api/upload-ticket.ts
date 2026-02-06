import { Router, Request, Response } from 'express';
import multer from 'multer';

// Router dédié
const router = Router();

// Stockage temporaire en mémoire (sécurisé)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB max
  }
});

/**
 * POST /api/upload-ticket
 * Réception d’un ticket citoyen (photo)
 */
router.post(
  '/',
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      const { store, date, territory } = req.body;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'Aucun fichier reçu'
        });
      }

      const ticket = {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        store: store || null,
        date: date || null,
        territory: territory || null,
        receivedAt: new Date().toISOString(),
        status: 'received',
        source: 'citizen_upload'
      };

      // 🔒 Pour l’instant : pas de stockage permanent
      // (étape suivante : Firebase Storage / R2)
      console.log('📥 Ticket citoyen reçu :', ticket);

      return res.json({
        success: true,
        message: 'Ticket reçu avec succès',
        ticket
      });

    } catch (error) {
      console.error('Erreur upload-ticket:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de l’upload'
      });
    }
  }
);

export default router;