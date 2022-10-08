import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AlertService } from '../services/alert.service';
import { AuthService } from '../services/auth.service';
import { Report, ReportService } from '../services/report.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  reports: Report[] = [];
  constructor(
    private authService: AuthService,
    private navCtrl: NavController,
    private reportService: ReportService,
    private alertService: AlertService,
  ) {}

  async logout() {
    try {
      await this.authService.logout();
      this.navCtrl.navigateRoot(['auth']);
    } catch (error) {
      alert('log out failed');
    }
  }

  async refresh(event: Event) {
    await this.getReports();
    (event.target as any).complete();
  }

  async getReports() {
    try {
      this.reports = await this.reportService.getReports();
    } catch (error) {
      this.alertService.showAlert({ header: 'Error', message: 'Failed to fetch reports.' });
    }
  }
}
