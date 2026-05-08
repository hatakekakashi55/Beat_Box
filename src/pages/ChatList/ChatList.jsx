import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  IoArrowBack, 
  IoCreateOutline, 
  IoChevronDown, 
  IoSearch,
  IoCameraOutline
} from 'react-icons/io5';
import './ChatList.css';

export default function ChatList() {
  const navigate = useNavigate();
  const { userProfile } = usePlayer();
  const [activeTab, setActiveTab] = useState('Primary');
  const [chats, setChats] = useState([]);
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [myNote, setMyNote] = useState('');

  // Fetch Chats
  useEffect(() => {
    if (!userProfile) return;

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef, 
      where('participants', 'array_contains', userProfile.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatList = [];
      for (const d of snapshot.docs) {
        const data = d.data();
        const otherId = data.participants.find(id => id !== userProfile.uid);
        
        // Fetch other user info
        const userSnap = await getDoc(doc(db, 'users', otherId));
        const userData = userSnap.exists() ? userSnap.data() : { name: 'Unknown', avatar: '' };

        chatList.push({
          id: d.id,
          otherId,
          ...data,
          otherUser: userData
        });
      }
      setChats(chatList);
    });

    return () => unsubscribe();
  }, [userProfile]);

  // Fetch Notes
  useEffect(() => {
    // In a real app, you'd fetch from a 'notes' collection. 
    // For now, let's mock some for the UI and allow saving yours.
    setNotes([
      { id: '1', name: 'Keerthan', avatar: 'https://i.pravatar.cc/150?u=1', note: 'Sidu Sidu 😫🪄' },
      { id: '2', name: 'elsa 🧚‍♀️', avatar: 'https://i.pravatar.cc/150?u=2', note: 'En Rant Ah... vaisaqh' },
      { id: '3', name: 'Nagajothi', avatar: 'https://i.pravatar.cc/150?u=3', note: 'Ei Suzhal... 🌻' },
    ]);
  }, []);

  const handlePostNote = async () => {
    if (!myNote.trim()) return;
    // Logic to save note to Firestore
    alert("Note posted: " + myNote);
    setShowNoteInput(false);
    setMyNote('');
  };

  return (
    <div className="chat-list-page">
      <div className="chat-list-header">
        <div className="header-left" onClick={() => navigate(-1)}>
          <IoArrowBack />
          <span className="username">{userProfile?.name || 'User'} <IoChevronDown /></span>
        </div>
        <div className="header-right">
          <IoCreateOutline className="edit-icon" />
        </div>
      </div>

      <div className="chat-tabs">
        <button 
          className={activeTab === 'Primary' ? 'active' : ''} 
          onClick={() => setActiveTab('Primary')}
        >
          Primary
        </button>
        <button 
          className={activeTab === 'General' ? 'active' : ''} 
          onClick={() => setActiveTab('General')}
        >
          General
        </button>
        <button 
          className={activeTab === 'Requests' ? 'active' : ''} 
          onClick={() => setActiveTab('Requests')}
        >
          Requests
        </button>
      </div>

      <div className="chat-search-bar">
        <IoSearch className="search-icon" />
        <input 
          type="text" 
          placeholder="Search" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="notes-container">
        <div className="notes-scroll">
          <div className="note-item my-note" onClick={() => setShowNoteInput(true)}>
            <div className="avatar-wrapper">
              <img src={userProfile?.avatar || 'https://i.pravatar.cc/150?u=me'} alt="" />
              <div className="note-bubble">Share your thoughts...</div>
            </div>
            <span className="note-name">Your note</span>
          </div>
          
          {notes.map(note => (
            <div key={note.id} className="note-item">
              <div className="avatar-wrapper">
                <img src={note.avatar} alt="" />
                <div className="note-bubble">{note.note}</div>
              </div>
              <span className="note-name">{note.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="chats-container">
        {chats.length > 0 ? chats.map(chat => (
          <div 
            key={chat.id} 
            className="chat-row" 
            onClick={() => navigate(`/chat/${chat.otherId}`)}
          >
            <img src={chat.otherUser.avatar} alt="" className="chat-avatar" />
            <div className="chat-info">
              <span className="chat-name">{chat.otherUser.name}</span>
              <p className={`chat-last-msg ${chat.unread ? 'unread' : ''}`}>
                {chat.lastMessage || 'Start a conversation'} • {chat.lastMessageTime || 'now'}
              </p>
            </div>
            {chat.unread && <div className="unread-dot"></div>}
            <IoCameraOutline className="camera-icon" />
          </div>
        )) : (
          <div className="empty-chats">
            <p>No messages yet.</p>
            <button className="start-chat-btn" onClick={() => navigate('/search')}>Find people to follow</button>
          </div>
        )}
      </div>

      {showNoteInput && (
        <div className="note-input-modal" onClick={() => setShowNoteInput(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>New Note</h3>
            <textarea 
              placeholder="What's on your mind?" 
              maxLength={60}
              value={myNote}
              onChange={e => setMyNote(e.target.value)}
            />
            <div className="modal-actions">
              <button onClick={() => setShowNoteInput(false)}>Cancel</button>
              <button className="post-btn" onClick={handlePostNote}>Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
