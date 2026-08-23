const fs = require('fs');
let content = fs.readFileSync('src/app/features/reports/reports.component.ts', 'utf8');

// Replace Month Wise Filters
content = content.replace(
    /<div class="relative mb-4 -mx-6">/g,
    '<div class="relative mb-4 -mx-4 sm:-mx-6">'
);
content = content.replace(
    /<div class="absolute left-0 top-0 bottom-1 w-6 bg-gradient-to-r from-\[#FAFAFA\] to-transparent z-10 pointer-events-none"><\/div>/g,
    '<div class="absolute left-0 top-0 bottom-1 w-4 sm:w-6 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>'
);
content = content.replace(
    /<div class="absolute right-0 top-0 bottom-1 w-6 bg-gradient-to-l from-\[#FAFAFA\] to-transparent z-10 pointer-events-none"><\/div>/g,
    '<div class="absolute right-0 top-0 bottom-1 w-4 sm:w-6 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>'
);
content = content.replace(
    /<div class="flex gap-3 overflow-x-auto hide-scrollbar pb-1 px-6 snap-x">/g,
    '<div class="flex gap-3 overflow-x-auto hide-scrollbar pb-1 px-4 sm:px-6 snap-x">'
);

// Replace Component Level Filters
content = content.replace(
    /<div class="relative -mx-6">/g,
    '<div class="relative -mx-4 sm:-mx-6">'
);
content = content.replace(
    /<div class="absolute left-0 top-0 bottom-2 w-6 bg-gradient-to-r from-\[#FAFAFA\] to-transparent z-10 pointer-events-none"><\/div>/g,
    '<div class="absolute left-0 top-0 bottom-2 w-4 sm:w-6 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>'
);
content = content.replace(
    /<div class="absolute right-0 top-0 bottom-2 w-6 bg-gradient-to-l from-\[#FAFAFA\] to-transparent z-10 pointer-events-none"><\/div>/g,
    '<div class="absolute right-0 top-0 bottom-2 w-4 sm:w-6 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>'
);
content = content.replace(
    /<div class="flex gap-2 overflow-x-auto hide-scrollbar pb-2 px-6 snap-x">/g,
    '<div class="flex gap-2 overflow-x-auto hide-scrollbar pb-2 px-4 sm:px-6 snap-x">'
);

fs.writeFileSync('src/app/features/reports/reports.component.ts', content);
console.log('Fixed chip margins');
