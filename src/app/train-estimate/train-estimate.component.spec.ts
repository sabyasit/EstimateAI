import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainEstimateComponent } from './train-estimate.component';

describe('TrainEstimateComponent', () => {
  let component: TrainEstimateComponent;
  let fixture: ComponentFixture<TrainEstimateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrainEstimateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrainEstimateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
