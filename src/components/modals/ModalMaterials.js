/* eslint-disable no-prototype-builtins */
import React from 'react';
import PropTypes from 'prop-types';
import Events from '../../lib/Events';
import { createUniqueId } from '../../lib/entity';
import Modal from './Modal';
import BooleanWidget from '../widgets/BooleanWidget';
import ColorWidget from '../widgets/ColorWidget';
import InputWidget from '../widgets/InputWidget';
import NumberWidget from '../widgets/NumberWidget';
import SelectWidget from '../widgets/SelectWidget';
import TextureWidget from '../widgets/TextureWidget';
import Vec2Widget from '../widgets/Vec2Widget';

/**
 * Modal listing the <a-material> assets of the scene.
 *
 * Acts both as a picker (when opened from the material property widget, the
 * selected material can be applied to the property) and as a live editor:
 * property changes are set on the <a-material> element, updating every entity
 * sharing the material.
 */
export default class ModalMaterials extends React.Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
    pickEnabled: PropTypes.bool,
    selectedMaterial: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.state = {
      isOpen: this.props.isOpen,
      materials: [],
      selectedEl: null
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (state.isOpen !== props.isOpen) {
      return { isOpen: props.isOpen };
    }
    return null;
  }

  componentDidMount() {
    // Textures load asynchronously; refresh swatches and widgets when they do.
    document.addEventListener('materialtextureloaded', this.onTextureLoaded);
    Events.on('assetcreate', this.onAssetCreate);
    Events.on('assetremove', this.onMaterialAssetsChanged);
    // Refresh on undo/redo of material asset updates.
    Events.on('assetupdate', this.onMaterialAssetsChanged);
  }

  componentWillUnmount() {
    document.removeEventListener('materialtextureloaded', this.onTextureLoaded);
    Events.off('assetcreate', this.onAssetCreate);
    Events.off('assetremove', this.onMaterialAssetsChanged);
    Events.off('assetupdate', this.onMaterialAssetsChanged);
  }

  onTextureLoaded = () => {
    if (this.state.isOpen) {
      this.forceUpdate();
    }
  };

  onAssetCreate = (assetEl) => {
    if (!assetEl.isMaterialAsset) return;
    this.setState({
      materials: Array.from(document.querySelectorAll('a-material')),
      selectedEl: assetEl
    });
  };

  onMaterialAssetsChanged = () => {
    const materials = Array.from(document.querySelectorAll('a-material'));
    const selectedEl =
      this.state.selectedEl && materials.includes(this.state.selectedEl)
        ? this.state.selectedEl
        : materials[0] || null;
    this.setState({ materials, selectedEl });
  };

  componentDidUpdate(prevProps) {
    if (this.props.isOpen && !prevProps.isOpen) {
      this.refresh();
    }
  }

  refresh() {
    const materials = Array.from(document.querySelectorAll('a-material'));
    const value = this.props.selectedMaterial;
    let selectedEl = null;
    if (value) {
      if (value[0] === '#') {
        selectedEl = materials.find((el) => el.id === value.substring(1));
      } else {
        selectedEl = materials.find((el) => el.inlineString === value);
      }
    }
    this.setState({
      materials: materials,
      selectedEl: selectedEl || materials[0] || null
    });
  }

  onClose = () => {
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  pick = () => {
    const el = this.state.selectedEl;
    if (!el || !this.props.onClose) return;
    this.props.onClose(el.id ? '#' + el.id : el.inlineString);
  };

  createMaterial = () => {
    // Selection of the new material happens via the assetcreate event,
    // so redo also reselects it.
    AFRAME.INSPECTOR.execute('assetcreate', { tagName: 'a-material' });
  };

  removeMaterial = () => {
    const el = this.state.selectedEl;
    // Inline materials are owned by their `material(...)` definitions.
    if (!el || !el.id) return;
    const material = el.getMaterial();
    const users = Array.from(
      document.querySelectorAll('a-scene [material]')
    ).filter(
      (entity) =>
        entity.isEntity && entity.components?.material?.material === material
    );
    const message = users.length
      ? 'Material `#' +
        el.id +
        '` is used by ' +
        users.length +
        ' entit' +
        (users.length === 1 ? 'y' : 'ies') +
        '. Do you really want to remove it?'
      : 'Do you really want to remove material `#' + el.id + '`?';
    if (!confirm(message)) return;
    AFRAME.INSPECTOR.execute('assetremove', { assetEl: el });
  };

  renameMaterial = (newIdRaw) => {
    const el = this.state.selectedEl;
    if (!el || !el.id) return;
    const newId = newIdRaw.trim();
    const oldId = el.id;
    if (!newId || newId === oldId) {
      this.forceUpdate();
      return;
    }
    if (!/^[A-Za-z][\w-]*$/.test(newId) || document.getElementById(newId)) {
      alert('Invalid or already used id: ' + newId);
      this.forceUpdate();
      return;
    }
    // Rename the asset and update every entity referencing it, as one
    // undoable step. The rename runs first; its undo (last) re-resolves the
    // reverted consumer references. Elements are referenced by id string so
    // the multi command payload stays serializable.
    const ref = '#' + oldId;
    const commands = [
      ['assetupdate', { assetEl: oldId, attribute: 'id', value: newId }]
    ];
    document.querySelectorAll('a-scene [material]').forEach((entity) => {
      if (
        entity.isEntity &&
        entity.getDOMAttribute('material')?.material === ref
      ) {
        if (!entity.id) {
          entity.id = createUniqueId();
        }
        commands.push([
          'entityupdate',
          {
            entity: entity.id,
            component: 'material',
            property: 'material',
            value: '#' + newId
          }
        ]);
      }
    });
    if (commands.length === 1) {
      AFRAME.INSPECTOR.execute('assetupdate', commands[0][1]);
    } else {
      AFRAME.INSPECTOR.execute('multi', commands);
    }
    this.onMaterialAssetsChanged();
  };

  updateProperty = (name, value) => {
    const el = this.state.selectedEl;
    const propDef = el.schema[name];
    let stringValue;
    if (value === null || value === undefined) {
      stringValue = '';
    } else if (typeof value === 'object') {
      stringValue = propDef.stringify(value);
    } else {
      stringValue = String(value);
    }
    AFRAME.INSPECTOR.execute('assetupdate', {
      assetEl: el,
      attribute: name,
      value: stringValue
    });
  };

  getMaterialTitle(el) {
    return el.id ? '#' + el.id : el.inlineString || '(inline)';
  }

  renderSwatch(el) {
    let color = '#888';
    let imageSrc = null;
    const material = el.getMaterial();
    if (material && material.color) {
      color = '#' + material.color.getHexString();
    }
    const image = material && material.map && material.map.image;
    if (image && image.src) {
      imageSrc = image.src;
    }
    return (
      <span className="materialSwatch" style={{ backgroundColor: color }}>
        {imageSrc ? <img src={imageSrc} /> : null}
      </span>
    );
  }

  renderMaterialsList() {
    const materials = this.state.materials;
    if (materials.length === 0) {
      return <p>No &lt;a-material&gt; assets in the scene.</p>;
    }
    return (
      <ul>
        {materials.map((el, idx) => (
          <li
            key={el.id || el.inlineString || idx}
            className={this.state.selectedEl === el ? 'selected' : ''}
            onClick={() => this.setState({ selectedEl: el })}
            onDoubleClick={this.props.pickEnabled ? this.pick : undefined}
            title={this.getMaterialTitle(el)}
          >
            {this.renderSwatch(el)}
            <span className="title">{this.getMaterialTitle(el)}</span>
          </li>
        ))}
      </ul>
    );
  }

  renderPropertyRow(el, key) {
    const propDef = el.schema[key];
    const value = el.data[key];
    const id = 'materialasset:' + key;
    const onChange = (widgetName, widgetValue) =>
      this.updateProperty(key, widgetValue);
    const widgetProps = { id: id, name: key, onChange: onChange, value: value };
    let widget;

    if (key === 'shader') {
      // Shader cannot be changed after the material is created.
      widget = <span title="Shader cannot be changed">{el.data.shader}</span>;
    } else if (propDef.oneOf && propDef.oneOf.length > 0) {
      widget = <SelectWidget {...widgetProps} options={propDef.oneOf} />;
    } else if (propDef.type === 'map') {
      // Opens the textures modal, stacked on top of this one.
      widget = <TextureWidget {...widgetProps} />;
    } else {
      switch (propDef.type) {
        case 'number': {
          widget = (
            <NumberWidget
              {...widgetProps}
              min={propDef.hasOwnProperty('min') ? propDef.min : -Infinity}
              max={propDef.hasOwnProperty('max') ? propDef.max : Infinity}
            />
          );
          break;
        }
        case 'int':
        case 'time': {
          widget = <NumberWidget {...widgetProps} precision={0} />;
          break;
        }
        case 'vec2': {
          widget = <Vec2Widget {...widgetProps} />;
          break;
        }
        case 'color': {
          widget = <ColorWidget {...widgetProps} />;
          break;
        }
        case 'boolean': {
          widget = <BooleanWidget {...widgetProps} />;
          break;
        }
        default: {
          widget = (
            <InputWidget
              id={id}
              name={key}
              onBlur={onChange}
              value={value}
              schema={propDef}
            />
          );
        }
      }
    }

    return (
      <div className="propertyRow" key={key}>
        <label
          htmlFor={id}
          className="text"
          title={key + ' - type: ' + propDef.type}
        >
          {key}
        </label>
        {widget}
      </div>
    );
  }

  renderEditor() {
    const el = this.state.selectedEl;
    if (!el || !el.schema) return null;
    const keys = Object.keys(el.schema).sort();
    return (
      <>
        {el.id && (
          <div className="propertyRow" key="__id">
            <label
              htmlFor="materialasset:id"
              className="text"
              title="Rename the material asset id; entities referencing it are updated"
            >
              id
            </label>
            <InputWidget
              id="materialasset:id"
              key={el.id}
              name="id"
              onBlur={(name, value) => this.renameMaterial(String(value))}
              value={el.id}
            />
          </div>
        )}
        {keys.map((key) => this.renderPropertyRow(el, key))}
      </>
    );
  }

  render() {
    return (
      <Modal
        id="materialsModal"
        title="Material Assets"
        isOpen={this.state.isOpen}
        onClose={this.onClose}
      >
        <div className="materialsModal">
          <div className="materialsList">
            {this.renderMaterialsList()}
            <div className="materialsActions">
              <button onClick={this.createMaterial}>NEW MATERIAL</button>
              {this.props.pickEnabled && (
                <button
                  onClick={this.pick}
                  disabled={!this.state.selectedEl}
                  title="Set the material property to the selected material asset"
                >
                  USE SELECTED
                </button>
              )}
              <button
                onClick={this.removeMaterial}
                disabled={!this.state.selectedEl || !this.state.selectedEl.id}
                title={
                  this.state.selectedEl && !this.state.selectedEl.id
                    ? 'Inline materials are owned by their material(...) definition'
                    : 'Remove the selected material asset'
                }
              >
                DELETE
              </button>
            </div>
          </div>
          <div className="materialsEditor">{this.renderEditor()}</div>
        </div>
      </Modal>
    );
  }
}
