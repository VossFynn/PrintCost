import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Shared feature page header.
 *
 * Renders a consistent lead block (icon tile · eyebrow · title · subtitle) on the
 * left and a projected actions slot on the right. Responsive: on narrow screens
 * the projected actions wrap to a full-width row beneath the title.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div class="page-header__lead">
        @if (icon) {
          <span class="page-header__icon" aria-hidden="true">{{ icon }}</span>
        }
        <div class="page-header__text">
          @if (eyebrow) {
            <span class="page-header__eyebrow">{{ eyebrow }}</span>
          }
          <h1 class="page-header__title">{{ heading }}</h1>
          @if (subtitle) {
            <p class="page-header__subtitle">{{ subtitle }}</p>
          }
        </div>
      </div>
      <div class="page-header__actions">
        <ng-content></ng-content>
      </div>
    </header>
  `,
  styleUrl: './page-header.component.scss'
})
export class PageHeaderComponent {
  @Input() icon = '';
  @Input() eyebrow = '';
  @Input() heading = '';
  @Input() subtitle = '';
}
