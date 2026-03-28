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
  const synthRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Render preview
  useEffect(() => {
    if (previewRef.current && setting.abc) {
      const abc = buildFullAbc({
        name: tune.name,
        key: setting.key,
        meter: setting.meter,
        abc: setting.abc,
      });
      const firstLine = abc.split('\n').slice(0, 6).join('\n');
      abcjs.renderAbc(previewRef.current, firstLine, {
        responsive: 'resize',
        staffwidth: 300,
        scale: 0.7,
        foregroundColor: '#000000',
      });
    }
  }, [setting, tune.name]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.stop();
      }
    };
  }, []);

  const handlePlay = async (e) => {
    e.stopPropagation();

    if (isPlaying) {
      if (synthRef.current) {
        synthRef.current.stop();
      }
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    try {
      const fullAbc = buildFullAbc({
        name: tune.name,
        key: setting.key,
        meter: setting.meter,
        abc: setting.abc,
      });

      // Use CreateSynth directly instead of SynthController
      const visualObj = abcjs.renderAbc('*', fullAbc)[0];

      if (!synthRef.current) {
        synthRef.current = new abcjs.synth.CreateSynth();
      }

      await synthRef.current.init({
        visualObj: visualObj,
        options: {
          soundFontUrl: 'https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/',
        },
      });

      await synthRef.current.prime();
      synthRef.current.start();
      setIsPlaying(true);

      // Watch for end
      const checkEnded = setInterval(() => {
        if (synthRef.current && !synthRef.current.isRunning) {
          setIsPlaying(false);
          clearInterval(checkEnded);
        }
      }, 200);
    } catch (err) {
      console.error('Playback error:', err);
    }

    setIsLoading(false);
  };

  return (
    <div
      className={`version-option ${isSelected ? 'selected' : ''} ${isSaved ? 'saved' : ''}`}
      onClick={onSelect}
    >
      <div className="version-option-header">
        <button
          className={`version-play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={handlePlay}
          disabled={isLoading}
          title={isPlaying ? 'Stop' : 'Play preview'}
        >
          {isLoading ? (
            <span className="version-play-spinner"></span>
          ) : isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
        <span className="version-option-key">{setting.key}</span>
        <span className="version-option-submitter">by {setting.member}</span>
        {isSaved && <span className="version-option-saved">Saved</span>}
      </div>
      <div className="version-option-preview" ref={previewRef} />
    </div>
  );
}
