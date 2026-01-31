import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { useFinance } from '../contexts/FinanceContext';
import { formatNumber, parseFormattedNumber } from '../utils/helpers';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}

export function CurrencyInput({ value, onChange, placeholder, className }: CurrencyInputProps) {
  const { settings } = useFinance();
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value === 0) {
      setDisplayValue('');
    } else {
      setDisplayValue(formatNumber(value.toString()));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (settings.currency === 'VND') {
      const formatted = formatNumber(inputValue);
      setDisplayValue(formatted);
      
      const numericValue = parseFormattedNumber(formatted);
      onChange(numericValue);
    } else {
      setDisplayValue(inputValue);
      
      const numericValue = inputValue.replace(/[^\d.]/g, '');
      const parsedValue = parseFloat(numericValue);
      
      if (!isNaN(parsedValue)) {
        onChange(parsedValue);
      } else if (inputValue === '') {
        onChange(0);
      }
    }
  };

  const handleBlur = () => {
    if (value > 0) {
      if (settings.currency === 'VND') {
        setDisplayValue(formatNumber(value.toString()));
      } else {
        setDisplayValue(value.toFixed(2));
      }
    }
  };

  const getCurrencySymbol = () => {
    if (settings.currency === 'VND') return '₫';
    if (settings.currency === 'USD') return '$';
    return settings.currency;
  };

  const isSymbolAfter = settings.currency === 'VND';

  return (
    <div className="relative">
      {!isSymbolAfter && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          {getCurrencySymbol()}
        </div>
      )}
      <Input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder || (settings.currency === 'VND' ? '500.000' : '0.00')}
        className={`${!isSymbolAfter ? 'pl-8' : ''} ${isSymbolAfter ? 'pr-8' : ''} ${className}`}
      />
      {isSymbolAfter && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          {getCurrencySymbol()}
        </div>
      )}
    </div>
  );
}