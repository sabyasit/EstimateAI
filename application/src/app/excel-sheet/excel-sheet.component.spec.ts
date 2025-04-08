import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcelSheetComponent } from './excel-sheet.component';

describe('ExcelSheetComponent', () => {
  let component: ExcelSheetComponent;
  let fixture: ComponentFixture<ExcelSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExcelSheetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExcelSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
