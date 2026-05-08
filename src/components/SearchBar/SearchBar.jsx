import React from 'react';
import { IoSearch, IoClose } from 'react-icons/io5';
import './SearchBar.css';

export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="search-bar" id="search-bar">
      <div className="search-bar__input-wrapper">
        <input
          type="text"
          className="search-bar__input"
          placeholder={placeholder || 'What do you want to listen to?'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          id="search-input"
          autoComplete="off"
          spellCheck="false"
        />
        <IoSearch className="search-bar__icon" />
        <button
          className={`search-bar__clear ${value ? 'visible' : ''}`}
          onClick={() => onChange('')}
          id="search-clear-btn"
          aria-label="Clear search"
        >
          <IoClose />
        </button>
      </div>
    </div>
  );
}
