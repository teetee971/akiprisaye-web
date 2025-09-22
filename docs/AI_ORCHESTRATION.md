# 🤖 Orchestrateur d'IA - Documentation Technique

## Vue d'ensemble

Le système d'orchestration d'IA d'A KI PRI SA YÉ permet à l'intelligence artificielle principale de la plateforme de créer, intégrer et orchestrer dynamiquement d'autres instances IA en fonction des besoins détectés.

## Architecture

### Composants Principaux

#### 1. AIOrchestrationEngine (`src/services/aiOrchestration.js`)
- **Rôle** : Moteur principal de l'orchestration
- **Responsabilités** :
  - Déploiement autonome d'IA spécialisées
  - Détection des besoins en temps réel
  - Gestion du cycle de vie des instances IA
  - Communication inter-IA
  - Sécurité et gouvernance

#### 2. AIOrchestrationDashboard (`src/components/AIOrchestrationDashboard.jsx`)
- **Rôle** : Interface utilisateur de monitoring et contrôle
- **Fonctionnalités** :
  - Visualisation des IA actives
  - Contrôles utilisateur pour l'auto-déploiement
  - Statistiques et métriques en temps réel
  - Gestion manuelle des instances

### Base de Données (Firestore)

#### Collections :
- `ai_instances` : Instances IA déployées
- `ai_messages` : Communication entre IA
- `ai_operations_log` : Audit et journalisation

## Fonctionnalités

### 1. Déploiement Autonome
```javascript
// Exemple de déploiement d'IA spécialisée
const aiSpec = {
  type: 'analyzer',
  specialization: 'shrinkflation_analysis',
  territory: 'DOM-TOM',
  capabilities: ['package_size_analysis', 'price_per_unit_tracking'],
  config: { alertThreshold: 0.15 }
};

await aiOrchestrator.deployAI(aiSpec);
```

### 2. Détection des Besoins
Le système analyse en continu :
- **Charge CPU** des analyses de prix
- **Événements de shrinkflation** détectés
- **Besoins territoriaux** spécifiques (DOM-TOM/Métropole)
- **Optimisations** possibles

### 3. Communication Inter-IA
```javascript
// Envoi de message à une IA spécifique
await aiOrchestrator.sendMessageToAI(aiId, {
  action: 'analyze_price_trend',
  data: { productId: '12345', territory: 'Guadeloupe' }
});

// Diffusion à toutes les IA
await aiOrchestrator.broadcastToAllAIs({
  alert: 'new_regulation_detected',
  territory: 'DOM-TOM'
});
```

### 4. Sécurité et Gouvernance

#### Contrôles de Sécurité :
- **Validation des déploiements** : Vérification des spécifications
- **Limites de ressources** : Nombre max d'instances
- **Contraintes territoriales** : Respect des périmètres géographiques
- **Détection de conflits** : Éviter les doublons

#### Niveaux de Sécurité :
- **Faible** : Validation minimale
- **Moyen** : Validation standard + contraintes territoriales
- **Élevé** : Validation complète + audit renforcé

### 5. Monitoring et Health Checks
- **Vérification périodique** de la santé des IA (30s)
- **Optimisation automatique** des ressources (5min)
- **Analyse des besoins** pour nouvelles IA (10min)

## Types d'IA Déployables

### 1. Analyseurs (`analyzer`)
- **price_analysis** : Analyse des prix et tendances
- **market_analysis** : Analyse de marché territoriale
- **trend_analysis** : Détection de tendances

### 2. Détecteurs (`detector`)
- **shrinkflation_analysis** : Détection de shrinkflation
- **anomaly_detection** : Détection d'anomalies de prix
- **fraud_detection** : Détection de pratiques abusives

### 3. Spécialistes Territoriaux (`territorial_specialist`)
- **dom-tom_specialist** : Spécialiste DOM-TOM
- **métropole_specialist** : Spécialiste Métropole
- **regional_specialist** : Spécialiste régional

## Configuration Utilisateur

### Paramètres Disponibles :
```javascript
{
  autoDeployment: true/false,     // Auto-déploiement activé
  maxInstances: 50,               // Nombre max d'IA
  securityLevel: 'high',          // Niveau de sécurité
  territorialScope: ['DOM-TOM', 'Métropole']  // Périmètres autorisés
}
```

## Adaptation Territoriale

### DOM-TOM
- **Contraintes spécifiques** : Réglementation locale
- **Optimisations** : Latence réseau, données locales
- **Spécialisations** : Produits régionaux, marchés locaux

### Métropole
- **Volume élevé** : Gestion de la charge
- **Intégration** : Systèmes existants
- **Conformité** : RGPD et réglementations françaises

## API Publique

### Méthodes Principales :
```javascript
// Déploiement
await aiOrchestrator.deployAI(aiSpec);

// Destruction
await aiOrchestrator.destroyAI(aiId, reason);

// Consultation
const activeAIs = aiOrchestrator.getActiveAIs();
const territoryAIs = aiOrchestrator.getAIsByTerritory('DOM-TOM');
const specializationAIs = aiOrchestrator.getAIsBySpecialization('price_analysis');

// Configuration
aiOrchestrator.updateConfig(newConfig);
```

## Journalisation et Audit

### Événements Tracés :
- **Déploiements** : Création d'instances IA
- **Destructions** : Suppression d'instances
- **Modifications** : Changements de configuration
- **Communications** : Messages inter-IA
- **Erreurs** : Échecs et problèmes détectés

### Format des Logs :
```javascript
{
  operation: 'deploy',
  aiId: 'ai_1234567890_abc123',
  aiType: 'analyzer',
  specialization: 'price_analysis',
  territory: 'DOM-TOM',
  timestamp: '2024-01-01T10:00:00Z',
  metadata: { reason: 'high_cpu_load' }
}
```

## Tests

### Coverage :
- **Déploiement et destruction** d'IA
- **Validation de sécurité** et contraintes
- **Détection de besoins** et conflits
- **Filtrage et recherche** d'instances
- **Configuration** et mise à jour

### Exécution :
```bash
npm run test:run src/test/aiOrchestration.test.js
```

## Intégration

### Dans l'Application :
1. **Import du service** : `import { aiOrchestrator } from './services/aiOrchestration.js'`
2. **Composant dashboard** : `<AIOrchestrationDashboard />`
3. **Navigation** : Ajout du module dans le menu principal

### Démarrage Automatique :
- L'orchestrateur se lance automatiquement au chargement de l'application
- Chargement des instances existantes depuis Firestore
- Démarrage du monitoring en arrière-plan

## Roadmap

### Phase 1 ✅ (Actuelle)
- ✅ Moteur d'orchestration de base
- ✅ Dashboard de monitoring
- ✅ Déploiement/destruction d'IA
- ✅ Sécurité et gouvernance
- ✅ Tests unitaires

### Phase 2 🔄 (Prochaine)
- 🔄 Intégration avec LLM locaux (Ollama)
- 🔄 IA de prédiction d'inflation avancée
- 🔄 Système de recommandations personnalisées
- 🔄 Auto-scaling intelligent

### Phase 3 📅 (Future)
- 📅 Fédération multi-plateforme
- 📅 IA explicable et transparente
- 📅 Optimisation énergétique
- 📅 Intégration blockchain pour l'audit

## Support et Maintenance

### Monitoring Production :
- Logs Firestore pour le debugging
- Métriques de performance via le dashboard
- Alertes automatiques en cas d'anomalie

### Dépannage :
1. **Vérifier la connexion Firestore**
2. **Consulter les logs d'opération**
3. **Redémarrer l'orchestrateur si nécessaire**
4. **Vérifier les limites de ressources**

---

**Note** : Cette documentation évolue avec les nouvelles fonctionnalités. Dernière mise à jour : Septembre 2024