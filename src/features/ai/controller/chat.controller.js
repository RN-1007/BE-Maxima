const chatService = require('../service/chat.service');

/**
 * Handle AI chatbot conversation with DB context (Maxist Assistant)
 * Endpoint: POST /api/v1/chat or POST /api/ai/chat
 */
const handleChat = async (req, res) => {
  try {
    const { message, db_context, treeId, tree_id, image_url, history } = req.body;

    const result = await chatService.chatWithAssistant({
      message,
      db_context,
      treeId: treeId || tree_id,
      image_url,
      history,
    });

    return res.status(200).json({
      status: 'success',
      data: {
        reply: result.reply,
      },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const statusType = error.statusType || (statusCode >= 500 ? 'error' : 'fail');

    return res.status(statusCode).json({
      status: statusType,
      message: error.message,
    });
  }
};

module.exports = {
  handleChat,
};
