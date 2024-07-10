const { MessageModel, ConversationModel } = require('../models/ConversationModel.js');

const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await ConversationModel.findById(conversationId)
            .populate('messages')
            .populate('sender')
            .populate('receiver');

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        res.status(200).json({ messages: conversation.messages });

    } catch (error) {
        console.error('Error retrieving messages:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
module.exports = getMessages