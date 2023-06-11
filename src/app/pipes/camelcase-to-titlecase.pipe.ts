import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'camelcaseToTitlecase',
  standalone: true,
})
export class CamelcaseToTitlecasePipe implements PipeTransform {
  transform(value: string): string {
    return value
      .split(/(?=[A-Z])/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
