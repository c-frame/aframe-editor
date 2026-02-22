import Events from '../Events.js';
import { Command } from '../command.js';
import { createUniqueId } from '../entity.js';

/**
 * Command to add a component to an entity
 * @param editor Editor
 * @param payload Object containing entity (element or ID string), component, and value
 * @constructor
 */
export class ComponentAddCommand extends Command {
  constructor(editor, payload = null) {
    super(editor);

    this.type = 'componentadd';
    this.name = 'Add Component';
    this.updatable = false;

    if (payload !== null) {
      // Handle case where entity is passed as ID string when used with multi command
      let entity;
      if (typeof payload.entity === 'string') {
        entity = document.querySelector(`#${payload.entity}:not(a-mixin)`);
        if (!entity) {
          console.error('Entity not found with ID:', payload.entity);
          return;
        }
        this.entityId = payload.entity;
      } else {
        entity = payload.entity;
        if (!entity.id) {
          entity.id = createUniqueId();
        }
        this.entityId = entity.id;
      }

      this.component = payload.component;
      this.value = payload.value;
    }
  }

  execute(nextCommandCallback) {
    const entity = document.querySelector(`#${this.entityId}:not(a-mixin)`);
    if (entity) {
      entity.setAttribute(this.component, this.value);
      Events.emit('componentadd', {
        entity: entity,
        component: this.component,
        value: this.value
      });
      nextCommandCallback?.(entity);
    }
  }

  undo(nextCommandCallback) {
    const entity = document.querySelector(`#${this.entityId}:not(a-mixin)`);
    if (entity) {
      entity.removeAttribute(this.component);
      Events.emit('componentremove', {
        entity,
        component: this.component
      });
      nextCommandCallback?.(entity);
    }
  }

  toJSON() {
    const output = super.toJSON(this);
    output.entityId = this.entityId;
    output.component = this.component;
    output.value = this.value;
    return output;
  }

  fromJSON(json) {
    super.fromJSON(json);
    this.entityId = json.entityId;
    this.component = json.component;
    this.value = json.value;
  }
}
