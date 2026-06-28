import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);

// Socket.io 서버 설정
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 접속한 사용자 목록
const users = new Map();

// 연결 처리
io.on('connection', (socket) => {
  console.log(`✅ 새 사용자 접속: ${socket.id}`);
  
  // 사용자 입장
  socket.on('join', (userName) => {
    users.set(socket.id, userName);
    console.log(`👤 ${userName} 입장 (전체 ${users.size}명)`);
    
    io.emit('user-joined', {
      userName,
      message: `${userName}님이 입장했습니다`,
      userCount: users.size,
      timestamp: Date.now()
    });
  });
  
  // 메시지 받기
  socket.on('chat-message', (data) => {
    const userName = users.get(socket.id) || '익명';
    console.log(`💬 ${userName}: ${data.text}`);
    
    io.emit('new-message', {
      userName,
      text: data.text,
      timestamp: Date.now(),
      socketId: socket.id
    });
  });
  
  // 타이핑 표시
  socket.on('typing', (isTyping) => {
    const userName = users.get(socket.id);
    socket.broadcast.emit('user-typing', {
      userName,
      isTyping
    });
  });
  
  // 연결 해제
  socket.on('disconnect', () => {
    const userName = users.get(socket.id);
    users.delete(socket.id);
    console.log(`❌ ${userName} 퇴장 (전체 ${users.size}명)`);
    
    if (userName) {
      io.emit('user-left', {
        userName,
        message: `${userName}님이 퇴장했습니다`,
        userCount: users.size,
        timestamp: Date.now()
      });
    }
  });
});

// 서버 상태 확인용
app.get('/', (req, res) => {
  res.send(`
    <h1>🚀 Socket.io 서버 작동 중!</h1>
    <p>접속자 수: ${users.size}명</p>
  `);
});

// 서버 시작
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 서버가 시작되었습니다!`);
  console.log(`📡 포트: ${PORT}`);
  console.log(`🌐 로컬: http://localhost:${PORT}\n`);
});