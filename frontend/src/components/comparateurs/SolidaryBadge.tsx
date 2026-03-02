/**
 * Solidary Badge Component
 * 
 * Visual badge to identify solidarity-focused products and services:
 * - Local products
 * - Fair trade
 * - Social economy
 * - Public services
 * - Free services
 * - Eco-friendly
 */

import React from 'react';
import type { SolidaryBadgeType } from '../../types/comparatorCommon';

export interface SolidaryBadgeProps {
  /** Type of solidarity badge */
  type: SolidaryBadgeType;
  /** Optional custom label (overrides default) */
  label?: string;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Show tooltip on hover */
  showTooltip?: boolean;
}

/**
 * Configuration for each badge type
 */
const BADGE_CONFIG: Record<
  SolidaryBadgeType,
  {
    label: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    tooltip: string;
  }
> = {
  local: {
    label: 'Produit local',
    icon: '🌿',
    color: 'text-green-300',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    tooltip: 'Produit fabriqué ou cultivé localement, soutient l\'économie locale',
  },
  fair_trade: {
    label: 'Commerce équitable',
    icon: '🤝',
    color: 'text-blue-300',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    tooltip: 'Produit issu du commerce équitable, garantit une rémunération juste',
  },
  social: {
    label: 'Économie solidaire',
    icon: '🎗️',
    color: 'text-orange-300',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    tooltip: 'Économie sociale et solidaire, impact social positif',
  },
  public: {
    label: 'Service public',
    icon: '🏛️',
    color: 'text-gray-300',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    tooltip: 'Service public, accessible à tous',
  },
  free: {
    label: 'Gratuit',
    icon: '🆓',
    color: 'text-purple-300',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    tooltip: 'Service ou produit gratuit',
  },
  eco: {
    label: 'Écologique',
    icon: '♻️',
    color: 'text-emerald-300',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    tooltip: 'Produit respectueux de l\'environnement',
  },
};

/**
 * Size configuration
 */
const SIZE_CONFIG = {
  small: {
    container: 'px-2 py-0.5 text-xs',
    icon: 'text-sm',
  },
  medium: {
    container: 'px-3 py-1 text-sm',
    icon: 'text-base',
  },
  large: {
    container: 'px-4 py-1.5 text-base',
    icon: 'text-lg',
  },
};

/**
 * Solidary Badge Component
 */
export const SolidaryBadge: React.FC<SolidaryBadgeProps> = ({
  type,
  label,
  size = 'medium',
  showTooltip = true,
}) => {
  const config = BADGE_CONFIG[type];
  const sizeConfig = SIZE_CONFIG[size];
  const displayLabel = label || config.label;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border
        ${config.color} ${config.bgColor} ${config.borderColor}
        ${sizeConfig.container}
        font-medium transition-all
        ${showTooltip ? 'cursor-help' : ''}
      `}
      title={showTooltip ? config.tooltip : undefined}
      aria-label={displayLabel}
    >
      <span className={sizeConfig.icon} aria-hidden="true">
        {config.icon}
      </span>
      <span>{displayLabel}</span>
    </span>
  );
};

export default SolidaryBadge;
