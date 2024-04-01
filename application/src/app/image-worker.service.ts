import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { ProcessDetails } from './train.model';

@Injectable({
  providedIn: 'root'
})
export class ImageWorkerService {
  public onImage!: (data: ProcessDetails) => void;

  async init(image: any) {
    this.triggerOnImage(true, 'Changing exposure...', 0, false, '', '', undefined, image);
    await this.sleep();

    const exposureImage = await this.changeExposure(image, 5);
    this.triggerOnImage(true, 'Changing gray style...', 25, false, '', '', undefined, exposureImage);
    await this.sleep();

    const grayImage = await this.changeGrayStyle(exposureImage);
    this.triggerOnImage(true, 'Changing blur...', 50, false, '', '', undefined, grayImage);
    await this.sleep();

    const blurImage = await this.changeBlur(grayImage);
    this.triggerOnImage(true, 'Finding edges...', 75, false, '', '', undefined, blurImage);
    await this.sleep();

    const edgeRect = await this.getEdge(blurImage);
    this.triggerOnImage(true, 'Drwaing edges..', 90, false, '', '', undefined, image);
    await this.sleep();

    this.triggerOnImage(true, 'Complete', 100, true, 'Estimation prediction...', `0/${edgeRect.length + 1}`, undefined, image);

    const model = await tf.loadLayersModel('assets/model/model.json');

    for (let i = 0; i < edgeRect.length; i++) {
      const cropImage = await this.getCorpImage(image, edgeRect[i]);
      const predictions = await this.prediction(cropImage, model);
      this.triggerOnImage(true, 'Complete', 100, true, 'Estimation prediction...', `${i + 1}/${edgeRect.length + 1}`, {
        rect: edgeRect[i],
        predictions,
        index: i
      }, image);
      await this.sleep();
    }
    this.triggerOnImage(false, 'Complete', 100, false, '', '', undefined, image);
  }

  changeGrayStyle = (image: any) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas: HTMLCanvasElement = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx!.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = avg; // Red
          data[i + 1] = avg; // Green
          data[i + 2] = avg; // Blue
        }
        ctx!.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = image;
    })
  }

  changeBlur = (image: any) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas: HTMLCanvasElement = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx!.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        // Precomputed Gaussian kernel (5x5)
        const kernel = [
          [1, 4, 6, 4, 1],
          [4, 16, 24, 16, 4],
          [6, 24, 36, 24, 6],
          [4, 16, 24, 16, 4],
          [1, 4, 6, 4, 1]
        ];

        const kernelSize = 5;
        const kernelRadius = Math.floor(kernelSize / 2);

        const newData = new Uint8ClampedArray(data.length);

        // Apply convolution
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            let sumR = 0, sumG = 0, sumB = 0, sumA = 0, weightSum = 0;
            for (let ky = 0; ky < kernelSize; ky++) {
              for (let kx = 0; kx < kernelSize; kx++) {
                const pixelX = x + kx - kernelRadius;
                const pixelY = y + ky - kernelRadius;
                if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
                  const offset = (pixelY * width + pixelX) * 4;
                  const weight = kernel[ky][kx];
                  sumR += data[offset] * weight;
                  sumG += data[offset + 1] * weight;
                  sumB += data[offset + 2] * weight;
                  sumA += data[offset + 3] * weight;
                  weightSum += weight;
                }
              }
            }
            const offset = (y * width + x) * 4;
            newData[offset] = sumR / weightSum;
            newData[offset + 1] = sumG / weightSum;
            newData[offset + 2] = sumB / weightSum;
            newData[offset + 3] = sumA / weightSum;
          }
        }

        // Put blurred image data back to canvas
        const newImageData = new ImageData(newData, width, height);
        ctx!.putImageData(newImageData, 0, 0);

        resolve(canvas.toDataURL('image/png'))
      };
      img.src = image;
    })
  }

  changeExposure = (image: any, gamma: number) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas: HTMLCanvasElement = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx!.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.pow(data[i] / 255, gamma) * 255; // Red
          data[i + 1] = Math.pow(data[i + 1] / 255, gamma) * 255; // Green
          data[i + 2] = Math.pow(data[i + 2] / 255, gamma) * 255; // Blue
        }

        ctx!.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = image;
    })
  }

  getEdge = (image: any) => {
    return new Promise<any>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas: HTMLCanvasElement = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx!.drawImage(img, 0, 0, img.width, img.height);

        const cv = (window as any).cv;

        // Convert canvas to OpenCV Mat
        const src = cv.imread(canvas);

        // Convert image to grayscale
        const gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        // Detect edges using Canny edge aw
        const edges = new cv.Mat();
        cv.Canny(src, edges, 50, 150, 3);

        // Find contours
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        // Find rectangles
        const rectangles = [];
        for (let i = 0; i < contours.size(); i++) {
          const contour = contours.get(i);
          const peri = cv.arcLength(contour, true);
          const approx = new cv.Mat();
          cv.approxPolyDP(contour, approx, 0.02 * peri, true);
          if (approx.size().height === 4) {
            const points = [];
            for (let j = 0; j < approx.size().height; j++) {
              points.push({ x: approx.data32S[j * 2], y: approx.data32S[j * 2 + 1] });
            }
            rectangles.push(points);
          }
          approx.delete();
          contour.delete();
        }

        // Draw rectangles
        // for (let i = 0; i < rectangles.length; i++) {
        //   ctx!.beginPath();
        //   ctx!.moveTo(rectangles[i][0].x, rectangles[i][0].y);
        //   for (let j = 1; j < 4; j++) {
        //     ctx!.lineTo(rectangles[i][j].x, rectangles[i][j].y);
        //   }
        //   ctx!.closePath();
        //   ctx!.strokeStyle = 'red';
        //   ctx!.lineWidth = 2;
        //   ctx!.stroke();
        // }

        // Clean up
        src.delete();
        gray.delete();
        edges.delete();
        contours.delete();
        hierarchy.delete();

        resolve(rectangles.filter(rect => ((rect[2].x - rect[0].x) * (rect[2].y - rect[0].y)) > 1000));
      };
      img.src = image;
    })
  }

  getCorpImage = (image: any, rect: any) => {
    return new Promise<any>((resolve: any, reject: any) => {
      const img = new Image();
      img.onload = () => {
        const canvas: HTMLCanvasElement = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = rect[2].x - rect[0].x;
        canvas.height = rect[2].y - rect[0].y;
        ctx!.drawImage(img, rect[0].x, rect[0].y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      }
      img.src = image;
    });
  }

  prediction = (image: any, model: any) => {
    return new Promise<any>((resolve: any, reject: any) => {
      const img = new Image();
      img.onload = async () => {
        let tensor = tf.browser.fromPixels(img);
        tensor = tensor.cast('float32').div(255);
        tensor = tf.image.resizeBilinear(tensor, [100, 100]);
        tensor = tensor.expandDims();

        let predictions = await model.predict(tensor).data();
        console.log(predictions);
        resolve(predictions);
      }
      img.src = image;
    });
  }

  triggerOnImage(display: boolean,
    imageProcessText: string,
    imageProcessValue: number,
    displayEstimate: boolean,
    estimateText: string,
    estimateStatus: string,
    estimateValue: any,
    image: any) {
    this.onImage({
      display,
      imageProcessText,
      imageProcessValue,
      displayEstimate,
      estimateText,
      estimateStatus,
      estimateValue,
      image
    });
  }

  sleep = () => {
    return new Promise((resolve: any, reject: any) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    })
  }
}