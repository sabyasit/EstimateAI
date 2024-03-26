import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TrainModel } from '../train.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-estimate-modal',
  templateUrl: './estimate-modal.component.html',
  styleUrls: ['./estimate-modal.component.scss']
})
export class EstimateModalComponent implements OnInit {
  model!: TrainModel;
  units = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    unit: new FormControl(1),
    view: new FormControl(),
    service: new FormControl(),
    logic: new FormControl(),
    common: new FormControl(false),
    color: new FormControl('#FF0000')
  });

  constructor(public dialogRef: MatDialogRef<EstimateModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    this.model = JSON.parse(sessionStorage.getItem('model')!);
    if (!this.data.edit) {
      this.form.get('view')?.setValue(this.model.master.views[0].item);
      this.form.get('service')?.setValue(this.model.master.services[0].item);
      this.form.get('logic')?.setValue(this.model.master.logics[0].item);
    } else {
      this.form.setValue({
        name: this.data.value.name,
        unit: this.data.value.unit,
        view: this.data.value.view,
        service: this.data.value.service,
        logic: this.data.value.logic,
        common: this.data.value.common,
        color: this.data.value.color
      });
    }
  }

  onSave() {
    this.dialogRef.close({ type: this.data.edit ? 'EDIT' : 'NEW', data: this.form.getRawValue() });
  }

  onDelete() {
    this.dialogRef.close({ type: 'DELETE' });
  }

  onCancel() {
    this.dialogRef.close(!this.data.edit ? { type: 'REMOVE' } : '');
  }
}
