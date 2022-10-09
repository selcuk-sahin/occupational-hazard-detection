import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFunctions, getFunctions } from '@angular/fire/functions';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { DragAndDropDirectiveModule } from './directives/drag-and-drop.directive';
import { FormatBytesPipeModule } from './pipes/format-bytes.pipe';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFunctions(() => getFunctions()),
    provideStorage(() => getStorage()),
    provideFirestore(() => getFirestore()),
    DragAndDropDirectiveModule,
    FormatBytesPipeModule,
  ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
  exports: [DragAndDropDirectiveModule, FormatBytesPipeModule],
})
export class AppModule {}
