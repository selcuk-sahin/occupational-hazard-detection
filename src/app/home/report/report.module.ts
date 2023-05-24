import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReportPageRoutingModule } from './report-routing.module';

import { ReportPage } from './report.page';
import { DragAndDropDirectiveModule } from 'src/app/directives/drag-and-drop.directive';
import { FormatBytesPipeModule } from 'src/app/pipes/format-bytes.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReportPageRoutingModule,
    DragAndDropDirectiveModule,
    FormatBytesPipeModule,
  ],
  declarations: [ReportPage],
})
export class ReportPageModule {}
