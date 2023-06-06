import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp();

export const updateDocument = onDocumentUpdated('users/{userId}/drafts/{draftId}', (event) => {
  const newValue = event.data?.after as any; // Updated document data
  const previousValue = event.data?.before as any; // Previous document data
  const userId = event.params.userId; // User ID
  const draftId = event.params.draftId; // Draft ID

  if (newValue.status === 'analyzing' && previousValue.status === 'draft') {
    // analyze & update
    // Call your desired function here
    const result = analyzeReport(newValue, userId);

    // Perform additional updates to Firestore if needed
    const db = getFirestore();
    const docRef = db.collection('users').doc(userId).collection('drafts').doc(draftId);
    return docRef.update(result);
  } else {
    return;
  }
});

function analyzeReport(report: any, userId: string) {
  // Implement your logic here
  console.log('I will analyze', { report }, 'for', { userId });
  return {
    outputFiles: ['users/VLPjOyV3gLYkqtzgHLiLfFD6i223/drafts/I0SWpFbhSlBrgPUeIE6N/IMG_7275.jpg'],
    status: 'completed',
  } as Partial<any>;
  // Perform any additional actions based on the updated values
}
