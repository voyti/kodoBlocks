import { Injectable } from '@angular/core';
import PF from 'pathfinding';
import _ from 'lodash';
import { MainVariablesService } from './main-variables.service';
import { QueuedActionsService } from './queued-actions.service';

@Injectable({
  providedIn: 'root'
})
export class MobileEntityService {
  collisionTilesFlat: any[] = [];
  collisionGrid: number[][] = [];
  logger: Console;
  pfModelCollisionGrid!: PF.Grid;
  aStarPathfinder!: PF.AStarFinder;
  boardScene!: Phaser.Scene;

  constructor(
    private mainVariablesService: MainVariablesService,
    private queuedActionsService: QueuedActionsService,
    ) {
    this.logger = console;
  }

  private buildCollisionGrid(collisionTiles: Tile[]) {
    const tileSize = this.mainVariablesService.getTileSize();
    const mapSize = this.mainVariablesService.getMapDimensions();
    const mapTilesX = mapSize[0] / tileSize;
    const mapTilesY = mapSize[1] / tileSize;

    let grid: number[][] = [];
    const collisionMap = new Map();

    for (let tile of collisionTiles) {
      collisionMap.set(`${tile.tileX}_${tile.tileY}`, true);
    }

    _.times(mapTilesY, (tileY) => {
      if (!grid[tileY]) grid.push([]);

      _.times(mapTilesX, (tileX) => {
        const collision = collisionMap.get(`${tileX}_${tileY}`);
        grid[tileY][tileX] = (collision ? 1 : 0);
      });
    });

    return grid;
  }

  registerScene(boardScene: Phaser.Scene) {
    this.boardScene = boardScene;
  }

  registerCollisionLayers(collisionLayers: Partial<any>) {
    this.collisionTilesFlat = _.flatten(Object.values(collisionLayers));
    this.logger.time('buildCollisionGrid');
    this.collisionGrid = this.buildCollisionGrid(this.collisionTilesFlat);
    this.logger.timeEnd('buildCollisionGrid');

    this.pfModelCollisionGrid = Object.freeze(new PF.Grid(this.collisionGrid));
    this.aStarPathfinder = new PF.AStarFinder(({
      allowDiagonal: true,
      dontCrossCorners: true
    } as  PF.FinderOptions));
  }

  moveEntities(selectedEntities: (Phaser.GameObjects.Container | Phaser.GameObjects.Sprite)[], pointer: { rightButtonDown: () => any; getDuration: () => number; x: any; y: any; }) {
    // TODO: MOVE MANY
    const entityToMove = selectedEntities[0];
    const tileSize = this.mainVariablesService.getTileSize();
    const freshGrid = this.pfModelCollisionGrid.clone();
    const transP = (point: number) => Math.floor(point / tileSize);
    const retransP = (point: number) => point * tileSize;
    const cameraPos = [this.boardScene.cameras.main.x, this.boardScene.cameras.main.y];

    this.logger.time('pathfinding');
    const path = this.aStarPathfinder.findPath(
      transP(entityToMove.x), transP(entityToMove.y),
      transP(pointer.x + cameraPos[0]), transP(pointer.y + cameraPos[1]), freshGrid);
    this.logger.timeEnd('pathfinding');

    const realCoordsPath = path.map((point) => [retransP(point[0]), retransP(point[1])]);

    this.queuedActionsService.applyMovementRequest(realCoordsPath, entityToMove);
    // for (let point of path) {
    //   const enemy = this.boardScene.add.sprite(retransP(point[0]), retransP(point[1]), 'enemy');
    //   enemy.setScale(0.1);
    // }


  }
}
