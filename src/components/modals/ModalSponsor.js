import React from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';

export default class ModalSponsor extends React.Component {
  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
  };

  render() {
    return (
      <Modal
        title="Sponsor"
        isOpen={this.props.isOpen}
        onClose={this.props.onClose}
      >
        <div style={{ fontSize: '1.2em', maxWidth: '500px' }}>
          <p style={{ fontWeight: 'bold', textAlign: 'center' }}>
            If you like the editor, please consider supporting the project.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <a
              href="https://github.com/c-frame/aframe-editor"
              target="_blank"
              rel="noreferrer"
              className="try-editor-btn"
            >
              Go to aframe editor repository and click Sponsor
            </a>
          </div>
        </div>
      </Modal>
    );
  }
}
