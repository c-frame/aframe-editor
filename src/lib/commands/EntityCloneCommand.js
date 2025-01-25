import Events from '../Events.js';
import { Command } from '../command.js';
import { cloneEntityImpl, createUniqueId, insertAfter } from '../entity.js';

export class EntityCloneCommand extends Command {
  constructor(editor, entity) {
    super(editor);

    this.type = 'entityclone';
    this.name = 'Clone Entity';
    this.updatable = false;
    if (!entity.id) {
      entity.id = createUniqueId();
    }
    this.entityIdToClone = entity.id;
    this.entityId = null;
    this.detachedClone = null;
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
      const clone = this.detachedClone.cloneNode(true);
      clone.addEventListener(
        'loaded',
        function () {
          Events.emit('entityclone', clone);
          AFRAME.INSPECTOR.selectEntity(clone);
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
}
