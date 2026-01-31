import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useFinance } from '../contexts/FinanceContext';
import { getCategoryIcon } from '../utils/helpers';

interface CategoryPickerProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'income' | 'expense';
  className?: string;
}

export function CategoryPicker({ value, onChange, type, className }: CategoryPickerProps) {
  const { categories } = useFinance();
  
  const filteredCategories = type 
    ? categories.filter(category => category.type === type)
    : categories;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Chọn danh mục" />
      </SelectTrigger>
      <SelectContent>
        {filteredCategories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            <div className="flex items-center gap-2">
              <span>{getCategoryIcon(category.icon)}</span>
              <span>{category.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}