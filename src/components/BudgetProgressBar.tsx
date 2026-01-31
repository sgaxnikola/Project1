import React from 'react';
import { formatCurrency } from '../utils/helpers';
import { useFinance } from '../contexts/FinanceContext';

interface BudgetProgressBarProps {
  spent: number;
  budget: number;
  categoryName: string;
  color?: string;
  showDetails?: boolean;
}

export function BudgetProgressBar({ 
  spent, 
  budget, 
  categoryName, 
  color = '#3b82f6',
  showDetails = true 
}: BudgetProgressBarProps) {
  const { settings } = useFinance();
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const remaining = budget - spent;

  const getProgressColor = () => {
    if (percentage <= 50) return '#10b981';
    if (percentage <= 80) return '#eab308';
    return '#ef4444';
  };

  const getStatusText = () => {
    if (percentage <= 80) return 'Đúng kế hoạch';
    if (percentage <= 100) return 'Gần đạt hạn mức';
    return 'Vượt ngân sách';
  };

  const getStatusColor = () => {
    if (percentage <= 80) return 'text-green-600 dark:text-green-400';
    if (percentage <= 100) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium">{categoryName}</span>
        </div>
        {showDetails && (
          <span className={`text-xs ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        )}
      </div>
      
      <div 
        className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
      >
        <div 
          className="h-full transition-all duration-300 ease-in-out"
          style={{ 
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: getProgressColor()
          }}
        />
      </div>
      
      {showDetails && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {formatCurrency(spent, settings.currency)} / {formatCurrency(budget, settings.currency)}
          </span>
          <span>
            {remaining >= 0 
              ? `Còn ${formatCurrency(remaining, settings.currency)}`
              : `Vượt ${formatCurrency(Math.abs(remaining), settings.currency)}`
            }
          </span>
        </div>
      )}
    </div>
  );
}