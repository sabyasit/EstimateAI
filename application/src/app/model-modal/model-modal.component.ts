import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
	selector: 'app-model-modal',
	templateUrl: './model-modal.component.html',
	styleUrls: ['./model-modal.component.scss']
})
export class ModelModalComponent {
	param = {
		model: '2',
		url: '',
		apiKey: ''
	}
	constructor(public dialogRef: MatDialogRef<ModelModalComponent>) {

	}

}
