# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

# Admin
from firebase_admin import initialize_app
from firebase_admin import storage

# Functions
from firebase_functions.firestore_fn import (
  on_document_updated,
  Event,
  Change,
  DocumentSnapshot,
)
from firebase_functions.options import (
  MemoryOption
)

# Detection
import math
from ultralytics import YOLO
from PIL import (
  Image,
  ImageDraw,
  ImageFont
)
from io import BytesIO
import datetime

app = initialize_app()
bucket = storage.bucket()

@on_document_updated(document="users/{userId}/drafts/{draftId}", timeout_sec=540, memory=MemoryOption.GB_1, max_instances=1)
def on_document_ready(event: Event[Change[DocumentSnapshot]]) -> None:
  userId = event.params['userId']
  draftId = event.params['draftId']
  previous_value = event.data.before.to_dict()
  new_value = event.data.after.to_dict()

  if new_value['status'] == 'analyzing' and previous_value['status'] == 'draft':
    # analyze & update here
    try:
      ## Analyze
      output_files = []
      # get output files & detection results
      for file in new_value["inputFiles"]:
        image = get_image_from_storage(file)
        # output_texts = analyze_image(new_value, image)
        output_texts, output_image = analyze_image(new_value, image)
        file_name, extension = file.rsplit('.', 1)  # Split the string at the last dot to get the file name and extension
        output_image_path = f"{file_name}_out.{extension}"  # Append "_out" before the extension
        save_file_to_storage(output_image, output_image_path)
        output_files.append({'outputTexts': output_texts, 'file': output_image_path})

      # set status
      new_value['outputFiles'] = output_files
      new_value['status'] = 'completed'
    except Exception as e:
      print(e)
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

def save_file_to_storage(image: Image, image_path):
  blob = bucket.blob(image_path)
  blob.metadata = {'contentType': 'image/jpeg'}
  blob.content_type = 'image/jpeg'
  with blob.open("wb") as f:
    image_bytes = BytesIO()
    image.save(image_bytes, format='JPEG')
    f.write(image_bytes.getvalue())

def analyze_image(draft: dict, image: Image):
  """Load model from GCS"""
  # bucket_name = "occupational-hazard-detection.appspot.com"
  # model_name =  "detection-models/yolov8n.pt"
  # storage_client = storage.Client()
  # bucket = storage_client.bucket(bucket_name)
  # blob = bucket.blob(model_name)
  # model_data = blob.download_as_bytes()

  #definitions
  boxes = []
  included_names = []

  # class lists
  spillables = []
  electronics = []
  tables = []
  pets = []
  breakables = []
  furnitures = []
  forkKnifeTb = []

  # Results
  output_text_list = []
  isBreakable = False
  isSpillable = False
  isPet = False
  isTable = False
  isElectronic = False
  isForkKnifeTb = False
  isFurniture = False

  #Dictionary definitions
  spillable_dictionary = {"39.0": "Bottle", "40.0": "Wine Glass", "41.0": "Cup"}
  electoric_dictionary = {"62.0": "TV", "63.0": "Laptop"}
  breakable_dictionary = {"39.0": "Bottle", "40.0": "Wine Glass", "41.0": "Cup", "75.0": "Vase"}
  pet_dictionary = {"15.0": "Cat", "16.0": "Dog"}
  other_dictionary = {"60.0": "Table"}
  fork_knife_dictionary= {"42.0": "Fork", "43.0": "Knife", "79.0": "Toothbrush"}
  furniture_dictionary = { "56.0": "Chair", "57.0": "Couch", "59.0": "Bed"}

  #prefixes
  spillable_prefixes = ["39.0", "40.0", "41.0"]
  breakable_prefixes = ["39.0", "40.0", "41.0", "75.0"]
  pet_prefixes = ["15.0", "16.0"]
  table_prefixes = ["60.0"]
  electronic_prefixes = ["62.0", "63.0"]
  fork_knife_prefixes = ["42.0", "43.0"]
  furniture_prefixes = ["56.0", "57.0", "59.0"]
  detectable_classes = [15, 16, 39, 40, 41, 60, 62, 63, 75, 42, 43, 56, 57, 59]

  # Predict
  model = YOLO("yolov8n.pt")
  results = model.predict(source=image, classes=detectable_classes)
  names = model.names

  #sonuçlar işlenmek üzere hazırlanır
  draw = ImageDraw.Draw(image)
  print("draw succ")
  for r in results:
    for box, class_id, confidence, box2 in zip(r.boxes.xywhn, r.boxes.cls, r.boxes.conf, r.boxes.xyxy):
      x, y, w, h = box.tolist()
      # Print the processed values
      line_to_add = f"{class_id} {x} {y} {w} {h} {confidence}"
      boxes.append(line_to_add)
      included_names.append(names[int(class_id)])
      try:
        #box for drawing
        x1, y1, x2, y2 = box2.tolist()
        draw.rectangle([(x1, y1), (x2, y2)], outline='yellow')
        print("draw rectangle succ")
        draw.text((x2-20, y1-5), names[int(class_id)], fill='red', font=ImageFont.truetype("arial.ttf", 30))
        print("draw text succ")
      except Exception as e:
        print("failed to draw box")
        print(e)

  #senaryo 1 masa+kedi+kırabilir
  isTable = check_prefixes(boxes, table_prefixes, isTable)
  if isTable:
    isPet = check_prefixes(boxes, pet_prefixes, isPet)
    if isPet:
      isBreakable = check_prefixes(boxes, breakable_prefixes, isBreakable)
      if isBreakable:
        list_maker(boxes, table_prefixes, tables)
        list_maker(boxes, breakable_prefixes, breakables)
        isCloseToTable = find_is_close_to_table(tables, breakables)
        if isCloseToTable > 0:
          list_maker(boxes, pet_prefixes, pets)
          tempList = find_close_objects(breakables, pets, 0.5)
          if len(tempList) > 0:
            convert_list(tempList, breakable_dictionary, pet_dictionary, 2, output_text_list)

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
        convert_list(tempList, spillable_dictionary, electoric_dictionary, 1, output_text_list)

  #senaryo 3 Bıçak+Çatal+Diş fırçası + yatak/koltuk
  isFurniture = check_prefixes(boxes, furniture_prefixes, isFurniture)
  if isFurniture:
    isForkKnifeTb = check_prefixes(boxes, fork_knife_prefixes, isForkKnifeTb)
    if isForkKnifeTb:
      list_maker(boxes,furniture_prefixes,furnitures)
      list_maker(boxes,fork_knife_prefixes,forkKnifeTb)
      isOnIt = find_is_close_to_table(forkKnifeTb, furnitures)
      if isOnIt > 0.02:
        tempList = find_close_objects(forkKnifeTb, furnitures, 0.5)
        if len(tempList) > 0:
          convert_list(tempList, fork_knife_dictionary, furniture_dictionary, 3, output_text_list)

  #senaryo 4 mutfak dışında çatal/bıçak
  isForkKnifeTb = check_prefixes(boxes, fork_knife_prefixes, isForkKnifeTb)
  if isForkKnifeTb and draft['location'] != 'kitchen':
    ### There is a sharp item out in the open!
    output_text_list.append((f'There is a sharp item out in the open!'))

  #senaryo 5 banyoda elektronik
  isElectronic = check_prefixes(boxes, electronic_prefixes, isElectronic)
  if isElectronic and draft['location'] == 'bathroom':
    ### Electronics in bathroom! Risk of getting wet!
    output_text_list.append((f'Electronics in the bathroom. Risk of getting wet!'))

  return output_text_list, image

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

#overlap check
def calculate_overlap(box1, box2):
  width = min(box1[0] + box1[2] / 2, box2[0] + box2[2] / 2) - max(box1[0] - box1[2] / 2, box2[0] - box2[2] / 2)
  height = min(box1[1] + box1[3] / 2, box2[1] + box2[3] / 2) - max(box1[1] - box1[3] / 2, box2[1] - box2[3] / 2)

  if width <= 0 or height <= 0:
    return 0.0  # No overlap

  intersection = width * height
  area_box1 = box1[2] * box1[3]
  area_box2 = box2[2] * box2[3]

  overlap = intersection / (area_box1 + area_box2 - intersection)
  return overlap  # 0 is no overlap, 1 is complete overlap

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

def find_is_close_to_table(tablelist, otherlist):
  overlap_result = 0.0  # Örtüşme durumunu takip eden değişken
  for item1 in tablelist:
    obj1 = item1.split()
    box1 = tuple(map(float, obj1[1:5]))
    for item2 in otherlist:
      obj2 = item2.split()
      box2 = tuple(map(float, obj2[1:5]))
      overlap_result = calculate_overlap(box1, box2)
      if overlap_result > 0:
        break  # Örtüşme olduğunda döngüyü sonlandır
    if overlap_result > 0:
      break  # Örtüşme olduğunda dış döngüyü de sonlandır
  return overlap_result

def find_breakable_objects(list1, list2, limit):
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

def convert_list(inputList, dictionary1, dictionary2, convertionFormat, output_text_list):
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
    if convertionFormat == 1:
      print("found entry, convertionFormat 1")
      if value == "nearby of":
        output_text_list.append((f'{obj1_name} is {value} {obj2_name}.'))
      output_text_list.append((f'{obj1_name} is {value} to {obj2_name}. Spilling of {obj1_name} may damage {obj2_name}.'))
    elif convertionFormat == 2:
      print("found entry, convertionFormat 2")
      output_text_list.append((f'{obj1_name} is {value} to {obj2_name}. {obj2_name} can break the {obj1_name}'))
    elif convertionFormat == 3:
      print("found entry, convertionFormat 3")
      output_text_list.append((f'{obj1_name} is on the {obj2_name}. Inappropriate place for {obj1_name}'))

def convert_distance_value(value):
  if value < 0.1:
    return "dangerously close"
  elif 0.1 <= value < 0.3:
    return "really close"
  elif 0.3 <= value < 0.4:
    return "close"
  elif 0.4 <= value < 0.5:
    return "nearby of"
  else:
    return "around"
