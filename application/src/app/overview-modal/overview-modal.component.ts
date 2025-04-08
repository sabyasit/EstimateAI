import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
	selector: 'app-overview-modal',
	templateUrl: './overview-modal.component.html',
	styleUrls: ['./overview-modal.component.scss']
})
export class OverviewModalComponent implements OnInit {
	markdown: string = '';
	constructor(public dialogRef: MatDialogRef<OverviewModalComponent>,
		@Inject(MAT_DIALOG_DATA) public model: any) {
	}

	async ngOnInit() {
		const fetchData = await fetch(this.model.modelEndpoint.url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'api-key': this.model.modelEndpoint.key,
			},
			body: JSON.stringify({
				messages: [
					{
						role: "system",
						content: `You are a ${this.model.framework} architect.
						- Don't give code sample.`
					},
					{
						role: "user",
						content: [
							{
								type: "text",
								text: `The project is about building a web application using ${this.model.framework}. The project has table, chart, forms features. Give me 
								- Architecture Overview, 
								- Project Structure, 
								- Popular Libraries, 
								- Coding Standards
								- Sample Workflow`
							}
						]
					}
				],
				max_tokens: 1000,
				stream: false
			}),
		});

		const responseData = await fetchData.json();
		this.markdown = responseData.choices[0].message.content;
	}

}
