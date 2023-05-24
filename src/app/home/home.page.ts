import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingController, NavController } from '@ionic/angular';
import { AlertService } from '../services/alert.service';
import { AuthService } from '../services/auth.service';
import { Report, ReportService } from '../services/report.service';
import { SubSink } from 'subsink';

type PageSegment = 'drafts' | 'reports';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  drafts: Report[] = [];
  reports: Report[] = [];
  segment: PageSegment = 'drafts';
  subs = new SubSink();

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

    // Update the UI without making an additional request on CRUD operations
    this.subs.sink = this.reportService.created.subscribe((report) => {
      if (report.status === 'draft') {
        this.drafts.push(report);
      }
    });
    this.subs.sink = this.reportService.updated.subscribe((report) => {
      const index = this.drafts.findIndex((r) => r.id === report.id);
      if (index !== -1) {
        if (report.status === 'draft') {
          const existingReport = this.drafts[index];
          this.drafts[index] = { ...existingReport, ...report };
        } else if (report.status === 'analyzing') {
          const [draft] = this.drafts.splice(index, 1);
          this.reports.push(draft);
        }
      }
    });
    this.subs.sink = this.reportService.deleted.subscribe((reportId) => {
      const index = this.drafts.findIndex((r) => r.id === reportId);
      if (index !== -1) {
        this.drafts.splice(index, 1);
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
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
      const reports = await this.reportService.getReports('drafts');
      this.drafts = reports.filter((r) => r.status !== 'completed');
      this.reports = reports.filter((r) => r.status === 'completed');
    } catch (error) {
      this.alertService.showAlert({ header: 'Error', message: 'Failed to fetch reports.' });
    }
  }

  onSegmentChanged(segment: Event) {
    this.segment = (segment as any).detail.value as PageSegment;
  }
}
