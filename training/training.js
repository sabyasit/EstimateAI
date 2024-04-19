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
        var filePath = path.join(dataDir, files[i]);

        var buffer = fs.readFileSync(filePath);

        var imageTensor = tf.node.decodePng(buffer, 3);
        //imageTensor = tf.image.rgbToGrayscale(imageTensor);
        imageTensor = imageTensor.cast('float32').div(255);
        imageTensor = imageTensor.expandDims();
        //console.log(imageTensor.shape)

        images.push(imageTensor);

        const label = files[i].toLocaleLowerCase().split('_')[1].split('.')[0];
        if (label === 'chart') {
            labels.push(0);
        }
        if (label === 'form') {
            labels.push(1);
        }
        if (label === 'menu') {
            labels.push(2);
        }
        if (label === 'table') {
            labels.push(3);
        }
    }

    return [images, labels];
}

async function run() {
    var trainImageData = loadImages(TRAIN_IMAGES_DIR);
    var testImageData = loadImages(TEST_IMAGES_DIR);

    var trainData = {
        images: tf.concat(trainImageData[0], 0),
        labels: tf.oneHot(tf.tensor1d(trainImageData[1], 'int32'), 4).toFloat()
    }
    var testData = {
        images: tf.concat(testImageData[0]),
        labels: tf.oneHot(tf.tensor1d(testImageData[1], 'int32'), 4).toFloat()
    }

    const model = tf.sequential();

    model.add(tf.layers.conv2d({ inputShape: [100, 100, 3], filters: 32, kernelSize: [3, 3], activation: 'relu' }));
    //model.add(tf.layers.batchNormalization());
    model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
    //model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.conv2d({ filters: 64, kernelSize: [3, 3], activation: 'relu' }));
    model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
    // model.add(tf.layers.batchNormalization());
    // model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.conv2d({ filters: 128, kernelSize: [3, 3], activation: 'relu' }));
    model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
    //model.add(tf.layers.batchNormalization());
    //model.add(tf.layers.dropout({ rate: 0.2 }));

    // model.add(tf.layers.conv2d({ filters: 64, kernelSize: [5, 5], activation: 'relu' }));
    // model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
    // model.add(tf.layers.batchNormalization());
    // model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.flatten());

    model.add(tf.layers.dense({ units: 256, activation: 'relu' }));
    // model.add(tf.layers.dropout({ rate: 0.5 }));
    // model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.5 }));
    model.add(tf.layers.dense({ units: 4, activation: 'softmax' }));

    model.summary();

    model.compile({
        optimizer: tf.train.adam(),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });

    await model.fit(trainData.images, trainData.labels, {
        epochs: 30
    });

    const evalOutput = model.evaluate(testData.images, testData.labels);
    console.log(
        `\nEvaluation result:\n` +
        `  Loss = ${evalOutput[0].dataSync()[0].toFixed(3)}; `+
        `Accuracy = ${evalOutput[1].dataSync()[0].toFixed(3)}`);

    await model.save(`file://./model`);
}

run();