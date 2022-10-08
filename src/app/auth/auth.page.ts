import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, NavController } from '@ionic/angular';
import { AlertService } from '../services/alert.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  credentials: FormGroup;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private navCtrl: NavController,
    private alertService: AlertService,
  ) {}

  ngOnInit() {
    this.credentials = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get email() {
    return this.credentials.get('email');
  }

  get password() {
    return this.credentials.get('password');
  }

  async login() {
    const loading = await this.loadingCtrl.create();
    await loading.present();
    try {
      await this.authService.login(this.credentials.value);
      await loading.dismiss();
      this.navCtrl.navigateRoot(['home']);
    } catch (error) {
      await loading.dismiss();
      this.alertService.showAlert({ header: 'Login failed.', message: error?.code });
    }
  }

  async register() {
    const loading = await this.loadingCtrl.create();
    await loading.present();
    try {
      await this.authService.register(this.credentials.value);
      await loading.dismiss();
      this.navCtrl.navigateRoot(['home']);
    } catch (error) {
      await loading.dismiss();
      this.alertService.showAlert({ header: 'Register failed.', message: error?.code });
    }
  }
}
