import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingController, NavController } from '@ionic/angular';
import { AlertService } from '../services/alert.service';
import { AuthService } from '../services/auth.service';
import { Report, ReportService } from '../services/report.service';

type PageSegment = 'drafts' | 'reports';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  drafts: Report[] = [];
  reports: Report[] = [];
  segment: PageSegment = 'drafts';

  constructor(
    private authService: AuthService,
    private navCtrl: NavController,
    private reportService: ReportService,
    private alertService: AlertService,
    private loadingCtrl: LoadingController,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.getReports();
  }

  async createNewDraft() {
    const loading = await this.loadingCtrl.create();
    loading.present();
    try {
      const report = await this.reportService.create();
      await loading.dismiss();
      await this.navCtrl.navigateForward(['report/', report.id], {
        state: { report, create: true },
        relativeTo: this.route,
      });
    } catch (error) {
      this.alertService.showAlert({ header: 'Failed to create', message: error?.message });
    } finally {
      loading.dismiss();
    }
  }

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
      [this.drafts, this.reports] = await Promise.all([
        this.reportService.getReports('drafts'),
        this.reportService.getReports('reports'),
      ]);
    } catch (error) {
      this.alertService.showAlert({ header: 'Error', message: 'Failed to fetch reports.' });
    }
  }

  onSegmentChanged(segment: Event) {
    this.segment = (segment as any).detail.value as PageSegment;
  }
}
