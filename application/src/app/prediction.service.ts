import { Injectable } from '@angular/core';
import * as ort from 'onnxruntime-web';
import * as tf from '@tensorflow/tfjs';
import 'jimp';
const { Jimp } = window as any;
import { ProcessDetails } from './train.model';

declare const Buffer: any;

@Injectable({
  providedIn: 'root'
})

export class PredictionService {
  PREDICTION_CLASSES = ['chart', 'form', 'menu', 'search', 'table'];

  async initPredection(image: any, coordinates: Array<any>, onPredection: (data: ProcessDetails) => void) {
    //const model = await tf.loadGraphModel('assets/model/model.json');
    await this.predictWithYolo8Model(image, coordinates, onPredection);
    //await this.predictWithTfModel(image, coordinates, onPredection);

  }

  async predictWithTfModel(image: any, coordinates: Array<any>, onPredection: (data: ProcessDetails) => void) {
    const model: any = await tf.loadGraphModel('assets/model_azure/model.json');

    onPredection({ display: true, text: 'Estimate prediction...', value: `0/${coordinates.length}`, data: null });
    await this.sleep();

    for (let i = 0; i < coordinates.length; i++) {
      const cropImage = await this.getCorpImage(image, coordinates[i].value);
      const predictions = await new Promise<any>((resolve: any, reject: any) => {
        const img = new Image();
        img.onload = async () => {
          let tensor = tf.browser.fromPixels(img, 3)
            .resizeNearestNeighbor([224, 224]) // change the image size
            .expandDims()
            .toFloat()
            .reverse(-1);
          let predictions = await model.predict(tensor).data();
          const array = Array.from(predictions).map((value: any, index: number) => {
            return { value, index: this.PREDICTION_CLASSES[index] }
          });
          array.sort((a, b) => a.value > b.value ? -1 : 1);
          resolve(array)
        }
        img.src = cropImage;
      });
      onPredection({
        display: true, text: 'Estimate prediction...', value: `${i + 1}/${coordinates.length}`,
        data: { predictions: predictions, id: coordinates[i].id }
      });
      await this.sleep();
    }

    onPredection({ display: false, text: 'Estimate prediction...', value: `0/${coordinates.length}`, data: null });
  }

  async predictWithYolo8Model(image: any, coordinates: Array<any>, onPredection: (data: ProcessDetails) => void) {
    const session = await ort.InferenceSession.create("assets/model_yolov8/best.onnx");

    onPredection({ display: true, text: 'Estimate prediction...', value: `0/${coordinates.length}`, data: null });
    await this.sleep();

    for (let j = 0; j < coordinates.length; j++) {
      const cropImage = await this.getCorpImage(image, coordinates[j].value);

      let imageBuffer = Buffer.from(cropImage.split(',')[1], 'base64');

      let imageBufferData = await Jimp.read(imageBuffer).then((buffer: any) => {
        return buffer.resize(256, 256);
      });

      var imageData = imageBufferData.bitmap.data;

      const [R, G, B]: [Array<any>, Array<any>, Array<any>] = [[], [], []];
      for (let i = 0; i < imageData.length; i += 4) {
        R.push(imageData[i]);
        G.push(imageData[i + 1]);
        B.push(imageData[i + 2]);
      }
      const transposedData = R.concat(G).concat(B);

      const float32Data = new Float32Array(1 * 3 * 256 * 256);
      for (let i = 0; i < transposedData.length; i++) {
        float32Data[i] = transposedData[i] / 255;
      }

      const inputTensor = new ort.Tensor("float32", float32Data, [1, 3, 256, 256]);
      const feeds: Record<string, ort.Tensor> = {};
      feeds[session.inputNames[0]] = inputTensor;

      const results: any = await session.run(feeds);
      debugger;

      const predictions = Array.from(results[session.outputNames[0]].data).map((value: any, index: number) => {
        return { value, index: this.PREDICTION_CLASSES[index] }
      });
      predictions.sort((a, b) => a.value > b.value ? -1 : 1);

      onPredection({
        display: true, text: 'Estimate prediction...', value: `${j + 1}/${coordinates.length}`,
        data: { predictions: predictions, id: coordinates[j].id }
      });
      await this.sleep();
    }

    onPredection({ display: false, text: 'Estimate prediction...', value: `0/${coordinates.length}`, data: null });
  }

  getCorpImage = (image: any, coordinates: any) => {
    return new Promise<any>((resolve: any, reject: any) => {
      const img = new Image();
      img.onload = () => {
        const canvas: HTMLCanvasElement = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = coordinates[2];
        canvas.height = coordinates[3];
        ctx!.drawImage(img, coordinates[0], coordinates[1], canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      }
      img.src = image;
    });
  }

  sleep = () => {
    return new Promise((resolve: any, reject: any) => {
      setTimeout(() => {
        resolve();
      }, 300);
    })
  }
}