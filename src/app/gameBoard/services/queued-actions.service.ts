import { Injectable } from '@angular/core';
import _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class QueuedActionsService {
  boardScene!: Phaser.Scene;
  actionsQueue: any[] = [];

  constructor() { }

  registerScene(boardScene: Phaser.Scene) {
    this.boardScene = boardScene;
  }

  applyMovementRequest(coordsPath: number[][], entityToMove: Entity) {
    const follower = { t: 0, vec: new Phaser.Math.Vector2() };
    const path = new Phaser.Curves.Path(entityToMove.x, entityToMove.y);
    const pathVectors = coordsPath.map((point) => new Phaser.Math.Vector2(point[0], point[1]));

    path.splineTo(pathVectors);

    const tween = this.boardScene.tweens.add({
      targets: follower,
      t: 1,
      ease: 'Sine.easeInOut',
      duration: 4000,
    });

    this.actionsQueue.push({ follower, path, tween, entity: entityToMove });
  }

  getActionsQueue() {
    return this.actionsQueue;
  }
}
