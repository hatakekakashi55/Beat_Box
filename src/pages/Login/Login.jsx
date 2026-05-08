import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { auth, googleProvider } from '../../firebase';
import { signInWithRedirect, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { LANGUAGES } from '../../data/languageData';
import {
  IoMusicalNotes,
  IoLogoGoogle,
  IoLogoApple,
  IoArrowForward,
  IoArrowBack,
  IoCheckmarkCircle,
  IoSparkles,
} from 'react-icons/io5';
import './Login.css';

/* ════════════════════════════════════════════
   STEP 0: Welcome / Login Form
   STEP 1: Language Selection
   STEP 2: Artist & Mood Preferences
   ════════════════════════════════════════════ */

export default function Login() {
  const { login, isAuthenticated } = usePlayer();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [selectedMoods, setSelectedMoods] = useState([]);

  // If already authenticated (e.g. from redirect), skip login step
  React.useEffect(() => {
    if (isAuthenticated && step === 0) {
      setStep(1);
    }
  }, [isAuthenticated, step]);

  /* ── Auth Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) return;
    
    try {
      if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setStep(1); // Move to language selection
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const handleSocialLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // setStep(1) will be triggered by useEffect
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider);
      } else {
        alert("Login failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Language Toggle ── */
  const toggleLanguage = (langId) => {
    setSelectedLanguages(prev =>
      prev.includes(langId)
        ? prev.filter(id => id !== langId)
        : [...prev, langId]
    );
  };

  /* ── Artist Toggle ── */
  const toggleArtist = (artistName) => {
    setSelectedArtists(prev =>
      prev.includes(artistName)
        ? prev.filter(n => n !== artistName)
        : [...prev, artistName]
    );
  };

  /* ── Mood Toggle ── */
  const toggleMood = (moodQuery) => {
    setSelectedMoods(prev =>
      prev.includes(moodQuery)
        ? prev.filter(q => q !== moodQuery)
        : [...prev, moodQuery]
    );
  };

  /* ── Finish Onboarding ── */
  const finishOnboarding = () => {
    // Save preferences
    localStorage.setItem('uxbeat_languages', JSON.stringify(selectedLanguages));
    localStorage.setItem('uxbeat_fav_artists', JSON.stringify(selectedArtists));
    localStorage.setItem('uxbeat_fav_moods', JSON.stringify(selectedMoods));

    // Force an app reload to trigger onAuthStateChanged in the new context state, 
    // or just let the context update handle it if already logged in
    window.location.href = '/';
  };

  /* ── Get artists & moods for selected languages ── */
  const getSelectedLangData = () => {
    return LANGUAGES.filter(l => selectedLanguages.includes(l.id));
  };

  return (
    <div className="login-page" id="login-page">
      {/* Ambient background orbs */}
      <div className="login-page__orb login-page__orb--1" />
      <div className="login-page__orb login-page__orb--2" />
      <div className="login-page__orb login-page__orb--3" />

      {/* ═══════════ STEP 0: LOGIN / SIGNUP ═══════════ */}
      {step === 0 && (
        <div className="login-page__container login-page__slide-in" key="step0">
          <div className="login-page__header">
            <div className="login-page__logo">
              <img src="/beatbox_logo.png" alt="BeatBox" style={{ height: 64, objectFit: 'contain' }} />
            </div>
            <h1 className="login-page__title">
              {isSignUp ? 'Sign up to start listening' : 'Log in to BeatBox'}
            </h1>
            <p className="login-page__desc">
              Stream unlimited music in 320kbps. Ad-free, forever.
            </p>
          </div>

          <form className="login-page__form" onSubmit={handleSubmit}>
            {isSignUp && (
              <div className="login-page__input-group">
                <label>What should we call you?</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="login-page__input-group">
              <label>Email address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-page__input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-page__submit">
              {isSignUp ? 'Sign Up' : 'Log In'}
              <IoArrowForward />
            </button>
          </form>

          <div className="login-page__divider"><span>or continue with</span></div>

          <div className="login-page__social">
            <button className="login-page__social-btn" onClick={handleSocialLogin} disabled={loading}>
              <IoLogoGoogle size={20} /> {loading ? 'Connecting...' : 'Google'}
            </button>
            <button className="login-page__social-btn" onClick={handleSocialLogin} disabled={loading}>
              <IoLogoApple size={20} /> {loading ? 'Connecting...' : 'Apple'}
            </button>
          </div>

          <div className="login-page__footer">
            <span className="login-page__footer-text">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <button className="login-page__toggle-btn" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Log in here' : 'Sign up for free'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ STEP 1: LANGUAGE SELECTION ═══════════ */}
      {step === 1 && (
        <div className="login-page__container login-page__container--wide login-page__slide-in" key="step1">
          <div className="login-page__step-header">
            <button className="login-page__back-btn" onClick={() => setStep(0)}>
              <IoArrowBack />
            </button>
            <div className="login-page__step-badge">Step 1 of 2</div>
          </div>

          <h2 className="login-page__step-title">
            <IoSparkles className="login-page__sparkle" />
            Choose your languages
          </h2>
          <p className="login-page__step-desc">
            Select the languages you listen to. We'll personalize your experience.
          </p>

          <div className="login-page__lang-grid">
            {LANGUAGES.map(lang => {
              const isSelected = selectedLanguages.includes(lang.id);
              return (
                <button
                  key={lang.id}
                  className={`login-page__lang-card ${isSelected ? 'selected' : ''}`}
                  style={{ '--lang-color': lang.color, '--lang-gradient': lang.gradient }}
                  onClick={() => toggleLanguage(lang.id)}
                >
                  {isSelected && (
                    <IoCheckmarkCircle className="login-page__lang-check" />
                  )}
                  <span className="login-page__lang-local">{lang.nameLocal}</span>
                  <span className="login-page__lang-name">{lang.name}</span>
                </button>
              );
            })}
          </div>

          <button
            className="login-page__next-btn"
            disabled={selectedLanguages.length === 0}
            onClick={() => setStep(2)}
          >
            Next <IoArrowForward />
          </button>
        </div>
      )}

      {/* ═══════════ STEP 2: ARTISTS & MOODS ═══════════ */}
      {step === 2 && (
        <div className="login-page__container login-page__container--wide login-page__slide-in" key="step2">
          <div className="login-page__step-header">
            <button className="login-page__back-btn" onClick={() => setStep(1)}>
              <IoArrowBack />
            </button>
            <div className="login-page__step-badge">Step 2 of 2</div>
          </div>

          <h2 className="login-page__step-title">
            Pick your favorites
          </h2>
          <p className="login-page__step-desc">
            Select artists and moods you love. Tap to select.
          </p>

          {/* Artists for each selected language */}
          {getSelectedLangData().map(lang => (
            <div key={lang.id} className="login-page__pref-section">
              <h3 className="login-page__pref-lang-title" style={{ color: lang.color }}>
                {lang.name} Artists
              </h3>
              <div className="login-page__artist-grid">
                {lang.artists.map(artist => {
                  const isSelected = selectedArtists.includes(artist.name);
                  return (
                    <button
                      key={artist.name}
                      className={`login-page__artist-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleArtist(artist.name)}
                    >
                      <div className="login-page__artist-img-wrap">
                        <img
                          className="login-page__artist-img"
                          src={artist.image}
                          alt={artist.name}
                          loading="lazy"
                          onError={(e) => { e.target.src = '/logo.png'; }}
                        />
                        {isSelected && (
                          <div className="login-page__artist-check-overlay">
                            <IoCheckmarkCircle size={28} />
                          </div>
                        )}
                      </div>
                      <span className="login-page__artist-name">{artist.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Moods */}
              <h3 className="login-page__pref-mood-title">
                What's your vibe?
              </h3>
              <div className="login-page__mood-grid">
                {lang.moods.map(mood => {
                  const isSelected = selectedMoods.includes(mood.query);
                  return (
                    <button
                      key={mood.query}
                      className={`login-page__mood-chip ${isSelected ? 'selected' : ''}`}
                      style={{ '--lang-color': lang.color }}
                      onClick={() => toggleMood(mood.query)}
                    >
                      <span className="login-page__mood-emoji">{mood.emoji}</span>
                      <span>{mood.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            className="login-page__finish-btn"
            onClick={finishOnboarding}
          >
            <IoSparkles />
            Start Listening
          </button>
        </div>
      )}
    </div>
  );
}
