import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CustomerService } from '../core/customers/customer.service';
import { PrinterService } from '../core/printers/printer.service';
import { UpdateBannerService } from './update-banner.service';

type NavItem = {
  path: string;
  label: string;
  ariaLabel: string;
  icon: string;
  mobileOnly?: boolean;
  desktopOnly?: boolean;
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
  protected readonly printerService = inject(PrinterService);
  protected readonly customerService = inject(CustomerService);

  protected readonly activePrinters = this.printerService.activePrinters;
  protected readonly activeCustomers = this.customerService.activeCustomers;
  protected readonly printerCount = computed(() => this.activePrinters().length);
  protected readonly customerCount = computed(() => this.activeCustomers().length);

  /** Desktop sidebar quick-filter for the printer profile list. */
  protected readonly sidebarSearch = signal('');
  protected readonly filteredPrinters = computed(() => {
    const term = this.sidebarSearch().trim().toLowerCase();
    if (!term) {
      return this.activePrinters();
    }
    return this.activePrinters().filter((printer) => printer.name.toLowerCase().includes(term));
  });

  protected readonly navItems: NavItem[] = [
    { path: '/calculate', label: 'Kalkulation', ariaLabel: 'Kalkulation öffnen', icon: '◎' },
    { path: '/inventory', label: 'Bestand', ariaLabel: 'Bestand öffnen', icon: '▦' },
    { path: '/filaments', label: 'Filamente', ariaLabel: 'Filamente öffnen', icon: '◐' },
    { path: '/more', label: 'Mehr', ariaLabel: 'Mehr öffnen', icon: '⋯', mobileOnly: true }
  ];

  constructor() {
    this.updateBanner.startMonitoring();
    void this.printerService.refresh();
    void this.customerService.refresh();
  }
}
