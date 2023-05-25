import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, NavController } from '@ionic/angular';
import { AlertService } from 'src/app/services/alert.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { Report, ReportService } from 'src/app/services/report.service';
import { SubSink } from 'subsink';

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
  files = new Map<string, FileMetadata>();
  reportId = '';
  report: Report;
  location = '';
  subs = new SubSink();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public reportService: ReportService,
    private loadingCtrl: LoadingController,
    private alertService: AlertService,
    private fileUploadService: FileUploadService,
    private sanitizer: DomSanitizer,
    private navCtrl: NavController,
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation.extras.state;
    this.initForm(state?.report as Report);
    if (state?.report) this.report = state?.report as Report;

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
    this.location = report?.location;
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
    // Validate form
    if (!this.location) {
      return this.alertService.showAlert({ message: 'Please select a location' });
    }
    if (this.files.size === 0) {
      return this.alertService.showAlert({ message: 'Please upload your images' });
    }
    if (this.hasUnfinishedUploads()) {
      return this.alertService.showAlert({ message: 'Please wait uploading images' });
    }

    const loading = await this.loadingCtrl.create();
    loading.present();
    try {
      await this.reportService.update({
        id: this.report.id,
        location: this.location,
        status: 'analyzing',
      });
      this.alertService.showAlert({ header: 'Success', message: 'Your media will be analyzed soon.' });
      this.report = undefined;
      this.navCtrl.navigateBack(['/home']);
    } catch (error) {
      this.alertService.showAlert({ header: 'Failed to save', message: error?.message });
    } finally {
      loading.dismiss();
    }
  }

  async onDelete() {
    const loading = await this.loadingCtrl.create();
    loading.present();
    try {
      await this.reportService.delete(this.report.id);
      this.report = undefined;
      this.navCtrl.navigateBack(['/home']);
    } catch (error) {
      this.alertService.showAlert({ header: 'Failed to delete', message: error?.message });
    } finally {
      loading.dismiss();
    }
  }

  /**
   * on file drop handler
   */
  onFileDropped(fileList: FileList) {
    this.uploadFiles(fileList);
  }

  /**
   * handle file from browsing
   */
  fileBrowseHandler(event: Event) {
    this.uploadFiles((event.target as HTMLInputElement).files);
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
  uploadFiles(files: FileList) {
    for (const file of Array.from(files)) {
      this.files.set(file.name, {
        file,
        name: file.name,
        progress: 0,
        size: file.size,
        state: 'uploading',
      });
      this.uploadFile(file.name);

      // Prepare preview
      const reader = new FileReader();
      reader.onload = () => {
        this.files.get(file.name).prewiew = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
    this.fileDropEl.nativeElement.value = '';
  }

  hasUnfinishedUploads() {
    let result = false;
    // Iterate over the map to find the item with progress less than 100
    this.files.forEach((fileMetadata, key) => {
      if (fileMetadata.progress < 100) {
        result = true;
      }
    });
    return result;
  }
}
