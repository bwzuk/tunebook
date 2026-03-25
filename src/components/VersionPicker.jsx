import { useState, useEffect, useRef } from 'react';
import abcjs from 'abcjs';
import Modal from './Modal';
import { getTuneDetails } from '../api/theSession';
import { buildFullAbc } from '../utils/abcUtils';
import { useLibrary } from '../contexts/LibraryContext';
import './VersionPicker.css';

export default function VersionPicker({ tune, isOpen, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSetting, setSelectedSetting] = useState(null);
  const { addTune, hasTune } = useLibrary();

  useEffect(() => {
    if (isOpen && tune) {
      setLoading(true);
      setError(null);
      setSelectedSetting(null);
      getTuneDetails(tune.id)
        .then((data) => {
          setDetails(data);
          if (data.settings?.length > 0) {
            setSelectedSetting(data.settings[0]);
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, tune]);

  const handleSave = async () => {
    if (!selectedSetting || !details) return;

    const tuneToSave = {
      id: `${details.id}_${selectedSetting.id}`,
      tuneId: details.id,
      settingId: selectedSetting.id,
      name: details.name,
      type: details.type,
      key: selectedSetting.key,
      meter: selectedSetting.meter,
      abc: selectedSetting.abc,
      sourceUrl: details.url,
    };

    const success = await addTune(tuneToSave);
    if (success) {
      onClose();
    }
  };

  const alreadySaved = selectedSetting && details
    ? hasTune(`${details.id}_${selectedSetting.id}`)
    : false;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tune?.name || 'Select Version'}>
      {loading && <div className="version-picker-loading">Loading versions...</div>}
      {error && <div className="version-picker-error">{error}</div>}
      {details && (
        <div className="version-picker">
          <div className="version-picker-info">
            <span className="version-picker-type">{details.type}</span>
            <span className="version-picker-count">{details.settings?.length} version(s)</span>
          </div>

          <div className="version-list">
            {details.settings?.map((setting) => (
              <VersionOption
                key={setting.id}
                setting={setting}
                tune={details}
                isSelected={selectedSetting?.id === setting.id}
                isSaved={hasTune(`${details.id}_${setting.id}`)}
                onSelect={() => setSelectedSetting(setting)}
              />
            ))}
          </div>

          <div className="version-picker-actions">
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={!selectedSetting || alreadySaved}
            >
              {alreadySaved ? 'Already in Library' : 'Add to Library'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function VersionOption({ setting, tune, isSelected, isSaved, onSelect }) {
  const previewRef = useRef(null);

  useEffect(() => {
    if (previewRef.current && setting.abc) {
      const abc = buildFullAbc({
        name: tune.name,
        key: setting.key,
        meter: setting.meter,
        abc: setting.abc,
      });
      // Just render first line for preview
      const firstLine = abc.split('\n').slice(0, 6).join('\n');
      abcjs.renderAbc(previewRef.current, firstLine, {
        responsive: 'resize',
        staffwidth: 300,
        scale: 0.7,
        foregroundColor: '#000000',
      });
    }
  }, [setting, tune.name]);

  return (
    <div
      className={`version-option ${isSelected ? 'selected' : ''} ${isSaved ? 'saved' : ''}`}
      onClick={onSelect}
    >
      <div className="version-option-header">
        <span className="version-option-key">{setting.key}</span>
        <span className="version-option-submitter">by {setting.member}</span>
        {isSaved && <span className="version-option-saved">Saved</span>}
      </div>
      <div className="version-option-preview" ref={previewRef} />
    </div>
  );
}
