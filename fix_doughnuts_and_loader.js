const fs = require('fs');
let content = fs.readFileSync('src/app/features/reports/reports.component.ts', 'utf8');

// 1. Add ChangeDetectorRef to imports if it doesn't exist
if (!content.includes('ChangeDetectorRef')) {
    content = content.replace(
        /ChangeDetectionStrategy,\n} from '@angular\/core';/,
        "ChangeDetectionStrategy,\n  ChangeDetectorRef,\n} from '@angular/core';"
    );
}

// 2. Inject ChangeDetectorRef
if (!content.includes('cdr = inject(ChangeDetectorRef)')) {
    content = content.replace(
        /reportService = inject\(ReportService\);/,
        "reportService = inject(ReportService);\n  cdr = inject(ChangeDetectorRef);"
    );
}

// 3. Fix the datalabel formatters
content = content.replace(
    /formatter: \(value: any, ctx: any\) => \{[\s\S]*?return value > 0 \? percentage : '';\n\s*\}/g,
    `formatter: (value: any) => value > 0 ? '₹' + (value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value) : ''`
);

// 4. Update the finally block in downloadPDF to call cdr.detectChanges()
content = content.replace(
    /this\.isDownloading = false;\n\s*\}/,
    "this.isDownloading = false;\n      this.cdr.detectChanges();\n    }"
);

fs.writeFileSync('src/app/features/reports/reports.component.ts', content);
console.log('Fixed formatters and loader update');
