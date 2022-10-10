import { Injectable } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDocs, QuerySnapshot, Timestamp } from '@angular/fire/firestore';
import { AuthService } from './auth.service';

export class Report {
  id: string;
  location: string;
  status: 'draft' | 'analyzing' | 'completed';
  inputFiles: string[];
  outputFiles: string[];
  requestedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  constructor(params?: Partial<Report>) {
    this.id = params?.id ?? '';
    this.location = params?.location ?? 'Unknown';
    this.status = params?.status ?? 'draft';
    this.inputFiles = params?.inputFiles !== undefined ? [...params.inputFiles] : [];
    this.outputFiles = params?.outputFiles !== undefined ? [...params.outputFiles] : [];
    this.requestedAt = params?.requestedAt ?? null;
    this.createdAt = params?.createdAt ?? null;
    this.updatedAt = params?.updatedAt ?? null;
  }
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  constructor(private authService: AuthService, private fireStore: Firestore) {}

  create() {
    const user = this.authService.currentUser();
    if (!user) {
      alert('log-in required');
      return;
    }
    const collectionRef = collection(this.fireStore, `users/${user.uid}/drafts`);
    const docRef = doc(collectionRef);
    const report = JSON.parse(
      JSON.stringify(
        new Report({
          id: docRef.id,
          createdAt: Timestamp.now(),
        }),
      ),
    );
    console.log(report);
    return addDoc(collectionRef, report);
  }

  async getReports(): Promise<Report[]> {
    const user = this.authService.currentUser();
    if (!user) {
      alert('log-in required');
      return;
    }

    const collectionRef = collection(this.fireStore, `users/${user.uid}/drafts`);
    const snapShot = await getDocs(collectionRef);
    return snapShot.docs.map((snapshot) => {
      return snapshot.data() as Report;
      // data.createdAt = Timestamp.fromMillis(data?.createdAt?.seconds * 1000 || 0);
      // data.updatedAt = Timestamp.fromMillis(data?.updatedAt?.seconds * 1000 || 0);
      // return data as Report;
    });
  }
}
