import Events from '../Events';
import { Command } from '../command.js';
import { findClosestEntity, prepareForSerialization } from '../entity.js';

/**
 * Command to remove an entity from the scene
 * @param editor Editor
 * @param entity Entity element or ID string
 * @constructor
 */
export class EntityRemoveCommand extends Command {
  constructor(editor, entity = null) {
    super(editor);

    this.type = 'entityremove';
    this.name = 'Remove Entity';
    this.updatable = false;

    if (entity !== null) {
      // Handle case where entity is passed as ID string when used with multi command
      if (typeof entity === 'string') {
        this.entity = document.querySelector(`#${entity}:not(a-mixin)`);
        if (!this.entity) {
          console.error('Entity not found with ID:', entity);
          return;
        }
        this.entityId = entity;
      } else {
        this.entity = entity;
        this.entityId = entity.id;
      }

      // Store the parent element and index for precise reinsertion
      this.parentEl = this.entity.parentNode;
      this.index = Array.from(this.parentEl.children).indexOf(this.entity);
    }
  }

  execute(nextCommandCallback) {
    const closest = findClosestEntity(this.entity);

    // Keep a clone not attached to DOM for undo
    this.entity.flushToDOM();
    const clone = prepareForSerialization(this.entity);

    // Remove entity
    this.entity.parentNode.removeChild(this.entity);
    Events.emit('entityremoved', this.entity);

    // Replace this.entity by clone
    this.entity = clone;

    this.editor.selectEntity(closest);
    nextCommandCallback?.(null);
  }

  undo(nextCommandCallback) {
    // Reinsert the entity at its original position using the stored index
    const referenceNode = this.parentEl.children[this.index] ?? null;
    this.parentEl.insertBefore(this.entity, referenceNode);

    // Emit event after entity is loaded
    this.entity.addEventListener(
      'loaded',
      () => {
        this.entity.pause();
        Events.emit('entitycreated', this.entity);
        this.editor.selectEntity(this.entity);
        nextCommandCallback?.(this.entity);
      },
      { once: true }
    );
  }

  toJSON() {
    const output = super.toJSON(this);
    output.entityId = this.entity.id;
    output.parentId = this.parentEl.id;
    output.index = this.index;
    return output;
  }

  fromJSON(json) {
    super.fromJSON(json);
    this.entity = document.querySelector(`#${json.entityId}:not(a-mixin)`);
    this.entityId = json.entityId;
    this.parentEl = document.querySelector(`#${json.parentId}:not(a-mixin)`);
    this.index = json.index;
  }
}
