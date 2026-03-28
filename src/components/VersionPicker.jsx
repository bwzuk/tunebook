import { useState, useEffect, useRef, useCallback } from 'react';
import abcjs from 'abcjs';
import Modal from './Modal';
import { getTuneDetails } from '../api/theSession';
import { buildFullAbc } from '../utils/abcUtils';
import { useLibrary } from '../contexts/LibraryContext';
import useAudioPlayback from '../hooks/useAudioPlayback';
import './VersionPicker.css';

export default function VersionPicker({ tune, isOpen, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [playingSettingId, setPlayingSettingId] = useState(null);
  const { addTune, hasTune } = useLibrary();

  useEffect(() => {
    if (isOpen && tune) {
      setLoading(true);
      setError(null);
      setSelectedSetting(null);
      setPlayingSettingId(null);
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

  // Stop any playing audio when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPlayingSettingId(null);
    }
  }, [isOpen]);

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

  const handlePlayStateChange = useCallback((settingId, isPlaying) => {
    setPlayingSettingId(isPlaying ? settingId : null);
  }, []);

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
                isPlaying={playingSettingId === setting.id}
                onPlayStateChange={handlePlayStateChange}
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

function VersionOption({ setting, tune, isSelected, isSaved, isPlaying, onPlayStateChange, onSelect }) {
  const previewRef = useRef(null);
  const {
    audioControlRef,
    isPlaying: localIsPlaying,
    isLoading,
    audioSupported,
    setVisualObj,
    play,
    stop,
  } = useAudioPlayback();

  // Notify parent of play state changes
  useEffect(() => {
    onPlayStateChange(setting.id, localIsPlaying);
  }, [localIsPlaying, setting.id, onPlayStateChange]);

  // Stop playing when another version starts
  useEffect(() => {
    if (isPlaying === false && localIsPlaying) {
      stop();
    }
  }, [isPlaying, localIsPlaying, stop]);

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
      const visualObj = abcjs.renderAbc(previewRef.current, firstLine, {
        responsive: 'resize',
        staffwidth: 300,
        scale: 0.7,
        foregroundColor: '#000000',
      });
      // Store the visual object for potential playback
      // For playback, we need the full ABC, so render it separately
    }
  }, [setting, tune.name]);

  const handlePlay = async (e) => {
    e.stopPropagation();

    if (localIsPlaying) {
      stop();
      return;
    }

    // Create a hidden element for full ABC rendering for audio
    const tempContainer = document.createElement('div');
    tempContainer.style.display = 'none';
    document.body.appendChild(tempContainer);

    const fullAbc = buildFullAbc({
      name: tune.name,
      key: setting.key,
      meter: setting.meter,
      abc: setting.abc,
    });

    const visualObj = abcjs.renderAbc(tempContainer, fullAbc, {
      responsive: 'resize',
    });

    setVisualObj(visualObj[0]);
    document.body.removeChild(tempContainer);

    // Small delay to ensure visual obj is set
    await new Promise(resolve => setTimeout(resolve, 50));
    play();
  };

  return (
    <div
      className={`version-option ${isSelected ? 'selected' : ''} ${isSaved ? 'saved' : ''}`}
      onClick={onSelect}
    >
      {/* Hidden audio control element */}
      <div ref={audioControlRef} style={{ display: 'none' }} />

      <div className="version-option-header">
        <button
          className={`version-play-btn ${localIsPlaying ? 'playing' : ''}`}
          onClick={handlePlay}
          disabled={isLoading || !audioSupported}
          title={localIsPlaying ? 'Stop preview' : 'Play preview'}
        >
          {isLoading ? (
            <span className="version-play-spinner"></span>
          ) : localIsPlaying ? (
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
