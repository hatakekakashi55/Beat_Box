import React from 'react';
import './FilterTabs.css';

const DEFAULT_TABS = [
  { key: 'all', label: 'All' },
  { key: 'songs', label: 'Songs' },
  { key: 'users', label: 'Users' },
  { key: 'artists', label: 'Artists' },
  { key: 'albums', label: 'Albums' },
  { key: 'playlists', label: 'Playlists' },
];

export default function FilterTabs({ activeTab, onTabChange, tabs }) {
  const tabList = tabs || DEFAULT_TABS;

  return (
    <div className="filter-tabs" id="filter-tabs">
      {tabList.map((tab) => (
        <button
          key={tab.key}
          className={`filter-tabs__tab ${activeTab === tab.key ? 'active' : ''}`}
          onClick={() => onTabChange(tab.key)}
          id={`filter-tab-${tab.key}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
