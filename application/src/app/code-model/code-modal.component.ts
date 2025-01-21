import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
	selector: 'app-code-modal',
	templateUrl: './code-modal.component.html',
	styleUrls: ['./code-modal.component.scss']
})
export class CodeModalComponent {
	image: any;
	framework: any;
	loading: number = 1;
	editorOptions = { theme: 'vs-dark', language: 'javascript', readOnly: true, minimap: { enabled: false } };
	code: string = '';
	url: string = '';
	apiKey: string = '';

	constructor(public dialogRef: MatDialogRef<CodeModalComponent>,
		@Inject(MAT_DIALOG_DATA) public data: any) {
		console.log(data);
		this.image = data.image;
		this.framework = data.model.framework;
		this.url = data.model.modelEndpoint.url;
		this.apiKey = data.model.modelEndpoint.key;
	}

	async generateCode() {
		this.loading = 2;
		const fetchData = await fetch(this.url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'api-key': this.apiKey,
			},
			body: JSON.stringify({
				messages: [
					{
						role: "system",
						content: `SYSTEM - You are an expert ${this.framework} developer.
							You take screenshots of a reference web page section from the user, and then build ${this.framework} component.

							- Make sure the app looks exactly like the screenshot.
							- Use the exact text from the screenshot.
							- For images, use placeholder images from https://placehold.co.
							- Don't create multiple files. 
							- Include styles in same typescript/javascript file.

							In terms of libraries, 
							- use popular libraries.

							Return only the full code in typescript/javascript.
							Do not include markdown at the start or end.`
					},
					{
						role: "user",
						content: [
							{
								type: "image_url",
								image_url: {
									url: this.image
								}
							}
						]
					}
				],
				max_tokens: 1000,
				stream: false
			}),
		});

		const responseData = await fetchData.json();
		if(responseData.error) {
			this.loading = 3;
			this.code = `Error: ${responseData.error.message}`;
			return;
		}
		console.log(responseData);
		this.loading = 3;
		this.code = responseData.choices[0].message.content;
	}
}
