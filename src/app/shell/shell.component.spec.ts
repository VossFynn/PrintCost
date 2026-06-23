import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { ShellComponent } from './shell.component';
import { routes } from '../app.routes';
import { UpdateBannerService } from './update-banner.service';

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

describe('ShellComponent', () => {
  it('renders non-blocking German update banner when update is available', async () => {
    const service = new UpdateBannerServiceStub();

    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [provideRouter(routes), { provide: UpdateBannerService, useValue: service }]
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
