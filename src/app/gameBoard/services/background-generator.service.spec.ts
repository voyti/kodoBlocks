import { TestBed } from '@angular/core/testing';

import { BackgroundGeneratorService } from './background-generator.service';

describe('BackgroundGeneratorService', () => {
  let service: BackgroundGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BackgroundGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
