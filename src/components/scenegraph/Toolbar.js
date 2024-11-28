import React from 'react';
import {
  faClipboard,
  faPlus,
  faPause,
  faPlay,
  faFloppyDisk,
  faQuestion
} from '@fortawesome/free-solid-svg-icons';
import { AwesomeIcon } from '../AwesomeIcon';
import { getEntityClipboardRepresentation } from '../../lib/entity';
import Events from '../../lib/Events';
import copy from 'clipboard-copy';
import { saveBlob } from '../../lib/utils';
import GLTFIcon from '../../../assets/gltf.svg';

function filterHelpers(scene, visible) {
  scene.traverse((o) => {
    if (o.userData.source === 'INSPECTOR') {
      o.visible = visible;
    }
  });
}

function getSceneName(scene) {
  return scene.id || slugify(window.location.host + window.location.pathname);
}

/**
 * Slugify the string removing non-word chars and spaces
 * @param  {string} text String to slugify
 * @return {string}      Slugified string
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '-') // Replace all non-word chars with -
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

/**
 * Tools and actions.
 */
export default class Toolbar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isPlaying: false,
      copied: false
    };
  }

  exportSceneToGLTF() {
    const sceneName = getSceneName(AFRAME.scenes[0]);
    const scene = AFRAME.scenes[0].object3D;
    filterHelpers(scene, false);
    AFRAME.INSPECTOR.exporters.gltf.parse(
      scene,
      function (buffer) {
        filterHelpers(scene, true);
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        saveBlob(blob, sceneName + '.glb');
      },
      function (error) {
        console.error(error);
      },
      { binary: true }
    );
  }

  addEntity() {
    AFRAME.INSPECTOR.execute('entitycreate', {
      components: {}
    });
  }

  /**
   * Try to write changes with aframe-inspector-watcher.
   */
  writeChanges = () => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:51234/save');
    xhr.onerror = () => {
      alert(
        'aframe-watcher not running. This feature requires a companion service running locally. npm install aframe-watcher to save changes back to file. Read more at https://github.com/supermedium/aframe-watcher'
      );
    };
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(AFRAME.INSPECTOR.historyWatcher.updates));
  };

  toggleScenePlaying = () => {
    if (this.state.isPlaying) {
      AFRAME.scenes[0].pause();
      this.setState({ isPlaying: false });
      AFRAME.scenes[0].isPlaying = true;
      document.getElementById('aframeInspectorMouseCursor').play();
      return;
    }
    AFRAME.scenes[0].isPlaying = false;
    AFRAME.scenes[0].play();
    this.setState({ isPlaying: true });
  };

  openHelpModal = () => {
    Events.emit('openhelpmodal');
  };

  render() {
    const watcherTitle = 'Write changes with aframe-watcher.';

    return (
      <div id="toolbar">
        <div className="toolbarActions" style={{ position: 'relative' }}>
          <a
            className="button"
            title="Add a new entity"
            onClick={this.addEntity}
          >
            <AwesomeIcon icon={faPlus} />
          </a>
          <a
            id="playPauseScene"
            className="button"
            title={this.state.isPlaying ? 'Pause scene' : 'Resume scene'}
            onClick={this.toggleScenePlaying}
          >
            {this.state.isPlaying ? (
              <AwesomeIcon icon={faPause} />
            ) : (
              <AwesomeIcon icon={faPlay} />
            )}
          </a>
          <a
            className="gltfIcon"
            title="Export to GLTF"
            onClick={this.exportSceneToGLTF}
          >
            <img src={GLTFIcon} />
          </a>
          <a
            className="button"
            title={watcherTitle}
            onClick={this.writeChanges}
          >
            <AwesomeIcon icon={faFloppyDisk} />
          </a>
          <a
            title="Copy a-scene HTML to clipboard"
            className="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              copy(
                getEntityClipboardRepresentation(
                  document.querySelector('a-scene')
                )
              );
              this.setState({ copied: true });
              setTimeout(() => {
                this.setState({ copied: false });
              }, 2000);
            }}
          >
            <AwesomeIcon icon={faClipboard} />
          </a>
          <div
            style={{
              display: this.state.copied ? 'block' : 'none',
              position: 'absolute',
              left: '8px',
              top: '35px',
              zIndex: '100',
              backgroundColor: '#242424',
              color: '#fff',
              width: '190px',
              padding: '10px',
              border: '1px solid #fff'
            }}
          >
            Copied a-scene HTML to clipboard
          </div>
          <div className="helpButtonContainer">
            <a className="button" title="Help" onClick={this.openHelpModal}>
              <AwesomeIcon icon={faQuestion} />
            </a>
          </div>
        </div>
      </div>
    );
  }
}
