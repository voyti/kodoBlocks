import { TestBed } from '@angular/core/testing';

import { BoardSceneService } from './board-scene.service';

describe('BoardSceneService', () => {
  let service: BoardSceneService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BoardSceneService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
