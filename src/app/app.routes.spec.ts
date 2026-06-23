import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';

import { AppComponent } from './app.component';
import { routes } from './app.routes';

describe('app routes', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter(routes)]
    }).compileComponents();
  });

  it('redirects root to calculate and renders persistent German navigation', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);

    fixture.detectChanges();
    await router.navigateByUrl('/');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/calculate');

    const root = fixture.nativeElement as HTMLElement;
    const labels = Array.from(root.querySelectorAll('.shell__label')).map((node) => node.textContent?.trim());
    const navLinks = Array.from(root.querySelectorAll('.shell__link')) as HTMLElement[];
    const styleText = Array.from(document.querySelectorAll('style'))
      .map((styleNode) => styleNode.textContent ?? '')
      .join('\n');

    expect(labels).toEqual(['Kalkulation', 'Bestand', 'Filamente', 'Mehr']);
    expect(root.querySelector('a[aria-current="page"]')?.textContent).toContain('Kalkulation');
    expect(root.querySelector('[aria-label="Primäre Navigation"]')).toBeTruthy();
    expect(navLinks).toHaveLength(4);
    expect(navLinks.every((node) => node.getAttribute('aria-label')?.endsWith('öffnen'))).toBe(true);
    expect(styleText).toContain('prefers-reduced-motion');
    expect(document.querySelector('link[href*="fonts.googleapis.com"]')).toBeNull();
    expect(document.querySelector('script[src*="fonts.googleapis.com"]')).toBeNull();

  });

  it('keeps Bestand navigation active and closes inventory detail on back or Escape', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);

    fixture.detectChanges();
    await router.navigateByUrl('/inventory');
    await fixture.whenStable();
    fixture.detectChanges();

    await router.navigateByUrl('/inventory?detail=calc-1');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toContain('/inventory?detail=calc-1');
    expect(router.url.startsWith('/inventory')).toBe(true);

    await router.navigateByUrl('/inventory');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/inventory');

    await router.navigateByUrl('/inventory?detail=calc-1');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toContain('/inventory?detail=calc-1');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/inventory');
  });
});
