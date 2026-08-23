const fs = require('fs');
let content = fs.readFileSync('src/app/features/reports/reports.component.ts', 'utf8');

// Fix double comma `},,` -> `},`
content = content.replace(/\},\,/g, '},');

// Fix strict type missing `any` in formatters
content = content.replace(/formatter: \(value, ctx\) =>/g, 'formatter: (value: any, ctx: any) =>');
content = content.replace(/formatter: \(value\) =>/g, 'formatter: (value: any) =>');
content = content.replace(/dataArr\.forEach\(data =>/g, 'dataArr.forEach((data: any) =>');

fs.writeFileSync('src/app/features/reports/reports.component.ts', content);
console.log('Fixed TS errors in chart datalabels configuration');
