import React, { useEffect, useMemo, useState } from 'react';
import { useFinance } from '../contexts/FinanceContext';
// OpenAI API key is intentionally stored only on the client

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function SettingsView() {
  const { settings, updateSettings, resetToSeed } = useFinance();
  const [apiKey, setApiKey] = useState(settings.openaiApiKey ?? '');
  const [isKeyVisible, setIsKeyVisible] = useState(false);

  // Keep input in sync if user clears data / reloads settings from storage.
  useEffect(() => {
    setApiKey(settings.openaiApiKey ?? '');
  }, [settings.openaiApiKey]);

  const maskedKeyHint = useMemo(() => {
    if (!apiKey) return 'sk-...';
    if (apiKey.length <= 10) return apiKey;
    return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`;
  }, [apiKey]);

  const handleSaveApiKey = async () => {
    await updateSettings({ openaiApiKey: apiKey.trim() || undefined });
  };

  const handleResetData = async () => {
    const ok = confirm(
      'Bạn có chắc chắn muốn đặt lại dữ liệu về mặc định? Tất cả dữ liệu hiện tại sẽ bị xóa.'
    );
    if (!ok) return;

    await resetToSeed();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cấu Hình OpenAI</CardTitle>
          <p className="text-sm text-muted-foreground">
            API key chỉ được lưu trên trình duyệt của bạn (localStorage).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium">
              OpenAI API Key
            </label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type={isKeyVisible ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsKeyVisible((v) => !v)}
                title={isKeyVisible ? 'Ẩn' : 'Hiện'}
              >
                {isKeyVisible ? 'Ẩn' : 'Hiện'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Gợi ý: {maskedKeyHint}</p>
          </div>

          <Button onClick={handleSaveApiKey}>Lưu API Key</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quản Lý Dữ Liệu</CardTitle>
          <p className="text-sm text-muted-foreground">Xóa và đặt lại dữ liệu ứng dụng</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="destructive" onClick={handleResetData}>
            Đặt Lại Dữ Liệu Mặc Định
          </Button>
          <p className="text-xs text-muted-foreground">
            Thao tác này sẽ xóa dữ liệu tài khoản của bạn trên server (SQLite) và khôi phục về mặc định.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông Tin Ứng Dụng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phiên Bản:</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tên Ứng Dụng:</span>
            <span className="font-medium">FineBank</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
