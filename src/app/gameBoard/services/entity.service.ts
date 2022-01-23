import { parseLazyRoute } from '@angular/compiler/src/aot/lazy_routes';
import { Injectable } from '@angular/core';
import { MainVariablesService } from './main-variables.service';
import _ from 'lodash';
import { SelectionService } from './selection.service';

const TILE_SIZE = 20; // RELOCATE

const ENTITY_BASIC_SCALE_FACTOR = 0.6;
const MAX_ENEMY_COUNT = 200;
const AVG_ENEMIES_PER_CLUSTER = 3;
const ENEMY_PER_CLUSTER_SPREAD = 2;

// x, y, acceptableArea
const PLAYER_SPAWN_LOCATION = [200, 200, 200];


@Injectable({
  providedIn: 'root'
})
export class EntityService {
  entityList: Entity[];

  constructor(
    private mainVariablesService: MainVariablesService,
    private selectionService: SelectionService
    ) {
      this.entityList = [];
    }

  populateDefaultEntities(boardScene: Phaser.Scene,  collisionLayers: []) {
    const mapSize = this.mainVariablesService.getMapDimensions();
    const playerEntity = this.populateEntityAtLocation(boardScene, PLAYER_SPAWN_LOCATION, 'player', collisionLayers);

    playerEntity.getAll()[0].setInteractive();
    playerEntity.getAll()[0].on('pointerdown', () => {
      console.log('CHANGE HOW THIS WORKS');
      this.selectionService.replaceSelection(playerEntity);
    });

    this.selectionService.replaceSelection(playerEntity);

    const enemyClusters = this.generateEnemyClusters(mapSize);
    console.warn('CLUSTERS', enemyClusters);

    for (let cluster of enemyClusters) {
      this.populateEntityAtLocation(boardScene, [cluster[0], cluster[1], 200], 'enemy', collisionLayers);
    }
  }

  startListeningToSelectionEvents(boardScene: Phaser.Scene) {
    this.selectionService.onSelectionChanged((entitiesAdded: Entity[] | undefined, entitiesRemoved: Entity[] | undefined) => {
      console.info('selection changed :', entitiesAdded, entitiesRemoved);
      (entitiesRemoved || []).forEach(entity => this.toggleEntitySelectionMark(boardScene, entity, false));
      (entitiesAdded || []).forEach(entity => this.toggleEntitySelectionMark(boardScene, entity, true));
    });
  }

  toggleEntitySelectionMark(boardScene: Phaser.Scene, entity: Entity, enable: boolean) {
    const children = (entity as Phaser.GameObjects.Container).getAll();
    const selectionMarkCandidates = children.filter((child) => child.getData('meta-name') === 'selection-mark');
    let selectionMark  = selectionMarkCandidates.length ? selectionMarkCandidates[0] : null;

    if (!selectionMark) {
      selectionMark = boardScene.add.sprite(entity.width / 2, -(children[0] as Entity).height / 1.5, 'selection');
      selectionMark.setData('meta-name', 'selection-mark');
      (selectionMark as Phaser.GameObjects.Sprite).alpha = 0.8;
      (entity as Phaser.GameObjects.Container).add(selectionMark);
    }

    (selectionMark as Entity).visible = enable;
  }

  private generateEnemyClusters(mapSize: number[]) {
    const clusterSpread = 160;
    const clusterMinPeerDistance = clusterSpread;
    const playerSpawn = PLAYER_SPAWN_LOCATION;
    const maxPackableClusters = (mapSize[0] / (clusterSpread * 2)) * (mapSize[1] / (clusterSpread * 2));
    const clusterCount = Math.min(maxPackableClusters, MAX_ENEMY_COUNT / 3);
    const clusters: number[][] = [];

    _.times(clusterCount, () => {

      let hasAcceptableDistanceFromEdge = (x: number, y: number) => x > clusterSpread && y > clusterSpread;
      let hasAcceptableDistanceFromPlayerSpawn = (x: number, y: number) => Math.hypot(x - playerSpawn[0], y - playerSpawn[1]) > playerSpawn[2];
      let hasAcceptableDistanceFromOtherClusters = (x: number, y: number, otherClusters: number[][]) => {
        for (let cluster of otherClusters) {
          if (Math.hypot(x - cluster[0], y - cluster[1]) < clusterMinPeerDistance) return false;
        }
        return true;
      };

      let cX = 0;
      let cY = 0;

      while(!hasAcceptableDistanceFromEdge(cX, cY) ||
            !hasAcceptableDistanceFromPlayerSpawn(cX, cY) ||
            !hasAcceptableDistanceFromOtherClusters(cX, cY, clusters)) {
        cX = _.random(clusterSpread, mapSize[0]);
        cY = _.random(clusterSpread, mapSize[1]);
      }

      clusters.push([cX, cY]);
    });

    return clusters;
  }

  private populateEntityAtLocation(boardScene: Phaser.Scene, location: number[], entityName: string, collisionLayers: []) {
    const mapSize = this.mainVariablesService.getMapDimensions();
    const pos = this.findUnoccupiedPlaceInArea(location[0], location[1], location[2], collisionLayers, mapSize);
    // console.warn('CORRECTING LOCATION: ', location[0], location[1], ' ===>>> ', pos);

    const entityContainer = this.getEntityContainer(boardScene, entityName);

    if (pos) {
      entityContainer.setPosition(pos[0], pos[1]);
    } else {
      console.warn('NO SPACE AT LOCATION: ', location, ' FOR ENTITY', );
    }

    this.entityList.push(entityContainer);
    return entityContainer;
  }

  private getEntityContainer(boardScene: Phaser.Scene, sprite: string) {
    const entityContainer = boardScene.add.container();
    const shadowPosition = this.mainVariablesService.getShadowPosition();
    const shadow = boardScene.add.sprite(shadowPosition[0], shadowPosition[1], sprite);

    shadow.tint = 0x000000;
    shadow.alpha = 0.1;
    const entity = boardScene.add.sprite(0, 0, sprite);
    entity.setScale(ENTITY_BASIC_SCALE_FACTOR);
    shadow.setScale(ENTITY_BASIC_SCALE_FACTOR);
    entityContainer.add([shadow, entity]);
    return entityContainer;
  }

  private findUnoccupiedPlaceInArea(areaX: number, areaY: number, areaSize: number, collisionLayers: any, hardAreaLimits: number[]) {
    const collisionTiles = _.flatten(Object.values(collisionLayers));
    const tileSize = this.mainVariablesService.getTileSize();

    for(let i = areaX; i < (areaX + areaSize); i += tileSize) {
      for(let j = areaY; j < (areaY + areaSize); j += tileSize) {

        const curX = i;
        const curY = j;

        const withinHardBounds = curX < hardAreaLimits[0] && curY < hardAreaLimits[1];
        const collisionOnSomeTiles =
          collisionTiles.some((tile: any) => Math.abs(curX - tile.pointX) < (tileSize * 2) && Math.abs(curY - tile.pointY) < (tileSize * 2));


        // if (collisionOnSomeTiles) console.info('COLLISION ON ', curX, curY);
        // if (!withinHardBounds) console.info('OO BOUNDS ON ', curX, curY);

        if (withinHardBounds && !collisionOnSomeTiles) {
          return [curX, curY];
        }
      }
    }

    return null;
  }
}
