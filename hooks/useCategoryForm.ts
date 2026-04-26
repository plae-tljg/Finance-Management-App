import { useState, useCallback } from 'react';
import { useCategoryService } from '@/services/business/CategoryService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import type { Category } from '@/services/database/schemas/Category';

interface UseCategoryFormOptions {
  category?: Category | null;
  onSuccess?: () => void;
}

interface UseCategoryFormReturn {
  name: string;
  icon: string;
  type: 'income' | 'expense';
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  isLoading: boolean;
  setName: (name: string) => void;
  setIcon: (icon: string) => void;
  setType: (type: 'income' | 'expense') => void;
  setSortOrder: (order: number) => void;
  setIsDefault: (isDefault: boolean) => void;
  setIsActive: (isActive: boolean) => void;
  resetForm: () => void;
  submit: () => Promise<boolean>;
}

export function useCategoryForm(options: UseCategoryFormOptions = {}): UseCategoryFormReturn {
  const { category, onSuccess } = options;
  const { isReady, databaseService } = useDatabaseSetup();
  const categoryService = useCategoryService(databaseService);

  const [name, setName] = useState(category?.name || '');
  const [icon, setIcon] = useState(category?.icon || '');
  const [type, setType] = useState<'income' | 'expense'>(category?.type || 'expense');
  const [sortOrder, setSortOrder] = useState(category?.sortOrder || 0);
  const [isDefault, setIsDefault] = useState(category?.isDefault ?? false);
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setName('');
    setIcon('');
    setType('expense');
    setSortOrder(0);
    setIsDefault(false);
    setIsActive(true);
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!categoryService || !isReady) {
      console.error('分类服务未初始化');
      return false;
    }

    if (!name.trim()) {
      alert('请输入分类名称');
      return false;
    }

    if (!icon.trim()) {
      alert('请输入图标');
      return false;
    }

    setIsSubmitting(true);

    try {
      const categoryData = {
        name: name.trim(),
        icon: icon.trim(),
        type,
        sortOrder,
        isDefault,
        isActive,
      };

      if (category?.id) {
        await categoryService.updateCategory(category.id, categoryData);
      } else {
        await categoryService.createCategory(categoryData);
      }

      onSuccess?.();
      return true;
    } catch (error) {
      console.error('保存分类失败:', error);
      alert('保存分类失败，请重试');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [categoryService, isReady, category, name, icon, type, sortOrder, isDefault, isActive, onSuccess]);

  return {
    name,
    icon,
    type,
    sortOrder,
    isDefault,
    isActive,
    isLoading: isSubmitting,
    setName,
    setIcon,
    setType,
    setSortOrder,
    setIsDefault,
    setIsActive,
    resetForm,
    submit,
  };
}