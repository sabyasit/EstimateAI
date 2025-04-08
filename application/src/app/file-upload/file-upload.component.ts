import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as ExcelJS from 'exceljs';
import * as pdfLib from 'pdfjs-dist';
import { TrainModel } from '../train.model';
import { MatDialog } from '@angular/material/dialog';
import { ExcelSheetComponent } from '../excel-sheet/excel-sheet.component';

pdfLib.GlobalWorkerOptions.workerSrc = 'assets/pdf.worker.js';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
  model: TrainModel = {
    projectName: '',
    framework: '',
    pages: [],
    master: {
      unitTestPer: 40,
      personHours: 6,
      views: [{ item: 'Very Simple', hr: 1 }, { item: 'Simple', hr: 2 }, { item: 'Medium', hr: 4 }, { item: 'Complex', hr: 8 }],
      services: [{ item: 'NA', hr: 0 }, { item: 'Very Simple', hr: 1 }, { item: 'Simple', hr: 2 }, { item: 'Medium', hr: 4 }, { item: 'Complex', hr: 8 }],
      logics: [{ item: 'NA', hr: 0 }, { item: 'Very Simple', hr: 1 }, { item: 'Simple', hr: 2 }, { item: 'Medium', hr: 4 }, { item: 'Complex', hr: 8 }]
    },
    prediction: {
      'card': { view: 'Simple', logic: 'Very Simple', service: 'Very Simple', weightage: .15, reusability: 0 },
      'chart': { view: 'Complex', logic: 'Simple', service: 'Simple', weightage: 1, reusability: .25 },
      'form': { view: 'Medium', logic: 'Complex', service: 'Medium', weightage: 1, reusability: .15 },
      'search': { view: 'Very Simple', logic: 'Very Simple', service: 'Medium', weightage: .25, reusability: 0 },
      'table': { view: 'Medium', logic: 'Simple', service: 'Simple', weightage: .5, reusability: .25 },
      'menu': { view: 'Simple', logic: 'NA', service: 'NA', weightage: .25, reusability: 0 }
    },
    modelEndpoint: {
      url: '',
      key: ''
    }
  };

  constructor(private router: Router, public dialog: MatDialog) {

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
            name: `Page-${i + 1}`,
            features: [],
            complete: false,
            imageNodes: null
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

  onNewExcelClick(element: any) {
    element.click();
  }

  onNewExcelFileSelected(event: any) {
    const reader = new FileReader();
    reader.readAsArrayBuffer(event.target.files[0]);
    reader.onload = () => {
      const workbook = new ExcelJS.Workbook(); 
      workbook.xlsx.load(reader.result as any).then(data => {
        this.dialog.open(ExcelSheetComponent, {
          data: data
        }).afterClosed().subscribe(value => {
          this.model.excel = value;
          sessionStorage.setItem('model', JSON.stringify(this.model));
          this.router.navigateByUrl('/excel-model');
        })
      })
    };
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
