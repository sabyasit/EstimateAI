import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as pdfLib from 'pdfjs-dist';
import { TrainModel } from '../train.model';

pdfLib.GlobalWorkerOptions.workerSrc = 'assets/pdf.worker.js';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
  model: TrainModel = {
    projectName: '',
    pages: [],
    master: {
      unitTestPer: 40,
      personHours: 6,
      views: [{ item: 'Simple', hr: 8 }, { item: 'Medium', hr: 16 }, { item: 'Complex', hr: 24 }],
      services: [{ item: 'NA', hr: 0 }, { item: 'Simple CRUD', hr: 8 }, { item: 'Medium CRUD', hr: 16 }, { item: 'Complex CRUD', hr: 24 }],
      logics: [{ item: 'NA', hr: 0 }, { item: 'Simple', hr: 8 }, { item: 'Medium', hr: 16 }, { item: 'Complex', hr: 24 }]
    }
  };

  constructor(private router: Router) {

  }

  onNewClick(element: any) {
    element.click();
  }

  onNewFileSelected(event: any) {
    const reader = new FileReader();
    reader.readAsArrayBuffer(event.target.files[0]);
    reader.onload = () => {
      pdfLib.getDocument({
        data: new Uint8Array(reader.result as any)
      }).promise.then(async (pdfData: pdfLib.PDFDocumentProxy) => {
        for (let i = 0; i < pdfData.numPages; i++) {
          const page = await pdfData.getPage(i + 1);
          const canvas: HTMLCanvasElement = document.createElement('canvas');
          const viewPort = page.getViewport({ scale: 1 });
          canvas.height = viewPort.height;
          canvas.width = viewPort.width;
          await page.render({
            canvasContext: canvas.getContext('2d')!,
            viewport: viewPort
          }).promise;
          this.model.pages.push({
            data: canvas.toDataURL('image/png'),
            width: canvas.width,
            height: canvas.height,
            name: `Page-${i}`,
            features: [],
            complete: false
          })
        }
        sessionStorage.setItem('model', JSON.stringify(this.model));
        this.router.navigateByUrl('/train-model');
      })
    }
  }

  onExistingClick(element: any) {
    element.click();
  }

  onExistingFileSelected(event: any) {
    const reader = new FileReader();
    reader.readAsText(event.target.files[0]);
    reader.onload = () => {
      sessionStorage.setItem('model', reader.result!.toString());
      this.router.navigateByUrl('/train-model');
    };
  }
}
