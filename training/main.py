# %%
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
import tensorflow as tf
# import tensorflowjs as tfjs
import pathlib 
import os

from tensorflow import keras 
from tensorflow.keras import layers
from tensorflow import math
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPool2D, Flatten, Dense, Input, Activation

def display_random_image(dir, class_type):
    # Define directory to look in
    img_dir = dir + "/" + class_type

    # Get files from directory
    files = os.listdir(img_dir)
    
    # Pick a random image from that directory
    img_name = files[2]
    
    # Read in the image
    img = mpimg.imread(img_dir + "/" + img_name)
    
    # Plot image with title & shape
    plt.imshow(img)
    plt.title(class_type)
    plt.axis("off");
    
    # Show the shape of the image
    print(f"Image shape: {img.shape}")

training_data = tf.keras.utils.image_dataset_from_directory('data/train', 
                                            batch_size=32, 
                                            color_mode='grayscale',
                                            image_size=(256,256))

validation_data = tf.keras.utils.image_dataset_from_directory('data/test',
                                            batch_size=32, 
                                            color_mode='grayscale',
                                            image_size=(256,256))

class_names = training_data.class_names
print(class_names)

for image_batch, labels_batch in training_data:
  print(image_batch.shape)
  print(labels_batch.shape)
  break

plt.figure(figsize=(10, 10))
for images, labels in training_data.take(1):
  for i in range(9):
    ax = plt.subplot(3, 3, i + 1)
    plt.imshow(images[i].numpy().astype("uint8"))
    plt.title(class_names[labels[i]])
    plt.axis("off")

#%%

AUTOTUNE = tf.data.AUTOTUNE
training_data = training_data.shuffle(100).prefetch(buffer_size=AUTOTUNE)
validation_data = validation_data.prefetch(buffer_size=AUTOTUNE)

model = tf.keras.models.Sequential([
  layers.Rescaling(1./255, input_shape=(256, 256, 1)),
  layers.Conv2D(16, 3, padding='same', activation='relu'),
  layers.MaxPooling2D(),
  # layers.Conv2D(32, 3, padding='same', activation='relu'),
  # layers.MaxPooling2D(),
  # layers.Conv2D(64, 3, padding='same', activation='relu'),
  # layers.MaxPooling2D(),
  layers.Dropout(0.2),
  layers.Flatten(),
  layers.Dense(128, activation='relu'),
  layers.Dense(3, name="outputs")
])

model.summary();

# Compile the model
model.compile(loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),
              optimizer=tf.keras.optimizers.Adam(),
              metrics=["accuracy"])

# Fit the model
history = model.fit(training_data,
                        epochs=10,
                        validation_data=validation_data) 

pd.DataFrame(history.history).plot(figsize=(20, 10))

# %%
model.save('model/model.h5')

# %%
#sunflower_url = 'C:/Users/sabya/Desktop/Estimate AI/training/data/predict/c.png'
#sunflower_path = tf.keras.utils.get_file('chart', origin=sunflower_url)

img = tf.keras.utils.load_img(
    'C:/Users/sabya/Desktop/Estimate AI/training/data/predict/c.png', target_size=(256, 256, 3),
    color_mode="grayscale"
)

plt.imshow(img)
img_array = tf.keras.utils.img_to_array(img)
img_array = tf.expand_dims(img_array, 0) # Create a batch

predictions = model.predict(img_array)
score = tf.nn.softmax(predictions[0])

print(score);

print(
    "This image most likely belongs to {} with a {:.2f} percent confidence."
    .format(class_names[np.argmax(score)], 100 * np.max(score))
)

# %%
