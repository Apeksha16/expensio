const fs = require('fs');
let content = fs.readFileSync('src/app/features/reports/reports.component.ts', 'utf8');

// 1. Remove the `< 5%` manual check from formatters, return the label for everything > 0
const newFormatter = `formatter: (value: any, ctx: any) => {
              if (value <= 0) return '';
              return '₹' + (value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value);
            }`;

content = content.replace(/formatter: \(value: any, ctx: any\) => \{[\s\S]*?return '₹' \+ \(value >= 1000 \? \(value \/ 1000\)\.toFixed\(1\) \+ 'k' : value\);\n\s*\}/g, newFormatter);

// 2. Add `display: 'auto'` and reduce font size to 9 for datalabels in doughnut charts
// Note: Datalabels config block looks like:
//          datalabels: {
//            color: '#ffffff',
//            font: { weight: 'bold', size: 10, family: 'Inter, sans-serif' },
//            formatter: ...

content = content.replace(
    /datalabels: \{\n\s*color: '#ffffff',\n\s*font: \{ weight: 'bold', size: 10, family: 'Inter, sans-serif' \},/g,
    `datalabels: {\n            display: 'auto',\n            color: '#ffffff',\n            font: { weight: 'bold', size: 9, family: 'Inter, sans-serif' },`
);

fs.writeFileSync('src/app/features/reports/reports.component.ts', content);
console.log('Fixed label overlap using display: auto');
