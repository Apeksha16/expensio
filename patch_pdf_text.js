const fs = require('fs');
let content = fs.readFileSync('src/app/features/reports/reports.component.ts', 'utf8');

// 1. Total Spent
content = content.replace(
    /<p class="text-\[rgba\(255,255,255,0\.8\)\] font-medium text-sm mb-1 relative z-10 m-0">Total Spent<\/p>/g,
    '<div class="text-[rgba(255,255,255,0.8)] font-medium text-sm mb-2 relative z-10 m-0 leading-none">Total Spent</div>'
);
content = content.replace(
    /<h2 class="text-4xl font-bold tracking-tight relative z-10 m-0">\{\{ totalSpent \| currency: 'INR' : 'symbol' : '1\.0-0' \}\}<\/h2>/g,
    '<div class="text-4xl font-bold tracking-tight relative z-10 m-0 leading-none">{{ totalSpent | currency: \'INR\' : \'symbol\' : \'1.0-0\' }}</div>'
);

// 2. The 4 Insight Boxes
content = content.replace(
    /<p class="text-\[#6b7280\] font-medium text-xs mb-1">(.*?)<\/p>/g,
    '<div class="text-[#6b7280] font-medium text-xs mb-2 leading-none m-0">$1</div>'
);
content = content.replace(
    /<p class="text-\[#111827\] font-bold text-xl leading-tight">(.*?)<\/p>/g,
    '<div class="text-[#111827] font-bold text-xl leading-none m-0">$1</div>'
);
content = content.replace(
    /<p class="text-\[#111827\] font-bold text-base leading-tight">(.*?)<\/p>/g,
    '<div class="text-[#111827] font-bold text-base leading-none m-0">$1</div>'
);

// 3. Headers
content = content.replace(
    /<h1 class="text-3xl font-bold text-\[#111827\] tracking-tight m-0">Expensio Report<\/h1>/g,
    '<div class="text-3xl font-bold text-[#111827] tracking-tight m-0 leading-none">Expensio Report</div>'
);
content = content.replace(
    /<p class="text-\[#6b7280\] mt-2 mb-0">Generated for: \{\{ getActiveFiltersText\(\) \}\}<\/p>/g,
    '<div class="text-[#6b7280] mt-3 mb-0 leading-none m-0">Generated for: {{ getActiveFiltersText() }}</div>'
);
content = content.replace(
    /<h2 class="text-xl font-bold text-\[#111827\] mb-4 m-0">Overview<\/h2>/g,
    '<div class="text-xl font-bold text-[#111827] mb-4 m-0 leading-none">Overview</div>'
);
content = content.replace(
    /<h2 class="text-xl font-bold text-\[#111827\] mb-4 m-0">Analytics<\/h2>/g,
    '<div class="text-xl font-bold text-[#111827] mb-4 m-0 leading-none">Analytics</div>'
);
content = content.replace(
    /<h3 class="font-bold text-\[#be123c\] mb-2 m-0">(.*?)<\/h3>/g,
    '<div class="font-bold text-[#be123c] mb-3 m-0 leading-none">$1</div>'
);

fs.writeFileSync('src/app/features/reports/reports.component.ts', content);
console.log('Fixed all text elements for html2canvas PDF rendering');
