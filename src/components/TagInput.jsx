import { useState, useRef, useEffect } from 'react';
import './TagInput.css';

export default function TagInput({ tags = [], allTags = [], onAddTag, onRemoveTag }) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Filter suggestions: show tags that match input and aren't already added
  const suggestions = allTags.filter(
    (tag) =>
      tag.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(tag)
  );

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAddTag(trimmed);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (tag) => {
    onAddTag(tag);
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  return (
    <div className="tag-input-container" ref={containerRef}>
      {/* Show existing tags as quick-pick chips when there are unused tags available */}
      {suggestions.length > 0 && (
        <div className="tag-suggestions-inline">
          <span className="tag-suggestions-label">Quick add:</span>
          {suggestions.slice(0, 6).map((tag) => (
            <button
              key={tag}
              type="button"
              className="tag-chip"
              onClick={() => handleSuggestionClick(tag)}
            >
              + {tag}
            </button>
          ))}
        </div>
      )}

      <div className="tag-list">
        {tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
            <button
              type="button"
              className="tag-remove"
              onClick={() => onRemoveTag(tag)}
              aria-label={`Remove ${tag}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="tag-input-form">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Add a new tag..."
          className="tag-input"
        />
        <button type="submit" className="tag-add-btn" disabled={!inputValue.trim()}>
          Add
        </button>
      </form>

      {showSuggestions && suggestions.length > 0 && inputValue && (
        <div className="tag-suggestions">
          {suggestions.slice(0, 5).map((tag) => (
            <button
              key={tag}
              type="button"
              className="tag-suggestion"
              onClick={() => handleSuggestionClick(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
