export type Language = 'bn' | 'en';
export type ThemeMode = 'light' | 'dark';
export type NavTab = 'home' | 'add' | 'history' | 'reports' | 'settings';
export type ReportSubTab = 'weekly' | 'monthly' | 'comparison' | 'categories';
export type HistoryViewMode = 'list' | 'calendar';

export type CategoryIconKey =
  | 'utensils'
  | 'bus'
  | 'coffee'
  | 'smartphone'
  | 'film'
  | 'shopping-bag'
  | 'users'
  | 'more-horizontal'
  | 'heart'
  | 'book'
  | 'home'
  | 'gift'
  | 'zap'
  | 'briefcase';

export interface Category {
  id: string;
  nameBn: string;
  nameEn: string;
  color: string;
  icon: CategoryIconKey;
  isDefault?: boolean;
}

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  description: string;
  date: string; // YYYY-MM-DD (local date)
  time: string; // HH:mm (24h local time)
  createdAt: number;
  updatedAt: number;
}

export interface IncomeEntry {
  id: string;
  amount: number;
  source: string;
  note: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  monthlyBudget: number;
  language: Language;
  theme: ThemeMode;
}

export interface AppDataBackup {
  version: number;
  exportedAt: string;
  expenses: Expense[];
  incomes?: IncomeEntry[];
  categories: Category[];
  settings: AppSettings;
}

export interface ExpenseFilters {
  searchQuery: string;
  date: string; // exact YYYY-MM-DD or ''
  month: string; // YYYY-MM or ''
  categoryId: string; // category id or ''
  minAmount: string;
  maxAmount: string;
}

export interface DashboardMetrics {
  monthTotal: number;
  todayTotal: number;
  weekTotal: number;
  dailyAverage: number;
  entryCount: number;
  lastMonthTotal: number;
  monthDiffAmount: number;
  monthDiffPercent: number | null; // null if last month was 0 and current > 0
  calculatedUpToDay: number;
  daysInMonth: number;
  currentMonthKey: string; // YYYY-MM
}

export interface BudgetSummary {
  budget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: 'unset' | 'normal' | 'warning' | 'exceeded';
}

export interface WeeklyBucket {
  weekIndex: number;
  labelEn: string;
  labelBn: string;
  startDate: string;
  endDate: string;
  total: number;
  entryCount: number;
  dailyAverage: number;
  daysCount: number;
}

export interface WeeklyReportData {
  monthKey: string;
  weeks: WeeklyBucket[];
  highestWeek: WeeklyBucket | null;
  lowestWeek: WeeklyBucket | null;
  currentWeekTotal: number;
  previousWeekTotal: number;
  weekDiffAmount: number;
  weekDiffPercent: number | null;
  overallWeeklyDailyAvg: number;
}

export interface DaySummary {
  date: string;
  total: number;
  entryCount: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  nameBn: string;
  nameEn: string;
  color: string;
  icon: CategoryIconKey;
  total: number;
  percentage: number;
  entryCount: number;
}

export interface MonthlyReportData {
  monthKey: string;
  startDate: string;
  endDate: string;
  total: number;
  dailyAverage: number;
  entryCount: number;
  highestDay: DaySummary | null;
  lowestDay: DaySummary | null;
  categoryBreakdown: CategoryBreakdownItem[];
}

export interface MonthlyComparisonItem {
  monthKey: string;
  total: number;
  entryCount: number;
  diffAmount: number;
  diffPercent: number | null;
}

export interface MonthlyComparisonData {
  items: MonthlyComparisonItem[];
  highestMonth: MonthlyComparisonItem | null;
  lowestMonth: MonthlyComparisonItem | null;
}

export interface DailyHistoryGroup {
  date: string;
  total: number;
  entries: Expense[];
}
