import { Report } from '../../src/app/services/report.service';

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

export const updateDocument = functions.firestore
  .document('users/{userId}/drafts/{draftId}')
  .onUpdate((change, context) => {
    const newValue = change.after.data() as Report; // Updated document data
    const previousValue = change.before.data() as Report; // Previous document data
    const userId = context.params.userId; // User ID
    const draftId = context.params.draftId; // Draft ID

    if (newValue.status === 'analyzing' && previousValue.status === 'draft') {
      // analyze & update
      // Call your desired function here
      const result = analyzeReport(newValue, userId);

      // Perform additional updates to Firestore if needed
      const db = admin.firestore();
      const docRef = db.collection('users').doc(userId).collection('drafts').doc(draftId);
      return docRef.update(result);
    } else {
      return;
    }
  });

function analyzeReport(report: Report, userId: string) {
  // Implement your logic here
  console.log('I will analyze', { report }, 'for', { userId });
  return {
    outputFiles: ['users/VLPjOyV3gLYkqtzgHLiLfFD6i223/drafts/I0SWpFbhSlBrgPUeIE6N/IMG_7275.jpg'],
    status: 'completed',
  } as Partial<Report>;
  // Perform any additional actions based on the updated values
}
