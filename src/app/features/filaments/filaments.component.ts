import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-filaments',
  standalone: true,
  templateUrl: './filaments.component.html',
  styleUrl: './filaments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilamentsComponent {}
