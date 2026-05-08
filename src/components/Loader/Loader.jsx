import React from 'react';
import './Loader.css';

export default function Loader() {
  return (
    <div className="loader-overlay" id="loader">
      <div className="loader-spinner">
        <div className="loader-bar"></div>
        <div className="loader-bar"></div>
        <div className="loader-bar"></div>
        <div className="loader-bar"></div>
        <div className="loader-bar"></div>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-wrapper">
      <div className="skeleton skeleton-card"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text-sm"></div>
    </div>
  );
}
