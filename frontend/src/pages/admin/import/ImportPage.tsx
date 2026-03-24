 
/**
 * ImportPage Component
 * Admin page for importing stores, products, and prices via CSV
 */
import { useState, useCallback } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Store, 
  Package, 
  DollarSign,
  Info,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';
import { CsvUploader } from './CsvUploader';
import { ImportPreview } from './ImportPreview';
import { ImportReport } from './ImportReport';
import {
  importStoresFromCSV,
  importProductsFromCSV,
  generateStoreCSVTemplate,
  generateProductCSVTemplate,
  downloadCSV,
  type ImportResult,
  type ImportError,
  type StoreCSVRecord,
  type ProductCSVRecord,
} from '@/services/csvImportService';
import { stringifyCsv } from '@/utils/csv';

type TabType = 'stores' | 'products' | 'prices';

interface TabConfig {
  id: TabType;
  label: string;
  icon: typeof Store;
  entityType: string;
  instructions: string[];
  templateFields: string[];
}

const TABS: TabConfig[] = [
  {
    id: 'stores',
    label: 'Enseignes',
    icon: Store,
    entityType: 'magasins',
    instructions: [
      'Le fichier CSV doit contenir les colonnes suivantes (dans cet ordre):',
      'name (requis) - Nom du magasin',
      'chain (optionnel) - Enseigne/Chaîne',
      'address (requis) - Adresse complète',
      'city (optionnel) - Ville',
      'territory (requis) - Code territoire (GP, MQ, GF, RE, YT, PM, BL, MF, WF, PF, NC)',
      'phone (optionnel) - Numéro de téléphone',
      'lat (optionnel) - Latitude',
      'lon (optionnel) - Longitude',
      'type (optionnel) - Type de magasin',
      'services (optionnel) - Services séparés par des virgules',
    ],
    templateFields: ['name', 'chain', 'address', 'city', 'territory', 'phone', 'lat', 'lon', 'type', 'services'],
  },
  {
    id: 'products',
    label: 'Produits',
    icon: Package,
    entityType: 'produits',
    instructions: [
      'Le fichier CSV doit contenir les colonnes suivantes (dans cet ordre):',
      'ean (requis) - Code-barres EAN (8 ou 13 chiffres)',
      'name (requis) - Nom du produit',
      'brand (optionnel) - Marque',
      'category (optionnel) - Catégorie',
      'unit (optionnel) - Unité de mesure',
      'price (optionnel) - Prix',
      'store (optionnel) - ID du magasin',
      'territory (optionnel) - Code territoire',
      'date (optionnel) - Date de relevé (YYYY-MM-DD)',
    ],
    templateFields: ['ean', 'name', 'brand', 'category', 'unit', 'price', 'store', 'territory', 'date'],
  },
  {
    id: 'prices',
    label: 'Prix',
    icon: DollarSign,
    entityType: 'prix',
    instructions: [
      'Le fichier CSV doit contenir les colonnes suivantes (dans cet ordre):',
      'ean (requis) - Code-barres EAN du produit',
      'price (requis) - Prix observé',
      'store (requis) - ID du magasin',
      'territory (requis) - Code territoire',
      'date (optionnel) - Date de relevé (YYYY-MM-DD)',
      'Note: Les prix sont importés comme des produits avec les informations de prix.',
    ],
    templateFields: ['ean', 'price', 'store', 'territory', 'date'],
  },
];

type ImportStep = 'upload' | 'preview' | 'importing' | 'results';

export function ImportPage() {
  const [activeTab, setActiveTab] = useState<TabType>('stores');
  const [step, setStep] = useState<ImportStep>('upload');
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<ImportError[]>([]);
  const [importResult, setImportResult] = useState<ImportResult<any> | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [validCount, setValidCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  const currentTab = TABS.find(t => t.id === activeTab)!;

  const handleFileLoaded = useCallback((data: any[], file: File) => {
    setCsvData(data);
    setCsvFile(file);
    
    // Validate data based on tab
    validateData(activeTab, data);
    
    setStep('preview');
    toast.success(`Fichier chargé: ${file.name}`);
  }, [activeTab]);

  const validateData = useCallback((tab: TabType, data: any[]) => {
    const errors: ImportError[] = [];
    
    // Perform validation based on tab
    if (tab === 'stores') {
      data.forEach((record, index) => {
        const row = index + 2;
        if (!record.name?.trim()) {
          errors.push({ row, field: 'name', message: 'Le nom est requis' });
        }
        if (!record.address?.trim()) {
          errors.push({ row, field: 'address', message: "L'adresse est requise" });
        }
        if (!record.territory?.trim()) {
          errors.push({ row, field: 'territory', message: 'Le territoire est requis' });
        }
      });
    } else if (tab === 'products' || tab === 'prices') {
      data.forEach((record, index) => {
        const row = index + 2;
        if (!record.ean?.trim()) {
          errors.push({ row, field: 'ean', message: 'Le code EAN est requis' });
        } else if (!/^\d{8}$|^\d{13}$/.test(record.ean.trim())) {
          errors.push({ row, field: 'ean', value: record.ean, message: 'Le code EAN doit contenir 8 ou 13 chiffres' });
        }
        
        if (tab === 'products' && !record.name?.trim()) {
          errors.push({ row, field: 'name', message: 'Le nom du produit est requis' });
        }
        
        if (tab === 'prices' && !record.price?.trim()) {
          errors.push({ row, field: 'price', message: 'Le prix est requis' });
        }
      });
    }
    
    setValidationErrors(errors);
  }, []);

  const handleFileError = useCallback((error: string) => {
    toast.error(error);
  }, []);

  const handleDownloadTemplate = useCallback(() => {
    let csv = '';
    let filename = '';
    
    if (activeTab === 'stores') {
      csv = generateStoreCSVTemplate();
      filename = 'template-magasins.csv';
    } else if (activeTab === 'products') {
      csv = generateProductCSVTemplate();
      filename = 'template-produits.csv';
    } else {
      // Generate prices template
      const template = [{
        ean: '3017620422003',
        price: '4.99',
        store: 'carrefour-jarry',
        territory: 'GP',
        date: new Date().toISOString().split('T')[0],
      }];
      csv = stringifyCsv(template);
      filename = 'template-prix.csv';
    }
    
    downloadCSV(csv, filename);
    toast.success('Modèle téléchargé');
  }, [activeTab]);

  const handleImport = useCallback(async () => {
    if (!csvFile || csvData.length === 0) return;
    
    setStep('importing');
    setImportProgress(0);
    
    try {
      // Read file content
      const content = await csvFile.text();
      let result: ImportResult<any>;
      
      if (activeTab === 'stores') {
        result = await importStoresFromCSV(
          content,
          true, // Enable geocoding
          (current, total) => {
            setImportProgress(Math.round((current / total) * 100));
          }
        );
      } else {
        // Products and prices use the same import
        result = await importProductsFromCSV(
          content,
          (current, total) => {
            setImportProgress(Math.round((current / total) * 100));
          }
        );
      }
      
      setImportResult(result);
      setStep('results');
      
      if (result.success) {
        toast.success(`Import réussi: ${result.successful} ${currentTab.entityType} importés`);
      } else {
        toast.error(`Import terminé avec ${result.failed} erreurs`);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erreur lors de l\'import: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
      setStep('preview');
    }
  }, [csvFile, csvData, activeTab, currentTab]);

  const handleReset = useCallback(() => {
    setCsvData([]);
    setCsvFile(null);
    setValidationErrors([]);
    setImportResult(null);
    setImportProgress(0);
    setValidCount(0);
    setErrorCount(0);
    setStep('upload');
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    handleReset();
  }, [handleReset]);

  const canImport = csvData.length > 0 && validCount > 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">
          Import CSV
        </h1>
        <p className="text-slate-600">
          Importez vos données d'enseignes, produits ou prix depuis des fichiers CSV
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap',
                isActive
                  ? 'border-2 border-blue-500/60 bg-blue-100 text-blue-800'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Instructions */}
        {step === 'upload' && (
          <GlassCard>
            <div className="flex items-start space-x-3 mb-4">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  Instructions d'import
                </h3>
                <ul className="space-y-1 text-sm text-slate-700">
                  {currentTab.instructions.map((instruction, index) => (
                    <li key={instruction} className={index === 0 ? 'font-medium text-slate-800' : ''}>
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Download Template Button */}
            <div className="mt-4 border-t border-slate-200 pt-4">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center space-x-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 transition-colors hover:bg-slate-100"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger le modèle CSV</span>
              </button>
            </div>
          </GlassCard>
        )}

        {/* Upload */}
        {step === 'upload' && (
          <GlassCard>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Sélectionner un fichier
            </h3>
            <CsvUploader
              onFileLoaded={handleFileLoaded}
              onError={handleFileError}
              acceptedTypes={['.csv']}
              maxSize={50}
            />
          </GlassCard>
        )}

        {/* Preview */}
        {step === 'preview' && (
          <>
            <GlassCard>
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                Aperçu des données
              </h3>
              <ImportPreview
                data={csvData}
                errors={validationErrors}
                onValidationComplete={(valid, errors) => {
                  setValidCount(valid);
                  setErrorCount(errors);
                }}
              />
            </GlassCard>

            {/* Import Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleReset}
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-slate-700 transition-colors hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                onClick={handleImport}
                disabled={!canImport}
                className={cn(
                  'flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all',
                  canImport
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'cursor-not-allowed bg-slate-200 text-slate-400'
                )}
              >
                <Upload className="w-5 h-5" />
                <span>
                  Importer {validCount} {currentTab.entityType}
                  {errorCount > 0 && ` (${errorCount} ignorés)`}
                </span>
              </button>
            </div>
          </>
        )}

        {/* Importing */}
        {step === 'importing' && (
          <GlassCard>
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
                <div className="w-8 h-8 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">
                Import en cours...
              </h3>
              <p className="mb-4 text-slate-600">
                Veuillez patienter pendant l'import des données
              </p>
              <div className="max-w-md mx-auto">
                <div className="mb-2 flex items-center justify-between text-sm text-slate-700">
                  <span>Progression</span>
                  <span>{importProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Results */}
        {step === 'results' && importResult && (
          <ImportReport
            result={importResult}
            onReset={handleReset}
            entityType={currentTab.entityType}
          />
        )}
      </div>
    </div>
  );
}
