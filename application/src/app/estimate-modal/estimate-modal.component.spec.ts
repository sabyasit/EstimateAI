import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstimateModalComponent } from './estimate-modal.component';

describe('EstimateModalComponent', () => {
  let component: EstimateModalComponent;
  let fixture: ComponentFixture<EstimateModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EstimateModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstimateModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
