import Events from '../Events';
import { Command } from '../command.js';

/**
 * Update an attribute of an asset element in <a-assets> (e.g., a-material,
 * a-mixin, img, audio, video, a-asset-item).
 *
 * Consecutive updates to the same asset attribute are merged in history like
 * entity updates (entityId/component/property are set for that purpose).
 *
 * @param editor Editor
 * @param payload Object containing assetEl (element or ID string), attribute
 *                and value (attribute string, or null to remove the attribute).
 * @constructor
 */
export class AssetUpdateCommand extends Command {
  constructor(editor, payload = null) {
    super(editor);

    this.type = 'assetupdate';
    this.name = 'Update Asset';
    this.updatable = true;

    if (payload === null) return;

    let assetEl;
    if (typeof payload.assetEl === 'string') {
      assetEl = document.getElementById(payload.assetEl);
      if (!assetEl) {
        console.error('Asset not found with ID:', payload.assetEl);
        return;
      }
    } else {
      assetEl = payload.assetEl;
    }
    // Inline materials (`material(...)`) have no id; keep a direct reference
    // for those, and use the inline string as history merge key.
    this.assetEl = assetEl;
    this.entityId = assetEl.id || assetEl.inlineString;
    this.component = assetEl.tagName.toLowerCase();
    this.property = payload.attribute;
    this.newValue = payload.value;
    this.oldValue = assetEl.getAttribute(payload.attribute);
  }

  resolveAssetEl() {
    if (this.assetEl && this.assetEl.isConnected) {
      return this.assetEl;
    }
    return document.getElementById(this.entityId) || this.assetEl;
  }

  apply(value, nextCommandCallback) {
    const assetEl = this.resolveAssetEl();
    if (!assetEl) return;
    if (value === null || value === undefined) {
      assetEl.removeAttribute(this.property);
    } else {
      assetEl.setAttribute(this.property, value);
    }
    // For A-Frame elements like <a-material>, attribute changes are picked up
    // by a MutationObserver (asynchronous); apply synchronously so the UI can
    // refresh right away.
    if (typeof assetEl.attributeChangedCallback === 'function') {
      assetEl.attributeChangedCallback(
        this.property.toLowerCase(),
        null,
        value ?? null
      );
    }
    Events.emit('assetupdate', {
      assetEl,
      attribute: this.property,
      value
    });
    nextCommandCallback?.(assetEl);
  }

  execute(nextCommandCallback) {
    if (this.editor.config.debugUndoRedo) {
      console.log('execute', this.entityId, this.property, this.newValue);
    }
    this.apply(this.newValue, nextCommandCallback);
  }

  undo(nextCommandCallback) {
    if (this.editor.config.debugUndoRedo) {
      console.log('undo', this.entityId, this.property, this.oldValue);
    }
    this.apply(this.oldValue, nextCommandCallback);
  }

  update(command) {
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
    this.assetEl = document.getElementById(this.entityId);
  }
}
