import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { IoAdd } from 'react-icons/io5';
import { usePlayer } from '../../context/PlayerContext';
import './Stories.css';

export default function Stories() {
  const { userProfile } = usePlayer();
  const [stories, setStories] = useState([]);
  const [activeStory, setActiveStory] = useState(null);

  useEffect(() => {
    // Fetch stories that haven't expired
    const q = query(
      collection(db, 'stories'),
      where('expiresAt', '>', new Date()),
      orderBy('expiresAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const storyList = [];
      const userStories = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!userStories[data.userId]) {
          userStories[data.userId] = {
            userId: data.userId,
            userName: data.userName,
            userAvatar: data.userAvatar,
            clips: []
          };
        }
        userStories[data.userId].clips.push({ id: doc.id, ...data });
      });

      setStories(Object.values(userStories));
    });

    return () => unsubscribe();
  }, []);

  const handleOpenStory = (storyGroup) => {
    setActiveStory(storyGroup);
    // Logic to open full-screen story viewer
  };

  return (
    <div className="stories-container">
      <div className="stories-scroll">
        {/* My Story Add */}
        <div className="story-item my-story">
          <div className="avatar-wrapper">
            <img src={userProfile?.avatar || 'https://i.pravatar.cc/150?u=me'} alt="My Story" />
            <div className="add-icon"><IoAdd /></div>
          </div>
          <span>Your story</span>
        </div>

        {/* User Stories */}
        {stories.map((group) => (
          <div key={group.userId} className="story-item" onClick={() => handleOpenStory(group)}>
            <div className="avatar-wrapper has-story">
              <img src={group.userAvatar} alt={group.userName} />
            </div>
            <span>{group.userName.split(' ')[0]}</span>
          </div>
        ))}
      </div>

      {activeStory && (
        <div className="story-viewer-overlay" onClick={() => setActiveStory(null)}>
          <div className="story-viewer-content" onClick={e => e.stopPropagation()}>
            <div className="story-progress-bar">
              {activeStory.clips.map((_, i) => <div key={i} className="progress-segment active"></div>)}
            </div>
            <div className="story-header">
              <img src={activeStory.userAvatar} alt="" />
              <span>{activeStory.userName}</span>
            </div>
            <div className="story-video">
               <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeStory.clips[0].clipId}?autoplay=1&controls=0&modestbranding=1&showinfo=0&rel=0`}
                title="Story"
                allow="autoplay; encrypted-media"
                frameBorder="0"
              />
            </div>
            <div className="story-footer">
              <span className="song-info">🎵 {activeStory.clips[0].songName}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
