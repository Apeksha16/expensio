const fs = require('fs');
let content = fs.readFileSync('src/app/features/reports/reports.component.ts', 'utf8');

// 1. Total Spent box
// Currently: p-6 (24px)
content = content.replace(
    /<div class="bg-\[#e11d48\] rounded-\[24px\] p-6 text-\[#ffffff\] shadow-md relative overflow-hidden mb-4">/g,
    '<div class="bg-[#e11d48] rounded-[24px] pt-8 pb-4 px-6 text-[#ffffff] shadow-md relative overflow-hidden mb-4">'
);

// 2. 4 Insight boxes
// Currently: p-5 (20px)
content = content.replace(
    /<div class="w-\[calc\(50%-8px\)\](.*?) p-5 shadow-\[0_2px_10px_rgba\(0,0,0,0\.02\)\] border border-\[#f3f4f6\] flex flex-col justify-center">/g,
    '<div class="w-[calc(50%-8px)]$1 pt-7 pb-3 px-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#f3f4f6] flex flex-col justify-center">'
);

// 3. Total Transactions box
// Currently: px-5 py-4 (16px top/bottom)
content = content.replace(
    /<div class="bg-\[#ffffff\] rounded-\[24px\] px-5 py-4 shadow-\[0_2px_10px_rgba\(0,0,0,0\.02\)\] border border-\[#f3f4f6\] flex items-center justify-between">/g,
    '<div class="bg-[#ffffff] rounded-[24px] px-5 pt-6 pb-2 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#f3f4f6] flex items-center justify-between">'
);

fs.writeFileSync('src/app/features/reports/reports.component.ts', content);
console.log('Applied explicit vertical padding compensation for html2canvas');
