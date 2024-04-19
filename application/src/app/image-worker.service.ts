import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { ProcessDetails } from './train.model';

@Injectable({
  providedIn: 'root'
})
export class ImageWorkerService {
  async initImage(image: any, onImage: (data: ProcessDetails) => void) {
    onImage({ display: true, text: 'Changing exposure...', value: 0, data: image });
    await this.sleep();

    const exposureImage = await this.changeExposure(image, 5);
    onImage({ display: true, text: 'Changing gray style...', value: 25, data: exposureImage });
    await this.sleep();

    const grayImage = await this.changeGrayStyle(exposureImage);
    onImage({ display: true, text: 'Changing blur...', value: 50, data: grayImage });
    await this.sleep();

    const blurImage = await this.changeBlur(grayImage);
    onImage({ display: true, text: 'Changing dilation...', value: 60, data: blurImage });
    await this.sleep();

    const dilatedImage = await this.changeDilation(blurImage);
    onImage({ display: true, text: 'Finding edges...', value: 75, data: dilatedImage });
    await this.sleep();

    onImage({ display: true, text: 'Finding edges...', value: 90, data: image });
    const edgeRect = await this.getEdge(dilatedImage);
    await this.sleep();

    for (let i = 0; i < edgeRect.length; i++) {
      onImage({
        display: true, text: 'Drwaing edges..', value: 95, data: {
          rect: edgeRect[i],
          index: i
        }
      });
      await this.sleep();
    }

    onImage({ display: false, text: 'Complete', value: 100, data: edgeRect });
    await this.sleep();
    onImage({ display: false, text: 'Complete', value: 100, data: edgeRect });
  }

  async initPredection(image: any, coordinates: Array<any>, onPredection: (data: ProcessDetails) => void) {
    //const model = await tf.loadGraphModel('assets/model/model.json');

    const model = await tf.loadLayersModel('assets/model/model.json');

    onPredection({ display: true, text: 'Estimate prediction...', value: `0/${coordinates.length}`, data: null });
    await this.sleep();

    for (let i = 0; i < coordinates.length; i++) {
      const cropImage = await this.getCorpImage(image, coordinates[i].value);
      const predictions = await this.prediction(cropImage, model);
      onPredection({ display: true, text: 'Estimate prediction...', value: `${i + 1}/${coordinates.length}`, data: { predictions: predictions.array, image: predictions.image, id: coordinates[i].id } });
      await this.sleep();
    }

    onPredection({ display: false, text: 'Estimate prediction...', value: `0/${coordinates.length}`, data: null });
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

        const cv = (window as any).cv;

        const src = cv.imread(canvas);

        let dst = new cv.Mat();
        cv.GaussianBlur(src, dst, new cv.Size(3, 3), 0, 0, cv.BORDER_DEFAULT);
        cv.imshow(canvas, dst);

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

  changeDilation = (image: any) => {
    return new Promise<any>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas: HTMLCanvasElement = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx!.drawImage(img, 0, 0, img.width, img.height);

        const cv = (window as any).cv;

        const src = cv.imread(canvas);

        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));

        // Perform dilation
        const dilated = new cv.Mat();
        cv.dilate(src, dilated, kernel);

        cv.imshow(canvas, dilated);

        src.delete();
        dilated.delete();
        kernel.delete();

        resolve(canvas.toDataURL('image/png'));
      }
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
            const sortX = points.map(x => x.x).sort((a, b) => a - b);
            const sortY = points.map(x => x.y).sort((a, b) => a - b);
            rectangles.push({
              x1: sortX[0],
              y1: sortY[0],
              x2: sortX[3],
              y2: sortY[3],
              points: points
            });
          }
          approx.delete();
          contour.delete();
        }

        //Draw rectangles
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

        resolve(rectangles.filter(rect => ((rect.x2 - rect.x1) * (rect.y2 - rect.y1)) > 1000));
      };
      img.src = image;
    })
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

  prediction = (image: any, model: any) => {
    const prediction = ['chart', 'form', 'menu', 'table'];
    return new Promise<any>((resolve: any, reject: any) => {
      const img = new Image();
      img.onload = async () => {
        let tensor = tf.browser.fromPixels(img, 3).resizeNearestNeighbor([100, 100]);
        //tensor = tf.image.rgbToGrayscale(tensor);
        //tensor = tf.image.resizeBilinear(tensor, [100, 100]);
        tensor = tensor.cast('float32').div(255);
        //tensor = tf.image.resizeBilinear(tensor, [256, 256]);
        tensor = tensor.expandDims();

        // let tensor = tf.browser.fromPixels(img, 3)
        //   .resizeNearestNeighbor([224, 224]) // change the image size
        //   .expandDims()
        //   .toFloat()
        //   .reverse(-1);
        let predictions = await model.predict(tensor).data();
        const array = Array.from(predictions).map((value: any, index: number) => {
          return { value, index: prediction[index] }
        });
        array.sort((a, b) => a.value > b.value ? -1 : 1);
        console.log(array);
        resolve({array, image})
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