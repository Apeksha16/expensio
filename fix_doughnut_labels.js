const fs = require('fs');
let content = fs.readFileSync('src/app/features/reports/reports.component.ts', 'utf8');

const newFormatter = `formatter: (value: any, ctx: any) => {
              if (value <= 0) return '';
              let sum = 0;
              let dataArr = ctx.chart.data.datasets[0].data;
              dataArr.forEach((data: any) => { sum += Number(data); });
              if ((value * 100 / sum) < 5) return '';
              return '₹' + (value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value);
            }`;

// Replace only the 4 occurrences before the bar charts
let count = 0;
content = content.replace(/formatter: \(value: any\) => value > 0 \? '₹' \+ \(value >= 1000 \? \(value \/ 1000\)\.toFixed\(1\) \+ 'k' : value\) : ''/g, (match, offset) => {
    count++;
    if (count <= 4) {
        return newFormatter;
    }
    return match; // Leave the bar chart formatters alone
});

fs.writeFileSync('src/app/features/reports/reports.component.ts', content);
console.log('Fixed overlapping labels for small slices');
