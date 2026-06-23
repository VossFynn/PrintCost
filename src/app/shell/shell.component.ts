import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UpdateBannerService } from './update-banner.service';

type NavItem = {
  path: string;
  label: string;
  ariaLabel: string;
  icon: string;
};

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShellComponent {
  protected readonly updateBanner = inject(UpdateBannerService);
  protected readonly navItems: NavItem[] = [
    { path: '/calculate', label: 'Kalkulation', ariaLabel: 'Kalkulation öffnen', icon: '◎' },
    { path: '/inventory', label: 'Bestand', ariaLabel: 'Bestand öffnen', icon: '▦' },
    { path: '/filaments', label: 'Filamente', ariaLabel: 'Filamente öffnen', icon: '◐' },
    { path: '/more', label: 'Mehr', ariaLabel: 'Mehr öffnen', icon: '⋯' }
  ];

  constructor() {
    this.updateBanner.startMonitoring();
  }
}
