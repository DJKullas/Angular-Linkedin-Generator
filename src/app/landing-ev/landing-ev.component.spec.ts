import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingEvComponent } from './landing-ev.component';

describe('LandingEvComponent', () => {
  let component: LandingEvComponent;
  let fixture: ComponentFixture<LandingEvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LandingEvComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandingEvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
