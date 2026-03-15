import { Command } from '../command.js';
import { createUniqueId, updateEntity } from '../entity.js';

/**
 * @param editor Editor
 * @param payload: entity (element or ID string), component, property, value.
 * @constructor
 */
export class EntityUpdateCommand extends Command {
  constructor(editor, payload = null) {
    super(editor);

    this.type = 'entityupdate';
    this.name = 'Update Entity';
    this.updatable = true;

    if (payload === null) return;

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
    this.property = payload.property ?? '';

    const component =
      entity.components[payload.component] ??
      AFRAME.components[payload.component];
    // First try to get `entity.components[payload.component]` to have the dynamic schema, and fallback to `AFRAME.components[payload.component]` if not found.
    // This is to properly stringify some properties that uses for example vec2 or vec3 on material component.
    // This is important to fallback to `AFRAME.components[payload.component]` for primitive components position rotation and scale
    // that may not have been created initially on the entity.
    if (component) {
      if (payload.property) {
        if (component.schema[payload.property]) {
          this.newValue =
            payload.value === null
              ? null
              : component.schema[payload.property].stringify(payload.value);
          this.oldValue = component.schema[payload.property].stringify(
            entity.getAttribute(payload.component)[payload.property]
          );
        } else {
          // Just in case dynamic schema is not properly updated and we set an unknown property. I don't think this should happen.
          this.newValue = payload.value;
          this.oldValue = entity.getAttribute(payload.component)[
            payload.property
          ];
        }
        if (this.editor.config.debugUndoRedo) {
          console.log(
            'entityupdate property',
            this.component,
            this.property,
            this.oldValue,
            this.newValue
          );
        }
      } else {
        this.newValue =
          payload.value === null
            ? null
            : component.isSingleProperty
              ? component.schema.stringify(payload.value)
              : payload.value;
        this.oldValue = component.isSingleProperty
          ? component.schema.stringify(entity.getAttribute(payload.component))
          : structuredClone(entity.getDOMAttribute(payload.component));
        if (this.editor.config.debugUndoRedo) {
          console.log(
            'entityupdate component',
            this.component,
            this.oldValue,
            this.newValue
          );
        }
      }
    } else {
      // id, class, mixin, data attributes
      this.newValue = payload.value;
      this.oldValue = entity.getAttribute(this.component);
      if (this.editor.config.debugUndoRedo) {
        console.log(
          'entityupdate attribute',
          this.component,
          this.oldValue,
          this.newValue
        );
      }
    }
  }

  execute(nextCommandCallback) {
    const entity = document.querySelector(`#${this.entityId}:not(a-mixin)`);
    if (entity) {
      if (this.editor.selectedEntity && this.editor.selectedEntity !== entity) {
        // If the selected entity is not the entity we are undoing, select the entity.
        this.editor.selectEntity(entity);
      }

      if (this.editor.config.debugUndoRedo) {
        console.log(
          'execute',
          entity,
          this.component,
          this.property,
          this.newValue
        );
      }
      updateEntity(entity, this.component, this.property, this.newValue);
      if (this.component === 'id') {
        this.entityId = this.newValue;
      }
      nextCommandCallback?.(entity);
    }
  }

  undo(nextCommandCallback) {
    const entity = document.querySelector(`#${this.entityId}:not(a-mixin)`);
    if (entity) {
      if (this.editor.selectedEntity && this.editor.selectedEntity !== entity) {
        // If the selected entity is not the entity we are undoing, select the entity.
        this.editor.selectEntity(entity);
      }
      if (this.editor.config.debugUndoRedo) {
        console.log(
          'undo',
          entity,
          this.component,
          this.property,
          this.oldValue
        );
      }
      updateEntity(entity, this.component, this.property, this.oldValue);
      if (this.component === 'id') {
        this.entityId = this.oldValue;
      }
      nextCommandCallback?.(entity);
    }
  }

  update(command) {
    if (this.editor.config.debugUndoRedo) {
      console.log('update', command);
    }
    this.newValue = command.newValue;
  }

  toJSON() {
    const output = super.toJSON(this);
    output.entityId = this.entityId;
    output.component = this.component;
    output.property = this.property;
    output.oldValue = this.oldValue;
    output.newValue = this.newValue;
    return output;
  }

  fromJSON(json) {
    super.fromJSON(json);
    this.entityId = json.entityId;
    this.component = json.component;
    this.property = json.property;
    this.oldValue = json.oldValue;
    this.newValue = json.newValue;
  }
}
