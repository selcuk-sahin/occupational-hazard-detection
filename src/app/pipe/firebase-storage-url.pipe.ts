import { Pipe, PipeTransform } from '@angular/core';
import { Storage, ref, getDownloadURL } from '@angular/fire/storage';

@Pipe({
  name: 'firebaseStorageUrl',
})
export class FirebaseStorageUrlPipe implements PipeTransform {
  constructor(private storage: Storage) {}

  async transform(path: string): Promise<string> {
    try {
      return await getDownloadURL(ref(this.storage, path));
    } catch (error) {
      return '';
    }
  }
}
