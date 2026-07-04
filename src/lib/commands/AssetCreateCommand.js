import Events from '../Events';
import { Command } from '../command.js';

/**
 * Create a new asset element in <a-assets> (e.g., a-material, a-mixin, img,
 * audio, video, a-asset-item).
 *
 * @param editor Editor
 * @param payload Object containing:
 *   - tagName: element tag to create (e.g., 'a-material', 'img').
 *   - id: optional; a unique `<base>-N` id is generated otherwise (e.g.,
 *     `material-1` for a-material). The id stays stable across undo/redo so
 *     later commands referencing the asset keep working.
 *   - attributes: optional object of attribute name to string value.
 * @param callback Optional callback receiving the created element on execute.
 * @constructor
 */
export class AssetCreateCommand extends Command {
  constructor(editor, payload = null, callback = undefined) {
    super(editor);

    this.type = 'assetcreate';
    this.name = 'Create Asset';
    this.callback = callback;

    if (payload === null) return;

    this.tagName = payload.tagName;
    this.attributes = payload.attributes ?? {};

    if (payload.id) {
      this.assetId = payload.id;
    } else {
      const base = this.tagName.startsWith('a-')
        ? this.tagName.substring(2)
        : this.tagName;
      let n = 1;
      while (document.getElementById(base + '-' + n)) {
        n++;
      }
      this.assetId = base + '-' + n;
    }
  }

  execute(nextCommandCallback) {
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
    assetsEl.appendChild(assetEl);
    Events.emit('assetcreate', assetEl);
    this.callback?.(assetEl);
    nextCommandCallback?.(assetEl);
    return assetEl;
  }

  undo(nextCommandCallback) {
    const assetEl = document.getElementById(this.assetId);
    if (assetEl && assetEl.parentNode) {
      assetEl.parentNode.removeChild(assetEl);
      Events.emit('assetremove', this.assetId);
    }
    nextCommandCallback?.();
  }

  toJSON() {
    const output = super.toJSON(this);
    output.tagName = this.tagName;
    output.assetId = this.assetId;
    output.attributes = this.attributes;
    return output;
  }

  fromJSON(json) {
    super.fromJSON(json);
    this.tagName = json.tagName;
    this.assetId = json.assetId;
    this.attributes = json.attributes;
  }
}
