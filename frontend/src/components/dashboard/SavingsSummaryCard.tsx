import React from 'react';

interface SavingsSummaryCardProps {
  title: string;
  amount: number;
  icon: string;
  subtitle?: string;
  trend?: number; // percentage change
  className?: string;
}

export default function SavingsSummaryCard({
  title,
  amount,
  icon,
  subtitle,
  trend,
  className = ''
}: SavingsSummaryCardProps) {
  const formattedAmount = amount.toFixed(2);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {formattedAmount}€
            </p>
            {trend !== undefined && (
              <span
                className={`text-sm font-medium ${
                  trend > 0
                    ? 'text-green-600 dark:text-green-400'
                    : trend < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {trend > 0 ? '↑' : trend < 0 ? '↓' : '•'} {Math.abs(trend)}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className="text-4xl ml-4">{icon}</div>
      </div>
    </div>
  );
}
