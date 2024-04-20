const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

const TRAIN_IMAGES_DIR = './data/train';
const TEST_IMAGES_DIR = './data/test';

function loadImages(dataDir) {
    const images = [];
    const labels = [];

    var folders = fs.readdirSync(dataDir);

    for (var j = 0; j < folders.length; j++) {
        var pathFolder = dataDir + '/' + folders[j];

        var files = fs.readdirSync(pathFolder);

        for (let i = 0; i < files.length; i++) {
            var filePath = path.join(pathFolder, files[i]);

            var buffer = fs.readFileSync(filePath);

            var imageTensor = tf.node.decodePng(buffer, 3);
            imageTensor = tf.image.resizeBilinear(imageTensor, size = [256, 256]);
            imageTensor = tf.image.rgbToGrayscale(imageTensor);
            imageTensor = imageTensor.div(255);
            imageTensor = imageTensor.expandDims();

            images.push(imageTensor);

            const label = folders[j];
            if (label === 'chart') {
                labels.push(0);
            }
            if (label === 'form') {
                labels.push(1);
            }
            if (label === 'table') {
                labels.push(2);
            }
        }
        console.log(images, labels);
    }

    return [images, labels];
}

async function run() {
    var trainImageData = loadImages(TRAIN_IMAGES_DIR);
    var testImageData = loadImages(TEST_IMAGES_DIR);

    var trainData = {
        images: tf.concat(trainImageData[0], 0),
        labels: tf.oneHot(tf.tensor1d(trainImageData[1], 'int32'), 3).toFloat()
    }
    var testData = {
        images: tf.concat(testImageData[0]),
        labels: tf.oneHot(tf.tensor1d(testImageData[1], 'int32'), 3).toFloat()
    }

    const model = tf.sequential();

    model.add(tf.layers.conv2d({ inputShape: [256, 256, 1], filters: 32, kernelSize: [3, 3], activation: 'relu' }));
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
    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));

    model.summary();

    model.compile({
        optimizer: tf.train.adam(),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });

    await model.fit(trainData.images, trainData.labels, {
        epochs: 10
    });

    const evalOutput = model.evaluate(testData.images, testData.labels);
    console.log(
        `\nEvaluation result:\n` +
        `  Loss = ${evalOutput[0].dataSync()[0].toFixed(3)}; ` +
        `Accuracy = ${evalOutput[1].dataSync()[0].toFixed(3)}`);

    await model.save(`file://./model`);
}

run();