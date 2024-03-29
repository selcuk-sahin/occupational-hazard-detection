import { EventEmitter, Injectable } from '@angular/core';
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDocFromServer,
  getDocs,
  setDoc,
  Timestamp,
} from '@angular/fire/firestore';
import { updateDoc } from '@firebase/firestore';
import { AuthService } from './auth.service';

export interface FileResult {
  file: string;
  outputTexts: string[];
}

export class Report {
  id: string;
  location: typeof ReportService.locations[number] | '';
  status: 'draft' | 'analyzing' | 'completed';
  inputFiles: string[];
  outputFiles: FileResult[];
  requestedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  constructor(params?: Partial<Report>) {
    this.id = params?.id ?? '';
    this.location = params?.location ?? '';
    this.status = params?.status ?? 'draft';
    this.inputFiles = params?.inputFiles !== undefined ? [...params.inputFiles] : [];
    this.outputFiles = params?.outputFiles !== undefined ? [...params.outputFiles] : [];
    this.requestedAt = params?.requestedAt ?? null;
    this.createdAt = params?.createdAt ?? null;
    this.updatedAt = params?.updatedAt ?? null;
  }
}

type PageMode = 'create' | 'update' | 'view';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  static locations = ['livingRoom', 'office', 'kitchen', 'bedroom', 'bathroom'] as const;
  pageMode: PageMode = 'create';
  created = new EventEmitter<Report>();
  updated = new EventEmitter<Partial<Report>>();
  deleted = new EventEmitter<Report['id']>();

  constructor(private authService: AuthService, private fireStore: Firestore) {}

  async create() {
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
    await setDoc(docRef, report);
    this.created.next(report);
    return report;
  }

  async update(report: Partial<Report>) {
    const user = this.authService.currentUser();
    if (!user) {
      alert('log-in required');
      return;
    }
    const docRef = doc(this.fireStore, `users/${user.uid}/drafts/${report.id}`);
    const partialReport: Partial<Report> = {
      updatedAt: Timestamp.now(),
      location: report.location,
      status: report.status,
    };
    await updateDoc(docRef, partialReport);
    this.updated.next({ ...report, ...partialReport });
    return report;
  }

  async delete(id: Report['id']) {
    const user = this.authService.currentUser();
    if (!user) {
      alert('log-in required');
      return;
    }
    // Deletes the document, but the media related to the document still exists
    const docRef = doc(this.fireStore, `users/${user.uid}/drafts/${id}`);
    await deleteDoc(docRef);
    this.deleted.next(id);
  }

  async linkMedia(reportId: string, fileUrl: string) {
    const user = this.authService.currentUser();
    if (!user) {
      alert('log-in required');
      return;
    }
    const docRef = doc(this.fireStore, `users/${user.uid}/drafts/${reportId}`);
    // Atomically add a new fileUrl to the "inputFiles" array field.
    await updateDoc(docRef, {
      inputFiles: arrayUnion(fileUrl),
    });
  }

  async getReports(type: 'drafts' | 'reports'): Promise<Report[]> {
    const user = this.authService.currentUser();
    if (!user) {
      alert('log-in required');
      return;
    }

    const collectionRef = collection(this.fireStore, `users/${user.uid}/${type}`);
    const snapShot = await getDocs(collectionRef);
    return snapShot.docs.map((snapshot) => snapshot.data() as Report);
  }

  async getById(type: 'drafts' | 'reports', reportId: string): Promise<Report> {
    const user = this.authService.currentUser();
    if (!user) {
      alert('log-in required');
      return;
    }

    const docRef = doc(this.fireStore, `users/${user.uid}/${type}/${reportId}`);
    const snapshot = await getDocFromServer(docRef);
    return snapshot.data() as Report;
  }
}
