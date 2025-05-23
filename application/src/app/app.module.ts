import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from  '@angular/common/http';

import { AppComponent } from './app.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { TrainEstimateComponent } from './train-estimate/train-estimate.component';
import { EstimateModalComponent } from './estimate-modal/estimate-modal.component';
import { MasterModalComponent } from './master-modal/master-modal.component';
import { MatFormFieldModule } from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { ImageWorkerService } from './image-worker.service';
import { CodeModalComponent } from './code-model/code-modal.component';
import { SectionStepModalComponent } from './section-step/section-step.component';
import { ModelModalComponent } from './model-modal/model-modal.component';
import {MatRadioModule} from '@angular/material/radio';
import { OverviewModalComponent } from './overview-modal/overview-modal.component';
import { ExcelTrainComponent } from './excel-train/excel-train.component';
import { ExcelSheetComponent } from './excel-sheet/excel-sheet.component';
import { MarkdownModule } from 'ngx-markdown';

@NgModule({
  declarations: [
    AppComponent,
    FileUploadComponent,
    TrainEstimateComponent,
    EstimateModalComponent,
    MasterModalComponent,
    CodeModalComponent,
    SectionStepModalComponent,
    ModelModalComponent,
    OverviewModalComponent,
    ExcelTrainComponent,
    ExcelSheetComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSelectModule,
    MatCheckboxModule,
    MatMenuModule,
    MatTabsModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatExpansionModule,
    MatRadioModule,
    MonacoEditorModule.forRoot(),
    MarkdownModule.forRoot()
  ],
  providers: [ImageWorkerService],
  bootstrap: [AppComponent]
})
export class AppModule { }
