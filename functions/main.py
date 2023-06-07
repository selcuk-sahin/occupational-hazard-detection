# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn
from firebase_admin import initialize_app
from firebase_functions.firestore_fn import (
  on_document_updated,
  Event,
  Change,
  DocumentSnapshot,
)

initialize_app()

@on_document_updated(document="users/{userId}/drafts/{draftId}")
def on_document_ready(event: Event[Change[DocumentSnapshot]]) -> None:
  userId = event.params['userId']
  draftId = event.params['draftId']
  previous_value = event.data.before.to_dict()
  new_value = event.data.after.to_dict()

  if new_value['status'] == 'analyzing' and previous_value['status'] == 'draft':
    # analyze & update here
    try:
      ## Analyze
      # get output files
      output_files: ['users/VLPjOyV3gLYkqtzgHLiLfFD6i223/drafts/I0SWpFbhSlBrgPUeIE6N/IMG_7275.jpg']

      # set status
      new_value['outputFiles'] = output_files
      new_value['status'] = 'completed'
    except:
      new_value['status'] = 'failed'

    # Update the status
    event.data.after.reference.update({"status", new_value['status']})
    event.data.after.reference.update({"outputFiles", new_value['outputFiles']})
    return

  else:
    return

def analyze_report(draft: dict) -> list:
  # get output files
  return ['users/VLPjOyV3gLYkqtzgHLiLfFD6i223/drafts/I0SWpFbhSlBrgPUeIE6N/IMG_7275.jpg']
