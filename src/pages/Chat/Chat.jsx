import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { 
  IoArrowBack, 
  IoSend, 
  IoImage, 
  IoMusicalNote, 
  IoCall, 
  IoVideocam, 
  IoInformationCircleOutline,
  IoHappyOutline,
  IoMicOutline
} from 'react-icons/io5';
import './Chat.css';

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = usePlayer();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [targetUser, setTargetUser] = useState(null);
  const messagesEndRef = useRef(null);

  const chatId = userProfile && id 
    ? [userProfile.uid, id].sort().join('_') 
    : null;

  useEffect(() => {
    async function fetchTargetUser() {
      if (!id) return;
      const snap = await getDoc(doc(db, 'users', id));
      if (snap.exists()) setTargetUser(snap.data());
    }
    fetchTargetUser();
  }, [id]);

  useEffect(() => {
    if (!chatId || !userProfile) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach(doc => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [chatId, userProfile]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !userProfile || !chatId) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        text: msgText,
        senderId: userProfile.uid,
        createdAt: serverTimestamp(),
      });
      
      // Update chat meta
      await setDoc(doc(db, 'chats', chatId), {
        participants: [userProfile.uid, id],
        lastMessage: msgText,
        lastMessageAt: serverTimestamp(),
        lastSenderId: userProfile.uid
      }, { merge: true });

    } catch (err) {
      console.error("Error sending message", err);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-header-insta">
        <div className="header-left" onClick={() => navigate(-1)}>
          <IoArrowBack />
          {targetUser && (
            <div className="target-profile">
              <img src={targetUser.avatar} alt="" />
              <div className="target-text">
                <span className="target-name">{targetUser.name}</span>
                <span className="target-status">Active now</span>
              </div>
            </div>
          )}
        </div>
        <div className="header-right">
          <IoCall />
          <IoVideocam />
          <IoInformationCircleOutline />
        </div>
      </div>

      <div className="chat-messages-insta">
        <div className="chat-target-meta">
          <img src={targetUser?.avatar} alt="" />
          <h3>{targetUser?.name}</h3>
          <p>BeatBox User • {targetUser?.email}</p>
          <button onClick={() => navigate(`/user/${id}`)}>View Profile</button>
        </div>

        {messages.map((msg, idx) => {
          const isMe = msg.senderId === userProfile?.uid;
          return (
            <div key={msg.id || idx} className={`msg-row ${isMe ? 'me' : 'them'}`}>
              {!isMe && <img src={targetUser?.avatar} className="msg-avatar" alt="" />}
              <div className="msg-bubble">
                <p>{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-insta">
        <div className="input-wrapper">
          <button className="input-icon-btn"><IoHappyOutline /></button>
          <input 
            type="text" 
            placeholder="Message..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          {newMessage.trim() ? (
            <button className="send-text-btn" onClick={handleSend}>Send</button>
          ) : (
            <div className="input-actions">
              <IoMicOutline />
              <IoImage />
              <IoMusicalNote />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

