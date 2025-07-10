import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PacientesEspecialistaComponent } from './pacientes-especialista.component';

describe('PacientesEspecialistaComponent', () => {
  let component: PacientesEspecialistaComponent;
  let fixture: ComponentFixture<PacientesEspecialistaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PacientesEspecialistaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PacientesEspecialistaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
