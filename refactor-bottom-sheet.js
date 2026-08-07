const fs = require('fs');

const path = 'src/app/shared/ui/bottom-sheet/bottom-sheet.component.ts';
let content = fs.readFileSync(path, 'utf8');

// Add Router import if not present
if (!content.includes("import { Router } from '@angular/router';")) {
  content = content.replace("import { CommonModule } from '@angular/common';", "import { CommonModule } from '@angular/common';\nimport { Router } from '@angular/router';");
}

// Add theme getter in class
const themeGetter = `
  router = inject(Router);

  get theme() {
    const route = this.router.url.split('/')[1] || 'dashboard';
    switch (route) {
      case 'expenses': return { text: 'text-expense-primary', bg: 'bg-expense-primary', border: 'border-expense-primary', focusBorder: 'focus:border-expense-primary', focusRing: 'focus:ring-expense-primary/10', shadow: 'shadow-expense-primary/20', activeBg: 'bg-expense-primary text-white border-expense-primary shadow-md shadow-expense-primary/20' };
      case 'budgets': return { text: 'text-budget-primary', bg: 'bg-budget-primary', border: 'border-budget-primary', focusBorder: 'focus:border-budget-primary', focusRing: 'focus:ring-budget-primary/10', shadow: 'shadow-budget-primary/20', activeBg: 'bg-budget-primary text-white border-budget-primary shadow-md shadow-budget-primary/20' };
      case 'friends': return { text: 'text-friends-primary', bg: 'bg-friends-primary', border: 'border-friends-primary', focusBorder: 'focus:border-friends-primary', focusRing: 'focus:ring-friends-primary/10', shadow: 'shadow-friends-primary/20', activeBg: 'bg-friends-primary text-white border-friends-primary shadow-md shadow-friends-primary/20' };
      case 'splits': return { text: 'text-splits-primary', bg: 'bg-splits-primary', border: 'border-splits-primary', focusBorder: 'focus:border-splits-primary', focusRing: 'focus:ring-splits-primary/10', shadow: 'shadow-splits-primary/20', activeBg: 'bg-splits-primary text-white border-splits-primary shadow-md shadow-splits-primary/20' };
      case 'subscriptions': return { text: 'text-subscriptions-primary', bg: 'bg-subscriptions-primary', border: 'border-subscriptions-primary', focusBorder: 'focus:border-subscriptions-primary', focusRing: 'focus:ring-subscriptions-primary/10', shadow: 'shadow-subscriptions-primary/20', activeBg: 'bg-subscriptions-primary text-white border-subscriptions-primary shadow-md shadow-subscriptions-primary/20' };
      case 'goals': 
      case 'goal-transactions': return { text: 'text-goals-primary', bg: 'bg-goals-primary', border: 'border-goals-primary', focusBorder: 'focus:border-goals-primary', focusRing: 'focus:ring-goals-primary/10', shadow: 'shadow-goals-primary/20', activeBg: 'bg-goals-primary text-white border-goals-primary shadow-md shadow-goals-primary/20' };
      case 'ledger': 
      case 'ledger-details': return { text: 'text-ledger-primary', bg: 'bg-ledger-primary', border: 'border-ledger-primary', focusBorder: 'focus:border-ledger-primary', focusRing: 'focus:ring-ledger-primary/10', shadow: 'shadow-ledger-primary/20', activeBg: 'bg-ledger-primary text-white border-ledger-primary shadow-md shadow-ledger-primary/20' };
      case 'tracker': return { text: 'text-tracker-primary', bg: 'bg-tracker-primary', border: 'border-tracker-primary', focusBorder: 'focus:border-tracker-primary', focusRing: 'focus:ring-tracker-primary/10', shadow: 'shadow-tracker-primary/20', activeBg: 'bg-tracker-primary text-white border-tracker-primary shadow-md shadow-tracker-primary/20' };
      case 'profile': return { text: 'text-profile-primary', bg: 'bg-profile-primary', border: 'border-profile-primary', focusBorder: 'focus:border-profile-primary', focusRing: 'focus:ring-profile-primary/10', shadow: 'shadow-profile-primary/20', activeBg: 'bg-profile-primary text-white border-profile-primary shadow-md shadow-profile-primary/20' };
      case 'reports': return { text: 'text-reports-primary', bg: 'bg-reports-primary', border: 'border-reports-primary', focusBorder: 'focus:border-reports-primary', focusRing: 'focus:ring-reports-primary/10', shadow: 'shadow-reports-primary/20', activeBg: 'bg-reports-primary text-white border-reports-primary shadow-md shadow-reports-primary/20' };
      default: return { text: 'text-expense-primary', bg: 'bg-expense-primary', border: 'border-expense-primary', focusBorder: 'focus:border-expense-primary', focusRing: 'focus:ring-expense-primary/10', shadow: 'shadow-expense-primary/20', activeBg: 'bg-expense-primary text-white border-expense-primary shadow-md shadow-expense-primary/20' };
    }
  }
`;

if (!content.includes('get theme()')) {
  content = content.replace(
    'export class BottomSheetComponent implements OnInit {',
    'export class BottomSheetComponent implements OnInit {\n' + themeGetter
  );
}

// Replace classes in template
content = content.replace(
  /class="w-5 h-5 text-expense-primary"/g,
  'class="w-5 h-5" [ngClass]="theme.text"'
);

content = content.replace(
  /class="w-full bg-white border-2 border-gray-100 text-slate-900 font-bold text-2xl rounded-2xl focus:border-expense-primary focus:ring-4 focus:ring-expense-primary\/10 pl-11 pr-4 py-4 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-300"/g,
  'class="w-full bg-white border-2 border-gray-100 text-slate-900 font-bold text-2xl rounded-2xl pl-11 pr-4 py-4 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-300" [ngClass]="[theme.focusBorder, theme.focusRing]"'
);

content = content.replace(
  /class="w-full bg-white border-2 border-gray-100 text-slate-900 font-semibold text-base rounded-2xl focus:border-expense-primary focus:ring-4 focus:ring-expense-primary\/10 pl-11 pr-4 py-4 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-400"/g,
  'class="w-full bg-white border-2 border-gray-100 text-slate-900 font-semibold text-base rounded-2xl pl-11 pr-4 py-4 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-400" [ngClass]="[theme.focusBorder, theme.focusRing]"'
);

content = content.replace(
  /'bg-expense-primary text-white border-expense-primary shadow-md shadow-expense-primary\/20'/g,
  'theme.activeBg'
);

content = content.replace(
  /class="w-full bg-white border-2 border-gray-100 text-slate-900 font-semibold text-sm rounded-2xl focus:border-expense-primary focus:ring-4 focus:ring-expense-primary\/10 flex justify-between items-center p-4 outline-none transition-all touch-manipulation shadow-sm"/g,
  'class="w-full bg-white border-2 border-gray-100 text-slate-900 font-semibold text-sm rounded-2xl flex justify-between items-center p-4 outline-none transition-all touch-manipulation shadow-sm" [ngClass]="[theme.focusBorder, theme.focusRing]"'
);

content = content.replace(
  /class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-expense-primary text-white shadow-md disabled:opacity-50 disabled:active:scale-100"/g,
  'class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm text-white shadow-md disabled:opacity-50 disabled:active:scale-100" [ngClass]="theme.bg"'
);

fs.writeFileSync(path, content, 'utf8');
