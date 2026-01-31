import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { TransactionForm } from './TransactionForm';
import { useFinance } from '../contexts/FinanceContext';
import { Transaction } from '../types';
import { formatCurrency, formatDate, getCategoryIcon } from '../utils/helpers';
import { Search, Plus, Filter, Edit, Trash2, Calendar, Download, Upload, Receipt } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

export function TransactionsList() {
  const { transactions, categories, settings, deleteTransaction } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'merchant'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string>('');

  // Export to CSV function
  const exportToCSV = () => {
    const headers = ['Ngày', 'Loại', 'Danh Mục', 'Số Tiền', 'Cửa Hàng/Nguồn', 'Nhãn', 'Ghi Chú'];
    const csvData = filteredAndSortedTransactions.map(transaction => {
      const category = categories.find(c => c.id === transaction.categoryId);
      return [
        new Date(transaction.date).toLocaleDateString('vi-VN'),
        transaction.type === 'income' ? 'Thu Nhập' : 'Chi Tiêu',
        category?.name || '',
        transaction.amount,
        transaction.merchant || '',
        transaction.tags.join('; '),
        transaction.notes || ''
      ];
    });

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `giao-dich-${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`;
    link.click();
  };

  // Export to JSON function
  const exportToJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      transactions: filteredAndSortedTransactions,
      categories: categories
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `giao-dich-${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.json`;
    link.click();
  };

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      // Search filter
      const matchesSearch = !searchTerm || 
        transaction.merchant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      // Type filter
      const matchesType = filterType === 'all' || transaction.type === filterType;

      // Category filter
      const matchesCategory = filterCategory === 'all' || transaction.categoryId === filterCategory;

      return matchesSearch && matchesType && matchesCategory;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'merchant':
          comparison = (a.merchant || '').localeCompare(b.merchant || '');
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchTerm, filterType, filterCategory, sortBy, sortOrder]);

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (transactionToDelete) {
      await deleteTransaction(transactionToDelete);
      setTransactionToDelete('');
    }
    setDeleteDialogOpen(false);
  };

  const handleCloseForm = () => {
    setShowTransactionForm(false);
    setEditingTransaction(undefined);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Giao Dịch</h1>
          <p className="text-muted-foreground">
            {filteredAndSortedTransactions.length} giao dịch
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download size={16} />
                Xuất Dữ Liệu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToCSV}>
                <Download size={16} className="mr-2" />
                Xuất CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToJSON}>
                <Download size={16} className="mr-2" />
                Xuất JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setShowTransactionForm(true)} className="gap-2">
            <Plus size={16} />
            Thêm Giao Dịch
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={(value: 'all' | 'income' | 'expense') => setFilterType(value)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất Cả Loại</SelectItem>
                <SelectItem value="income">Thu Nhập</SelectItem>
                <SelectItem value="expense">Chi Tiêu</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tất Cả Danh Mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất Cả Danh Mục</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {getCategoryIcon(category.icon)} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter size={16} />
                  Sắp Xếp
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder('desc'); }}>
                  <Calendar size={16} className="mr-2" />
                  Mới Nhất Trước
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder('asc'); }}>
                  <Calendar size={16} className="mr-2" />
                  Cũ Nhất Trước
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('amount'); setSortOrder('desc'); }}>
                  Số Tiền (Cao đến Thấp)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('amount'); setSortOrder('asc'); }}>
                  Số Tiền (Thấp đến Cao)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredAndSortedTransactions.length > 0 ? (
          filteredAndSortedTransactions.map((transaction) => {
            const category = categories.find(c => c.id === transaction.categoryId);
            
            return (
              <Card key={transaction.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        {getCategoryIcon(category?.icon || 'other')}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">
                            {transaction.merchant || category?.name || 'Transaction'}
                          </h3>
                          {transaction.isRecurring && (
                            <Badge variant="outline" className="text-xs">
                              Định Kỳ
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{category?.name}</span>
                          <span>•</span>
                          <span>{formatDate(transaction.date)}</span>
                          {transaction.tags.length > 0 && (
                            <>
                              <span>•</span>
                              <div className="flex gap-1">
                                {transaction.tags.slice(0, 2).map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {transaction.tags.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{transaction.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        
                        {transaction.notes && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {transaction.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`text-right ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <div className="font-semibold">
                          {transaction.type === 'expense' ? '-' : '+'}
                          {formatCurrency(transaction.amount, settings.currency)}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                            <Edit size={16} className="mr-2" />
                            Chỉnh Sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="text-red-600"
                          >
                            <Trash2 size={16} className="mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <Receipt size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Không tìm thấy giao dịch</h3>
                <p>Bắt đầu bằng cách thêm giao dịch đầu tiên của bạn.</p>
              </div>
              <Button onClick={() => setShowTransactionForm(true)} className="mt-4 gap-2">
                <Plus size={16} />
                Thêm Giao Dịch
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transaction Form */}
      <TransactionForm
        open={showTransactionForm}
        onClose={handleCloseForm}
        transaction={editingTransaction}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa Giao Dịch</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa giao dịch này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}