import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-more',
  standalone: true,
  templateUrl: './more.component.html',
  styleUrl: './more.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoreComponent {}
