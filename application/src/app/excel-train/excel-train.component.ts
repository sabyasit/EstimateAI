import { Component, OnInit } from '@angular/core';
import { TrainModel } from '../train.model';

@Component({
  selector: 'app-excel-train',
  templateUrl: './excel-train.component.html',
  styleUrls: ['./excel-train.component.scss']
})
export class ExcelTrainComponent implements OnInit {
  model!: TrainModel;

  ngOnInit(): void {
    this.model = JSON.parse(sessionStorage.getItem('model')!);
  }
}
