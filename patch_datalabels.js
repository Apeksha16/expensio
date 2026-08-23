const fs = require('fs');
let content = fs.readFileSync('src/app/features/reports/reports.component.ts', 'utf8');

// 1. Add Import
if (!content.includes('ChartDataLabels')) {
    content = content.replace(
        "import html2canvas from 'html2canvas';",
        "import html2canvas from 'html2canvas';\nimport ChartDataLabels from 'chartjs-plugin-datalabels';"
    );
}

// 2. Globally Register Plugin
if (!content.includes('Chart.register(ChartDataLabels)')) {
    content = content.replace(
        'constructor() {',
        'constructor() {\n    Chart.register(ChartDataLabels);'
    );
}

// 3. Add datalabels config to Doughnut charts
const doughnutRegex = /\s*\},\s*cutout: '65%',/g;
content = content.replace(doughnutRegex, (match) => {
    return `,
          datalabels: {
            color: '#ffffff',
            font: { weight: 'bold', size: 10, family: 'Inter, sans-serif' },
            formatter: (value, ctx) => {
              let sum = 0;
              let dataArr = ctx.chart.data.datasets[0].data;
              dataArr.forEach(data => { sum += Number(data); });
              let percentage = (value * 100 / sum).toFixed(0) + "%";
              return value > 0 ? percentage : '';
            }
          }
        },
        cutout: '65%',`;
});

// 4. Add datalabels config to Bar charts
const barRegex = /legend: \{ display: false \},/g;
content = content.replace(barRegex, (match) => {
    return `legend: { display: false },
          datalabels: {
            color: '#f43f5e',
            anchor: 'end',
            align: 'top',
            offset: 4,
            font: { weight: 'bold', size: 10, family: 'Inter, sans-serif' },
            formatter: (value) => value > 0 ? '₹' + (value >= 1000 ? (value/1000).toFixed(1) + 'k' : value) : ''
          },`;
});

fs.writeFileSync('src/app/features/reports/reports.component.ts', content);
console.log('Added datalabels config successfully!');
