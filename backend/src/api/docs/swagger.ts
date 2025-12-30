/**
 * Configuration Swagger / OpenAPI 3.0
 *
 * Documentation interactive de l'API
 * Accessible via GET /api/docs
 *
 * Inclut:
 * - Tous les endpoints
 * - Schémas de données
 * - Sécurité JWT
 * - Exemples de requêtes/réponses
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'A KI PRI SA YÉ - API Backend',
      version: '2.0.0',
      description: `
Backend institutionnel pour la gestion des entités juridiques françaises.

## Conformité
- **RGPD**: Règlement (UE) 2016/679
- **SIREN**: Décret n°82-130 du 9 février 1982
- **SIRET**: Article R123-220 du Code de commerce

## Authentification
Utilise JWT (JSON Web Tokens):
- **Access Token**: Courte durée (15 min)
- **Refresh Token**: Longue durée (7 jours)

Pour utiliser les endpoints protégés:
1. POST /api/auth/login pour obtenir les tokens
2. Utiliser le access token dans le header: \`Authorization: Bearer <token>\`
3. POST /api/auth/refresh pour renouveler le token expiré

## Rate Limiting
- Endpoints auth: 5 tentatives / 15 min
- Création ressources: 20 / heure
- API générale: 100 requêtes / 15 min
      `,
      contact: {
        name: 'Support A KI PRI SA YÉ',
        email: 'dpo@akiprisaye.app',
      },
      license: {
        name: 'Propriétaire',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Développement local',
      },
      {
        url: 'https://api.akiprisaye.app',
        description: 'Production',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token JWT obtenu via /api/auth/login',
        },
      },
      schemas: {
        // Schéma User
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Identifiant unique',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email de l\'utilisateur',
            },
            name: {
              type: 'string',
              description: 'Nom complet',
            },
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN', 'SUPER_ADMIN'],
              description: 'Rôle utilisateur',
            },
            isActive: {
              type: 'boolean',
              description: 'Compte actif',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création',
            },
          },
        },
        // Schéma LegalEntity
        LegalEntity: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Identifiant unique',
            },
            siren: {
              type: 'string',
              pattern: '^[0-9]{9}$',
              description: 'Numéro SIREN (9 chiffres)',
              example: '123456782',
            },
            siret: {
              type: 'string',
              pattern: '^[0-9]{14}$',
              description: 'Numéro SIRET (14 chiffres)',
              example: '12345678200002',
            },
            name: {
              type: 'string',
              maxLength: 255,
              description: 'Raison sociale',
              example: 'Entreprise Exemple SARL',
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'CEASED'],
              description: 'Statut de l\'entreprise',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de mise à jour',
            },
          },
          required: ['siren', 'siret', 'name'],
        },
        // Schéma d'erreur
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Type d\'erreur',
            },
            message: {
              type: 'string',
              description: 'Message détaillé',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Horodatage de l\'erreur',
            },
          },
        },
        // Schéma de validation error
        ValidationError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Erreur de validation',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Non autorisé - Token manquant ou invalide',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Non autorisé',
                message: 'Access token invalide',
                timestamp: '2024-12-19T00:00:00.000Z',
              },
            },
          },
        },
        ValidationError: {
          description: 'Erreur de validation',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        RateLimitError: {
          description: 'Trop de requêtes - Rate limit dépassé',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints d\'authentification JWT',
      },
      {
        name: 'Legal Entities',
        description: 'Gestion des entités juridiques (SIREN/SIRET)',
      },
    ],
  },
  apis: ['./src/api/routes/*.ts', './src/api/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Configure Swagger UI dans l'application Express
 *
 * @param app - Application Express
 */
export function setupSwagger(app: Express): void {
  // Endpoint pour le JSON OpenAPI
  app.get('/api/docs/json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Interface Swagger UI
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'A KI PRI SA YÉ - API Documentation',
    })
  );

  console.info('📘 Swagger documentation disponible sur /api/docs');
}

export default swaggerSpec;
