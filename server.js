require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const http = require('http');
const chatFunctions = require('./chatfunctions');
const nodemailer = require('nodemailer');
const Admin = require('./models/Admin');
const User = require('./models/User');
const Message = require('./models/Message');
const WebSocket = require('ws');
const { exec, spawn } = require('child_process');
const sessionSchema = require('./models/Session');

const app = express();
const server = http.createServer(app);
const serverless = require('serverless-http');

module.exports = app;

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://saisrikumar940:S%40isrikumar123@cluster0.40ghmo4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const pages = ['home', 'team', 'chat', 'login', 'signup', 'contact', 'about', 'forgot-password'];
pages.forEach(page => {
  app.get(`/${page === 'home' ? '' : page}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', `${page === 'forgot-password' ? 'forgot_password' : page}.html`));
  });
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'contact.html'));
});

app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      registeredDate: new Date(),
      lastLoginDate: new Date(),
      loginCount: 1
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({ message: 'User created successfully', token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    user.lastLoginDate = new Date();
    user.loginCount += 1;
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

app.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ message: 'Admin login successful', token });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Error logging in as admin' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));

const wss = new WebSocket.Server({ server });

chatFunctions.initializeWebSocket(wss);

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

function openApplication(appName) {
    return new Promise((resolve, reject) => {
        let childProcess;
        switch (process.platform) {
            case 'darwin':
                childProcess = spawn('open', ['-a', appName]);
                break;
            case 'win32':
                childProcess = spawn('cmd.exe', ['/c', 'start', '', appName]);
                break;
            case 'linux':
                childProcess = spawn('xdg-open', [appName]);
                break;
            default:
                reject(new Error('Unsupported platform'));
                return;
        }

        childProcess.on('error', (error) => {
            console.error(`Error opening application: ${error}`);
            reject(error);
        });

        childProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`Application opened successfully: ${appName}`);
                resolve(`Opened ${appName}`);
            } else {
                console.error(`Application exited with code ${code}`);
                reject(new Error(`Failed to open ${appName}`));
            }
        });

        // Set a timeout
        const timeout = setTimeout(() => {
            childProcess.kill();
            reject(new Error('Application launch timeout'));
        }, 10000);

        childProcess.on('exit', () => {
            clearTimeout(timeout);
        });
    });
}

async function getUserCollection(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const collectionName = `user_${user.username.replace(/\s+/g, '_').toLowerCase()}`;
    
    if (mongoose.connection.models[collectionName]) {
      return mongoose.connection.models[collectionName];
    }

    const SessionModel = mongoose.model(collectionName, sessionSchema);
    console.log(`Created new collection for user ${user.username}`);
    return SessionModel;
  } catch (error) {
    console.error(`Error creating collection for user ${userId}:`, error);
    throw error;
  }
}

wss.on('connection', (ws) => {
  let userId = null;
  let sessionId = null;

  ws.on('message', async (message) => {
    const data = JSON.parse(message);

    if (data.type === 'auth') {
      userId = verifyToken(data.token);
      if (!userId) {
        ws.send(JSON.stringify({ type: 'error', content: 'Authentication failed' }));
      } else {
        try {
          const UserSessionModel = await getUserCollection(userId);
          const session = new UserSessionModel();
          await session.save();
          sessionId = session._id;
          console.log("Authentication successful");
        } catch (error) {
          console.error('Error creating session:', error);
          ws.send(JSON.stringify({ type: 'error', content: 'Error creating session' }));
        }
      }
    } else if (data.type === 'message') {
      if (!userId || !sessionId) {
        ws.send(JSON.stringify({ type: 'error', content: 'Not authenticated' }));
        return;
      }
      try {
        const UserSessionModel = await getUserCollection(userId);
        const updatedSession = await UserSessionModel.findByIdAndUpdate(
          sessionId,
          {
            $push: { messages: { content: data.content, sender: 'user' } },
            lastActive: new Date(),
            $setOnInsert: { name: data.content.substring(0, 30) } // Set name if it doesn't exist
          },
          { new: true, upsert: true }
        );

        const aiResponse = await chatFunctions.handleAIChat(data.content);
        
        await UserSessionModel.findByIdAndUpdate(sessionId, {
          $push: { messages: { content: aiResponse, sender: 'bot' } },
          lastActive: new Date()
        });

        ws.send(JSON.stringify({ 
          type: 'message', 
          content: aiResponse, 
          sessionId: sessionId,
          sessionName: updatedSession.name
        }));
      } catch (error) {
        ws.send(JSON.stringify({ type: 'error', content: error.message }));
      }
    } else if (data.type === 'open') {
      if (!userId) {
        ws.send(JSON.stringify({ type: 'error', content: 'Not authenticated' }));
        return;
      }
      try {
        const result = await openApplication(data.content);
        ws.send(JSON.stringify({ type: 'message', content: result }));
      } catch (error) {
        console.error('Error opening application:', error);
        ws.send(JSON.stringify({ type: 'error', content: `Unable to open ${data.content}: ${error.message}` }));
      }
    } else if (data.type === 'new_session') {
      if (!userId) {
        ws.send(JSON.stringify({ type: 'error', content: 'Not authenticated' }));
        return;
      }
      try {
        const UserSessionModel = await getUserCollection(userId);
        const session = new UserSessionModel({ name: 'New Chat' });
        await session.save();
        sessionId = session._id;
        ws.send(JSON.stringify({ type: 'new_session', sessionId: sessionId, sessionName: session.name }));
      } catch (error) {
        console.error('Error creating new session:', error);
        ws.send(JSON.stringify({ type: 'error', content: 'Failed to create new session' }));
      }
    } else if (data.type === 'load_session') {
      if (!userId) {
        ws.send(JSON.stringify({ type: 'error', content: 'Not authenticated' }));
        return;
      }
      try {
        const UserSessionModel = await getUserCollection(userId);
        const session = await UserSessionModel.findById(data.sessionId);
        if (session) {
          sessionId = session._id;
          ws.send(JSON.stringify({ type: 'load_session', session: session }));
        } else {
          ws.send(JSON.stringify({ type: 'error', content: 'Session not found' }));
        }
      } catch (error) {
        ws.send(JSON.stringify({ type: 'error', content: 'Failed to load session' }));
      }
    }
  });
});

app.post('/ai-chat', chatFunctions.authenticateToken, chatFunctions.aiChatRoute);

app.post('/send-contact-email', async (req, res) => {
  try {
    const { firstName, lastName, email, message } = req.body;
    console.log('Received contact form submission:', { firstName, lastName, email, message });

    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newMessage = new Message({
      firstName,
      lastName,
      email,
      message
    });

    await newMessage.save();

    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log('SMTP Configuration:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
    });

    let info = await transporter.sendMail({
      from: `"Chicha Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.YOUR_EMAIL,
      subject: "New Contact Form Submission",
      text: `
        Name: ${firstName} ${lastName}
        Email: ${email}
        Message: ${message}
      `,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    console.log("Message sent: %s", info.messageId);
    res.status(200).json({ message: 'Email sent and message saved successfully' });
  } catch (error) {
    console.error('Detailed error sending email or saving message:', error);
  }
});

app.get('/api/user', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ username: user.username });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.sendStatus(403);
  }
});

app.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'admin.html'));
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username email registeredDate lastLoginDate loginCount');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

app.get('/api/admin/statistics', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalConversations = await getTotalConversations();
    const avgResponseTime = await getAverageResponseTime();
    const userSatisfaction = await getUserSatisfactionRate();

    res.json({
      totalUsers,
      totalConversations,
      avgResponseTime,
      userSatisfaction
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bot statistics' });
  }
});

app.get('/api/admin/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'admin-login.html'));
});

app.post('/admin-signup', async (req, res) => {
  try {
    const { username, email, password, adminCode } = req.body;

    if (adminCode !== process.env.ADMIN_REGISTRATION_CODE) {
      return res.status(400).json({ message: 'Invalid admin registration code' });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      username,
      email,
      password: hashedPassword
    });

    await admin.save();

    res.status(201).json({ message: 'Admin account created successfully' });
  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({ message: 'Error creating admin account' });
  }
});

app.get('/admin-signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'admin-signup.html'));
});

app.get('/api/admin/info', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.adminId);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({ username: admin.username });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.sendStatus(403);
  }
});

app.delete('/api/admin/users/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await User.findByIdAndDelete(userId);
    if (result) {
      res.json({ success: true, message: 'User removed successfully' });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error removing user:', error);
    res.status(500).json({ success: false, message: 'Error removing user' });
  }
});

app.get('/api/admin/analytics/new-users', async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers = await User.aggregate([
      { $match: { registeredDate: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$registeredDate" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const labels = newUsers.map(item => item._id);
    const values = newUsers.map(item => item.count);

    res.json({ labels, values });
  } catch (error) {
    console.error('Error fetching new users data:', error);
    res.status(500).json({ message: 'Error fetching new users data' });
  }
});

app.get('/api/admin/analytics/user-actions', async (req, res) => {
  try {
    const userActions = [
      { action: 'Login', count: 100 },
      { action: 'Message Sent', count: 75 },
      { action: 'Profile Update', count: 50 },
      { action: 'Password Reset', count: 25 }
    ];

    const labels = userActions.map(item => item.action);
    const values = userActions.map(item => item.count);

    res.json({ labels, values });
  } catch (error) {
    console.error('Error fetching user actions data:', error);
    res.status(500).json({ message: 'Error fetching user actions data' });
  }
});

app.get('/api/admin/analytics/messages', async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const messages = await Message.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const labels = messages.map(item => item._id);
    const values = messages.map(item => item.count);

    res.json({ labels, values });
  } catch (error) {
    console.error('Error fetching messages data:', error);
    res.status(500).json({ message: 'Error fetching messages data' });
  }
});

app.get('/api/user/sessions', chatFunctions.authenticateToken, async (req, res) => {
  try {
    const UserSessionModel = await getUserCollection(req.user.userId);
    const sessions = await UserSessionModel.find().sort({ lastActive: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sessions' });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
