import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreativeCvComponent } from './creative-cv.component';

describe('CreativeCvComponent', () => {
  let component: CreativeCvComponent;
  let fixture: ComponentFixture<CreativeCvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreativeCvComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreativeCvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
