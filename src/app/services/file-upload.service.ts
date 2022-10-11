import { Injectable } from '@angular/core';
import { Storage, uploadBytes, ref, listAll, getBlob, deleteObject } from '@angular/fire/storage';
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

  /** fix for not drafts */
  async listAllFilesUnderReport(reportId: string): Promise<Map<string, Blob>> {
    const user = this.authService.currentUser();
    if (!user) {
      alert('log-in required');
      return;
    }
    const listRef = ref(this.storage, `users/${user.uid}/drafts/${reportId}`);
    const listResult = await listAll(listRef);

    const blobMap = new Map<string, Blob>();
    for (const itemRef of listResult.items) {
      const blob = await getBlob(ref(this.storage, itemRef.fullPath));
      blobMap.set(itemRef.name, blob);
    }
    return blobMap;
  }

  deleteFileUnderReport(reportId: string, fileName: string) {
    const user = this.authService.currentUser();
    if (!user) {
      alert('log-in required');
      return;
    }
    const fileRef = ref(this.storage, `users/${user.uid}/drafts/${reportId}/${fileName}`);
    return deleteObject(fileRef);
  }
}
