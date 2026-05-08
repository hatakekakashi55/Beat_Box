import React from 'react';
import { IoTimeOutline, IoClose, IoTrashOutline } from 'react-icons/io5';
import './RecentSearches.css';

export default function RecentSearches({ searches, onSelect, onRemove, onClear }) {
  if (!searches || searches.length === 0) return null;

  return (
    <div className="recent-searches" id="recent-searches">
      <div className="recent-searches__header">
        <h3 className="recent-searches__title">Recent Searches</h3>
        <button
          className="recent-searches__clear-all"
          onClick={onClear}
          aria-label="Clear all recent searches"
        >
          <IoTrashOutline />
          <span>Clear all</span>
        </button>
      </div>
      <div className="recent-searches__list">
        {searches.map((query) => (
          <div key={query} className="recent-searches__item">
            <button
              className="recent-searches__chip"
              onClick={() => onSelect(query)}
            >
              <IoTimeOutline className="recent-searches__icon" />
              <span className="recent-searches__text">{query}</span>
            </button>
            <button
              className="recent-searches__remove"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(query);
              }}
              aria-label={`Remove ${query}`}
            >
              <IoClose />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
