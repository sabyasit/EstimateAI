import { Injectable } from '@angular/core';
import * as ort from 'onnxruntime-web';
import * as tf from '@tensorflow/tfjs';
import 'jimp';
const { Jimp } = window as any;
import { ProcessDetails } from './train.model';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';
import { ImageWorkerService } from './image-worker.service';

declare const Buffer: any;

@Injectable({
  providedIn: 'root'
})

export class PredictionService {
  PREDICTION_CLASSES = ['card', 'chart', 'form', 'menu', 'search', 'table'];

  constructor(public apiService: ApiService, public imageWorkerService: ImageWorkerService) { }

  async initPredection(image: any, coordinates: Array<any>, onPredection: (data: ProcessDetails) => void) {
    //const model = await tf.loadGraphModel('assets/model/model.json');
    //await this.predictWithYolo8Model(image, coordinates, onPredection);
    await this.predictWithTfModel(image, coordinates, onPredection);

  }

  async predictWithTfModel(image: any, coordinates: Array<any>, onPredection: (data: ProcessDetails) => void) {
    const model: any = await tf.loadLayersModel('assets/model/model.json');

    onPredection({ display: true, text: 'Estimate prediction...', value: `0/${coordinates.length}`, data: null });
    await this.sleep();

    for (let i = 0; i < coordinates.length; i++) {
      const cropImage = await this.imageWorkerService.getCorpImage(image, coordinates[i].value);
      const predictions = await new Promise<any>((resolve: any, reject: any) => {
        const img = new Image();
        img.onload = async () => {
          let tensor = tf.browser.fromPixels(img, 1)
            .resizeNearestNeighbor([256, 256])
            .toFloat()
            .div(255)
            .expandDims(0);
          let predictions = await model.predict(tensor).data();
          debugger;
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
        data: { predictions: predictions, id: coordinates[i].id }, image: cropImage
      });
      await this.sleep();
    }

    onPredection({ display: false, text: 'Estimate prediction...', value: `0/${coordinates.length}`, data: null });
  }

  async predictWithAzureModel(image: any, coordinates: Array<any>, onPredection: (data: ProcessDetails) => void) {
    const model: any = await tf.loadGraphModel('assets/model_azure/model.json');

    onPredection({ display: true, text: 'Estimate prediction...', value: `0/${coordinates.length}`, data: null });
    await this.sleep();

    for (let i = 0; i < coordinates.length; i++) {
      const cropImage = await this.imageWorkerService.getCorpImage(image, coordinates[i].value);
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
        data: { predictions: predictions, id: coordinates[i].id }, image: cropImage
      });
      await this.sleep();
    }

    onPredection({ display: false, text: 'Estimate prediction...', value: `0/${coordinates.length}`, data: null });
  }

  async predictWithYolo8Model(image: any, coordinates: Array<any>, onPredection: (data: ProcessDetails) => void) {
    ort.env.wasm.wasmPaths = 'assets/';
    const session = await ort.InferenceSession.create("assets/model_yolov8/best.onnx");

    onPredection({ display: true, text: 'Estimate prediction...', value: `0/${coordinates.length}`, data: null });
    await this.sleep();

    for (let j = 0; j < coordinates.length; j++) {
      const cropImage = await this.imageWorkerService.getCorpImage(image, coordinates[j].value);

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

      let predictions = Array.from(results[session.outputNames[0]].data).map((value: any, index: number) => {
        return { value, index: this.PREDICTION_CLASSES[index] }
      });
      predictions.sort((a, b) => a.value > b.value ? -1 : 1);

      // if (predictions[0].value < .5) {
      //   try {
      //     const response = await firstValueFrom(this.apiService.getGPT4ImageClassification(cropImage));
      //     if (response?.choices[0]?.message?.content) {
      //       predictions = JSON.parse(response.choices[0].message.content.replace(/'/g, '"')).map((x: any) => {
      //         return {
      //           index: x,
      //           value: 1
      //         }
      //       })
      //     }
      //   } catch { }
      // }

      onPredection({
        display: true, text: 'Estimate prediction...', value: `${j + 1}/${coordinates.length}`,
        data: { predictions: predictions, id: coordinates[j].id }, image: cropImage
      });
      await this.sleep();
    }

    onPredection({ display: false, text: 'Estimate prediction...', value: `0/${coordinates.length}`, data: null });
  }



  sleep = () => {
    return new Promise((resolve: any, reject: any) => {
      setTimeout(() => {
        resolve();
      }, 300);
    })
  }
}