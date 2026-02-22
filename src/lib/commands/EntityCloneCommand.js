import Events from '../Events.js';
import { Command } from '../command.js';
import {
  cloneEntityImpl,
  createUniqueId,
  elementToObject,
  insertAfter,
  objectToElement
} from '../entity.js';

export class EntityCloneCommand extends Command {
  constructor(editor, entity = null) {
    super(editor);

    this.type = 'entityclone';
    this.name = 'Clone Entity';
    this.updatable = false;

    this.entityId = null;
    if (entity !== null) {
      if (!entity.id) {
        entity.id = createUniqueId();
      }
      this.entityIdToClone = entity.id;
      this.detachedClone = null;
    }
  }

  execute(nextCommandCallback) {
    const entityToClone = document.querySelector(
      `#${this.entityIdToClone}:not(a-mixin)`
    );
    if (entityToClone) {
      // We keep a copy of the detached clone to keep the new ids of the
      // entity and children in the case we do a follow-up action like
      // entityupdate on the entity or one of the children, then undo entityupdate, undo entityclone,
      // redo entityclone with the same new ids, redo entityupdate that has a ref to a new id.
      if (!this.detachedClone) {
        this.detachedClone = cloneEntityImpl(entityToClone);
      }
      if (this.detachedClone === null) return;
      const clone = this.detachedClone.cloneNode(true);
      clone.addEventListener(
        'loaded',
        () => {
          clone.pause();
          Events.emit('entityclone', clone);
          this.editor.selectEntity(clone);
        },
        { once: true }
      );
      insertAfter(clone, entityToClone);
      this.entityId = clone.id;
      nextCommandCallback?.(clone);
      return clone;
    }
  }

  undo(nextCommandCallback) {
    const entity = document.querySelector(`#${this.entityId}:not(a-mixin)`);
    if (entity) {
      entity.parentNode.removeChild(entity);
      Events.emit('entityremoved', entity);
      const entityToClone = document.querySelector(
        `#${this.entityIdToClone}:not(a-mixin)`
      );
      this.editor.selectEntity(entityToClone);
      nextCommandCallback?.(entity);
    }
  }

  toJSON() {
    const output = super.toJSON(this);
    output.entityIdToClone = this.entityIdToClone;
    output.definition = this.detachedClone
      ? elementToObject(this.detachedClone)
      : null;
    output.entityId = this.entityId;
    return output;
  }

  fromJSON(json) {
    super.fromJSON(json);
    this.entityIdToClone = json.entityIdToClone;
    if (json.definition) {
      this.detachedClone = objectToElement(json.definition);
      this.detachedClone.flushToDOM();
    } else {
      this.detachedClone = null;
    }
    this.entityId = json.entityId;
  }
}
