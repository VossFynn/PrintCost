import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';

@Injectable({
  providedIn: 'root'
})
export class UpdateBannerService {
  readonly #updateAvailable = signal(false);
  readonly #swUpdate = inject(SwUpdate, { optional: true });

  updateAvailable = this.#updateAvailable.asReadonly();

  startMonitoring(): void {
    if (!this.#swUpdate?.isEnabled) {
      return;
    }

    this.#swUpdate.versionUpdates.subscribe({
      next: (event: VersionEvent) => {
        if (event.type === 'VERSION_READY') {
          this.#updateAvailable.set(true);
        }
      },
      error: (error: unknown) => {
        console.error('Update check failed', error);
      }
    });

    this.#swUpdate.checkForUpdate().catch((error: unknown) => {
      console.error('Initial update check failed', error);
    });
  }

  async applyUpdate(): Promise<void> {
    if (this.#swUpdate?.isEnabled) {
      await this.#swUpdate.activateUpdate();
    }

    window.location.reload();
  }

  dismiss(): void {
    this.#updateAvailable.set(false);
  }
}
