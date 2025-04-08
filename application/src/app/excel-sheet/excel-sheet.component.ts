import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-excel-sheet',
  templateUrl: './excel-sheet.component.html',
  styleUrls: ['./excel-sheet.component.scss']
})
export class ExcelSheetComponent implements OnInit {
  sheets: Array<any> = [];
  columns: Array<any> = [
    { id: 1, name: 'A' },
    { id: 2, name: 'B' },
    { id: 3, name: 'C' },
    { id: 4, name: 'D' },
    { id: 5, name: 'E' },
    { id: 6, name: 'F' },
    { id: 7, name: 'G' },
    { id: 8, name: 'H' },
    { id: 9, name: 'I' },
    { id: 10, name: 'J' }
  ];

  sheetForm = new FormGroup({
    sheet: new FormControl(''),
    column: new FormControl('')
  });

  constructor(public dialogRef: MatDialogRef<ExcelSheetComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit(): void {
    this.data.worksheets.forEach((sheet: any, i: any) => {
      this.sheets.push({ id: i + 1, name: sheet.name });
    });

  }

  processData() {
    const data: Array<any> = [];
    this.data.getWorksheet(this.sheetForm.value.sheet).eachRow((row: any) => {
      row.eachCell((cell: any) => {
        if(cell.col === this.sheetForm.value.column) {
          data.push(cell.value);
        }
      })
    })
    this.dialogRef.close(data);
  }
}
