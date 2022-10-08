import { Injectable } from '@angular/core';

export interface Report {
  inputFiles: string[];
  outputFiles: string[];
  requestedAt: number;
  createdAt: number;
  updatedAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  reports: Report[] = [{ inputFiles: [], outputFiles: [], requestedAt: 0, createdAt: 0, updatedAt: 0 }];

  constructor() {}

  async getReports() {
    return this.reports;
  }
}
