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
  url: string = '';
  apiKey: string = '';
  editorOptions = { theme: 'vs-dark', language: 'javascript', readOnly: true, minimap: { enabled: false } };
  code: string = '';

  constructor(public dialogRef: MatDialogRef<CodeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public model: any) {
    console.log(model);
    this.image = model.image;
	this.framework = model.framework;
  }

  generateCode() {
    this.loading = 2;
    setTimeout(() => {
      this.loading = 3;
      this.code = `import { Component, ViewChild } from '@angular/core';
import {
	MonacoEditorComponent,
	MonacoEditorConstructionOptions,
	MonacoEditorLoaderService,
	MonacoStandaloneCodeEditor
} from '@materia-ui/ngx-monaco-editor';

@Component({
  selector: 'app-text-editor',
	templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent  {
  @ViewChild(MonacoEditorComponent, { static: false }) monacoComponent: MonacoEditorComponent;
	
	userCode: string = "var a = 2";
	userLanguage: string = "javascript";
	availableLanguages: string[] = [
		"javascript",
		"html",
		"css"
	];
	userTheme: string = "vs-dark";
	editorOptions: MonacoEditorConstructionOptions = {
		theme: this.userTheme,
		language: this.userLanguage,
		roundedSelection: true,
		autoIndent: true
	};
	editor: MonacoStandaloneCodeEditor;

	constructor(private monacoLoaderService: MonacoEditorLoaderService) {
	}

	ngOnInit(): void { }

	editorInit(editor: MonacoStandaloneCodeEditor) {
		this.editor = editor
	}

	changeLanguage($event) {
		this.editorOptions = {...this.editorOptions, language: $event.currentTarget.value}
	}
}
`
    }, 3000);
  }
}
