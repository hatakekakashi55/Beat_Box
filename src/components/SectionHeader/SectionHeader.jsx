import React from 'react';
import './SectionHeader.css';

export default function SectionHeader({ title, actionLabel, onAction, badge }) {
  return (
    <div className="section-header">
      <div className="section-header__left">
        <h2 className="section-header__title">{title}</h2>
        {badge && <span className="section-header__badge">{badge}</span>}
      </div>
      {actionLabel && (
        <button className="section-header__link" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
