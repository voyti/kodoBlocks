import { Injectable } from '@angular/core';
import { BackgroundGeneratorService } from './background-generator.service';
import { EntityService } from './entity.service';
import { InteractionService } from './interaction.service';
import { MainVariablesService } from './main-variables.service';
import _ from 'lodash';
import { MobileEntityService } from './mobile-entity.service';
import { QueuedActionsService } from './queued-actions.service';

const GAME_VIEWPORT_MARGIN = 100;
const CAMERA_OVERSHOOT = 1.2;
const COLLISION_LAYERS = ['foreground B'];


@Injectable({
  providedIn: 'root'
})
export class BoardSceneService {

  constructor(
    private mainVariablesService: MainVariablesService,
    private backgroundGeneratorService: BackgroundGeneratorService,
    private interactionService: InteractionService,
    private entityService: EntityService,
    private mobileEntityService: MobileEntityService,
    private queuedActionsService: QueuedActionsService,
  ) {

  }

  getBoardSceneId() {
    return 'MapScene';
  }

  getBoardSceneClass() {
    const _mainVariablesService = this.mainVariablesService;
    const _backgroundGeneratorService = this.backgroundGeneratorService;
    const _interactionService = this.interactionService;
    const _entityService = this.entityService;
    const _mobileEntityService = this.mobileEntityService;
    const _queuedActionsService = this.queuedActionsService;

    const sceneId = this.getBoardSceneId();


    class BoardScene extends Phaser.Scene {
      logger: Console;

      constructor () {
          super(sceneId);
          this.logger = console;
      }

      preload() {
        this.load.image('grass', '../assets/grass_tile.png');
        this.load.image('ground', '../assets/ground_tile.png');
        this.load.image('rock', '../assets/rock_tile.png');

        this.load.image('player', '../assets/player.png');
        this.load.image('enemy', '../assets/enemy.png');
        this.load.image('collector', '../assets/collector.png');

        this.load.image('selection', '../assets/selection_tick.png');
      }

      create () {
        const [width, height] = _mainVariablesService.getViewportDimensions();
        const [mapWidth, mapHeight] = _mainVariablesService.getMapDimensions();
        this.cameras.main.setBounds(0, 0, mapWidth * CAMERA_OVERSHOOT, mapHeight * CAMERA_OVERSHOOT);

        // const graphics = this.add.graphics();
        // this.add.text(0, 0, 'Press one, two or three !', {});

        const bodyRect = document.body.getBoundingClientRect();
        const fitWidth = bodyRect.width - GAME_VIEWPORT_MARGIN;
        const fitHeight = ((height / width) * bodyRect.width) - GAME_VIEWPORT_MARGIN;
        this.game.scale.resize(fitWidth, fitHeight);

        let generatedLayers: any = {};

        if (typeof height === 'number' && typeof width === 'number') {
          generatedLayers = _backgroundGeneratorService.generate([mapWidth, mapHeight], this);
        } else {
          this.logger.warn('Parameter for config.height/config.width are not numbers, can\'t proceed with bg generation');
        }

        const collisionLayers = _.pickBy(generatedLayers, (all, key) => COLLISION_LAYERS.includes(key));

        _interactionService.registerScene(this);
        _interactionService.registerKeyboardHandling();

        _queuedActionsService.registerScene(this);
        _mobileEntityService.registerScene(this);
        _mobileEntityService.registerCollisionLayers(collisionLayers);

        _entityService.startListeningToSelectionEvents(this);
        _entityService.populateDefaultEntities(this, (collisionLayers as []));

      }

      update(time: number, deltaTime: number) {
        (this as any).controls.update(deltaTime);

        const actions = _queuedActionsService.getActionsQueue();
        for (let action of actions) {
          action.path.getPoint(action.follower.t, action.follower.vec);
          (action.entity as Entity).setPosition(action.follower.vec.x, action.follower.vec.y);
        }

      }
    }

    return BoardScene;
  }

}
