const express = require('express');
const router = express.Router();
const chatController = require('./controller/chat.controller');

// POST /api/v1/chat or POST /api/ai/chat
router.post('/chat', chatController.handleChat);
router.post('/', chatController.handleChat);

module.exports = router;
