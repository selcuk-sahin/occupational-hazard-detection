import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFunctions, getFunctions, connectFunctionsEmulator } from '@angular/fire/functions';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideFirestore, getFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { DragAndDropDirectiveModule } from './directives/drag-and-drop.directive';
import { FormatBytesPipeModule } from './pipes/format-bytes.pipe';
import { FirestoreTimestampPipeModule } from './pipes/firestore-timestamp.pipe';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFunctions(() => {
      if (!environment.production) {
        connectFunctionsEmulator(getFunctions(), 'localhost', 5001);
      }
      return getFunctions();
    }),
    provideStorage(() => getStorage()),
    provideFirestore(() => {
      if (!environment.production) {
        connectFirestoreEmulator(getFirestore(), 'localhost', 9001);
      }
      return getFirestore();
    }),
    DragAndDropDirectiveModule,
    FormatBytesPipeModule,
    FirestoreTimestampPipeModule,
  ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
  exports: [DragAndDropDirectiveModule, FormatBytesPipeModule, FirestoreTimestampPipeModule],
})
export class AppModule {}
