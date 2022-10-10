import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { ReportService } from 'src/app/services/report.service';
import { SubSink } from 'subsink';
type PageMode = 'create' | 'update';

@Component({
  selector: 'app-report',
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
})
export class ReportPage implements OnInit, OnDestroy {
  @ViewChild('fileDropRef') fileDropEl: ElementRef;
  files: any[] = [];
  pageMode: PageMode = 'update';
  reportId = '';
  subs = new SubSink();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private reportService: ReportService,
    private loadingCtrl: LoadingController,
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation) {
      const state = navigation.extras.state;
      console.log('state', state);
      this.pageMode = state && state?.create ? 'create' : 'update';
    }
    this.subs.sink = this.route.params.subscribe((params) => {
      this.reportId = params['id'] ?? '';
      if (this.reportId) {
        this.getReportDetail(this.reportId);
      } else {
        this.createReport();
      }
    });
  }

  ngOnInit() {}

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  async createReport() {
    this.reportService.create();
    const loading = await this.loadingCtrl.create();
    loading.present();
  }

  getReportDetail(id: string) {}

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
