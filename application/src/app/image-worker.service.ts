import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { ProcessDetails } from './train.model';
import ssim from "ssim.js";

@Injectable({
  providedIn: 'root'
})
export class ImageWorkerService {
  async initImage(image: any, data: Array<any>, onImage: (data: ProcessDetails) => void) {
    let edgeRect: any = undefined;
    for (let i = 0; i < data.length; i++) {
      if (data[i].class === 'exposure') {
        onImage({ display: true, text: 'Changing exposure...', value: i * 10, data: image });
        await this.sleep();
        image = await this.changeExposure(image, +data[i].data.gamma);
        await this.sleep();
      }
      if (data[i].class === 'grayStyle') {
        onImage({ display: true, text: 'Changing gray scale...', value: i * 10, data: image });
        await this.sleep();
        image = await this.changeGrayStyle(image);
        await this.sleep();
      }
      if (data[i].class === 'blur') {
        onImage({ display: true, text: 'Changing blur...', value: i * 10, data: image });
        await this.sleep();
        image = await this.changeBlur(image, +data[i].data.kernel);
        await this.sleep();
      }
      if (data[i].class === 'threshold') {
        onImage({ display: true, text: 'Changing threshold...', value: i * 10, data: image });
        await this.sleep();
        image = await this.changeThreshold(image, +data[i].data.value);
        await this.sleep();
      }
      if (data[i].class === 'dilation') {
        onImage({ display: true, text: 'Changing dilation...', value: i * 10, data: image });
        await this.sleep();
        image = await this.changeDilation(image, data[i].data.element, +data[i].data.kernel);
        await this.sleep();
      }
      if (data[i].class === 'canny') {
        onImage({ display: true, text: 'Finding edges...', value: i * 10, data: image });
        await this.sleep();
        edgeRect = await this.getEdge(image, +data[i].data.maxThreshold, +data[i].data.minThreshold, +data[i].data.aperture);
        await this.sleep();
      }
      if (data[i].class === 'end') {
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
      }
    }
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

  changeBlur = (image: any, size: number) => {
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
        cv.GaussianBlur(src, dst, new cv.Size(size, size), 0, 0, cv.BORDER_DEFAULT);
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

  changeDilation = (image: any, element: any, size: number) => {
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

        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(size, size));

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

  changeThreshold = (image: any, value: number) => {
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

        let dst = new cv.Mat();
        cv.threshold(src, dst, value, 255, cv.THRESH_BINARY);

        cv.imshow(canvas, dst);

        src.delete();
        dst.delete();

        resolve(canvas.toDataURL('image/png'));
      }
      img.src = image;
    })
  }

  getEdge = (image: any, maxThreshold: number, minThreshold: number, aperture: number) => {
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
        cv.Canny(src, edges, minThreshold, maxThreshold, aperture);

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
        resolve({ array, image })
      }
      img.src = image;
    });
  }

  getImageMatch = (src: any, test: any): Promise<number> => {
    return new Promise(async (resolve: any) => {
      let width = 256, height = 256;
      const imgTest = new Image();
      imgTest.src = test;
      await new Promise(r => {
        imgTest.onload = r
      });
      width = imgTest.width;
      height = imgTest.height;
      const canvasTest = document.createElement('canvas');
      const ctxTest = canvasTest.getContext('2d');
      canvasTest.width = width;
      canvasTest.height = height;
      ctxTest?.drawImage(imgTest, 0, 0, imgTest.width, imgTest.height, 0, 0, width, height);
      const testData = ctxTest?.getImageData(0, 0, width, height);

      const imgSrc = new Image();
      imgSrc.src = src;
      await new Promise(r => {
        imgSrc.onload = r
      });
      const canvasSrc = document.createElement('canvas');
      const ctxSrc = canvasSrc.getContext('2d');
      canvasSrc.width = width;
      canvasSrc.height = height;
      ctxSrc?.drawImage(imgSrc, 0, 0, imgSrc.width, imgSrc.height, 0, 0, width, height);
      const srcData = ctxSrc?.getImageData(0, 0, width, height);

      const { mssim, performance } = ssim(srcData!, testData!, { ssim: 'original' });

      resolve(mssim);
    })
  }

  getLimitDimensions = (
    width: number,
    height: number,
    limit?: number
  ) => {
    if (limit && width >= limit && height >= limit) {
      const ratio = width / height;

      if (ratio > 1) {
        return { height: limit, width: Math.round(limit / ratio) };
      }
      return { height: Math.round(limit * ratio), width: limit };
    }
    return { width, height };
  }

  sleep = () => {
    return new Promise((resolve: any, reject: any) => {
      setTimeout(() => {
        resolve();
      }, 300);
    })
  }
}