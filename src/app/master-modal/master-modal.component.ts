import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TrainModel } from '../train.model';

@Component({
  selector: 'app-master-modal',
  templateUrl: './master-modal.component.html',
  styleUrls: ['./master-modal.component.scss']
})
export class MasterModalComponent {

  constructor(public dialogRef: MatDialogRef<MasterModalComponent>,
    @Inject(MAT_DIALOG_DATA) public model: any) { }
}
