import { useEffect, useState } from 'react';
import { faRotateLeft, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { AwesomeIcon } from '../AwesomeIcon';
import Events from '../../lib/Events';

const UndoRedo = () => {
  const [undoDisabled, setUndoDisabled] = useState(
    AFRAME.INSPECTOR.history.undos.length === 0
  );
  const [redoDisabled, setRedoDisabled] = useState(
    AFRAME.INSPECTOR.history.redos.length === 0
  );
  const handleUndoClick = () => {
    AFRAME.INSPECTOR.undo();
  };

  const handleRedoClick = () => {
    AFRAME.INSPECTOR.redo();
  };

  useEffect(() => {
    const listener = () => {
      setUndoDisabled(AFRAME.INSPECTOR.history.undos.length === 0);
      setRedoDisabled(AFRAME.INSPECTOR.history.redos.length === 0);
    };
    Events.on('historychanged', listener);
    return () => {
      Events.off('historychanged', listener);
    };
  }, []);

  return (
    <div id="undoRedoButtons">
      <button
        type="button"
        onClick={handleUndoClick}
        disabled={undoDisabled}
        title="Undo"
      >
        <AwesomeIcon icon={faRotateLeft} />
      </button>
      <button
        type="button"
        onClick={handleRedoClick}
        disabled={redoDisabled}
        title="Redo"
      >
        <AwesomeIcon icon={faRotateRight} />
      </button>
    </div>
  );
};

export default UndoRedo;
