const socket = io();
let uid, uname;

// тема
const toggle = document.getElementById('theme-toggle');
toggle.onclick = () => { document.body.classList.toggle('dark'); toggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙'; };

// auth
firebase.auth().onAuthStateChanged(user => {
  if (user) { uid = user.uid; uname = user.displayName || 'User'; document.getElementById('login-btn').textContent = 'Выйти'; }
});
document.getElementById('login-btn').onclick = () => {
  if (uid) firebase.auth().signOut(); else {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
  }
};

// сообщения
const messages = document.getElementById('messages');
const form = document.getElementById('chat-form');
const input = document.getElementById('input');

form.addEventListener('submit', e => {
  e.preventDefault();
  if (!input.value.trim() || !uid) return;
  socket.emit('send-message', { uid, name: uname, text: input.value.trim(), ts: Date.now() });
  input.value = '';
});

socket.on('receive-message', msg => {
  const div = document.createElement('div'); div.className = 'message';
  div.innerHTML = `<span class="user">${msg.name}:</span> ${escape(msg.text)}`;
  messages.appendChild(div); messages.scrollTop = messages.scrollHeight;
});

// реакции
function escape(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

// голосовые
let recorder, chunks = [];
document.getElementById('record-btn').onclick = async () => {
  if (!uid) return alert('Войдите');
  if (!recorder) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const ref = firebase.storage().ref(`voice/${uid}/${Date.now()}.webm`);
      await ref.put(blob);
      const url = await ref.getDownloadURL();
      socket.emit('send-message', { uid, name: uname, text: `<a href="${url}" target="_blank">🎤 голосовое</a>`, ts: Date.now() });
      chunks = [];
    };
    recorder.start(); document.getElementById('record-btn').style.background = 'red';
  } else { recorder.stop(); recorder.stream.getTracks().forEach(t => t.stop()); recorder = null; document.getElementById('record-btn').style.background = ''; }
};