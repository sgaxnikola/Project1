import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { formatCurrency } from '../utils/helpers';
import { useFinance } from '../contexts/FinanceContext';

interface StatCardProps {
  title: string;
  amount: number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'income' | 'expense' | 'neutral';
}

export function StatCard({ 
  title, 
  amount, 
  change, 
  changeLabel, 
  icon, 
  variant = 'default' 
}: StatCardProps) {
  const { settings } = useFinance();

  const getVariantStyles = () => {
    switch (variant) {
      case 'income':
        return 'border-l-4 border-l-green-500';
      case 'expense':
        return 'border-l-4 border-l-red-500';
      case 'neutral':
        return 'border-l-4 border-l-blue-500';
      default:
        return '';
    }
  };

  const getAmountColor = () => {
    switch (variant) {
      case 'income':
        return 'text-green-700 dark:text-green-400';
      case 'expense':
        return 'text-red-700 dark:text-red-400';
      case 'neutral':
        return 'text-blue-700 dark:text-blue-400';
      default:
        return 'text-foreground';
    }
  };

  return (
    <Card className={getVariantStyles()}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${getAmountColor()}`}>
          {variant === 'expense' && amount > 0 && (
            <span className="text-red-600 dark:text-red-400">-</span>
          )}
          {formatCurrency(Math.abs(amount), settings.currency)}
        </div>
        {change !== undefined && changeLabel && (
          <p className="text-xs text-muted-foreground mt-1">
            <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
            {' '}{changeLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}