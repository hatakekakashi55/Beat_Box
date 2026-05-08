import React, { useState, useEffect } from 'react';
import { IoClose, IoMail, IoLogoInstagram, IoLogoGithub, IoStar, IoFilm, IoMusicalNotes, IoFlash } from 'react-icons/io5';
import './AboutModal.css';

export default function AboutModal({ onClose }) {
  const [typedText, setTypedText] = useState('');
  const fullText = 'Mokka Coding';
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, i + 1));
      i++;
      if (i === fullText.length) clearInterval(interval);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: <IoMusicalNotes />, title: 'Premium Music', desc: 'High-quality 320kbps audio streaming with zero ads.' },
    { icon: <IoFilm />, title: 'HD Movies', desc: 'Latest Tamil movies & web series with multi-server support.' },
    { icon: <IoFlash />, title: 'Super Fast', desc: 'Optimized performance for a smooth, lag-free experience.' },
    { icon: <IoStar />, title: 'Curated Playlists', desc: 'Handpicked collections for every mood and genre.' },
  ];

  return (
    <div className="about-modal-overlay" onClick={onClose}>
      <div className="about-modal" onClick={e => e.stopPropagation()}>
        <div className="about-modal__header">
          <h2 className="about-modal__title">About BeatBox</h2>
          <button className="about-modal__close" onClick={onClose}>
            <IoClose size={24} />
          </button>
        </div>

        <div className="about-modal__content">
          <div className="about-modal__hero">
            <div className="about-modal__logo-3d">
              <div className="cube">
                <div className="face front">B</div>
                <div className="face back">B</div>
                <div className="face right">B</div>
                <div className="face left">B</div>
                <div className="face top">B</div>
                <div className="face bottom">B</div>
              </div>
            </div>
            <h1 className="about-modal__app-name">BeatBox</h1>
            <p className="about-modal__version">Version 2.0.4 Premium</p>
          </div>

          <div className="about-modal__features">
            {features.map((f, i) => (
              <div key={i} className="about-feature-card" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="about-feature-card__icon">{f.icon}</div>
                <div className="about-feature-card__info">
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="about-modal__creator">
            <p className="creator-label">Created with ❤️ by</p>
            <h2 className="typing-animation">{typedText}<span>|</span></h2>
          </div>

          <div className="about-modal__contact">
            <h3 className="contact-title">Connect with Me</h3>
            <div className="contact-links">
              <a href="mailto:keerthan4531@gmail.com" className="contact-link">
                <IoMail /> <span>keerthan4531@gmail.com</span>
              </a>
              <a href="https://instagram.com/dark.shadow_4531" target="_blank" rel="noreferrer" className="contact-link">
                <IoLogoInstagram /> <span>@dark.shadow_4531</span>
              </a>
              <a href="https://github.com/keerthan4531-a11y" target="_blank" rel="noreferrer" className="contact-link">
                <IoLogoGithub /> <span>keerthan4531-a11y</span>
              </a>
            </div>
          </div>
        </div>

        <div className="about-modal__footer">
          <p>© 2024 BeatBox Media Player. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
}
