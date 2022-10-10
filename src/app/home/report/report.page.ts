import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { AlertService } from 'src/app/services/alert.service';
import { Report, ReportService } from 'src/app/services/report.service';
import { SubSink } from 'subsink';
type PageMode = 'create' | 'update';

@Component({
  selector: 'app-report',
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
})
export class ReportPage implements OnInit, OnDestroy {
  @ViewChild('fileDropRef') fileDropEl: ElementRef;
  form: FormGroup;
  files: any[] = [];
  pageMode: PageMode = 'update';
  reportId = '';
  report: Report;
  subs = new SubSink();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private reportService: ReportService,
    private loadingCtrl: LoadingController,
    private alertService: AlertService,
    private fb: FormBuilder,
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation.extras.state;
    this.pageMode = state && state?.create ? 'create' : 'update';
    this.initForm(state?.report);

    this.subs.sink = this.route.params.subscribe((params) => {
      this.reportId = params?.id ?? '';
      if (this.reportId) {
        if (!state?.report) {
          this.getReportDetail(this.reportId);
        }
      } else {
        this.alertService.showAlert({ message: 'Report not found' });
      }
    });
  }

  ngOnInit() {}

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  initForm(report?: Report) {
    this.form = this.fb.group({
      location: [report?.location, []],
    });
  }

  async createReport() {
    this.reportService.create();
    const loading = await this.loadingCtrl.create();
    loading.present();
  }

  async getReportDetail(id: string) {
    const loading = await this.loadingCtrl.create();
    loading.present();
    try {
      this.report = await this.reportService.getById('drafts', id);
      this.initForm(this.report);
    } catch (error) {
      this.alertService.showAlert({ header: 'Failed to fetch details', message: error?.message });
    } finally {
      loading.dismiss();
    }
  }

  async onSave() {
    const loading = await this.loadingCtrl.create();
    loading.present();
    try {
      await this.reportService.update({
        id: this.report.id,
        location: this.form.controls.location.value,
        status: this.report.status,
      });
    } catch (error) {
      this.alertService.showAlert({ header: 'Failed to save', message: error?.message });
    } finally {
      loading.dismiss();
    }
  }

  async onDelete() {
    this.alertService.showAlert({ header: 'Not implemented', message: 'TBD' });
  }

  /**
   * on file drop handler
   */
  onFileDropped(event) {
    this.prepareFilesList(event);
  }

  /**
   * handle file from browsing
   */
  fileBrowseHandler(files) {
    this.prepareFilesList(files);
  }

  /**
   * Delete file from files list
   *
   * @param index (File index)
   */
  deleteFile(index: number) {
    if (this.files[index].progress < 100) {
      console.log('Upload in progress.');
      return;
    }
    this.files.splice(index, 1);
  }

  /**
   * Simulate the upload process
   */
  uploadFilesSimulator(index: number) {
    setTimeout(() => {
      if (index === this.files.length) {
        return;
      } else {
        const progressInterval = setInterval(() => {
          if (this.files[index].progress === 100) {
            clearInterval(progressInterval);
            this.uploadFilesSimulator(index + 1);
          } else {
            this.files[index].progress += 5;
          }
        }, 200);
      }
    }, 1000);
  }

  /**
   * Convert Files list to normal array list
   *
   * @param files (Files List)
   */
  prepareFilesList(files: Array<any>) {
    for (const item of files) {
      item.progress = 0;
      this.files.push(item);
    }
    this.fileDropEl.nativeElement.value = '';
    this.uploadFilesSimulator(0);
  }
}
