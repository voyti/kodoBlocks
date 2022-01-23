import { TestBed } from '@angular/core/testing';

import { MainVariablesService } from './main-variables.service';

describe('MainVariablesService', () => {
  let service: MainVariablesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MainVariablesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
