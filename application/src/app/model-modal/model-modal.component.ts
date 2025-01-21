import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
	selector: 'app-model-modal',
	templateUrl: './model-modal.component.html',
	styleUrls: ['./model-modal.component.scss']
})
export class ModelModalComponent {
	param = {
		model: '2'
	}
	constructor(public dialogRef: MatDialogRef<ModelModalComponent>,
		@Inject(MAT_DIALOG_DATA) public data: any
	) {
		console.log(this.data)
	}

	calcEstimateCost() {
		return ((.15 * (this.data.token.input / 1000000)) + (.6 * (this.data.token.output / 1000000)) + this.data.token.api).toFixed(4);
	}
}
