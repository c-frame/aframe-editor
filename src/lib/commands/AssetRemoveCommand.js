import Events from '../Events';
import { Command } from '../command.js';

/**
 * Remove an asset element from <a-assets> (e.g., a-material, a-mixin, img,
 * audio, video, a-asset-item).
 *
 * The tag name, attributes and position are captured so undo can recreate the
 * asset in place. For <a-material>, entities referencing the asset are
 * re-resolved on undo so they use the recreated THREE.Material instance.
 *
 * @param editor Editor
 * @param payload Object containing assetEl (element or ID string).
 * @constructor
 */
export class AssetRemoveCommand extends Command {
  constructor(editor, payload = null) {
    super(editor);

    this.type = 'assetremove';
    this.name = 'Remove Asset';

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
    this.assetId = assetEl.id;
    this.tagName = assetEl.tagName.toLowerCase();
    // Capture attributes and position for undo.
    this.attributes = {};
    for (const attr of assetEl.attributes) {
      if (attr.name === 'id') continue;
      this.attributes[attr.name] = attr.value;
    }
    this.index = assetEl.parentNode
      ? Array.prototype.indexOf.call(assetEl.parentNode.children, assetEl)
      : -1;
  }

  execute(nextCommandCallback) {
    const assetEl = document.getElementById(this.assetId);
    if (assetEl && assetEl.parentNode) {
      assetEl.parentNode.removeChild(assetEl);
      Events.emit('assetremove', this.assetId);
    }
    nextCommandCallback?.();
  }

  undo(nextCommandCallback) {
    const sceneEl = AFRAME.scenes[0];
    let assetsEl = sceneEl.querySelector('a-assets');
    if (!assetsEl) {
      assetsEl = document.createElement('a-assets');
      sceneEl.appendChild(assetsEl);
    }
    const assetEl = document.createElement(this.tagName);
    assetEl.id = this.assetId;
    for (const name in this.attributes) {
      assetEl.setAttribute(name, this.attributes[name]);
    }
    assetsEl.insertBefore(assetEl, assetsEl.children[this.index] ?? null);
    Events.emit('assetcreate', assetEl);

    // The recreated <a-material> is a new THREE.Material instance; re-resolve
    // the entities referencing it so they pick it up.
    if (assetEl.isMaterialAsset) {
      const ref = '#' + this.assetId;
      document.querySelectorAll('a-scene [material]').forEach((entity) => {
        if (
          entity.isEntity &&
          entity.getDOMAttribute('material')?.material === ref
        ) {
          entity.setAttribute('material', 'material', ref);
        }
      });
    }
    nextCommandCallback?.(assetEl);
  }

  toJSON() {
    const output = super.toJSON(this);
    output.tagName = this.tagName;
    output.assetId = this.assetId;
    output.attributes = this.attributes;
    output.index = this.index;
    return output;
  }

  fromJSON(json) {
    super.fromJSON(json);
    this.tagName = json.tagName;
    this.assetId = json.assetId;
    this.attributes = json.attributes;
    this.index = json.index;
  }
}
