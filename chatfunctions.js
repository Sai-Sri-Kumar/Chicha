require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const http = require('http');
const WebSocket = require('ws');
const uuid = require('uuid');
const cors = require('cors');
const app = express();
const server = http.createServer(app);

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const connections = new Map();

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

function initializeWebSocket(wss) {
    console.log('WebSocket server initialized');
}

async function handleWebSocketMessage(ws, message, userId) {
    try {
        const data = JSON.parse(message);
        console.log(`Received from ${userId}:`, data);

        switch (data.type) {
            case 'auth':
                await handleAuth(ws, data, userId);
                break;
            case 'message':
                await handleMessage(ws, data, userId);
                break;
            default:
                ws.send(JSON.stringify({ type: 'error', content: 'Unknown message type' }));
        }
    } catch (error) {
        console.error('Error processing message:', error);
        ws.send(JSON.stringify({ type: 'error', content: 'Invalid message format' }));
    }
}

function handleWebSocketClose(userId) {
    console.log(`WebSocket connection closed: ${userId}`);
    for (const [username, conn] of connections.entries()) {
        if (conn.userId === userId) {
            connections.delete(username);
            break;
        }
    }
}

async function handleAuth(ws, data, userId) {
    try {
        const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
        connections.set(decoded.userId, { ws, userId });
        ws.send(JSON.stringify({ type: 'auth', success: true }));
    } catch (error) {
        console.error('Authentication error:', error);
        ws.send(JSON.stringify({ type: 'auth', success: false, error: 'Invalid token' }));
    }
}

async function handleMessage(ws, data, userId) {
    if (connections.has(userId)) {
        try {
            const result = await model.generateContent(data.content);
            const response = { type: 'message', content: result.response.text() };
            ws.send(JSON.stringify(response));
        } catch (error) {
            console.error('Error processing AI response:', error);
            ws.send(JSON.stringify({ type: 'error', content: 'Error processing AI response' }));
        }
    } else {
        ws.send(JSON.stringify({ type: 'error', content: 'Not authenticated' }));
    }
}

async function aiChatRoute(req, res) {
    try {
        const { message } = req.body;
        
        const result = await Promise.race([
            model.generateContent(message),
            new Promise((_, reject) => setTimeout(() => reject(new Error('AI response timeout')), 10000))
        ]);

        res.json({ message: result.response.text() });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error processing AI response' });
    }
}

async function handleAIChat(message) {
    try {
        const result = await model.generateContent(message);
        return result.response.text();
    } catch (error) {
        console.error('Error processing AI response:', error);
        throw new Error('Error processing AI response');
    }
}

module.exports = {
    initializeWebSocket,
    authenticateToken,
    aiChatRoute,
    handleAIChat
};
