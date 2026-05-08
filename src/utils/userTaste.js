/**
 * userTaste.js — Spotify-style Taste Profiling Engine
 *
 * Analyses recentlyPlayed + likedSongs to detect:
 *   - Favourite artists (top-3)
 *   - Favourite mood/genre (kuthu, melody, love, mass, etc.)
 *   - Preferred language (Tamil, Hindi, etc.)
 *   - Activity pattern (time-of-day)
 *
 * Returns a sorted list of "personalised sections" for the Home page.
 */

const TAMIL_MOODS = {
  kuthu:    { keywords: ['kuthu', 'dance', 'party', 'mass', 'item', 'beat', 'peppy'], label: '🎉 Kuthu Hits', query: 'tamil kuthu party songs' },
  melody:   { keywords: ['melody', 'love', 'romance', 'kaadhal', 'soft', 'feel'], label: '💕 Melody Vibes', query: 'tamil melody love songs' },
  sad:      { keywords: ['sad', 'breakup', 'nenjam', 'kathal', 'pain', 'thanimai'], label: '🌧️ Feels Songs', query: 'tamil sad feeling songs' },
  mass:     { keywords: ['mass', 'thala', 'thalapathy', 'vijay', 'ajith', 'vijay'], label: '💥 Mass Songs', query: 'vijay ajith tamil mass songs' },
  devotional:{ keywords: ['god', 'amman', 'muruga', 'devotional', 'bhajan'], label: '🙏 Devotional', query: 'tamil devotional songs' },
};

/**
 * Extract artist names from a song object (handles all API response shapes)
 */
function extractArtists(song) {
  const rawArtists = song.primaryArtists || song.artists?.primary || '';
  if (Array.isArray(rawArtists)) return rawArtists.map(a => (a.name || a).toLowerCase());
  if (typeof rawArtists === 'string') return rawArtists.split(',').map(a => a.trim().toLowerCase()).filter(Boolean);
  return [];
}

/**
 * Score and rank items by frequency
 */
function rankByFrequency(items) {
  const counts = {};
  for (const item of items) {
    counts[item] = (counts[item] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([item]) => item);
}

/**
 * Detect mood from song name / description text
 */
function detectMood(text) {
  const lower = (text || '').toLowerCase();
  for (const [mood, data] of Object.entries(TAMIL_MOODS)) {
    if (data.keywords.some(k => lower.includes(k))) return mood;
  }
  return null;
}

/**
 * Main taste analyser — returns a TasteProfile
 * @param {Array} recentlyPlayed
 * @param {Array} likedSongs
 * @returns TasteProfile
 */
export function buildTasteProfile(recentlyPlayed = [], likedSongs = []) {
  const allSongs = [...likedSongs, ...recentlyPlayed];
  // Deduplicate
  const seen = new Set();
  const songs = allSongs.filter(s => {
    if (!s?.id || seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });

  if (songs.length === 0) return null;

  // --- Artist frequency ---
  const allArtists = songs.flatMap(extractArtists);
  const topArtists = rankByFrequency(allArtists).slice(0, 5);

  // --- Mood frequency ---
  const moods = songs.map(s => detectMood(s.name || s.title || '')).filter(Boolean);
  const topMoods = rankByFrequency(moods).slice(0, 2);

  // --- Language frequency ---
  const languages = songs
    .map(s => (s.language || '').toLowerCase())
    .filter(Boolean);
  const topLanguage = rankByFrequency(languages)[0] || 'tamil';

  return { topArtists, topMoods, topLanguage, totalSongs: songs.length };
}

/**
 * Generate personalised album-search sections from the taste profile.
 * Returns an array of { key, title, query, type } — type is 'album' or 'song'
 *
 * @param {TasteProfile|null} profile
 * @returns Array of section configs
 */
export function getPersonalisedSections(profile) {
  // Always-on base sections using ALBUMS (real Spotify-style)
  const baseSections = [
    { key: 'new_releases_album',  title: '🆕 New Tamil Albums 2025',    query: 'new tamil album 2025',        type: 'album' },
    { key: 'anirudh_albums',      title: '🎵 Anirudh Albums',           query: 'anirudh ravichander album',   type: 'album' },
    { key: 'trending_album',      title: '🔥 Trending Tamil Albums',    query: 'tamil trending album 2025',   type: 'album' },
    { key: 'arrahman_albums',     title: '🎶 A.R. Rahman Albums',       query: 'ar rahman tamil album',       type: 'album' },
    { key: 'yuvan_albums',        title: '🎸 Yuvan Shankar Raja Albums', query: 'yuvan shankar raja album',   type: 'album' },
    { key: 'harris_albums',       title: '🌟 Harris Jayaraj Albums',    query: 'harris jayaraj album',        type: 'album' },
    { key: 'imman_albums',        title: '🎼 D. Imman Albums',          query: 'd imman album',               type: 'album' },
    { key: 'ilaiyaraaja_albums',  title: '👑 Ilaiyaraaja Albums',       query: 'ilaiyaraaja album',           type: 'album' },
    { key: 'gvprakash_albums',    title: '🎵 G.V. Prakash Albums',      query: 'gv prakash kumar album',      type: 'album' },
    { key: 'sidsriram_albums',    title: '🎤 Sid Sriram Albums',        query: 'sid sriram album',            type: 'album' },
  ];

  // Mood/vibe-based song sections
  const moodSections = [
    { key: 'kuthu_songs',   title: '🎉 Kuthu Party Hits',      query: 'tamil kuthu party dance songs', type: 'song' },
    { key: 'melody_songs',  title: '💕 Tamil Melody Love',     query: 'tamil melody love songs',       type: 'song' },
    { key: 'mass_songs',    title: '💥 Mass Beats',            query: 'vijay ajith mass songs tamil',  type: 'song' },
    { key: 'sad_songs',     title: '🌧️ Feels Songs',           query: 'tamil sad feeling songs',       type: 'song' },
    { key: 'romantic',      title: '❤️ Romantic Hits',         query: 'tamil romantic songs 2025',     type: 'song' },
    { key: 'devotional',    title: '🙏 Devotional',            query: 'tamil devotional songs',        type: 'song' },
    { key: 'hiphop',        title: '🎧 Hip Hop Tamizha',       query: 'hip hop tamizha songs',         type: 'song' },
    { key: 'dhanush',       title: '🎬 Dhanush Hits',          query: 'dhanush tamil songs',           type: 'song' },
    { key: 'spb',           title: '🌺 S.P.B Evergreen',       query: 'spb tamil songs',               type: 'song' },
    { key: 'vijay_songs',   title: '🦁 Thalapathy Vijay Hits', query: 'vijay mass songs tamil',        type: 'song' },
  ];

  if (!profile) {
    return [...baseSections, ...moodSections];
  }

  // Personalised: "Made For You" artist albums injected at top
  const personalised = [];

  for (const artist of profile.topArtists.slice(0, 3)) {
    const niceName = artist.split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    personalised.push({
      key: `personal_${artist.replace(/\s/g, '_')}`,
      title: `🎯 More of ${niceName}`,
      query: `${artist} album`,
      type: 'album',
      personalised: true,
    });
  }

  // Personalised mood sections
  for (const mood of profile.topMoods) {
    const data = TAMIL_MOODS[mood];
    if (data) {
      personalised.push({
        key: `personal_mood_${mood}`,
        title: `✨ ${data.label} (For You)`,
        query: data.query,
        type: 'song',
        personalised: true,
      });
    }
  }

  // Time-of-day section
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    personalised.push({ key: 'morning', title: '☀️ Morning Boost', query: 'tamil morning fresh songs', type: 'song' });
  } else if (hour >= 12 && hour < 17) {
    personalised.push({ key: 'afternoon', title: '🌤️ Afternoon Vibes', query: 'tamil peppy afternoon songs', type: 'song' });
  } else {
    personalised.push({ key: 'evening', title: '🌙 Evening Calm', query: 'tamil calm evening melody', type: 'song' });
  }

  return [...personalised, ...baseSections, ...moodSections];
}

/**
 * Filter songs to only include Tamil songs.
 * Removes songs where language is explicitly a non-Tamil Indian language.
 */
const NON_TAMIL_LANGS = new Set([
  'hindi', 'telugu', 'kannada', 'malayalam', 'bengali',
  'marathi', 'punjabi', 'gujarati', 'odia', 'urdu', 'english',
]);

export function filterByLanguage(songs = [], preferredLang = 'tamil') {
  if (!songs || songs.length === 0) return songs;
  if (preferredLang !== 'tamil') return songs;

  const filtered = songs.filter(song => {
    const lang = (song.language || '').toLowerCase();
    if (!lang || lang === 'tamil') return true;
    if (NON_TAMIL_LANGS.has(lang)) return false;
    return true;
  });

  // If filtering removed too many results, return original (query might not support language param)
  return filtered.length >= Math.min(3, Math.ceil(songs.length * 0.3)) ? filtered : songs;
}
