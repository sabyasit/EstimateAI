import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
	selector: 'app-overview-modal',
	templateUrl: './overview-modal.component.html',
	styleUrls: ['./overview-modal.component.scss']
})
export class OverviewModalComponent implements OnInit {

	constructor(public dialogRef: MatDialogRef<OverviewModalComponent>,
		@Inject(MAT_DIALOG_DATA) public model: any) {
	}

	ngOnInit(): void {
		throw new Error('Method not implemented.');
	}

}
