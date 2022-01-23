import { Injectable } from '@angular/core';

const WIDTH = 1280;
const HEIGHT  = 720;

// const MAP_WIDTH = 1280 * 4;
// const MAP_HEIGHT  = 720 * 4;

const MAP_WIDTH = 1280 * 1;
const MAP_HEIGHT  = 720 * 1;

const SHADOW_X = 5;
const SHADOW_Y  = 5;

const TILE_SIZE = 20;
const TILE_POLYGON_SIZE = TILE_SIZE * 4/5;

// const MAP_WIDTH = 1280;
// const MAP_HEIGHT  = 720;

@Injectable({
  providedIn: 'root'
})
export class MainVariablesService {

  constructor() { }

  getTileSize() {
    return TILE_SIZE;
  }

  getTilePolygonSize() {
    return TILE_POLYGON_SIZE;
  }

  getViewportDimensions(): AreaDimensions {
    return [WIDTH, HEIGHT];
  }

  getMapDimensions(): AreaDimensions {
    return [MAP_WIDTH, MAP_HEIGHT];
  }

  getShadowPosition(): AreaDimensions {
    return [SHADOW_X, SHADOW_Y];
  }

}
