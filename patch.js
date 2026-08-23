const fs = require('fs');
let content = fs.readFileSync('src/app/features/reports/reports.component.ts', 'utf8');

const regex = /<div #pdfContainer class="absolute -left-\[9999px\] top-0 w-\[800px\] bg-\[#FAFAFA\] p-8 flex flex-col gap-6" style="pointer-events: none;">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*`,/;

const newTemplate = `<div #pdfContainer class="absolute -left-[9999px] top-0 w-[800px] bg-[#FAFAFA] p-8 flex flex-col" style="pointer-events: none;">
        <!-- Header -->
        <div class="border-b border-[#e5e7eb] pb-4 mb-6">
          <h1 class="text-3xl font-bold text-[#111827] tracking-tight m-0">Expensio Report</h1>
          <p class="text-[#6b7280] mt-2 mb-0">Generated for: {{ getActiveFiltersText() }}</p>
        </div>

        <!-- Insights -->
        <div class="flex flex-col mb-6">
          <h2 class="text-xl font-bold text-[#111827] mb-4 m-0">Overview</h2>
          
          <div class="bg-[#e11d48] rounded-[24px] p-6 text-[#ffffff] shadow-md relative overflow-hidden mb-4">
            <p class="text-[rgba(255,255,255,0.8)] font-medium text-sm mb-1 relative z-10 m-0">Total Spent</p>
            <h2 class="text-4xl font-bold tracking-tight relative z-10 m-0">{{ totalSpent | currency: 'INR' : 'symbol' : '1.0-0' }}</h2>
          </div>

          <!-- 4 Insights boxes using flex wrap instead of grid -->
          <div class="flex flex-wrap w-full mb-4">
            <div class="w-[calc(50%-8px)] mr-[16px] mb-[16px] bg-[#ffffff] rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#f3f4f6] flex flex-col justify-center">
              <p class="text-[#6b7280] font-medium text-xs mb-1 m-0">Daily Average</p>
              <p class="text-[#111827] font-bold text-lg m-0">{{ dailyAverage | currency: 'INR' : 'symbol' : '1.0-0' }}</p>
            </div>
            <div class="w-[calc(50%-8px)] mb-[16px] bg-[#ffffff] rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#f3f4f6] flex flex-col justify-center">
              <p class="text-[#6b7280] font-medium text-xs mb-1 m-0">Largest Spend</p>
              <p class="text-[#111827] font-bold text-lg m-0">{{ largestSpend | currency: 'INR' : 'symbol' : '1.0-0' }}</p>
            </div>
            <div class="w-[calc(50%-8px)] mr-[16px] bg-[#ffffff] rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#f3f4f6] flex flex-col justify-center">
              <p class="text-[#6b7280] font-medium text-xs mb-1 m-0">Top Category</p>
              <p class="text-[#111827] font-bold text-sm truncate m-0">{{ highestCategory }}</p>
            </div>
            <div class="w-[calc(50%-8px)] bg-[#ffffff] rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#f3f4f6] flex flex-col justify-center">
              <p class="text-[#6b7280] font-medium text-xs mb-1 m-0">Top Payment</p>
              <p class="text-[#111827] font-bold text-sm truncate m-0">{{ topPaymentMethod }}</p>
            </div>
          </div>
          
          <div class="bg-[#ffffff] rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#f3f4f6] flex items-center justify-between">
            <div>
              <p class="text-[#6b7280] font-medium text-sm m-0">Total Transactions</p>
            </div>
            <p class="text-[#111827] font-bold text-xl m-0">{{ totalTransactions }}</p>
          </div>
        </div>

        <!-- Charts -->
        <div class="flex flex-col mt-2">
          <h2 class="text-xl font-bold text-[#111827] mb-4 m-0">Analytics</h2>
          
          <!-- Spending Trend (Full Width) -->
          <div class="bg-[#fff1f2] rounded-[24px] p-5 mb-4">
            <h3 class="font-bold text-[#be123c] mb-2 m-0">Spending Trend</h3>
            <div class="h-48 relative w-full">
              <canvas #pdfTrendChart></canvas>
            </div>
          </div>

          <!-- Category & Payment (Side by Side) -->
          <div class="flex w-full">
            <div class="w-[calc(50%-8px)] mr-[16px] bg-[#fff1f2] rounded-[24px] p-5">
              <h3 class="font-bold text-[#be123c] mb-2 m-0">Category Distribution</h3>
              <div class="h-48 relative w-full">
                <canvas #pdfCategoryChart></canvas>
              </div>
            </div>

            <div class="w-[calc(50%-8px)] bg-[#fff1f2] rounded-[24px] p-5">
              <h3 class="font-bold text-[#be123c] mb-2 m-0">Payment Methods</h3>
              <div class="h-48 relative w-full">
                <canvas #pdfPaymentChart></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  \`,`;

content = content.replace(regex, newTemplate);
fs.writeFileSync('src/app/features/reports/reports.component.ts', content);
console.log('Patched layout');
