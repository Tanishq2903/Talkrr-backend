const { MessageModel, ConversationModel } = require('../models/ConversationModel.js');

// Handle sending a new message
const sendMessage = async (req, res) => {
    try {
        const { sender, receiver, text, imageUrl, videoUrl } = req.body;

        let conversation = await ConversationModel.findOne({
            "$or": [
                { sender: sender, receiver: receiver },
                { sender: receiver, receiver: sender }
            ]
        });

        if (!conversation) {
            conversation = new ConversationModel({ sender, receiver });
            await conversation.save();
        }

        const message = new MessageModel({ text, imageUrl, videoUrl, msgByUserId: sender });
        const savedMessage = await message.save();

        conversation.messages.push(savedMessage._id);
        await conversation.save();

        res.status(201).json({ message: 'Message sent successfully', savedMessage });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
module.exports = sendMessage


