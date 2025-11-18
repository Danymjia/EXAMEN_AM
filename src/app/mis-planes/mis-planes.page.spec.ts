import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MisPlanesPage } from './mis-planes.page';

describe('MisPlanesPage', () => {
  let component: MisPlanesPage;
  let fixture: ComponentFixture<MisPlanesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MisPlanesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
