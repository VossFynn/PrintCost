import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';

import { UpdateBannerService } from './update-banner.service';

describe('UpdateBannerService', () => {
  let activateUpdate: ReturnType<typeof vi.fn>;
  let checkForUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    activateUpdate = vi.fn(async () => {});
    checkForUpdate = vi.fn(async () => {});
  });

  it('shows update banner when service worker emits VERSION_READY event', async () => {
    const versionUpdates = {
      subscribe: (observer: { next: (event: VersionReadyEvent) => void }) => {
        observer.next({ type: 'VERSION_READY', currentVersion: { hash: 'old', appData: {} }, latestVersion: { hash: 'new', appData: {} } });
        return { unsubscribe: () => {} };
      }
    };

    const swUpdate = {
      isEnabled: true,
      versionUpdates,
      activateUpdate,
      checkForUpdate
    } as unknown as SwUpdate;

    await TestBed.configureTestingModule({
      providers: [{ provide: SwUpdate, useValue: swUpdate }]
    });
    const service = TestBed.inject(UpdateBannerService);
    service.startMonitoring();

    expect(service.updateAvailable()).toBe(true);
  });

  it('dismiss hides banner state', async () => {
    const swUpdate = {
      isEnabled: true,
      versionUpdates: { subscribe: () => ({ unsubscribe: () => {} }) },
      activateUpdate,
      checkForUpdate
    } as unknown as SwUpdate;

    await TestBed.configureTestingModule({
      providers: [{ provide: SwUpdate, useValue: swUpdate }]
    });
    const service = TestBed.inject(UpdateBannerService);
    service.startMonitoring();
    service.dismiss();
    expect(service.updateAvailable()).toBe(false);
  });
});
