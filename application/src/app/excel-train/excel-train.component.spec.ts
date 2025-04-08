import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcelTrainComponent } from './excel-train.component';

describe('ExcelTrainComponent', () => {
  let component: ExcelTrainComponent;
  let fixture: ComponentFixture<ExcelTrainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExcelTrainComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExcelTrainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
