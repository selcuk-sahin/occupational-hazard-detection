import { NgModule, Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'firestoreTimestamp',
})
export class FirestoreTimestampPipe implements PipeTransform {
  constructor(private datePipe: DatePipe) {}
  transform(value: any) {
    if (!value && !value?.seconds) {
      return '--';
    }
    return this.datePipe.transform(value.seconds * 1000);
  }
}

@NgModule({
  declarations: [FirestoreTimestampPipe],
  exports: [FirestoreTimestampPipe],
  providers: [DatePipe],
})
export class FirestoreTimestampPipeModule {}
