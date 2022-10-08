import { Injectable } from '@angular/core';
import { AlertController, AlertOptions } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  constructor(private alertCtrl: AlertController) {}

  async showAlert(options: AlertOptions) {
    if (!options.buttons) {
      options.buttons = [
        {
          text: 'Confirm',
          role: 'destructive',
        },
      ];
    }
    const alert = await this.alertCtrl.create(options);
    await alert.present();
  }
}
