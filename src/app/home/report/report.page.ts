import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { AlertService } from 'src/app/services/alert.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { Report, ReportService } from 'src/app/services/report.service';
import { SubSink } from 'subsink';
type PageMode = 'create' | 'update';

interface FileMetadata {
  file?: File | Blob;
  name: string;
  size: number;
  progress: number;
  state: 'failed' | 'uploading' | 'success';
  prewiew?: SafeUrl;
}

@Component({
  selector: 'app-report',
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
})
export class ReportPage implements OnDestroy {
  @ViewChild('fileDropRef') fileDropEl: ElementRef;
  form: FormGroup;
  files = new Map<string, FileMetadata>();
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
    private sanitizer: DomSanitizer,
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation.extras.state;
    this.pageMode = state && state?.create ? 'create' : 'update';
    this.initForm(state?.report);

    this.subs.sink = this.route.params.subscribe((params) => {
      this.reportId = params?.id ?? '';
      if (this.reportId) {
        this.getFiles();
        if (!state?.report) {
          this.getReportDetail(this.reportId);
        }
      } else {
        this.alertService.showAlert({ message: 'Report not found' });
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  async getFiles() {
    const loading = await this.loadingCtrl.create();
    loading.present();
    try {
      const blobMap = await this.fileUploadService.listAllFilesUnderReport(this.reportId);
      blobMap.forEach((blob, fileName) => {
        const objectURL = URL.createObjectURL(blob);
        this.files.set(fileName, {
          file: blob,
          name: fileName,
          progress: 100,
          size: blob.size,
          state: 'success',
          prewiew: this.sanitizer.bypassSecurityTrustUrl(objectURL),
        });
      });
    } catch (error) {
      this.alertService.showAlert({ header: 'Error', message: JSON.stringify(error) });
    } finally {
      loading.dismiss();
    }
  }

  initForm(report?: Report) {
    this.form = this.fb.group({
      location: [report?.location, []],
    });
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
    this.uploadFiles(event);
  }

  /**
   * handle file from browsing
   */
  fileBrowseHandler(files) {
    this.uploadFiles(files);
  }

  /**
   * Delete file from files list
   *
   * @param key (File key)
   */
  async deleteFile(key: string) {
    const metadata = this.files.get(key);
    if (metadata.progress < 100) {
      console.log('Upload in progress.');
      return;
    }
    const loading = await this.loadingCtrl.create();
    loading.present();
    try {
      await this.fileUploadService.deleteFileUnderReport(this.reportId, metadata.name);
      this.files.delete(key);
    } catch (error) {
      this.alertService.showAlert({ header: 'Failed to delete', message: error?.message });
    } finally {
      loading.dismiss();
    }
  }

  /**
   * Simulate the upload process
   */
  async uploadFile(key: string) {
    const fileMetadata = this.files.get(key);
    try {
      const result = await this.fileUploadService.uploadUnderReport(this.reportId, fileMetadata.file as File);
      await this.reportService.linkMedia(this.reportId, result.ref.fullPath);
      fileMetadata.state = 'success';
      const objectURL = URL.createObjectURL(fileMetadata.file);
      fileMetadata.prewiew = this.sanitizer.bypassSecurityTrustUrl(objectURL);
    } catch (error) {
      fileMetadata.state = 'failed';
    } finally {
      fileMetadata.progress = 100;
      this.files.set(key, fileMetadata);
    }
  }

  /**
   * Convert Files list to normal array list
   *
   * @param files (Files List)
   */
  uploadFiles(files: File[]) {
    for (const file of files) {
      this.files.set(file.name, {
        file,
        name: file.name,
        progress: 0,
        size: file.size,
        state: 'uploading',
      });
      this.uploadFile(file.name);
    }
    this.fileDropEl.nativeElement.value = '';
  }
}
