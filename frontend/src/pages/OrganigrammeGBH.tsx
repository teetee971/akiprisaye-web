/**
 * OrganigrammeGBH — Organigramme interactif du Groupe Bernard Hayot (GBH)
 * Route : /organigrame-gbh
 *
 * Visualisation SVG interactive de la structure capitalistique et commerciale
 * du Groupe Bernard Hayot, premier groupe de grande distribution
 * dans les départements et régions d'outre-mer français.
 *
 * Sources :
 *  Autorité de la concurrence — Avis 09-A-45 ; Avis 19-A-12
 *  INSEE — Annuaire des entreprises 2023
 *  Registre du Commerce et des Sociétés (RCS) Guadeloupe
 *  Rapport CEROM 2022 — Comptes économiques rapides pour l'Outre-Mer
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { SEOHead } from '../components/ui/SEOHead';

// ─── Types ───────────────────────────────────────────────────────────────────

type Territory = 'GP' | 'MQ' | 'GF' | 'RE' | 'NC' | 'PF';

type Sector =
  | 'grande-distribution'
  | 'automobile'
  | 'hotellerie'
  | 'agroalimentaire'
  | 'btp'
  | 'holding';

interface OrgNode {
  id: string;
  label: string;
  sublabel?: string;
  sector: Sector;
  territories: Territory[];
  children?: OrgNode[];
  detail?: string;
  ca?: string;
  employees?: string;
  founded?: string;
  enseignes?: string[];
  source?: string;
}

// ─── Couleurs par secteur ─────────────────────────────────────────────────────

const SECTOR_META: Record<Sector, { color: string; bg: string; border: string; label: string; emoji: string }> = {
  holding: {
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.5)',
    label: 'Holding',
    emoji: '🏛️',
  },
  'grande-distribution': {
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.5)',
    label: 'Grande Distribution',
    emoji: '🛒',
  },
  automobile: {
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.5)',
    label: 'Automobile',
    emoji: '🚗',
  },
  hotellerie: {
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.12)',
    border: 'rgba(168,85,247,0.5)',
    label: 'Hôtellerie & Services',
    emoji: '🏨',
  },
  agroalimentaire: {
    color: '#f97316',
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.5)',
    label: 'Agroalimentaire',
    emoji: '🌾',
  },
  btp: {
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.12)',
    border: 'rgba(148,163,184,0.5)',
    label: 'BTP & Matériaux',
    emoji: '🏗️',
  },
};

const TERRITORY_META: Record<Territory, { flag: string; label: string }> = {
  GP: { flag: '🇬🇵', label: 'Guadeloupe' },
  MQ: { flag: '🇲🇶', label: 'Martinique' },
  GF: { flag: '🇬🇫', label: 'Guyane' },
  RE: { flag: '🇷🇪', label: 'La Réunion' },
  NC: { flag: '🇳🇨', label: 'Nouvelle-Calédonie' },
  PF: { flag: '🇵🇫', label: 'Polynésie française' },
};

// ─── Données de l'organigramme ────────────────────────────────────────────────

const GBH_TREE: OrgNode = {
  id: 'gbh',
  label: 'GBH',
  sublabel: 'Groupe Bernard Hayot',
  sector: 'holding',
  territories: ['GP', 'MQ', 'GF', 'RE', 'NC', 'PF'],
  ca: '~3,5 Md €',
  employees: '~14 000',
  founded: '1960',
  detail:
    'Le Groupe Bernard Hayot (GBH) est le premier groupe privé antillais. Fondé en 1960 en Guadeloupe par Bernard Hayot, il est présent dans la grande distribution, l\'automobile, l\'hôtellerie et les services, l\'agroalimentaire et les matériaux de construction, dans l\'ensemble des DOM-COM français et au-delà.',
  source: 'RCS Guadeloupe — SIREN 313 222 260',
  children: [
    {
      id: 'gd',
      label: 'GBH Distribution',
      sublabel: 'Grande Distribution',
      sector: 'grande-distribution',
      territories: ['GP', 'MQ', 'GF', 'RE'],
      ca: '~2 Md €',
      employees: '~7 000',
      detail:
        'Pôle grande distribution : hypermarchés et supermarchés sous enseigne Carrefour, supérettes Leader Price et Carrefour Express. GBH est franchisé Carrefour pour l\'ensemble de ses territoires.',
      enseignes: ['Carrefour', 'Carrefour Market', 'Leader Price', 'Carrefour Express', 'Carrefour Bio'],
      children: [
        {
          id: 'gd-gp',
          label: 'GBH Distribution Guadeloupe',
          sublabel: 'Jarry, Baie-Mahault',
          sector: 'grande-distribution',
          territories: ['GP'],
          detail:
            'Opère les hypermarchés Carrefour de Destreland et de Milenis, ainsi que plusieurs Carrefour Market et Leader Price en Guadeloupe.',
          enseignes: ['Carrefour Destreland', 'Carrefour Milenis', 'Carrefour Market', 'Leader Price'],
        },
        {
          id: 'gd-mq',
          label: 'GBH Distribution Martinique',
          sublabel: 'Fort-de-France',
          sector: 'grande-distribution',
          territories: ['MQ'],
          detail:
            'Exploite les hypermarchés Carrefour du Lamentin et de Génipa, des Carrefour Market et supérettes Leader Price en Martinique.',
          enseignes: ['Carrefour Lamentin', 'Carrefour Génipa', 'Carrefour Market', 'Leader Price'],
        },
        {
          id: 'gd-gf',
          label: 'GBH Distribution Guyane',
          sublabel: 'Cayenne',
          sector: 'grande-distribution',
          territories: ['GF'],
          detail:
            'Présence en Guyane avec l\'hypermarché Carrefour de Cayenne et des supermarchés sous enseigne Carrefour Market.',
          enseignes: ['Carrefour Cayenne', 'Carrefour Market'],
        },
        {
          id: 'gd-re',
          label: 'GBH Distribution La Réunion',
          sublabel: 'Saint-Denis',
          sector: 'grande-distribution',
          territories: ['RE'],
          detail:
            'Opère des hypermarchés Carrefour à La Réunion, en concurrence avec le Groupe Caillé.',
          enseignes: ['Carrefour', 'Carrefour Market'],
        },
      ],
    },
    {
      id: 'auto',
      label: 'GBH Automobile',
      sublabel: 'Distribution Automobile',
      sector: 'automobile',
      territories: ['GP', 'MQ', 'GF', 'RE', 'NC', 'PF'],
      ca: '~600 M €',
      employees: '~2 500',
      detail:
        'Pôle automobile : concessionnaire multi-marques (Toyota, Lexus, Citroën, Peugeot, Hyundai, Land Rover, Jaguar…) dans les DOM-COM et le Pacifique. C\'est le plus grand distributeur automobile des territoires ultramarins français.',
      enseignes: ['Toyota', 'Lexus', 'Citroën', 'Peugeot', 'Hyundai', 'Land Rover', 'Jaguar'],
      children: [
        {
          id: 'auto-antilles',
          label: 'Antilles Automobile',
          sublabel: 'Guadeloupe & Martinique',
          sector: 'automobile',
          territories: ['GP', 'MQ'],
          detail:
            'Concessions Toyota, Citroën et Peugeot en Guadeloupe et Martinique. Le groupe est le leader incontestable de la distribution automobile aux Antilles.',
          enseignes: ['Toyota GP', 'Toyota MQ', 'Citroën', 'Peugeot'],
        },
        {
          id: 'auto-pacifique',
          label: 'Pacific Auto',
          sublabel: 'Nouvelle-Calédonie & Polynésie',
          sector: 'automobile',
          territories: ['NC', 'PF'],
          detail:
            'Distribution automobile Toyota, Lexus et autres marques premium en Nouvelle-Calédonie et en Polynésie française.',
          enseignes: ['Toyota NC', 'Lexus NC', 'Toyota PF'],
        },
        {
          id: 'auto-ocean',
          label: 'Réunion & Guyane Auto',
          sublabel: 'La Réunion & Guyane',
          sector: 'automobile',
          territories: ['RE', 'GF'],
          detail:
            'Présence dans la distribution automobile à La Réunion et en Guyane avec plusieurs marques.',
          enseignes: ['Toyota RE', 'Citroën GF'],
        },
      ],
    },
    {
      id: 'hotel',
      label: 'GBH Hôtellerie & Services',
      sublabel: 'Tourisme & Services',
      sector: 'hotellerie',
      territories: ['GP', 'MQ'],
      ca: '~200 M €',
      employees: '~1 500',
      detail:
        'Pôle hôtellerie et services : hôtels Karibéa en Guadeloupe et Martinique, agences immobilières, logistique et autres services B2B.',
      enseignes: ['Karibéa Hôtels', 'Karibéa Resorts'],
      children: [
        {
          id: 'hotel-karibea',
          label: 'Karibéa Hôtels',
          sublabel: 'Chaîne hôtelière antillaise',
          sector: 'hotellerie',
          territories: ['GP', 'MQ'],
          detail:
            'Chaîne hôtelière de 4 établissements aux Antilles : Hôtel Baie du Galion (Martinique), Hôtel Le Clipper (Guadeloupe), Résidence Amyris (Martinique) et Résidence Golf Village (Guadeloupe).',
          enseignes: ['Hôtel Baie du Galion', 'Hôtel Le Clipper', 'Résidence Amyris', 'Golf Village'],
        },
        {
          id: 'hotel-logistique',
          label: 'GBH Logistique & Services',
          sublabel: 'Services B2B & Immobilier',
          sector: 'hotellerie',
          territories: ['GP', 'MQ'],
          detail:
            'Activités logistiques (plateformes de distribution), immobilier commercial et services aux entreprises dans les Antilles françaises.',
        },
      ],
    },
    {
      id: 'agro',
      label: 'GBH Agroalimentaire',
      sublabel: 'Importation & Production',
      sector: 'agroalimentaire',
      territories: ['GP', 'MQ'],
      ca: '~300 M €',
      employees: '~1 200',
      detail:
        'Pôle agroalimentaire : importation et distribution de produits alimentaires, partenariats avec des producteurs locaux et activités de conditionnement.',
      children: [
        {
          id: 'agro-import',
          label: 'GBH Import Alimentaire',
          sublabel: 'Importation & Grossiste',
          sector: 'agroalimentaire',
          territories: ['GP', 'MQ', 'GF'],
          detail:
            'Importation en gros de produits alimentaires depuis la France métropolitaine et l\'Europe. GBH contrôle une partie significative des flux d\'importation alimentaire aux Antilles, ce qui a été relevé par l\'Autorité de la concurrence.',
        },
        {
          id: 'agro-local',
          label: 'Partenariats Producteurs Locaux',
          sublabel: 'Filières locales',
          sector: 'agroalimentaire',
          territories: ['GP', 'MQ'],
          detail:
            'Partenariats avec des agriculteurs et producteurs locaux pour la commercialisation de fruits, légumes et produits typiques antillais dans les hypermarchés Carrefour.',
        },
      ],
    },
    {
      id: 'btp',
      label: 'GBH Matériaux & BTP',
      sublabel: 'Construction & Distribution',
      sector: 'btp',
      territories: ['GP', 'MQ'],
      ca: '~150 M €',
      employees: '~800',
      detail:
        'Pôle BTP et matériaux de construction : distribution de matériaux, outillage et fournitures pour les professionnels et les particuliers dans les Antilles.',
      enseignes: ['Point P', 'Asturienne', 'Cedeo'],
      children: [
        {
          id: 'btp-distribution',
          label: 'Distribution Matériaux',
          sublabel: 'Point P & Partenaires',
          sector: 'btp',
          territories: ['GP', 'MQ'],
          detail:
            'Distribution de matériaux de construction sous enseigne Point P et marques associées dans les deux principaux territoires antillais.',
          enseignes: ['Point P GP', 'Point P MQ'],
        },
      ],
    },
  ],
};

// ─── Utilitaires de layout SVG ────────────────────────────────────────────────

interface LayoutNode extends OrgNode {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  parentId?: string;
  layoutChildren?: LayoutNode[];
  collapsed?: boolean;
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 56;
const H_GAP = 24;
const V_GAP = 80;

function buildLayout(
  node: OrgNode,
  collapsedIds: Set<string>,
  depth = 0,
  parentId?: string,
): LayoutNode {
  const isCollapsed = collapsedIds.has(node.id);
  const visibleChildren =
    node.children && !isCollapsed
      ? node.children.map((c) => buildLayout(c, collapsedIds, depth + 1, node.id))
      : [];

  const subtreeWidth = visibleChildren.length
    ? visibleChildren.reduce((sum, c) => sum + c.width, 0) +
      (visibleChildren.length - 1) * H_GAP
    : NODE_WIDTH;

  // Center this node over its children
  const x = visibleChildren.length
    ? visibleChildren[0].x + (subtreeWidth - NODE_WIDTH) / 2
    : 0;

  // Stack children horizontally
  let cx = 0;
  for (const child of visibleChildren) {
    child.x += cx;
    cx += child.width + H_GAP;
  }

  return {
    ...node,
    x,
    y: depth * (NODE_HEIGHT + V_GAP),
    width: subtreeWidth,
    height: NODE_HEIGHT,
    depth,
    parentId,
    layoutChildren: visibleChildren,
    collapsed: isCollapsed,
  };
}

function flattenLayout(node: LayoutNode): LayoutNode[] {
  const result: LayoutNode[] = [node];
  for (const child of node.layoutChildren ?? []) {
    result.push(...flattenLayout(child));
  }
  return result;
}

function flattenEdges(node: LayoutNode): Array<{ parent: LayoutNode; child: LayoutNode }> {
  const result: Array<{ parent: LayoutNode; child: LayoutNode }> = [];
  for (const child of node.layoutChildren ?? []) {
    result.push({ parent: node, child });
    result.push(...flattenEdges(child));
  }
  return result;
}

// ─── Composant Nœud ──────────────────────────────────────────────────────────

function OrgNodeRect({
  node,
  offsetX,
  selected,
  onSelect,
  onToggle,
}: {
  node: LayoutNode;
  offsetX: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const meta = SECTOR_META[node.sector];
  const hasChildren = (node.children?.length ?? 0) > 0;
  const cx = node.x + offsetX + NODE_WIDTH / 2;
  const cy = node.y + NODE_HEIGHT / 2;
  const rx = 10;

  return (
    <g
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(node.id)}
      role="button"
      aria-label={`Nœud ${node.label}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(node.id);
      }}
    >
      {/* Shadow */}
      <rect
        x={node.x + offsetX + 2}
        y={node.y + 2}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={rx}
        fill="rgba(0,0,0,0.35)"
      />
      {/* Background */}
      <rect
        x={node.x + offsetX}
        y={node.y}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={rx}
        fill={selected ? meta.bg.replace('0.12', '0.28') : meta.bg}
        stroke={selected ? meta.color : meta.border}
        strokeWidth={selected ? 2 : 1}
      />
      {/* Label */}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={meta.color}
        fontSize={12}
        fontWeight={700}
        style={{ fontFamily: 'system-ui, sans-serif', pointerEvents: 'none' }}
      >
        {node.label.length > 18 ? node.label.slice(0, 17) + '…' : node.label}
      </text>
      {node.sublabel && (
        <text
          x={cx}
          y={cy + 9}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#94a3b8"
          fontSize={9}
          style={{ fontFamily: 'system-ui, sans-serif', pointerEvents: 'none' }}
        >
          {node.sublabel.length > 22 ? node.sublabel.slice(0, 21) + '…' : node.sublabel}
        </text>
      )}
      {/* Expand/collapse toggle */}
      {hasChildren && (
        <g
          onClick={(e) => {
            e.stopPropagation();
            onToggle(node.id);
          }}
          style={{ cursor: 'pointer' }}
          role="button"
          aria-label={node.collapsed ? 'Développer' : 'Réduire'}
        >
          <circle
            cx={node.x + offsetX + NODE_WIDTH - 10}
            cy={node.y + 10}
            r={8}
            fill={meta.color}
            opacity={0.85}
          />
          <text
            x={node.x + offsetX + NODE_WIDTH - 10}
            y={node.y + 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            fontSize={11}
            fontWeight={900}
            style={{ fontFamily: 'monospace', pointerEvents: 'none' }}
          >
            {node.collapsed ? '+' : '−'}
          </text>
        </g>
      )}
    </g>
  );
}

// ─── Composant Arbre SVG ──────────────────────────────────────────────────────

function OrgTree({
  root,
  collapsedIds,
  selectedId,
  onSelect,
  onToggle,
  filterTerritory,
  filterSector,
}: {
  root: OrgNode;
  collapsedIds: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  filterTerritory: Territory | 'all';
  filterSector: Sector | 'all';
}) {
  const layout = buildLayout(root, collapsedIds);
  const nodes = flattenLayout(layout);
  const edges = flattenEdges(layout);

  // Filter: dim nodes that don't match
  const matchNode = (n: OrgNode) => {
    const tOk =
      filterTerritory === 'all' || n.territories.includes(filterTerritory);
    const sOk = filterSector === 'all' || n.sector === filterSector;
    return tOk && sOk;
  };

  const totalWidth = layout.width + NODE_WIDTH;
  const maxDepth = nodes.reduce((m, n) => Math.max(m, n.depth), 0);
  const totalHeight = (maxDepth + 1) * (NODE_HEIGHT + V_GAP) + 20;
  const offsetX = (totalWidth - layout.width - NODE_WIDTH) / 2;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      width="100%"
      style={{ maxHeight: 700, overflow: 'visible' }}
      aria-label="Organigramme GBH"
      role="img"
    >
      <defs>
        <marker
          id="arrow"
          markerWidth="8"
          markerHeight="8"
          refX="4"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L0,8 L8,4 Z" fill="#475569" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map(({ parent, child }) => {
        const px = parent.x + offsetX + NODE_WIDTH / 2;
        const py = parent.y + NODE_HEIGHT;
        const cx = child.x + offsetX + NODE_WIDTH / 2;
        const cy = child.y;
        const midY = (py + cy) / 2;
        const dimmed = !matchNode(child);
        return (
          <path
            key={`${parent.id}-${child.id}`}
            d={`M${px},${py} C${px},${midY} ${cx},${midY} ${cx},${cy}`}
            fill="none"
            stroke={dimmed ? 'rgba(71,85,105,0.25)' : '#475569'}
            strokeWidth={1.5}
            markerEnd="url(#arrow)"
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const dimmed = !matchNode(node);
        return (
          <g key={node.id} opacity={dimmed ? 0.3 : 1} style={{ transition: 'opacity 0.2s' }}>
            <OrgNodeRect
              node={node}
              offsetX={offsetX}
              selected={selectedId === node.id}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Panel Détail ─────────────────────────────────────────────────────────────

function findNode(tree: OrgNode, id: string): OrgNode | null {
  if (tree.id === id) return tree;
  for (const child of tree.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

function DetailPanel({ node, onClose }: { node: OrgNode; onClose: () => void }) {
  const meta = SECTOR_META[node.sector];
  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.9)',
        border: `1px solid ${meta.border}`,
        borderRadius: 16,
        padding: '1.25rem 1.5rem',
        position: 'relative',
      }}
    >
      <button
        onClick={onClose}
        aria-label="Fermer le panneau de détail"
        style={{
          position: 'absolute',
          top: 12,
          right: 14,
          background: 'none',
          border: 'none',
          color: '#64748b',
          fontSize: '1.2rem',
          cursor: 'pointer',
          lineHeight: 1,
        }}
      >
        ✕
      </button>

      {/* Header */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: 20,
            background: meta.bg,
            border: `1px solid ${meta.border}`,
            color: meta.color,
            fontWeight: 700,
            fontSize: '0.72rem',
            marginBottom: '0.5rem',
          }}
        >
          {meta.emoji} {meta.label}
        </div>
        <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 800 }}>
          {node.label}
        </h3>
        {node.sublabel && (
          <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            {node.sublabel}
          </p>
        )}
      </div>

      {/* Territoires */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
        {node.territories.map((t) => (
          <span
            key={t}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
              padding: '2px 8px',
              borderRadius: 12,
              background: 'rgba(148,163,184,0.1)',
              border: '1px solid rgba(148,163,184,0.2)',
              color: '#cbd5e1',
              fontSize: '0.75rem',
              fontWeight: 500,
            }}
          >
            {TERRITORY_META[t].flag} {TERRITORY_META[t].label}
          </span>
        ))}
      </div>

      {/* Détail */}
      {node.detail && (
        <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
          {node.detail}
        </p>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        {node.ca && (
          <div>
            <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
              CA estimé
            </div>
            <div style={{ color: '#f1f5f9', fontSize: '0.95rem', fontWeight: 700 }}>{node.ca}</div>
          </div>
        )}
        {node.employees && (
          <div>
            <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Effectifs
            </div>
            <div style={{ color: '#f1f5f9', fontSize: '0.95rem', fontWeight: 700 }}>{node.employees}</div>
          </div>
        )}
        {node.founded && (
          <div>
            <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Fondé
            </div>
            <div style={{ color: '#f1f5f9', fontSize: '0.95rem', fontWeight: 700 }}>{node.founded}</div>
          </div>
        )}
      </div>

      {/* Enseignes */}
      {node.enseignes && (
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Enseignes & Marques
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {node.enseignes.map((e) => (
              <span
                key={e}
                style={{
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: meta.bg,
                  border: `1px solid ${meta.border}`,
                  color: meta.color,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {e}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Source */}
      {node.source && (
        <p
          style={{
            marginTop: '0.85rem',
            color: '#475569',
            fontSize: '0.7rem',
            fontStyle: 'italic',
          }}
        >
          Source : {node.source}
        </p>
      )}
    </div>
  );
}

// ─── Légende ─────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        background: 'rgba(15,23,42,0.75)',
        borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.1)',
      }}
    >
      <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, alignSelf: 'center', marginRight: '0.25rem' }}>
        Secteurs :
      </span>
      {(Object.keys(SECTOR_META) as Sector[]).map((s) => {
        const m = SECTOR_META[s];
        return (
          <span
            key={s}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '2px 10px',
              borderRadius: 12,
              background: m.bg,
              border: `1px solid ${m.border}`,
              color: m.color,
              fontSize: '0.73rem',
              fontWeight: 600,
            }}
          >
            {m.emoji} {m.label}
          </span>
        );
      })}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function OrganigrammeGBH() {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>('gbh');
  const [filterTerritory, setFilterTerritory] = useState<Territory | 'all'>('all');
  const [filterSector, setFilterSector] = useState<Sector | 'all'>('all');
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const selectedNode = selectedId ? findNode(GBH_TREE, selectedId) : null;

  // Scroll SVG into view on mobile when a node is selected
  useEffect(() => {
    if (selectedId && svgContainerRef.current) {
      svgContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedId]);

  const selectFilter = (style: React.CSSProperties): React.CSSProperties => ({
    background: 'rgba(15,23,42,0.9)',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: 8,
    color: '#e2e8f0',
    padding: '0.4rem 0.75rem',
    fontSize: '0.82rem',
    outline: 'none',
    cursor: 'pointer',
    ...style,
  });

  return (
    <>
      <SEOHead
        title="Organigramme GBH — Structure du Groupe Bernard Hayot — A KI PRI SA YÉ"
        description="Visualisez la structure capitalistique interactive du Groupe Bernard Hayot (GBH), premier groupe de grande distribution des DOM-COM français : filiales, enseignes, territoires et chiffres clés."
        canonical="https://teetee971.github.io/akiprisaye-web/organigrame-gbh"
      />

      <div className="min-h-screen bg-slate-950 text-slate-100">
        {/* ── Hero ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <HeroImage
            src={PAGE_HERO_IMAGES.organigrammeGBH}
            alt="Structure du Groupe Bernard Hayot"
            gradient="from-slate-950 to-slate-800"
            height="h-40 sm:h-52"
          >
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
              🏛️ Organigramme GBH
            </h1>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
              Structure interactive du Groupe Bernard Hayot — premier groupe privé antillais
            </p>
          </HeroImage>

          {/* ── Contexte ── */}
          <section
            style={{
              background: 'rgba(245,158,11,0.07)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 14,
              padding: '1rem 1.25rem',
              marginTop: '1.25rem',
              marginBottom: '1.25rem',
            }}
          >
            <p style={{ margin: 0, color: '#fbbf24', fontSize: '0.82rem', fontWeight: 600 }}>
              ⚠️ Contexte réglementaire
            </p>
            <p style={{ margin: '0.4rem 0 0', color: '#e2e8f0', fontSize: '0.82rem', lineHeight: 1.6 }}>
              Le Groupe Bernard Hayot (GBH) fait l'objet de deux avis majeurs de l'Autorité de la
              concurrence (09-A-45 et 19-A-12) portant sur la concentration des marchés dans les
              DOM. Son positionnement simultané en grande distribution, automobile, hôtellerie et
              importation alimentaire en fait l'acteur économique privé le plus puissant des Antilles
              françaises. Ces données sont issues de sources publiques officielles.
            </p>
          </section>

          {/* ── Filtres ── */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <label style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>
              Territoire :
            </label>
            <select
              value={filterTerritory}
              onChange={(e) => setFilterTerritory(e.target.value as Territory | 'all')}
              style={selectFilter({})}
              aria-label="Filtrer par territoire"
            >
              <option value="all">Tous les territoires</option>
              {(Object.keys(TERRITORY_META) as Territory[]).map((t) => (
                <option key={t} value={t}>
                  {TERRITORY_META[t].flag} {TERRITORY_META[t].label}
                </option>
              ))}
            </select>

            <label style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>
              Secteur :
            </label>
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value as Sector | 'all')}
              style={selectFilter({})}
              aria-label="Filtrer par secteur"
            >
              <option value="all">Tous les secteurs</option>
              {(Object.keys(SECTOR_META) as Sector[]).map((s) => (
                <option key={s} value={s}>
                  {SECTOR_META[s].emoji} {SECTOR_META[s].label}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setCollapsedIds(new Set());
                setSelectedId(null);
                setFilterTerritory('all');
                setFilterSector('all');
              }}
              style={{
                background: 'rgba(148,163,184,0.1)',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: 8,
                color: '#94a3b8',
                padding: '0.4rem 0.75rem',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
              aria-label="Réinitialiser les filtres"
            >
              ↺ Réinitialiser
            </button>
          </div>

          {/* ── Légende ── */}
          <div style={{ marginBottom: '1rem' }}>
            <Legend />
          </div>

          {/* ── Instructions ── */}
          <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '1rem' }}>
            💡 Cliquez sur un nœud pour afficher les détails. Cliquez sur le bouton{' '}
            <strong style={{ color: '#94a3b8' }}>+/−</strong> pour développer ou réduire une
            branche.
          </p>

          {/* ── Layout principal ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: selectedNode ? '1fr 320px' : '1fr',
              gap: '1rem',
              alignItems: 'start',
            }}
          >
            {/* SVG organigram */}
            <div
              ref={svgContainerRef}
              style={{
                background: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(148,163,184,0.1)',
                borderRadius: 16,
                padding: '1rem',
                overflowX: 'auto',
                minHeight: 300,
              }}
            >
              <OrgTree
                root={GBH_TREE}
                collapsedIds={collapsedIds}
                selectedId={selectedId}
                onSelect={handleSelect}
                onToggle={handleToggle}
                filterTerritory={filterTerritory}
                filterSector={filterSector}
              />
            </div>

            {/* Detail panel */}
            {selectedNode && (
              <DetailPanel node={selectedNode} onClose={() => setSelectedId(null)} />
            )}
          </div>

          {/* ── Sources ── */}
          <section
            style={{
              marginTop: '2rem',
              padding: '1rem 1.25rem',
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(148,163,184,0.1)',
              borderRadius: 14,
            }}
          >
            <h2 style={{ margin: '0 0 0.75rem', color: '#f1f5f9', fontSize: '1rem', fontWeight: 700 }}>
              📚 Sources officielles
            </h2>
            <ul style={{ margin: 0, padding: '0 0 0 1.2rem', color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.9 }}>
              <li>
                <a
                  href="https://www.autoritedelaconcurrence.fr/fr/decision/avis-relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer-0"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#60a5fa' }}
                >
                  Autorité de la concurrence — Avis 09-A-45 (2009)
                </a>{' '}
                : Situation de la concurrence dans les DOM
              </li>
              <li>
                <a
                  href="https://www.autoritedelaconcurrence.fr/fr/decision/avis-n19-a-12-du-4-juillet-2019-relatif-aux-prix-et-la-concurrence-dans-le-secteur-de"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#60a5fa' }}
                >
                  Autorité de la concurrence — Avis 19-A-12 (2019)
                </a>{' '}
                : Prix et concurrence dans le secteur de la distribution alimentaire dans les DOM
              </li>
              <li>
                INSEE — Annuaire statistique des entreprises ultramarines 2023
              </li>
              <li>
                CEROM (Comptes Économiques Rapides pour l'Outre-Mer) — Rapport 2022
              </li>
              <li>
                RCS Guadeloupe — Registre du Commerce et des Sociétés, extraits publics
              </li>
            </ul>
            <p style={{ margin: '0.75rem 0 0', color: '#475569', fontSize: '0.72rem', fontStyle: 'italic' }}>
              Les données chiffrées (CA, effectifs) sont des estimations publiques issues des
              rapports officiels. Les structures de filiales sont issues du Registre national des
              entreprises et des avis de l'Autorité de la concurrence.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
