import { TestBed } from '@angular/core/testing';

import { QueuedActionsService } from './queued-actions.service';

describe('QueuedActionsService', () => {
  let service: QueuedActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QueuedActionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
