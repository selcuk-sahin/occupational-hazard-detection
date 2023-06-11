# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

# Admin
from firebase_admin import initialize_app
# from firebase_admin import credentials
from firebase_admin import storage

# Functions
from firebase_functions.firestore_fn import (
  on_document_updated,
  Event,
  Change,
  DocumentSnapshot,
)

# Detection
import math
from ultralytics import YOLO
from PIL import Image
from io import BytesIO

app = initialize_app()
bucket = storage.bucket('occupational-hazard-detection.appspot.com', app)

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
      output_files = analyze_report(new_value)

      # set status
      new_value['outputFiles'] = output_files
      new_value['status'] = 'completed'
    except:
      new_value['status'] = 'failed'

    # Update the status
    event.data.after.reference.update({
      "status" : new_value['status'],
      "outputFiles" : new_value['outputFiles']
    })
    return

  else:
    return

def get_image_from_storage(image_path):
    blob = bucket.blob(image_path)
    image_data = blob.download_as_bytes()

    # Open the image using Pillow
    image = Image.open(BytesIO(image_data))

    return image

def analyze_report(draft: dict) -> list:
  """Load model from GCS"""
  # bucket_name = "occupational-hazard-detection.appspot.com"
  # model_name =  "detection-models/yolov8n.pt"
  # storage_client = storage.Client()
  # bucket = storage_client.bucket(bucket_name)
  # blob = bucket.blob(model_name)
  # model_data = blob.download_as_bytes()

  """Load Images from GCS"""
  #start with 1 image
  print(draft["inputFiles"][0])
  image = get_image_from_storage(draft["inputFiles"][0])

  # Predict
  model = YOLO("yolov8n.pt")
  results = model.predict(source=image, save=True, save_txt=True, show_conf=True)
  names = model.names

  # Dictionary definitions
  spillable_dictionary = {"39.0": "Bottle", "40.0": "Wine Glass", "41.0": "Cup"}
  electoric_dictionary = {"62.0": "Laptop", "63.0": "TV"}
  breakable_dictionary = {"39.0": "Bottle", "40.0": "Wine Glass", "41.0": "Cup", "75.0": "Vase"}
  pet_dictionary = {"15.0": "Cat", "16.0": "Dog"}
  other_dictionary = {"60.0": "Table"}

  # Prefixes List
  spillable_prefixes = ["39.0", "40.0", "41.0"]
  breakable_prefixes = ["39.0", "40.0", "41.0", "75.0"]
  pet_prefixes = ["15.0", "16.0"]
  table_prefixes = ["60.0"]
  electronic_prefixes = ["62.0", "63.0"]

  #definitions
  boxes = []
  included_names = []

  #class lists
  spillables = []
  electronics = []
  tables = []
  cat = []
  breakables = []
  #prefixes
  spillable_prefixes = ["39.0", "40.0", "41.0"]
  breakable_prefixes = ["39.0", "40.0", "41.0", "75.0"]
  pet_prefixes = ["15.0", "16.0"]
  table_prefixes = ["60.0"]
  electronic_prefixes = ["62.0", "63.0"]

  # Results
  output_text_list = []
  isBreakable = False
  isSpillable = False
  isPet = False
  isTable = False
  isElectronic = False

  #sonuçlar işlenmek üzere hazırlanır
  for r in results:
    for box, class_id, confidence in zip(r.boxes.xywhn, r.boxes.cls, r.boxes.conf):
      x, y, w, h = box.tolist()
      # Print the processed values
      line_to_add = f"{class_id} {x} {y} {w} {h} {confidence}"
      boxes.append(line_to_add)
      included_names.append(names[int(class_id)])

  #senaryo 1 masa+kedi+kırabilir
  isTable = check_prefixes(boxes, table_prefixes, isTable)
  if isTable:
    isPet = check_prefixes(boxes, pet_prefixes, isPet)
    if isPet:
      isBreakable = check_prefixes(boxes, breakable_prefixes, isBreakable)
      print("table+cat+breakable")
      #hepsi okayse listeler de topla
      #burada table ile cat overlapli mi controlü yap
      #table ile breakable overlapli mi kontrolü yap hepsi okayse output_text_liste kayıt ekle

  #senaryo 2 dökülebilir+elektronik
  isElectronic = check_prefixes(boxes, electronic_prefixes, isElectronic)
  if isElectronic:
    isSpillable = check_prefixes(boxes, spillable_prefixes, isSpillable)
    if isSpillable:
      #ayrı listelerde topla hesaplama yap output_text'ye bas
      list_maker(boxes,electronic_prefixes,electronics)
      list_maker(boxes,spillable_prefixes,spillables)
      tempList = find_close_objects(spillables, electronics, 0.5)
      if len(tempList) > 0:
        convert_list(tempList, spillable_dictionary, electoric_dictionary, output_text_list)

  print(output_text_list)
  return output_text_list

#kontrol edilecek nesneler var mı kontrolü
def check_prefixes(box_list, prefixes, isPrefixExist):
  for box in box_list:
    for prefix in prefixes:
      if box.startswith(prefix):
        isPrefixExist = True
      break
  return isPrefixExist

#input listesinden prefixler verilerek output listesi oluşacak.
#Örnek: Spillable ve electronic aynı anda varsa bu fonksiyon çağrılıp 2 ayrı liste elde edilecek ve hesaplamalara geçilecek.
def list_maker(inputList, prefixes, outputList):
  for line in inputList[:]:  # [:] ile orijinal listenin kopyası üzerinde işlem yapılır
    for prefix in prefixes:
      if line.startswith(prefix):
        outputList.append(line)
        # inputList.remove(line)
        break

def calculate_distance(x1, y1, x2, y2):
  distance = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
  return distance

def find_close_objects(list1, list2, limit):
  temp_list = []
  classid1 = None
  classid2 = None
  for item1 in list1:
    obj1 = item1.split()
    x1 = float(obj1[1])
    y1 = float(obj1[2])
    classid1 = obj1[0]
    for item2 in list2:
      obj2 = item2.split()
      x2 = float(obj2[1])
      y2 = float(obj2[2])
      classid2 = obj2[0]
      distance = calculate_distance(x1, y1, x2, y2)
      if distance < limit:
        temp_list.append((classid1, classid2, convert_distance_value(distance)))
  return temp_list

def convert_list(inputList, dictionary1, dictionary2, output_text_list):
  for item in inputList:
    obj1, obj2, value = item
    if obj1 in dictionary1:
      obj1_name = dictionary1[obj1]
    else:
      obj1_name = obj1
    if obj2 in dictionary2:
      obj2_name = dictionary2[obj2]
    else:
      obj2_name = obj2
    output_text_list.append((f'{obj1_name} is {value} to {obj2_name}'))
  return output_text_list

def convert_distance_value(value):
  if value < 0.1:
    return "dangerously close"
  elif 0.1 <= value < 0.3:
    return "really close"
  elif 0.3 <= value < 0.5:
    return "close"
  else:
    return "around"
