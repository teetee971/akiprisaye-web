# Guide d'intégration API - A KI PRI SA YÉ

## 🚀 Démarrage rapide

### 1. Créer un compte

Inscrivez-vous sur https://akiprisaye.app et choisissez votre niveau d'abonnement.

### 2. Générer une API Key

```bash
curl -X POST https://api.akiprisaye.app/api/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Application",
    "permissions": ["READ_COMPARATORS", "READ_PRICES"]
  }'
```

**⚠️ Important**: Copiez la clé immédiatement, elle ne sera plus affichée!

### 3. Faire votre première requête

```bash
curl https://api.akiprisaye.app/api/v1/comparators/fuel/data?territory=MQ \
  -H "X-API-Key: akp_live_YOUR_KEY_HERE"
```

## 📚 Exemples par langage

### Python

```python
import requests

API_KEY = "akp_live_YOUR_KEY_HERE"
BASE_URL = "https://api.akiprisaye.app/api/v1"

def get_fuel_prices(territory="MQ"):
    headers = {"X-API-Key": API_KEY}
    response = requests.get(
        f"{BASE_URL}/comparators/fuel/data",
        headers=headers,
        params={"territory": territory}
    )
    response.raise_for_status()
    return response.json()

# Utilisation
try:
    data = get_fuel_prices("GP")
    print(f"Trouvé {data['metadata']['count']} stations")
    for station in data['data']:
        print(f"- {station['name']}: {station['price']}€/L")
except requests.exceptions.HTTPError as e:
    if e.response.status_code == 429:
        print("Rate limit atteint, attendez avant de réessayer")
    else:
        print(f"Erreur: {e}")
```

### Node.js / TypeScript

```typescript
import axios, { AxiosInstance } from 'axios';

class AkiprisayeClient {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: 'https://api.akiprisaye.app/api/v1',
      headers: {
        'X-API-Key': apiKey,
      },
    });
  }

  async getFuelPrices(territory: string = 'MQ') {
    try {
      const response = await this.client.get('/comparators/fuel/data', {
        params: { territory },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded');
        }
      }
      throw error;
    }
  }

  async getPriceHistory(category: string, startDate: string, endDate: string) {
    const response = await this.client.get(`/prices/${category}/history`, {
      params: { startDate, endDate },
    });
    return response.data;
  }
}

// Utilisation
const client = new AkiprisayeClient(process.env.API_KEY!);

async function main() {
  const fuelData = await client.getFuelPrices('RE');
  console.log(`Nombre de stations: ${fuelData.metadata.count}`);
}

main();
```

### PHP

```php
<?php

class AkiprisayeClient {
    private $apiKey;
    private $baseUrl = 'https://api.akiprisaye.app/api/v1';
    
    public function __construct($apiKey) {
        $this->apiKey = $apiKey;
    }
    
    public function getFuelPrices($territory = 'MQ') {
        $url = $this->baseUrl . '/comparators/fuel/data';
        $url .= '?' . http_build_query(['territory' => $territory]);
        
        $context = stream_context_create([
            'http' => [
                'header' => "X-API-Key: " . $this->apiKey
            ]
        ]);
        
        $response = file_get_contents($url, false, $context);
        
        if ($response === false) {
            $error = error_get_last();
            throw new Exception('API request failed: ' . $error['message']);
        }
        
        return json_decode($response, true);
    }
    
    public function exportToCsv($dataType, $filters) {
        $url = $this->baseUrl . '/exports/csv';
        
        $data = json_encode([
            'dataType' => $dataType,
            'filters' => $filters
        ]);
        
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/json\r\n" .
                           "X-API-Key: " . $this->apiKey,
                'content' => $data
            ]
        ]);
        
        $response = file_get_contents($url, false, $context);
        return json_decode($response, true);
    }
}

// Utilisation
$client = new AkiprisayeClient($_ENV['API_KEY']);

try {
    $data = $client->getFuelPrices('GP');
    echo "Trouvé " . $data['metadata']['count'] . " stations\n";
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
}
?>
```

### Go

```go
package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"
)

type Client struct {
    apiKey     string
    baseURL    string
    httpClient *http.Client
}

type FuelPricesResponse struct {
    Message  string                 `json:"message"`
    Data     []map[string]interface{} `json:"data"`
    Metadata struct {
        Count int `json:"count"`
    } `json:"metadata"`
}

func NewClient(apiKey string) *Client {
    return &Client{
        apiKey:  apiKey,
        baseURL: "https://api.akiprisaye.app/api/v1",
        httpClient: &http.Client{
            Timeout: 10 * time.Second,
        },
    }
}

func (c *Client) GetFuelPrices(territory string) (*FuelPricesResponse, error) {
    url := fmt.Sprintf("%s/comparators/fuel/data?territory=%s", c.baseURL, territory)
    
    req, err := http.NewRequest("GET", url, nil)
    if err != nil {
        return nil, err
    }
    
    req.Header.Set("X-API-Key", c.apiKey)
    
    resp, err := c.httpClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode == 429 {
        return nil, fmt.Errorf("rate limit exceeded")
    }
    
    if resp.StatusCode != 200 {
        body, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("API error %d: %s", resp.StatusCode, string(body))
    }
    
    var result FuelPricesResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }
    
    return &result, nil
}

func main() {
    client := NewClient("akp_live_YOUR_KEY_HERE")
    
    data, err := client.GetFuelPrices("RE")
    if err != nil {
        fmt.Printf("Error: %v\n", err)
        return
    }
    
    fmt.Printf("Found %d stations\n", data.Metadata.Count)
}
```

## 🔄 Gestion du Rate Limiting

### Stratégies de retry

```python
import time
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

def create_session_with_retry():
    session = requests.Session()
    
    # Configuration du retry automatique
    retry_strategy = Retry(
        total=3,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "POST"],
        backoff_factor=1  # 1s, 2s, 4s
    )
    
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    
    return session

# Utilisation
session = create_session_with_retry()
headers = {"X-API-Key": API_KEY}
response = session.get(f"{BASE_URL}/comparators/fuel/data", headers=headers)
```

### Monitoring des limites

```typescript
class RateLimitTracker {
  private remaining: number = 0;
  private limit: number = 0;
  private reset: number = 0;

  updateFromHeaders(headers: any) {
    this.limit = parseInt(headers['x-ratelimit-limit'] || '0');
    this.remaining = parseInt(headers['x-ratelimit-remaining'] || '0');
    this.reset = parseInt(headers['x-ratelimit-reset'] || '0');
  }

  shouldWait(): boolean {
    // Si moins de 10% des requêtes restantes
    return this.remaining < this.limit * 0.1;
  }

  getWaitTime(): number {
    if (!this.shouldWait()) return 0;
    
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, this.reset - now);
  }
}
```

## 💾 Caching et optimisation

### Cache local avec TTL

```python
from functools import lru_cache
import time

class CachedApiClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes
    
    def _get_from_cache(self, key):
        if key in self.cache:
            data, timestamp = self.cache[key]
            if time.time() - timestamp < self.cache_ttl:
                return data
        return None
    
    def _save_to_cache(self, key, data):
        self.cache[key] = (data, time.time())
    
    def get_fuel_prices(self, territory):
        cache_key = f"fuel_{territory}"
        
        # Essayer le cache d'abord
        cached = self._get_from_cache(cache_key)
        if cached:
            return cached
        
        # Sinon, appeler l'API
        headers = {"X-API-Key": self.api_key}
        response = requests.get(
            f"{BASE_URL}/comparators/fuel/data",
            headers=headers,
            params={"territory": territory}
        )
        data = response.json()
        
        # Mettre en cache
        self._save_to_cache(cache_key, data)
        return data
```

## 🔍 Debugging

### Logger les requêtes

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.akiprisaye.app/api/v1',
});

// Interceptor pour logger les requêtes
api.interceptors.request.use((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  console.log(`[API] Headers:`, config.headers);
  return config;
});

// Interceptor pour logger les réponses
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ${response.status} ${response.config.url}`);
    console.log(`[API] Rate Limit: ${response.headers['x-ratelimit-remaining']}/${response.headers['x-ratelimit-limit']}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[API] Error ${error.response.status}:`, error.response.data);
    }
    return Promise.reject(error);
  }
);
```

## 🎯 Bonnes pratiques

### 1. Gestion des erreurs

```python
class ApiError(Exception):
    def __init__(self, status_code, message, response_data=None):
        self.status_code = status_code
        self.message = message
        self.response_data = response_data
        super().__init__(self.message)

def make_api_request(url, headers):
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            raise ApiError(401, "API key invalide ou expirée")
        elif e.response.status_code == 403:
            data = e.response.json()
            raise ApiError(403, f"Permission insuffisante: {data.get('requiredTier')}")
        elif e.response.status_code == 429:
            retry_after = e.response.headers.get('Retry-After', '60')
            raise ApiError(429, f"Rate limit dépassé, réessayez dans {retry_after}s")
        else:
            raise ApiError(e.response.status_code, str(e))
    except requests.exceptions.ConnectionError:
        raise ApiError(0, "Impossible de se connecter à l'API")
```

### 2. Environnement de développement

```bash
# .env.development
API_KEY=akp_test_your_dev_key_here
API_BASE_URL=https://api-staging.akiprisaye.app/api/v1

# .env.production
API_KEY=akp_live_your_prod_key_here
API_BASE_URL=https://api.akiprisaye.app/api/v1
```

### 3. Tests unitaires

```python
import unittest
from unittest.mock import patch, Mock

class TestApiClient(unittest.TestCase):
    def setUp(self):
        self.client = AkiprisayeClient("test_key")
    
    @patch('requests.get')
    def test_get_fuel_prices(self, mock_get):
        # Mock de la réponse
        mock_response = Mock()
        mock_response.json.return_value = {
            'data': [{'name': 'Station 1', 'price': 1.5}],
            'metadata': {'count': 1}
        }
        mock_get.return_value = mock_response
        
        # Test
        result = self.client.get_fuel_prices('MQ')
        
        # Assertions
        self.assertEqual(result['metadata']['count'], 1)
        mock_get.assert_called_once_with(
            'https://api.akiprisaye.app/api/v1/comparators/fuel/data',
            headers={'X-API-Key': 'test_key'},
            params={'territory': 'MQ'}
        )
```

## 📊 Monitoring en production

### Métriques à suivre

1. **Taux de succès**: % de requêtes 2xx
2. **Latence**: Temps de réponse moyen
3. **Rate limit**: Utilisation des quotas
4. **Erreurs**: Fréquence et types d'erreurs

### Alertes recommandées

```yaml
# Exemple configuration Prometheus/Grafana

alerts:
  - name: RateLimitWarning
    condition: rate_limit_remaining < 10%
    action: notify_team
    
  - name: HighErrorRate
    condition: error_rate > 5%
    duration: 5m
    action: page_on_call
    
  - name: SlowResponse
    condition: p95_latency > 2s
    duration: 10m
    action: notify_team
```

## 🔐 Sécurité

### Rotation des clés

```python
from datetime import datetime, timedelta

def should_rotate_key(key_created_at, days=90):
    """Rotation tous les 90 jours recommandée"""
    age = datetime.now() - key_created_at
    return age > timedelta(days=days)

def rotate_api_key(old_key_id):
    # 1. Créer nouvelle clé
    new_key = create_api_key(name="Rotated Key")
    
    # 2. Période de transition (déployer nouvelle clé)
    print(f"Nouvelle clé: {new_key['secret']}")
    print("Déployez cette nouvelle clé dans vos applications")
    input("Appuyez sur Entrée quand terminé...")
    
    # 3. Révoquer ancienne clé
    revoke_api_key(old_key_id)
    print("Ancienne clé révoquée")
```

## 📞 Support

- Documentation: https://docs.akiprisaye.app
- Status API: https://status.akiprisaye.app
- Email: api@akiprisaye.fr
- Discord: https://discord.gg/akiprisaye
