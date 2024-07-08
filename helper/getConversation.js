const { ConversationModel } = require("../models/ConversationModel.js");

const getConversation = async (currentUserId) => {
    if (!currentUserId) return [];

    try {
        // Fetch conversations where currentUserId is either sender or receiver
        const currentUserConversation = await ConversationModel.find({
            "$or": [
                { sender: currentUserId },
                { receiver: currentUserId }
            ]
        })
            .sort({ updatedAt: -1 })
            .populate('messages')
            .populate('sender') // Assuming these fields are ObjectIds that reference UserModel
            .populate('receiver');

        // Process conversations
        const conversation = currentUserConversation.map((conv) => {
            // Handle cases where messages might be empty
            const lastMsg = conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null;

            // Count unseen messages
            const countUnseenMsg = conv.messages.reduce((prev, curr) => {
                if (curr.msgByUserId.toString() !== currentUserId) {
                    return prev + (curr.seen ? 0 : 1);
                }
                return prev;
            }, 0);

            return {
                _id: conv._id,
                sender: conv.sender,
                receiver: conv.receiver,
                unseenMsg: countUnseenMsg,
                lastMsg: lastMsg
            };
        });

        return conversation;
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return [];
    }
};

module.exports = getConversation;
