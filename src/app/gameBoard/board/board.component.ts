import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import * as Phaser from 'phaser';
import { BackgroundGeneratorService } from '../services/background-generator.service';
import { BoardSceneService } from '../services/board-scene.service';
import { InteractionService } from '../services/interaction.service';
import { MainVariablesService } from '../services/main-variables.service';
const PARENT_EL_ID = 'board';
const COLOR_WATER = 0x77bcf9;

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {
  config: Phaser.Types.Core.GameConfig | undefined;
  logger: Console;
  additionalConfig: { tileSize: number; noiseRes: number; } | undefined;
  game: Phaser.Game | undefined;

  constructor(
    private mainVariablesService: MainVariablesService,
    private backgroundGeneratorService: BackgroundGeneratorService,
    private boardSceneService: BoardSceneService,
    ) {
    this.logger = console;

  }

  ngOnInit(): void {
    this.initializePhaser();
  }

  initializePhaser() {
    const areaDimensions = this.mainVariablesService.getViewportDimensions();
    const boardScene = this.boardSceneService.getBoardSceneClass();

    this.config = {
      width: areaDimensions[0],
      height: areaDimensions[1],
      type: Phaser.AUTO,
      parent: PARENT_EL_ID,
      backgroundColor: COLOR_WATER,

      scene: [boardScene],
      // fps: {
      //   target: 2
      // }
    };


    this.game = new Phaser.Game(this.config);
  }

}
