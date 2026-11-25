import type { AppSettings, Category, CategoryIconKey } from '../types/expense';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat_food',
    nameBn: 'খাবার',
    nameEn: 'Food',
    color: '#059669',
    icon: 'utensils',
    isDefault: true,
  },
  {
    id: 'cat_transport',
    nameBn: 'যাতায়াত',
    nameEn: 'Transport',
    color: '#0284C7',
    icon: 'bus',
    isDefault: true,
  },
  {
    id: 'cat_tea',
    nameBn: 'চা ও নাস্তা',
    nameEn: 'Tea & Snacks',
    color: '#D97706',
    icon: 'coffee',
    isDefault: true,
  },
  {
    id: 'cat_mobile',
    nameBn: 'মোবাইল রিচার্জ',
    nameEn: 'Mobile Recharge',
    color: '#7C3AED',
    icon: 'smartphone',
    isDefault: true,
  },
  {
    id: 'cat_entertainment',
    nameBn: 'বিনোদন',
    nameEn: 'Entertainment',
    color: '#DB2777',
    icon: 'film',
    isDefault: true,
  },
  {
    id: 'cat_shopping',
    nameBn: 'কেনাকাটা',
    nameEn: 'Shopping',
    color: '#EA580C',
    icon: 'shopping-bag',
    isDefault: true,
  },
  {
    id: 'cat_friends',
    nameBn: 'বন্ধুদের সঙ্গে খরচ',
    nameEn: 'With Friends',
    color: '#0D9488',
    icon: 'users',
    isDefault: true,
  },
  {
    id: 'cat_other',
    nameBn: 'অন্যান্য',
    nameEn: 'Other',
    color: '#64748B',
    icon: 'more-horizontal',
    isDefault: true,
  },
];

export const CATEGORY_COLOR_PALETTE: string[] = [
  '#059669',
  '#0284C7',
  '#D97706',
  '#7C3AED',
  '#DB2777',
  '#EA580C',
  '#0D9488',
  '#DC2626',
  '#4F46E5',
  '#64748B',
];

export const CATEGORY_ICON_OPTIONS: CategoryIconKey[] = [
  'utensils',
  'bus',
  'coffee',
  'smartphone',
  'film',
  'shopping-bag',
  'users',
  'home',
  'heart',
  'book',
  'gift',
  'zap',
  'briefcase',
  'more-horizontal',
];

export const DEFAULT_SETTINGS: AppSettings = {
  monthlyBudget: 5000,
  language: 'bn',
  theme: 'light',
};
