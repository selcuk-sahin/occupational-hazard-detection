import { Injectable } from '@angular/core';
import { Storage, uploadBytes, ref } from '@angular/fire/storage';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  constructor(private storage: Storage, private authService: AuthService) {}

  uploadUnderReport(reportId: string, file: File) {
    const user = this.authService.currentUser();
    if (!user) {
      alert('log-in required');
      return;
    }
    const storageRef = ref(this.storage, `users/${user.uid}/drafts/${reportId}/${file.name}`);
    return uploadBytes(storageRef, file);
  }
}
