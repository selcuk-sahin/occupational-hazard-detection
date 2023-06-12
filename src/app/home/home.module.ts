import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { HomePage } from './home.page';
import { HomePageRoutingModule } from './home-routing.module';
import { FirestoreTimestampPipeModule } from '../pipes/firestore-timestamp.pipe';
import { CamelcaseToTitlecasePipe } from '../pipes/camelcase-to-titlecase.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    FirestoreTimestampPipeModule,
    CamelcaseToTitlecasePipe,
  ],
  declarations: [HomePage],
})
export class HomePageModule {}
