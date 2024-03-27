import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { TrainEstimateComponent } from './train-estimate/train-estimate.component';

const routes: Routes = [
  {
    path: 'file-upload',
    component: FileUploadComponent
  },
  {
    path: 'train-model',
    component: TrainEstimateComponent
  },
  { path: '',   redirectTo: '/file-upload', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
