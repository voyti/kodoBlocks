type Entity = Phaser.GameObjects.Container |  Phaser.GameObjects.Sprite;
type AreaDimensions = (number)[];
type Tile = {
  tileX: number;
  tileY: number;
  pointX: number;
  pointY: number;
  value: number;
  category: 'baseline' | 'foreground A' | 'foreground B';
  renderedSprite?: Phaser.GameObjects.Sprite,
  neighborhoodId?: number,
}
type Tiles = Tile[];
type AdditionalConfig = { tileSize: number; noiseRes: number; } | undefined;
