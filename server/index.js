require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');

const serviceAccount = require('./firebase-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'galaxychat-445e6.firebasestorage.app'
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.static('public'));

io.on('connection', socket => {
  socket.on('send-message', msg => io.emit('receive-message', msg));
  socket.on('send-reaction', data => io.emit('receive-reaction', data));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server on ${PORT}`));