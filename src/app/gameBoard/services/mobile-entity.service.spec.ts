import { TestBed } from '@angular/core/testing';

import { MobileEntityService } from './mobile-entity.service';

describe('MobileEntityService', () => {
  let service: MobileEntityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MobileEntityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
