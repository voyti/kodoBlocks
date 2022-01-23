import { Injectable } from '@angular/core';
import * as Phaser from 'phaser';

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  currentSelection: Entity[];
  selectionChangedCallback: (entitiesAdded?: Entity[], entitiesRemoved?: Entity[]) => any;

  constructor() {
    this.currentSelection = [];
    this.selectionChangedCallback = (entitiesAdded, entitiesRemoved) => {};
  }

  onSelectionChanged(callback: (entitiesAdded?: Entity[], entitiesRemoved?: Entity[]) => any) {
    this.selectionChangedCallback = callback;
  }

  replaceSelection(entity: Entity) {
    const newSelection = [entity];
    this.selectionChangedCallback(newSelection,this.currentSelection);
    this.currentSelection = [entity];

    return this.currentSelection;
  }

  addToSelection(entity: Entity) {
    this.selectionChangedCallback([entity]);

    this.currentSelection.push(entity);
    return this.currentSelection;
  }

  clearSelection() {
    this.selectionChangedCallback([], this.currentSelection);
    this.currentSelection = [];
    return this.currentSelection;
  }

  getCurrentSelection() {
    return this.currentSelection;
  }

}
