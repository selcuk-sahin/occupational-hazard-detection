import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { AlertService } from 'src/app/services/alert.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { Report, ReportService } from 'src/app/services/report.service';
import { SubSink } from 'subsink';
type PageMode = 'create' | 'update';

interface FileMetadata {
  [key: string]: {
    file: File;
    name: string;
    size: number;
    progress: number;
    state: 'failed' | 'uploading' | 'success';
  };
}

@Component({
  selector: 'app-report',
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
})
export class ReportPage implements OnInit, OnDestroy {
  @ViewChild('fileDropRef') fileDropEl: ElementRef;
  form: FormGroup;
  files: FileMetadata = {};
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
    private fileUploadService: FileUploadService,
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
   * @param key (File key)
   */
  deleteFile(key: string) {
    if (this.files[key].progress < 100) {
      console.log('Upload in progress.');
      return;
    }
    delete this.files[key];
  }

  /**
   * Simulate the upload process
   */
  async uploadFile(key: string) {
    const fileMetadata = this.files[key];
    try {
      const result = await this.fileUploadService.uploadUnderReport(this.reportId, fileMetadata.file);
      await this.reportService.linkMedia(this.reportId, result.ref.fullPath);
      this.files[key].state = 'success';
    } catch (error) {
      this.files[key].state = 'failed';
    } finally {
      this.files[key].progress = 100;
    }
  }

  /**
   * Convert Files list to normal array list
   *
   * @param files (Files List)
   */
  prepareFilesList(files: File[]) {
    for (const file of files) {
      this.files[file.name] = {
        file,
        name: file.name,
        progress: 0,
        size: file.size,
        state: 'uploading',
      };
      this.uploadFile(file.name);
    }
    this.fileDropEl.nativeElement.value = '';
  }
}
