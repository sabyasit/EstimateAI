#%%
from ultralytics import YOLO

model = YOLO('yolov8n-cls.pt')

model.train(data='C:/Users/61074535/data', epochs=10, imgsz=256)

model.export(format='tfjs')

# %%
from ultralytics import YOLO
import numpy as np

model = YOLO('./runs/classify/train3/weights/best.pt')  # load a custom model

model.export(format='tfjs')

results = model('C:/Users/61074535/Code/EstimateAI/training/data/predict/f1.png')  # predict on an image

names_dict = results[0].names

probs = results[0].probs.data.tolist()

print(names_dict)
print(probs)

print(names_dict[np.argmax(probs)])

# %%
