import { Injectable } from '@angular/core';
import noise from 'noisejs';
import _ from 'lodash';
import { MainVariablesService } from './main-variables.service';


const MAX_PERLIN_VALUE = 256;

const LAYER_TEXTURE_OVERSHOOT = 1.2;

const COLOR_GRASS = 0x91c483;
const COLOR_GROUND = 0xCFB784;
const COLOR_FOREST = 0x125C13;
const COLOR_WATER = 0x38A3A5;
const COLOR_ROCK = 0x99A799;

const NOISE_RESOLUTION = 20; // influences how featureless the terrain is; 100 is more homogenous, less is more diverse
const FIRST_NOISE_CUTOFF_RATIO = 0.5; // influences how pronounced feature layer (like grass) is
const SECOND_NOISE_CUTOFF_RATIO = 0.75;

@Injectable({
  providedIn: 'root'
})
export class BackgroundGeneratorService {
  noise: any;
  logger: Console;

  constructor(private mainVariablesService: MainVariablesService) {
    this.noise = new (noise as any).Noise(Math.random());
    this.logger = console;
  }

  generate(areaDimensions: AreaDimensions, scene: Phaser.Scene, additionalConfig?: AdditionalConfig) {
    if (areaDimensions?.[0] && areaDimensions?.[1]) {
      const tileSize = additionalConfig?.tileSize || this.mainVariablesService.getTileSize();

      const testAreaTileability = (width: number, height: number) => width % tileSize === 0 &&  height % tileSize === 0;
      if (testAreaTileability(areaDimensions[0], areaDimensions[1]) && !this.checkForOperationOverload(tileSize, areaDimensions)) {
        console.time('generateTilesFromArea');
        let tiledPoints = this.generateTilesFromArea(this.noise, areaDimensions, tileSize, additionalConfig?.noiseRes);
        console.timeEnd('generateTilesFromArea');

        console.time('renderTiles');
        const renderedLayers = this.renderTiles(tiledPoints, scene, areaDimensions);
        console.timeEnd('renderTiles');
        return renderedLayers;

      } else {
        this.logger.warn('Area size ', areaDimensions, ' can\'t be tiled into parts of ', tileSize, ' properly. Aborting');
        return {};
      }
    }

    return {};
  }

  private checkForOperationOverload(tileSize: number, areaDimensions: AreaDimensions) {
    const OVERLOAD_VALUE = 2000000;
    const numberOfOps = (areaDimensions[0] / tileSize) * (areaDimensions[1] / tileSize);
    console.log('Rough op estimate: ', numberOfOps);
    if (numberOfOps > OVERLOAD_VALUE) {
      console.warn('Too many ops, aborting: ', numberOfOps);
      alert('Too many ops at this tile size - please increase size');
    }

    return numberOfOps > OVERLOAD_VALUE;
  }

  private assignCategoryToPerlinPoint(value: number) {
    const CATEGORY_A_VAL_MAX = MAX_PERLIN_VALUE * FIRST_NOISE_CUTOFF_RATIO;
    const CATEGORY_B_VAL_MAX = MAX_PERLIN_VALUE * SECOND_NOISE_CUTOFF_RATIO;

    if (value <=  CATEGORY_A_VAL_MAX) {
      return 'baseline';
    } else if (value >  CATEGORY_A_VAL_MAX && value <=  CATEGORY_B_VAL_MAX) {
      return 'foreground A';
    } else {
      return 'foreground B';
    }

  }

  private generateTilesFromArea(noise: any, areaDimensions: AreaDimensions, tileSize: number, noiseRes?: number) {
    noise.seed(Math.random());
    const noiseResolution = noiseRes || NOISE_RESOLUTION;
    const getPointFromTile = (tileCoord: number) =>
      (tileCoord * tileSize) + (tileSize / 2);

    const tiles: Tiles = [];
    _.times(areaDimensions[1] / tileSize, (tileY: number) => {
      tiles[tileY] = tiles[tileY] || [];
      _.times(areaDimensions[0] / tileSize, (tileX: number) => {

        const initialValue = noise.simplex2(tileX / noiseResolution, tileY / noiseResolution);
        const value = Math.abs(initialValue) * MAX_PERLIN_VALUE;
        const category = this.assignCategoryToPerlinPoint(value);

        tiles.push({
          tileX,
          tileY,
          pointX: getPointFromTile(tileX),
          pointY: getPointFromTile(tileY),
          value,
          category,
        });
      });
    });

    return tiles;
  }

  private mapNeighborhoods(tiles: Tiles): Tiles {
    const sortedTiles = tiles.sort((tileA, tileB) =>
      Math.sqrt((tileA.tileX * tileA.tileX) + (tileA.tileY * tileA.tileY)) -
      Math.sqrt((tileB.tileX * tileB.tileX) + (tileB.tileY * tileB.tileY)));

    const areTilesNextToEachOther = (tileA: Tile, tileB: Tile) => Math.abs(tileA.tileX - tileB.tileX) <= 2 && Math.abs(tileA.tileY - tileB.tileY) <= 2
    return sortedTiles.map((val: any, i, all: any[]) => {
      const prev = all[i - 1];
      if (prev && areTilesNextToEachOther(val, prev) && val.category === prev.category) {
        val.neighborhoodId = prev.neighborhoodId;
      } else {
        val.neighborhoodId = i;
      }
      return val;
    });
  }

  private renderTiles(tiles: Tiles, scene: Phaser.Scene, areaDimensions: AreaDimensions) {
    const categoryToTileMap = {
      'baseline': 'grass',
      'foreground A': 'ground',
      'foreground B': 'rock',
    };

    // const neighborhoodTiles = this.mapNeighborhoods(tiles);

    const groupedTilesFlat = _.groupBy(tiles, 'category');
    const categoryLayers = ['baseline', 'foreground A', 'foreground B'];
    const shadowedLayers = ['foreground B'];
    const renderedLayers: string[] = [];
    const shadowPosition = this.mainVariablesService.getShadowPosition();



    for(let layer of categoryLayers) {
      // if (shadowedLayers.includes(layer)) {
      //   renderedLayers.push(`_SHADOW_${layer}`);
      // }
      renderedLayers.push(layer);
    }

    // for(let layer of categoryLayers) {
    //   const layerTiles = groupedTilesFlat[layer];
    //   layerTiles.sort((tileA, tileB) =>
    //     Math.sqrt(Math.pow(tileA.pointX, 2) + Math.pow(tileA.pointY, 2)) - Math.sqrt(Math.pow(tileB.pointX, 2) + Math.pow(tileB.pointY, 2)));
    // }



    const layerToRenderTexturesMap: any = {};

    for(let layer of renderedLayers) {
      const layerTiles = groupedTilesFlat[layer] || groupedTilesFlat[layer.replace('_SHADOW_', '')];

      let foregroundShadowRt = null;
      if (layer === 'foreground B') {
        foregroundShadowRt = scene.add.renderTexture(5, 5, areaDimensions[0] * 1.2, areaDimensions[1] * 1.2);
        foregroundShadowRt.tint = 0x000000;
        foregroundShadowRt.alpha = 0.1;
      }
      layerToRenderTexturesMap[layer] = layerToRenderTexturesMap[layer] ||
      scene.add.renderTexture(0, 0, areaDimensions[0] * LAYER_TEXTURE_OVERSHOOT, areaDimensions[1] * LAYER_TEXTURE_OVERSHOOT);
      layerToRenderTexturesMap[layer].visible = false;

      for (let tile of layerTiles) {
        const tilePolygonSize = this.mainVariablesService.getTileSize();
        if (layer === 'foreground B') {
          const tileSprite = scene.add.sprite(tile.pointX, tile.pointY, categoryToTileMap[tile.category]);
          tileSprite.setScale((tileSprite.height - tilePolygonSize) / tileSprite.height);
          tileSprite.setRotation(_.random(0, 360) * (Math.PI/180));
          tileSprite.setVisible(false);
          if (layer === 'foreground B') foregroundShadowRt?.draw(tileSprite);
          layerToRenderTexturesMap[layer]?.draw(tileSprite);
        } else {
          const tileSprite = scene.add.sprite(tile.pointX, tile.pointY, categoryToTileMap[tile.category]);
          tileSprite.setScale((tileSprite.height - tilePolygonSize) / tileSprite.height);
          tileSprite.setRotation(_.random(0, 360) * (Math.PI/180));
          tile.renderedSprite = tileSprite;
        }

        // const layerNeighborhoods = _.groupBy(layerTiles, 'neighborhoodId');

        // for (let neighborhood of Object.values(layerNeighborhoods)) {
        //   const minX = _.minBy(neighborhood, 'pointX')?.pointX || 0;
        //   const minY = _.minBy(neighborhood, 'pointY')?.pointY || 0;
        //   const maxX = _.maxBy(neighborhood, 'pointX')?.pointX || 0;
        //   const maxY = _.maxBy(neighborhood, 'pointY')?.pointY || 0;


        //   const rt = scene.add.renderTexture(
        //     minX - TILE_SIZE, minY - TILE_SIZE,
        //     Math.max(maxX - minX, TILE_SIZE) * 1.5, Math.max(maxY - minY, TILE_SIZE) * 1.5);

        //   for (let tile of neighborhood) {
        //     const tileSprite = scene.add.sprite(tile.pointX - minX, tile.pointY - minY, categoryToTileMap[tile.category]);
        //     tileSprite.setScale((tileSprite.height - TILE_POLYGON_SIZE) / tileSprite.height);
        //     tileSprite.setRotation(_.random(0, 360) * (Math.PI/180));
        //     tileSprite.setVisible(false);

        //     // console.log('DRAWING TO RT: ', tileSprite);
        //     rt.draw(tileSprite);
        //   }
      }
      layerToRenderTexturesMap[layer].visible = true;

    }

    return groupedTilesFlat;
  }
}
