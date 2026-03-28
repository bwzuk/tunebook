import './TagFilter.css';

export default function TagFilter({ tags, selectedTag, onSelectTag }) {
  if (tags.length === 0) return null;

  return (
    <div className="tag-filter">
      <span className="tag-filter-label">Tags:</span>
      <div className="tag-filter-list">
        <button
          className={`tag-filter-btn ${selectedTag === null ? 'active' : ''}`}
          onClick={() => onSelectTag(null)}
        >
          All
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            className={`tag-filter-btn ${selectedTag === tag ? 'active' : ''}`}
            onClick={() => onSelectTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
