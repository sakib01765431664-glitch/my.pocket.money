import type { Category, Language } from '../types/expense';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

export function formatNumber(value: number, lang: Language, decimals = 0): string {
  const fixed = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  const num = Number(fixed);
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return lang === 'bn' ? toBanglaDigits(formatted) : formatted;
}

export function formatCurrency(amount: number, lang: Language, showDecimals = false): string {
  const abs = Math.abs(amount);
  const decimals = showDecimals && abs % 1 !== 0 ? 2 : 0;
  const formatted = formatNumber(abs, lang, decimals);
  return amount < 0 ? `-৳${formatted}` : `৳${formatted}`;
}

export function formatPercent(value: number, lang: Language): string {
  const rounded = Math.round(value * 10) / 10;
  const decimals = rounded % 1 === 0 ? 0 : 1;
  return `${formatNumber(rounded, lang, decimals)}%`;
}

const MONTHS_BN = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

const MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTHS_SHORT_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_SHORT_BN = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগ', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];

const WEEKDAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatMonthLabel(monthKey: string, lang: Language, short = false): string {
  const [yStr, mStr] = monthKey.split('-');
  const year = Number(yStr);
  const monthIdx = Number(mStr) - 1;
  if (!Number.isFinite(year) || monthIdx < 0 || monthIdx > 11) return monthKey;
  const name =
    lang === 'bn'
      ? short
        ? MONTHS_SHORT_BN[monthIdx]
        : MONTHS_BN[monthIdx]
      : short
        ? MONTHS_SHORT_EN[monthIdx]
        : MONTHS_EN[monthIdx];
  const yr = lang === 'bn' ? toBanglaDigits(year) : String(year);
  return `${name} ${yr}`;
}

export function formatDateLabel(dateStr: string, lang: Language): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(y, m - 1, d);
  const weekday = lang === 'bn' ? WEEKDAYS_BN[dt.getDay()] : WEEKDAYS_EN[dt.getDay()];
  const monthName = lang === 'bn' ? MONTHS_SHORT_BN[m - 1] : MONTHS_SHORT_EN[m - 1];
  const dayStr = lang === 'bn' ? toBanglaDigits(d) : String(d);
  const yearStr = lang === 'bn' ? toBanglaDigits(y) : String(y);
  return `${weekday}, ${dayStr} ${monthName} ${yearStr}`;
}

export function formatTime12h(timeStr: string, lang: Language): string {
  const [hStr, mStr] = timeStr.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return timeStr;
  const period = h >= 12 ? (lang === 'bn' ? 'অপরাহ্ণ' : 'PM') : lang === 'bn' ? 'পূর্বাহ্ণ' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const padM = String(m).padStart(2, '0');
  const formatted = `${h12}:${padM}`;
  return `${lang === 'bn' ? toBanglaDigits(formatted) : formatted} ${period}`;
}

export function getWeekdayHeaders(lang: Language): string[] {
  return lang === 'bn' ? WEEKDAYS_BN : WEEKDAYS_EN;
}

export function getCategoryName(category: Category | undefined, lang: Language): string {
  if (!category) return lang === 'bn' ? 'অন্যান্য' : 'Other';
  return lang === 'bn' ? category.nameBn || category.nameEn : category.nameEn || category.nameBn;
}

export const TEXT = {
  bn: {
    appName: 'My Pocket Money',
    appSubtitle: 'ব্যক্তিগত পকেট খরচ ট্র্যাকার',
    navHome: 'হোম',
    navAdd: 'খরচ যোগ',
    navHistory: 'ইতিহাস',
    navReports: 'রিপোর্ট',
    navSettings: 'সেটিংস',

    // Dashboard
    dashboardTitle: 'আজকের ও মাসিক হিসাব',
    addExpense: 'খরচ যোগ করুন',
    thisMonthTotal: 'এই মাসে মোট খরচ',
    todayTotal: 'আজকের মোট খরচ',
    thisWeekTotal: 'এই সপ্তাহের মোট খরচ',
    dailyAverage: 'দৈনিক গড় খরচ',
    monthEntries: 'মোট এন্ট্রি',
    vsLastMonth: 'গত মাসের তুলনায়',
    calculatedUpTo: 'হিসাবের সময়কাল',
    entriesCountSuffix: 'টি এন্ট্রি',
    noLastMonthData: 'গত মাসে কোনো খরচ ছিল না',
    increasedBy: 'বেড়েছে',
    decreasedBy: 'কমেছে',
    sameAsLastMonth: 'গত মাসের সমান',
    dayLabel: 'তারিখ পর্যন্ত',
    recentExpenses: 'সাম্প্রতিক খরচসমূহ',
    viewAllHistory: 'সব দেখুন',
    noExpensesYet: 'এখনো কোনো খরচ যোগ করা হয়নি',
    noExpensesHint: 'আপনার প্রতিদিনের পকেট খরচের হিসাব রাখতে প্রথম খরচটি যোগ করুন।',
    addFirstExpense: 'প্রথম খরচ যোগ করুন',

    // Budget
    monthlyBudget: 'মাসিক বাজেট',
    totalBudget: 'মোট বাজেট',
    spentSoFar: 'এখন পর্যন্ত খরচ',
    remainingBudget: 'বাকি আছে',
    overspentBy: 'অতিরিক্ত খরচ',
    budgetUsed: 'বাজেট ব্যবহৃত',
    editBudget: 'বাজেট পরিবর্তন',
    budgetWarning80: 'সতর্কতা: আপনার মাসিক বাজেটের ৮০% এর বেশি খরচ হয়ে গেছে!',
    budgetExceeded: 'সতর্কতা: আপনার মাসিক বাজেট অতিক্রম করেছে!',
    budgetUnset: 'মাসিক বাজেট নির্ধারণ করা হয়নি',
    setBudget: 'বাজেট সেট করুন',

    // Add/Edit Form
    newExpenseTitle: 'নতুন খরচ যোগ করুন',
    editExpenseTitle: 'খরচ সম্পাদনা করুন',
    amountLabel: 'টাকার পরিমাণ (BDT ৳)',
    amountPlaceholder: 'যেমন: ১২০',
    categoryLabel: 'ক্যাটাগরি (খাত)',
    newCategoryBtn: '+ নতুন ক্যাটাগরি',
    descriptionLabel: 'বিবরণ (কী কারণে খরচ)',
    descriptionPlaceholder: 'যেমন: দুপুরের খাবার, রিকশা ভাড়া...',
    dateLabel: 'তারিখ',
    timeLabel: 'সময়',
    saveExpense: 'খরচ সংরক্ষণ করুন',
    updateExpense: 'আপডেট করুন',
    cancel: 'বাতিল',
    delete: 'মুছুন',
    edit: 'সম্পাদনা',
    amountError: 'অনুগ্রহ করে ০-এর বেশি সঠিক টাকার পরিমাণ লিখুন।',
    categoryError: 'অনুগ্রহ করে একটি ক্যাটাগরি নির্বাচন করুন।',
    dateError: 'অনুগ্রহ করে সঠিক তারিখ দিন।',

    // Categories
    manageCategories: 'ক্যাটাগরি পরিচালনা',
    addCategoryTitle: 'নতুন ক্যাটাগরি তৈরি করুন',
    editCategoryTitle: 'ক্যাটাগরি পরিবর্তন করুন',
    catNameBn: 'ক্যাটাগরির নাম (বাংলা)',
    catNameEn: 'ক্যাটাগরির নাম (ইংরেজি)',
    catColor: 'রঙ নির্বাচন করুন',
    catIcon: 'আইকন নির্বাচন করুন',
    saveCategory: 'ক্যাটাগরি সংরক্ষণ',
    deleteCategoryWarning: 'এই ক্যাটাগরির খরচগুলো "অন্যান্য" ক্যাটাগরিতে স্থানান্তরিত হবে।',

    // History & Search/Filter & Calendar
    historyTitle: 'দৈনিক খরচের ইতিহাস',
    listView: 'তালিকা',
    calendarView: 'ক্যালেন্ডার',
    searchPlaceholder: 'বিবরণ বা ক্যাটাগরি খুঁজুন...',
    filterByDate: 'তারিখ',
    filterByMonth: 'মাস',
    filterByCategory: 'ক্যাটাগরি',
    allCategories: 'সব ক্যাটাগরি',
    allMonths: 'সব মাস',
    minAmount: 'সর্বনিম্ন ৳',
    maxAmount: 'সর্বোচ্চ ৳',
    clearFilters: 'ফিল্টার মুছুন',
    dailyTotal: 'দিনের মোট',
    noMatchingExpenses: 'আপনার খোঁজা শর্তে কোনো খরচ পাওয়া যায়নি।',
    selectCalendarDate: 'যেকোনো তারিখে ক্লিক করে সেই দিনের বিস্তারিত খরচ দেখুন',
    selectedDateExpenses: 'নির্বাচিত দিনের খরচ',
    noExpensesOnDate: 'এই তারিখে কোনো খরচ হয়নি।',

    // Reports
    reportsTitle: 'খরচের রিপোর্ট ও বিশ্লেষণ',
    tabWeekly: 'সাপ্তাহিক',
    tabMonthly: 'মাসিক',
    tabComparison: 'মাসের তুলনা',
    tabCategories: 'ক্যাটাগরি',
    weeklyReportTitle: 'সাপ্তাহিক খরচের হিসাব',
    highestWeek: 'সর্বোচ্চ খরচের সপ্তাহ',
    lowestWeek: 'সর্বনিম্ন খরচের সপ্তাহ',
    weeklyDailyAvg: 'সাপ্তাহিক দৈনিক গড়',
    vsPrevWeek: 'আগের সপ্তাহের তুলনায়',
    monthlyReportTitle: 'মাসিক পূর্ণাঙ্গ রিপোর্ট',
    highestDay: 'সবচেয়ে বেশি খরচের দিন',
    lowestDay: 'সবচেয়ে কম খরচের দিন',
    categoryBreakdown: 'ক্যাটাগরি অনুযায়ী খরচ',
    monthComparisonTitle: 'একাধিক মাসের তুলনা',
    highestMonth: 'সর্বোচ্চ খরচের মাস',
    lowestMonth: 'সর্বনিম্ন খরচের মাস',
    monthOverMonth: 'আগের মাসের তুলনায় পরিবর্তন',
    categoryAnalysisTitle: 'ক্যাটাগরি ভিত্তিক বিশ্লেষণ',
    noDataForReport: 'এই সময়ের জন্য কোনো খরচের ডেটা নেই।',

    // Settings & Data Management
    settingsTitle: 'সেটিংস ও ডেটা ব্যবস্থাপনা',
    appearanceSection: 'ভাষা ও থিম',
    languageLabel: 'ভাষা (Language)',
    themeLabel: 'ডিসপ্লে মোড',
    lightMode: 'লাইট মোড',
    darkMode: 'ডার্ক মোড',
    budgetSection: 'মাসিক পকেট বাজেট',
    saveBudget: 'বাজেট সংরক্ষণ',
    dataSection: 'ডেটা ব্যাকআপ ও এক্সপোর্ট',
    backupJson: 'JSON ব্যাকআপ ডাউনলোড',
    restoreJson: 'ব্যাকআপ থেকে রিস্টোর (JSON)',
    exportCsv: 'Excel / CSV এক্সপোর্ট',
    dangerZone: 'সব ডেটা মুছুন',
    deleteAllBtn: 'সব খরচ মুছে ফেলুন',
    deleteAllConfirmTitle: 'আপনি কি নিশ্চিত?',
    deleteAllConfirmDesc: 'এটি আপনার ডিভাইসে সংরক্ষিত সব খরচের তালিকা স্থায়ীভাবে মুছে ফেলবে। আগে JSON ব্যাকআপ নিয়ে রাখার পরামর্শ দেওয়া হলো।',
    confirmDeleteAll: 'হ্যাঁ, সব মুছে ফেলুন',
    restoreSuccess: 'ব্যাকআপ থেকে ডেটা সফলভাবে রিস্টোর হয়েছে!',
    restoreError: 'সঠিক JSON ব্যাকআপ ফাইল নির্বাচন করুন।',
    budgetSaved: 'বাজেট সফলভাবে সংরক্ষিত হয়েছে।',
    localPrivacyNote: 'আপনার সব ব্যক্তিগত খরচের তথ্য সম্পূর্ণ বিনামূল্যে এবং নিরাপদে শুধু আপনার নিজের ডিভাইসেই সংরক্ষিত থাকে।',

    // Quick Action & Income
    quickActionsTitle: 'কুইক অ্যাকশন',
    qaAddExpense: 'খরচ যোগ',
    qaAddExpenseSub: 'নতুন খরচ লিখুন',
    qaAddIncome: 'আয় যোগ',
    qaAddIncomeSub: 'পকেট মানি বা আয়',
    qaTodaysExpense: 'আজকের খরচ',
    qaTodaysExpenseSub: 'আজকের বিস্তারিত',
    qaSetBudget: 'মাসিক বাজেট',
    qaSetBudgetSub: 'বাজেট সেট বা বদলান',
    addIncomeTitle: 'নতুন আয় যোগ করুন',
    incomeSourceLabel: 'আয়ের উৎস',
    incomeNoteLabel: 'নোট (ঐচ্ছিক)',
    incomeNotePlaceholder: 'যেমন: মাসের পকেট মানি, টিউশনি...',
    saveIncome: 'আয় সংরক্ষণ করুন',
    thisMonthIncome: 'এই মাসে মোট আয়',
    pocketBalance: 'হাতে থাকা ব্যালেন্স',
    recentIncomes: 'এই মাসের আয়সমূহ',
    noIncomesYet: 'এই মাসে এখনো কোনো আয় যোগ করা হয়নি।',
    todaysExpensesTitle: 'আজকের খরচের তালিকা',
    noExpensesToday: 'আজ এখনো কোনো খরচ যোগ করা হয়নি।',
    quickBudgetTitle: 'মাসিক বাজেট নির্ধারণ',
    quickBudgetHint: 'আপনার এই মাসের পকেট খরচের সর্বোচ্চ সীমা নির্ধারণ করুন।',
  },
  en: {
    appName: 'My Pocket Money',
    appSubtitle: 'Personal Pocket Money Tracker',
    navHome: 'Home',
    navAdd: 'Add Expense',
    navHistory: 'History',
    navReports: 'Reports',
    navSettings: 'Settings',

    // Dashboard
    dashboardTitle: 'Monthly & Daily Overview',
    addExpense: 'Add Expense',
    thisMonthTotal: 'This Month Total',
    todayTotal: "Today's Total",
    thisWeekTotal: 'This Week Total',
    dailyAverage: 'Daily Average',
    monthEntries: 'Month Entries',
    vsLastMonth: 'vs Last Month',
    calculatedUpTo: 'Calculated Up To',
    entriesCountSuffix: 'entries',
    noLastMonthData: 'No spending last month',
    increasedBy: 'Up',
    decreasedBy: 'Down',
    sameAsLastMonth: 'Same as last month',
    dayLabel: 'of month',
    recentExpenses: 'Recent Expenses',
    viewAllHistory: 'View All',
    noExpensesYet: 'No expenses recorded yet',
    noExpensesHint: 'Start tracking your daily pocket spending by logging your first expense.',
    addFirstExpense: 'Add First Expense',

    // Budget
    monthlyBudget: 'Monthly Budget',
    totalBudget: 'Total Budget',
    spentSoFar: 'Spent So Far',
    remainingBudget: 'Remaining',
    overspentBy: 'Overspent By',
    budgetUsed: 'Budget Used',
    editBudget: 'Edit Budget',
    budgetWarning80: 'Warning: You have spent over 80% of your monthly budget!',
    budgetExceeded: 'Alert: You have exceeded your monthly budget!',
    budgetUnset: 'No monthly budget set yet',
    setBudget: 'Set Budget',

    // Add/Edit Form
    newExpenseTitle: 'Add New Expense',
    editExpenseTitle: 'Edit Expense',
    amountLabel: 'Amount (BDT ৳)',
    amountPlaceholder: 'e.g. 120',
    categoryLabel: 'Category',
    newCategoryBtn: '+ New Category',
    descriptionLabel: 'Description (Reason)',
    descriptionPlaceholder: 'e.g. Lunch, rickshaw fare, tea...',
    dateLabel: 'Date',
    timeLabel: 'Time',
    saveExpense: 'Save Expense',
    updateExpense: 'Update Expense',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    amountError: 'Please enter a valid amount greater than 0.',
    categoryError: 'Please select a category.',
    dateError: 'Please select a valid date.',

    // Categories
    manageCategories: 'Manage Categories',
    addCategoryTitle: 'Create New Category',
    editCategoryTitle: 'Edit Category',
    catNameBn: 'Category Name (Bangla)',
    catNameEn: 'Category Name (English)',
    catColor: 'Choose Color',
    catIcon: 'Choose Icon',
    saveCategory: 'Save Category',
    deleteCategoryWarning: 'Expenses in this category will be moved to Other.',

    // History & Search/Filter & Calendar
    historyTitle: 'Daily Expense History',
    listView: 'List View',
    calendarView: 'Calendar',
    searchPlaceholder: 'Search description or category...',
    filterByDate: 'Date',
    filterByMonth: 'Month',
    filterByCategory: 'Category',
    allCategories: 'All Categories',
    allMonths: 'All Months',
    minAmount: 'Min ৳',
    maxAmount: 'Max ৳',
    clearFilters: 'Clear Filters',
    dailyTotal: 'Day Total',
    noMatchingExpenses: 'No expenses match your current filters.',
    selectCalendarDate: 'Tap any date to inspect all expenses from that day',
    selectedDateExpenses: 'Selected Day Expenses',
    noExpensesOnDate: 'No expenses recorded on this date.',

    // Reports
    reportsTitle: 'Expense Reports & Analytics',
    tabWeekly: 'Weekly',
    tabMonthly: 'Monthly',
    tabComparison: 'Comparison',
    tabCategories: 'Categories',
    weeklyReportTitle: 'Weekly Spending Report',
    highestWeek: 'Highest Spending Week',
    lowestWeek: 'Lowest Spending Week',
    weeklyDailyAvg: 'Weekly Daily Avg',
    vsPrevWeek: 'vs Previous Week',
    monthlyReportTitle: 'Monthly Summary Report',
    highestDay: 'Highest Spending Day',
    lowestDay: 'Lowest Spending Day',
    categoryBreakdown: 'Category Breakdown',
    monthComparisonTitle: 'Monthly Comparison',
    highestMonth: 'Highest Month',
    lowestMonth: 'Lowest Month',
    monthOverMonth: 'Change vs Prior Month',
    categoryAnalysisTitle: 'Category Analysis',
    noDataForReport: 'No expense data available for this period.',

    // Settings & Data Management
    settingsTitle: 'Settings & Data Management',
    appearanceSection: 'Language & Appearance',
    languageLabel: 'Language',
    themeLabel: 'Display Theme',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    budgetSection: 'Monthly Pocket Budget',
    saveBudget: 'Save Budget',
    dataSection: 'Backup & Export',
    backupJson: 'Download JSON Backup',
    restoreJson: 'Restore from JSON Backup',
    exportCsv: 'Export Excel / CSV',
    dangerZone: 'Reset All Data',
    deleteAllBtn: 'Delete All Expenses',
    deleteAllConfirmTitle: 'Are you sure?',
    deleteAllConfirmDesc: 'This will permanently delete all expense records stored on this device. Consider downloading a JSON backup first.',
    confirmDeleteAll: 'Yes, Delete Everything',
    restoreSuccess: 'Backup restored successfully!',
    restoreError: 'Please choose a valid JSON backup file.',
    budgetSaved: 'Monthly budget saved.',
    localPrivacyNote: 'All your personal expense data stays 100% free and private right on your own device.',

    // Quick Action & Income
    quickActionsTitle: 'Quick Action',
    qaAddExpense: 'Add Expense',
    qaAddExpenseSub: 'Log a new spend',
    qaAddIncome: 'Add Income',
    qaAddIncomeSub: 'Pocket money or pay',
    qaTodaysExpense: "Today's Expense",
    qaTodaysExpenseSub: 'View today entries',
    qaSetBudget: 'Set Monthly Budget',
    qaSetBudgetSub: 'Update spend limit',
    addIncomeTitle: 'Add New Income',
    incomeSourceLabel: 'Income Source',
    incomeNoteLabel: 'Note (Optional)',
    incomeNotePlaceholder: 'e.g. Monthly allowance, tuition, salary...',
    saveIncome: 'Save Income',
    thisMonthIncome: 'This Month Income',
    pocketBalance: 'Pocket Balance',
    recentIncomes: 'Incomes This Month',
    noIncomesYet: 'No income entries logged this month yet.',
    todaysExpensesTitle: "Today's Expenses",
    noExpensesToday: 'No expenses logged today yet.',
    quickBudgetTitle: 'Set Monthly Budget',
    quickBudgetHint: 'Set your pocket spending limit for this month.',
  },
} as const;
