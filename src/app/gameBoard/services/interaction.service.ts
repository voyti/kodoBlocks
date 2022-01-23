import { Injectable } from '@angular/core';
import * as Phaser from 'phaser';
import { MobileEntityService } from './mobile-entity.service';
import { SelectionService } from './selection.service';

@Injectable({
  providedIn: 'root'
})
export class InteractionService {
  boardScene!: Phaser.Scene;

  constructor(
    private selectionService: SelectionService,
    private mobileEntityService: MobileEntityService,

  ) {
  }

  registerScene(boardScene: Phaser.Scene) {
    this.boardScene = boardScene;
  }

  registerKeyboardHandling() {
    // const cursors = boardScene.input.keyboard.createCursorKeys();

    const controlConfig: Phaser.Types.Cameras.Controls.SmoothedKeyControlConfig = {
        camera: this.boardScene.cameras.main,
        // left: cursors.left,
        // right: cursors.right,
        // up: cursors.up,
        // down: cursors.down,
        left: this.boardScene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.boardScene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        up: this.boardScene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.boardScene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        zoomIn: this.boardScene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
        zoomOut: this.boardScene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        acceleration: 0.6,
        drag: 0.05,
        maxSpeed: 1.0
    };

    (this.boardScene as any).controls = new Phaser.Cameras.Controls.SmoothedKeyControl(controlConfig);

    // boardScene.input.on('keyUp', () => {
    //   console.log('a');

    //   boardScene.cameras.main.centerOn(0, -100);
    // });

    // boardScene.input.on('keyDown', () => {
    //   console.log('a');

    //   boardScene.cameras.main.centerOn(0, -1000);
    // });

    // boardScene.input.on('keyLeft', () => {
    //   console.log('a');

    //   boardScene.cameras.main.centerOn(1000, 0);
    // });

    // boardScene.input.on('keyRight', () => {
    //   console.log('a');

    //   boardScene.cameras.main.centerOn(2000, 0);
    // });


    this.boardScene.input.mouse.disableContextMenu();

    this.boardScene.input.on('pointerdown', (pointer: { rightButtonDown: () => any; getDuration: () => number; x: any; y: any; }) => {
        if (pointer.rightButtonDown()) {
          const selectedEntities = this.selectionService.getCurrentSelection();
          this.mobileEntityService.moveEntities(selectedEntities, pointer);
        }

    }, this);

    this.boardScene.input.keyboard.on('keydown-ESC', (event: { key: any; }) => {
      this.selectionService.clearSelection();
    });

    this.boardScene.input.keyboard.on('keydown-SPACE', (event: { key: any; }) => {
      const selection = this.selectionService.getCurrentSelection();
      if (selection.length && this.boardScene) {
        this.boardScene.cameras.main.centerOn(selection[0].x, selection[0].y);
      }
    });

  }
}
