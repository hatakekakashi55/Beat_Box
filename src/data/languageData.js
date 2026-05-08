/**
 * Language & Preference data for onboarding
 * Artist images from JioSaavn search results (loaded dynamically)
 */

export const LANGUAGES = [
  {
    id: 'tamil',
    name: 'Tamil',
    nameLocal: 'தமிழ்',
    color: '#e91e63',
    gradient: 'linear-gradient(135deg, #e91e63, #9c27b0)',
    artists: [
      { name: 'Anirudh Ravichander', query: 'anirudh ravichander', image: 'https://c.saavncdn.com/artists/Anirudh_Ravichander_004_20231120090755_500x500.jpg' },
      { name: 'A.R. Rahman', query: 'ar rahman', image: 'https://c.saavncdn.com/artists/AR_Rahman_500x500.jpg' },
      { name: 'Yuvan Shankar Raja', query: 'yuvan shankar raja', image: 'https://c.saavncdn.com/artists/Yuvan_Shankar_Raja_500x500.jpg' },
    ],
    moods: [
      { name: 'Romantic', emoji: '❤️', query: 'tamil romantic' },
      { name: 'Party', emoji: '🎉', query: 'tamil kuthu party' },
      { name: 'Melody', emoji: '🎵', query: 'tamil melody' },
    ],
  },
  {
    id: 'hindi',
    name: 'Hindi',
    nameLocal: 'हिन्दी',
    color: '#ff9800',
    gradient: 'linear-gradient(135deg, #ff9800, #f44336)',
    artists: [
      { name: 'Arijit Singh', query: 'arijit singh', image: 'https://c.saavncdn.com/artists/Arijit_Singh_500x500.jpg' },
      { name: 'Shreya Ghoshal', query: 'shreya ghoshal', image: 'https://c.saavncdn.com/artists/Shreya_Ghoshal_006_20200710082615_500x500.jpg' },
      { name: 'Pritam', query: 'pritam', image: 'https://c.saavncdn.com/artists/Pritam_Chakraborty_500x500.jpg' },
    ],
    moods: [
      { name: 'Romantic', emoji: '💕', query: 'hindi romantic' },
      { name: 'Party', emoji: '🎊', query: 'bollywood party' },
      { name: 'Chill', emoji: '🌊', query: 'hindi lofi chill' },
    ],
  },
  {
    id: 'telugu',
    name: 'Telugu',
    nameLocal: 'తెలుగు',
    color: '#4caf50',
    gradient: 'linear-gradient(135deg, #4caf50, #2e7d32)',
    artists: [
      { name: 'S. Thaman', query: 'thaman s', image: 'https://c.saavncdn.com/artists/S._Thaman_500x500.jpg' },
      { name: 'Devi Sri Prasad', query: 'devi sri prasad', image: 'https://c.saavncdn.com/artists/Devi_Sri_Prasad_500x500.jpg' },
      { name: 'Sid Sriram', query: 'sid sriram telugu', image: 'https://c.saavncdn.com/artists/Sid_Sriram_000_20231120090827_500x500.jpg' },
    ],
    moods: [
      { name: 'Mass', emoji: '🔥', query: 'telugu mass' },
      { name: 'Melody', emoji: '🎶', query: 'telugu melody' },
      { name: 'Dance', emoji: '💃', query: 'telugu dance' },
    ],
  },
  {
    id: 'malayalam',
    name: 'Malayalam',
    nameLocal: 'മലയാളം',
    color: '#00bcd4',
    gradient: 'linear-gradient(135deg, #00bcd4, #006064)',
    artists: [
      { name: 'Sushin Shyam', query: 'sushin shyam', image: 'https://c.saavncdn.com/artists/Sushin_Shyam_000_20230428072337_500x500.jpg' },
      { name: 'Vineeth Sreenivasan', query: 'vineeth sreenivasan', image: 'https://c.saavncdn.com/artists/Vineeth_Sreenivasan_500x500.jpg' },
      { name: 'KS Harisankar', query: 'ks harisankar', image: 'https://c.saavncdn.com/artists/K_S_Harisankar_500x500.jpg' },
    ],
    moods: [
      { name: 'Romantic', emoji: '🌹', query: 'malayalam romantic' },
      { name: 'Folk', emoji: '🪘', query: 'malayalam folk' },
      { name: 'Chill', emoji: '☮️', query: 'malayalam chill' },
    ],
  },
  {
    id: 'kannada',
    name: 'Kannada',
    nameLocal: 'ಕನ್ನಡ',
    color: '#ff5722',
    gradient: 'linear-gradient(135deg, #ff5722, #d84315)',
    artists: [
      { name: 'Ravi Basrur', query: 'ravi basrur', image: 'https://c.saavncdn.com/artists/B_Ajaneesh_Loknath_000_20230315124712_500x500.jpg' },
      { name: 'Charan Raj', query: 'charan raj kannada', image: 'https://c.saavncdn.com/artists/Charan_Raj_000_20210729060421_500x500.jpg' },
      { name: 'Vijay Prakash', query: 'vijay prakash', image: 'https://c.saavncdn.com/artists/Vijay_Prakash_500x500.jpg' },
    ],
    moods: [
      { name: 'Mass', emoji: '⚡', query: 'kannada mass' },
      { name: 'Romantic', emoji: '💖', query: 'kannada love' },
      { name: 'Devotional', emoji: '🙏', query: 'kannada devotional' },
    ],
  },
  {
    id: 'punjabi',
    name: 'Punjabi',
    nameLocal: 'ਪੰਜਾਬੀ',
    color: '#ff7043',
    gradient: 'linear-gradient(135deg, #ff7043, #bf360c)',
    artists: [
      { name: 'Diljit Dosanjh', query: 'diljit dosanjh', image: 'https://c.saavncdn.com/artists/Diljit_Dosanjh_500x500.jpg' },
      { name: 'AP Dhillon', query: 'ap dhillon', image: 'https://c.saavncdn.com/artists/AP_Dhillon_000_20211027083aborar_500x500.jpg' },
      { name: 'Sidhu Moose Wala', query: 'sidhu moose wala', image: 'https://c.saavncdn.com/artists/Sidhu_Moose_Wala_000_20210210035943_500x500.jpg' },
    ],
    moods: [
      { name: 'Bhangra', emoji: '🥁', query: 'punjabi bhangra' },
      { name: 'Sad', emoji: '😢', query: 'punjabi sad' },
      { name: 'Party', emoji: '🎉', query: 'punjabi party' },
    ],
  },
  {
    id: 'english',
    name: 'English',
    nameLocal: 'English',
    color: '#7c4dff',
    gradient: 'linear-gradient(135deg, #7c4dff, #304ffe)',
    artists: [
      { name: 'The Weeknd', query: 'the weeknd', image: 'https://c.saavncdn.com/artists/The_Weeknd_500x500.jpg' },
      { name: 'Taylor Swift', query: 'taylor swift', image: 'https://c.saavncdn.com/artists/Taylor_Swift_500x500.jpg' },
      { name: 'Ed Sheeran', query: 'ed sheeran', image: 'https://c.saavncdn.com/artists/Ed_Sheeran_500x500.jpg' },
    ],
    moods: [
      { name: 'Pop', emoji: '🎤', query: 'english pop hits' },
      { name: 'R&B', emoji: '🎷', query: 'rnb songs' },
      { name: 'Rock', emoji: '🎸', query: 'rock classics' },
    ],
  },
];
