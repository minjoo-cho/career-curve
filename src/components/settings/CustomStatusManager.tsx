import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCustomStatuses, CustomStatus } from '@/hooks/useCustomStatuses';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const COLOR_OPTIONS = [
  { value: 'muted', label: '회색', className: 'bg-muted text-muted-foreground' },
  { value: 'primary', label: '파랑', className: 'bg-primary/10 text-primary' },
  { value: 'success', label: '초록', className: 'bg-success/10 text-success' },
  { value: 'warning', label: '노랑', className: 'bg-warning/10 text-warning' },
  { value: 'destructive', label: '빨강', className: 'bg-destructive/10 text-destructive' },
  { value: 'info', label: '하늘', className: 'bg-info/10 text-info' },
];

export function getColorClassName(color: string): string {
  const found = COLOR_OPTIONS.find((c) => c.value === color);
  return found?.className || 'bg-muted text-muted-foreground';
}

export function CustomStatusManager() {
  const { t } = useLanguage();
  const { customStatuses, addCustomStatus, updateCustomStatus, removeCustomStatus, isLoading } =
    useCustomStatuses();

  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('muted');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('muted');

  const handleAdd = async () => {
    if (!newStatusName.trim()) return;
    await addCustomStatus(newStatusName.trim(), newStatusColor);
    setNewStatusName('');
    setNewStatusColor('muted');
  };

  const startEdit = (status: CustomStatus) => {
    setEditingId(status.id);
    setEditName(status.name);
    setEditColor(status.color);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('muted');
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await updateCustomStatus(editingId, { name: editName.trim(), color: editColor });
    setEditingId(null);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">로딩 중...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {t('settings.customStatusDescription')}
      </div>

      {/* Add new status */}
      <div className="flex gap-2">
        <Input
          placeholder={t('settings.newStatusPlaceholder')}
          value={newStatusName}
          onChange={(e) => setNewStatusName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1"
        />
        <Select value={newStatusColor} onValueChange={setNewStatusColor}>
          <SelectTrigger className="w-24">
            <Badge className={cn('text-xs', getColorClassName(newStatusColor))}>
              {COLOR_OPTIONS.find((c) => c.value === newStatusColor)?.label}
            </Badge>
          </SelectTrigger>
          <SelectContent>
            {COLOR_OPTIONS.map((color) => (
              <SelectItem key={color.value} value={color.value}>
                <Badge className={cn('text-xs', color.className)}>{color.label}</Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="icon" onClick={handleAdd} disabled={!newStatusName.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Existing custom statuses */}
      <div className="space-y-2">
        {customStatuses.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {t('settings.noCustomStatuses')}
          </p>
        ) : (
          customStatuses.map((status) => (
            <div
              key={status.id}
              className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg"
            >
              {editingId === status.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 h-8"
                  />
                  <Select value={editColor} onValueChange={setEditColor}>
                    <SelectTrigger className="w-20 h-8">
                      <Badge className={cn('text-xs', getColorClassName(editColor))}>
                        {COLOR_OPTIONS.find((c) => c.value === editColor)?.label}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_OPTIONS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <Badge className={cn('text-xs', color.className)}>{color.label}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={saveEdit}>
                    <Check className="w-4 h-4 text-success" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelEdit}>
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Badge className={cn('text-xs', getColorClassName(status.color))}>
                    {status.name}
                  </Badge>
                  <span className="flex-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => startEdit(status)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeCustomStatus(status.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
