import { TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { ShellComponent } from './shell.component';
import { routes } from '../app.routes';
import { UpdateBannerService } from './update-banner.service';
import { PrinterService } from '../core/printers/printer.service';
import { CustomerService } from '../core/customers/customer.service';

class UpdateBannerServiceStub {
  readonly #updateAvailable = signal(false);
  readonly updateAvailable = this.#updateAvailable.asReadonly();

  startMonitoring(): void {}
  async applyUpdate(): Promise<void> {}
  dismiss(): void {}

  setUpdateAvailable(value: boolean): void {
    this.#updateAvailable.set(value);
  }
}

class PrinterServiceStub {
  readonly printers = signal([]).asReadonly();
  readonly activePrinters = computed(() => []);
  async refresh(): Promise<void> {}
}

class CustomerServiceStub {
  readonly customers = signal([]).asReadonly();
  readonly activeCustomers = computed(() => []);
  async refresh(): Promise<void> {}
}

describe('ShellComponent', () => {
  it('renders non-blocking German update banner when update is available', async () => {
    const service = new UpdateBannerServiceStub();

    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter(routes),
        { provide: UpdateBannerService, useValue: service },
        { provide: PrinterService, useValue: new PrinterServiceStub() },
        { provide: CustomerService, useValue: new CustomerServiceStub() }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Update verfügbar');

    service.setUpdateAvailable(true);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Update verfügbar');
    expect(root.textContent).toContain('Jetzt neu laden');
  });
});
