const fs = require('fs');
let content = fs.readFileSync('src/app/features/reports/reports.component.ts', 'utf8');

content = content.replace(
    /<p class="text-\[#111827\] font-bold text-sm truncate m-0">\{\{ highestCategory \}\}<\/p>/g,
    '<p class="text-[#111827] font-bold text-base leading-tight">{{ highestCategory }}</p>'
);

content = content.replace(
    /<p class="text-\[#111827\] font-bold text-sm truncate m-0">\{\{ topPaymentMethod \}\}<\/p>/g,
    '<p class="text-[#111827] font-bold text-base leading-tight">{{ topPaymentMethod }}</p>'
);

// Also remove `m-0` from the labels to restore the `mb-1` spacing
content = content.replace(
    /<p class="text-\[#6b7280\] font-medium text-xs mb-1 m-0">/g,
    '<p class="text-[#6b7280] font-medium text-xs mb-1">'
);

// And remove m-0 from the Daily Average / Largest spend values
content = content.replace(
    /<p class="text-\[#111827\] font-bold text-lg m-0">/g,
    '<p class="text-[#111827] font-bold text-xl leading-tight">'
);

fs.writeFileSync('src/app/features/reports/reports.component.ts', content);
console.log('Fixed text truncation');
