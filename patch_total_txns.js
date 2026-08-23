const fs = require('fs');
let content = fs.readFileSync('src/app/features/reports/reports.component.ts', 'utf8');

const regex = /<div class="bg-\[#ffffff\] rounded-\[24px\] p-5 shadow-\[0_2px_10px_rgba\(0,0,0,0\.02\)\] border border-\[#f3f4f6\] flex items-center justify-between">[\s\S]*?<\/div>/;

const newBlock = `<div class="bg-[#ffffff] rounded-[24px] px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#f3f4f6] flex items-center justify-between">
            <p class="text-[#6b7280] font-medium text-sm leading-tight">Total Transactions</p>
            <p class="text-[#111827] font-bold text-xl leading-tight">{{ totalTransactions }}</p>
          </div>`;

content = content.replace(regex, newBlock);
fs.writeFileSync('src/app/features/reports/reports.component.ts', content);
console.log('Fixed Total Transactions alignment');
