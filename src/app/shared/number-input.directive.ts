import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: 'input[type="number"]',
})
export class NumberInputDirective {
  @HostListener('focus', ['$event'])
  onFocus(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }
}
