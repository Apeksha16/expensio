import { Component, input, computed, numberAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }
  `],
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="block"
      style="color: currentColor;"
    >
      @for (path of paths(); track $index) {
        <path
          [attr.d]="path.d"
          [attr.fill]="path.fill"
          [attr.stroke]="path.stroke"
          [attr.stroke-width]="path.strokeWidth"
          [attr.stroke-linecap]="path.strokeLinecap"
          [attr.stroke-linejoin]="path.strokeLinejoin"
        />
      }
    </svg>
  `,
})
export class AppIconComponent {
  icon = input<any>();
  size = input(24, { transform: numberAttribute });

  paths = computed(() => {
    const iconData = this.icon();
    if (!iconData || !Array.isArray(iconData)) return [];
    return iconData.map(([_, attrs]: [string, Record<string, string>]) => ({
      d: attrs['d'],
      fill: attrs['fill'] || 'none',
      stroke: attrs['stroke'] || 'currentColor',
      strokeWidth: attrs['strokeWidth'] || '1.5',
      strokeLinecap: attrs['strokeLinecap'] || 'round',
      strokeLinejoin: attrs['strokeLinejoin'] || 'round',
    }));
  });
}
