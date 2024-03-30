const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

const TRAIN_IMAGES_DIR = './data/train';
const TEST_IMAGES_DIR = './data/test';

function loadImages(dataDir) {
  const images = [];
  const labels = [];
  
  var files = fs.readdirSync(dataDir);
  for (let i = 0; i < files.length; i++) { 
    if (!files[i].toLocaleLowerCase().endsWith(".png")) {
      continue;
    }

    var filePath = path.join(dataDir, files[i]);
    debugger;
    var buffer = fs.readFileSync(filePath);
    var imageTensor = tf.node.decodeImage(buffer, 3)
    imageTensor = imageTensor.cast('float32').div(255);
    imageTensor = tf.image.resizeBilinear(imageTensor, size = [100, 100]);
    imageTensor = imageTensor.expandDims();
    images.push(imageTensor);
    
    labels.push(files[i].toLocaleLowerCase().split('_')[1].split('.')[0]);
  }
  return [images, labels];
}

/** Helper class to handle loading training and test data. */
class TuberculosisDataset {
  constructor() {
    this.trainData = [];
    this.testData = [];
  }

  /** Loads training and test data. */
  loadData() {
    console.log('Loading images...');
    this.trainData = loadImages(TRAIN_IMAGES_DIR);
    this.testData = loadImages(TEST_IMAGES_DIR);
    console.log('Images loaded successfully.')
  }

  getTrainData() {
    return {
      images: tf.concat(this.trainData[0]),
      labels: tf.oneHot(tf.tensor1d(this.trainData[1], 'int32'), 4).toFloat()
    }
  }

  getTestData() {
    return {
      images: tf.concat(this.testData[0]),
      labels: tf.oneHot(tf.tensor1d(this.testData[1], 'int32'), 4).toFloat()
    }
  }
}

module.exports = new TuberculosisDataset();