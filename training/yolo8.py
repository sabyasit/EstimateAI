#%%
from ultralytics import YOLO
import numpy as np

model = YOLO('yolov8n-cls.pt')

model.train(data='./data', epochs=10, imgsz=256)

model.export(format='onnx')


# %%
