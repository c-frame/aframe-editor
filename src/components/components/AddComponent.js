import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { faPaste } from '@fortawesome/free-solid-svg-icons';
import { AwesomeIcon } from '../AwesomeIcon';

export default class AddComponent extends React.Component {
  static propTypes = {
    entity: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.state = { value: null };
  }

  /**
   * Add blank component.
   * If component is instanced, generate an ID.
   */
  addComponent = (value) => {
    this.setState({ value: null });

    let componentName = value.value;

    const entity = this.props.entity;

    if (AFRAME.components[componentName].multiple) {
      let id = prompt(
        `Provide an ID for this component (e.g., 'foo' for ${componentName}__foo).`
      );
      if (id) {
        id = id
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '');
        // With the transform, id could be empty string, so we need to check again.
      }
      if (id) {
        componentName = `${componentName}__${id}`;
      } else {
        // If components already exist, be sure to suffix with an id,
        // if it's first one, use the component name without id.
        const numberOfComponents = Object.keys(
          this.props.entity.components
        ).filter(function (name) {
          return (
            name === componentName || name.startsWith(`${componentName}__`)
          );
        }).length;
        if (numberOfComponents > 0) {
          id = numberOfComponents + 1;
          componentName = `${componentName}__${id}`;
        }
      }
    }

    AFRAME.INSPECTOR.execute('componentadd', {
      entity,
      component: componentName,
      value: ''
    });
  };

  handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        console.warn('Clipboard is empty');
        return;
      }

      const entity = this.props.entity;
      if (!entity) {
        console.error('No entity selected');
        return;
      }

      // Parse the pasted text format: "component=value"
      const equalIndex = text.indexOf('=');
      if (equalIndex === -1) {
        console.error('Invalid paste format. Expected: "component=value"');
        return;
      }

      const componentName = text.substring(0, equalIndex).trim();
      let valueString = text.substring(equalIndex + 1).trim();

      if (!componentName || !valueString) {
        console.error(
          'Invalid paste format. Both component and value are required'
        );
        return;
      }

      // Remove quotes from valueString
      if (
        (valueString.startsWith('"') && valueString.endsWith('"')) ||
        (valueString.startsWith("'") && valueString.endsWith("'"))
      ) {
        valueString = valueString.slice(1, -1);
      }

      // Parse the value using AFRAME's style parser
      let parsedValue;
      try {
        parsedValue = AFRAME.utils.styleParser.parse(valueString);
      } catch (error) {
        console.error('Failed to parse component value:', error);
        return;
      }

      // Check if component already exists
      const hasComponent = entity.hasAttribute(componentName);

      if (hasComponent) {
        AFRAME.INSPECTOR.execute('entityupdate', {
          entity: entity,
          component: componentName,
          value: parsedValue
        });
      } else {
        AFRAME.INSPECTOR.execute('componentadd', {
          entity: entity,
          component: componentName,
          value: parsedValue
        });
      }
    } catch (error) {
      console.error('Failed to read from clipboard:', error);
    }
  };

  /**
   * Component dropdown options.
   */
  getComponentsOptions() {
    const usedComponents = Object.keys(this.props.entity.components);
    return Object.keys(AFRAME.components)
      .filter((componentName) => {
        if (
          AFRAME.components[componentName].sceneOnly &&
          !this.props.entity.isScene
        ) {
          return false;
        }

        return (
          AFRAME.components[componentName].multiple ||
          usedComponents.indexOf(componentName) === -1
        );
      })
      .map(function (value) {
        return { value: value, label: value };
      })
      .toSorted(function (a, b) {
        return a.label === b.label ? 0 : a.label < b.label ? -1 : 1;
      });
  }

  render() {
    const entity = this.props.entity;
    if (!entity) {
      return <div />;
    }

    const options = this.getComponentsOptions();

    return (
      <div id="addComponentContainer">
        <p id="addComponentHeader">COMPONENTS</p>
        <div className="addComponentRow">
          <Select
            id="addComponent"
            className="addComponent"
            classNamePrefix="select"
            options={options}
            isClearable={false}
            isSearchable
            placeholder="Add component..."
            noOptionsMessage={() => 'No components found'}
            onChange={this.addComponent}
            value={this.state.value}
          />
          <a
            title="Paste values of a copied component"
            className="button"
            onClick={this.handlePaste}
          >
            <AwesomeIcon icon={faPaste} />
          </a>
        </div>
      </div>
    );
  }
}
