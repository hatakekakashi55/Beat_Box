import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { 
  IoArrowBack, 
  IoChatbubbleEllipses, 
  IoPersonAdd, 
  IoCheckmark, 
  IoCamera,
  IoGrid,
  IoHeart,
  IoSettingsOutline,
  IoMusicalNote
} from 'react-icons/io5';
import Loader from '../../components/Loader/Loader';
import { decodeHTML, getHighQualityImage } from '../../utils/helpers';
import './UserProfile.css';

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile, likedSongs, playSong } = usePlayer();
  
  const [targetUser, setTargetUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchUser() {
      if (!id) return;
      try {
        const docRef = doc(db, 'users', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setTargetUser(data);
          if (data.followers && userProfile && data.followers.includes(userProfile.uid)) {
            setIsFollowing(true);
          }
        }
      } catch (e) {
        console.error("Error fetching user", e);
      }
      setLoading(false);
    }
    fetchUser();
  }, [id, userProfile]);

  const handleFollow = async () => {
    if (!userProfile) return alert("Please log in to follow users.");
    const targetUserRef = doc(db, 'users', id);
    const currentUserRef = doc(db, 'users', userProfile.uid);
    try {
      if (isFollowing) {
        await updateDoc(targetUserRef, { followers: arrayRemove(userProfile.uid) });
        await updateDoc(currentUserRef, { following: arrayRemove(id) });
        setIsFollowing(false);
      } else {
        await updateDoc(targetUserRef, { followers: arrayUnion(userProfile.uid) });
        await updateDoc(currentUserRef, { following: arrayUnion(id) });
        setIsFollowing(true);
      }
    } catch (e) {
      console.error("Error toggling follow", e);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // In a real app, you'd upload to Firebase Storage. 
    // For now, we'll use a FileReader to show it locally and you can save the URL.
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      const userRef = doc(db, 'users', userProfile.uid);
      try {
        await updateDoc(userRef, { avatar: base64 });
        setTargetUser(prev => ({ ...prev, avatar: base64 }));
        alert("Profile picture updated!");
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <Loader />;
  if (!targetUser) return <div className="user-profile-error">User not found</div>;

  const isSelf = userProfile?.uid === id;

  return (
    <div className="user-profile-page">
      <div className="user-profile-top-nav">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <IoArrowBack />
        </button>
        <span className="nav-username">{targetUser.name}</span>
        {isSelf ? (
          <button className="icon-btn">
            <IoSettingsOutline />
          </button>
        ) : (
          <div style={{ width: 40 }} />
        )}
      </div>
      
      <div className="user-profile-header-main">
        <div className="avatar-wrapper">
          <img src={targetUser.avatar} alt={targetUser.name} className="main-avatar" />
          {isSelf && (
            <button className="change-avatar-btn" onClick={() => fileInputRef.current?.click()}>
              <IoCamera />
            </button>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="image/*"
            onChange={handleAvatarChange}
          />
        </div>

        <div className="stats-row">
          <div className="stat-item">
            <span className="count">{isSelf ? likedSongs.length : (targetUser.likedCount || 0)}</span>
            <span className="label">Songs</span>
          </div>
          <div className="stat-item">
            <span className="count">{targetUser.followers?.length || 0}</span>
            <span className="label">Followers</span>
          </div>
          <div className="stat-item">
            <span className="count">{targetUser.following?.length || 0}</span>
            <span className="label">Following</span>
          </div>
        </div>
      </div>

      <div className="user-bio-section">
        <h3 className="full-name">{targetUser.name}</h3>
        <p className="bio">Music Lover • BeatBox User</p>
        <p className="email-small">{targetUser.email}</p>
      </div>

      <div className="profile-actions-insta">
        {isSelf ? (
          <>
            <button className="edit-profile-btn">Edit Profile</button>
            <button className="share-profile-btn">Share Profile</button>
          </>
        ) : (
          <>
            <button 
              className={`follow-btn-insta ${isFollowing ? 'following' : ''}`}
              onClick={handleFollow}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <button className="msg-btn-insta" onClick={() => navigate(`/chat/${id}`)}>Message</button>
          </>
        )}
      </div>

      <div className="profile-tabs">
        <div className="tab active">
          <IoGrid />
        </div>
        <div className="tab">
          <IoHeart />
        </div>
        <div className="tab">
          <IoMusicalNote />
        </div>
      </div>

      <div className="songs-grid">
        {(isSelf ? likedSongs : []).map((song, idx) => (
          <div key={song.id || idx} className="grid-item" onClick={() => playSong(song)}>
            <img src={getHighQualityImage(song.image)} alt="" />
            <div className="grid-overlay">
              <IoMusicalNote />
            </div>
          </div>
        ))}
        {(!isSelf || likedSongs.length === 0) && (
          <div className="empty-grid">
            <p>No songs added yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

