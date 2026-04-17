/**
 * AnalyseFactures — Upload PDF, catégorisation automatique, dashboard dépenses, export
 * Route : /analyse-factures
 * Module 27 — Analyse factures
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Upload,
  FileText,
  BarChart2,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

// ── Types ─────────────────────────────────────────────────────────────────────

type Category =
  | 'Alimentation'
  | 'Électricité'
  | 'Eau'
  | 'Télécom'
  | 'Carburant'
  | 'Santé'
  | 'Divers';

interface LineItem {
  description: string;
  category: Category;
  amount: number;
}

interface Invoice {
  id: string;
  filename: string;
  month: string; // 'YYYY-MM'
  parsedAt: string;
  items: LineItem[];
  total: number;
}

const CATEGORIES: Category[] = [
  'Alimentation',
  'Électricité',
  'Eau',
  'Télécom',
  'Carburant',
  'Santé',
  'Divers',
];

const CATEGORY_COLORS: Record<Category, string> = {
  Alimentation: 'bg-green-500',
  Électricité: 'bg-yellow-400',
  Eau: 'bg-blue-400',
  Télécom: 'bg-purple-500',
  Carburant: 'bg-orange-500',
  Santé: 'bg-rose-500',
  Divers: 'bg-gray-400',
};

// ── Mock OCR ─────────────────────────────────────────────────────────────────

function generateMockItems(filename: string): LineItem[] {
  const seed = filename.length % 7;
  const items: LineItem[] = [
    { description: 'Courses supermarché', category: 'Alimentation', amount: 87.5 + seed * 5 },
    { description: 'Électricité EDF', category: 'Électricité', amount: 42.3 + seed * 2 },
    { description: 'Facture eau', category: 'Eau', amount: 18.75 },
    { description: 'Abonnement mobile', category: 'Télécom', amount: 19.99 },
    { description: 'Carburant SP95', category: 'Carburant', amount: 65.0 + seed * 3 },
    { description: 'Pharmacie', category: 'Santé', amount: 23.6 },
    { description: 'Divers achats', category: 'Divers', amount: 31.2 + seed * 1.5 },
  ];
  return items;
}

// ── Storage helpers ───────────────────────────────────────────────────────────

const STORAGE_KEY = 'akiprisaye_factures';

function loadInvoices(): Invoice[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveInvoices(list: Invoice[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function exportCSV(items: LineItem[], filename: string) {
  const header = 'Description,Catégorie,Montant (€)\n';
  const rows = items
    .map((i) => `"${i.description}","${i.category}",${i.amount.toFixed(2)}`)
    .join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AnalyseFactures() {
  const [invoices, setInvoices] = useState<Invoice[]>(loadInvoices);
  const [parsing, setParsing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth());
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available months from invoices
  const months = useMemo(() => {
    const set = new Set(invoices.map((i) => i.month));
    return Array.from(set).sort().reverse();
  }, [invoices]);

  const visibleInvoices = useMemo(
    () => invoices.filter((i) => i.month === selectedMonth),
    [invoices, selectedMonth]
  );

  const allItems = useMemo(() => visibleInvoices.flatMap((i) => i.items), [visibleInvoices]);

  const totalByCategory = useMemo(() => {
    const acc: Partial<Record<Category, number>> = {};
    for (const item of allItems) {
      acc[item.category] = (acc[item.category] ?? 0) + item.amount;
    }
    return acc;
  }, [allItems]);

  const grandTotal = useMemo(
    () => Object.values(totalByCategory).reduce((s, v) => s + (v ?? 0), 0),
    [totalByCategory]
  );

  const maxCategoryValue = useMemo(
    () => Math.max(...Object.values(totalByCategory).map((v) => v ?? 0), 1),
    [totalByCategory]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error('Seuls les fichiers PDF et images sont acceptés');
        return;
      }
      setParsing(true);
      toast.loading('Analyse en cours…', { id: 'ocr' });

      setTimeout(() => {
        const items = generateMockItems(file.name);
        const total = items.reduce((s, i) => s + i.amount, 0);
        const invoice: Invoice = {
          id: crypto.randomUUID(),
          filename: file.name,
          month: currentMonth(),
          parsedAt: new Date().toISOString(),
          items,
          total,
        };
        const updated = [invoice, ...invoices];
        setInvoices(updated);
        saveInvoices(updated);
        setSelectedMonth(invoice.month);
        setParsing(false);
        toast.success(`Facture analysée : ${total.toFixed(2)} €`, { id: 'ocr' });
      }, 1500);
    },
    [invoices]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  function handleDeleteInvoice(id: string) {
    const updated = invoices.filter((i) => i.id !== id);
    setInvoices(updated);
    saveInvoices(updated);
  }

  function handleExportAll() {
    if (allItems.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }
    exportCSV(allItems, `factures-${selectedMonth}.csv`);
    toast.success('Export CSV téléchargé');
  }

  // ── Month navigation ───────────────────────────────────────────────────────

  const monthIdx = months.indexOf(selectedMonth);

  function formatMonth(m: string) {
    const [year, month] = m.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  return (
    <>
      <Helmet>
        <title>Analyse de factures — A KI PRI SA YÉ</title>
        <meta name="description" content="Analysez vos factures et dépenses — A KI PRI SA YÉ" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="px-4 pt-4 max-w-3xl mx-auto">
          <HeroImage
            src={PAGE_HERO_IMAGES.analyseFactures}
            alt="Analyse de factures"
            gradient="from-violet-950 to-indigo-900"
            height="h-40 sm:h-52"
          >
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-violet-300 drop-shadow" />
              <span className="text-xs font-semibold uppercase tracking-widest text-violet-300">
                Analyse factures
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow">
              📄 Analyse de factures
            </h1>
            <p className="text-violet-100 text-sm mt-1 drop-shadow">
              Uploadez vos factures, catégorisez vos dépenses, exportez vos données
            </p>
          </HeroImage>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 pb-12 space-y-6">
          {/* ── Upload zone ── */}
          <div
            role="button"
            tabIndex={0}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
              dragging
                ? 'border-violet-500 bg-violet-50'
                : 'border-gray-300 bg-white hover:border-violet-400 hover:bg-violet-50'
            } ${parsing ? 'pointer-events-none opacity-70' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Upload
              className={`w-10 h-10 mx-auto mb-3 ${dragging ? 'text-violet-600' : 'text-gray-300'}`}
            />
            {parsing ? (
              <p className="text-sm text-violet-600 font-medium animate-pulse">
                Analyse OCR en cours…
              </p>
            ) : (
              <>
                <p className="font-semibold text-gray-700 text-sm">
                  Glissez-déposez une facture ou cliquez pour parcourir
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF ou image (JPG, PNG, WEBP)</p>
              </>
            )}
          </div>

          {/* ── Month selector ── */}
          {months.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() =>
                    setSelectedMonth(months[Math.min(monthIdx + 1, months.length - 1)])
                  }
                  disabled={monthIdx >= months.length - 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <p className="font-bold text-gray-900 capitalize">{formatMonth(selectedMonth)}</p>
                  <p className="text-xs text-gray-400">{visibleInvoices.length} facture(s)</p>
                </div>
                <button
                  onClick={() => setSelectedMonth(months[Math.max(monthIdx - 1, 0)])}
                  disabled={monthIdx <= 0}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ── Dashboard dépenses ── */}
          {allItems.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-violet-600" />
                  <h2 className="font-bold text-gray-900">Dashboard dépenses</h2>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-violet-700">{grandTotal.toFixed(2)} €</p>
                  <p className="text-xs text-gray-400">total du mois</p>
                </div>
              </div>

              <div className="space-y-2">
                {CATEGORIES.filter((cat) => totalByCategory[cat]).map((cat) => {
                  const val = totalByCategory[cat] ?? 0;
                  const pct = Math.round((val / maxCategoryValue) * 100);
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-24 flex-shrink-0">{cat}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${CATEGORY_COLORS[cat]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-16 text-right">
                        {val.toFixed(2)} €
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleExportAll}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-violet-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exporter en CSV
              </button>
            </div>
          )}

          {/* ── Invoice list ── */}
          {visibleInvoices.length > 0 && (
            <div>
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-600" />
                Factures analysées
              </h2>
              <div className="space-y-3">
                {visibleInvoices.map((inv) => (
                  <div key={inv.id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm truncate max-w-[200px]">
                          {inv.filename}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(inv.parsedAt).toLocaleDateString('fr-FR')} ·{' '}
                          {inv.total.toFixed(2)} €
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => exportCSV(inv.items, `facture-${inv.id.slice(0, 8)}.csv`)}
                          className="p-1.5 text-gray-400 hover:text-violet-600 transition-colors"
                          title="Exporter"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {inv.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 truncate flex-1">{item.description}</span>
                          <span
                            className={`ml-2 px-1.5 py-0.5 rounded text-white text-[10px] flex-shrink-0 ${CATEGORY_COLORS[item.category]}`}
                          >
                            {item.category}
                          </span>
                          <span className="ml-3 font-semibold text-gray-700 flex-shrink-0 w-16 text-right">
                            {item.amount.toFixed(2)} €
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {invoices.length === 0 && (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">
              <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                Uploadez votre première facture pour commencer l'analyse
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
