const express = require('express')
const { Server } = require('socket.io')
const http = require('http')
const getUserDetailsFromToken = require('../helper/getUserDetailsFromToken.js')
const UserModel = require('../models/UserModel.js')
const { ConversationModel, MessageModel } = require('../models/ConversationModel.js')
const getConversation = require('../helper/getConversation.js')

const app = express()

/***socket connection */
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: 'https://talkrr-chatwithyourlovedones.netlify.app',
        methods: ["GET", "POST"],
        credentials: true
    }
})

const onlineUser = new Set()

io.on('connection', async (socket) => {
    console.log("connect User ", socket.id);

    const token = socket.handshake.auth.token;

    //current user details 
    let user;
    try {
        user = await getUserDetailsFromToken(token);
    } catch (error) {
        console.error('Error fetching user details:', error);
        socket.disconnect();
        return;
    }

    if (!user) {
        console.log('User not authenticated');
        socket.disconnect();
        return;
    }

    // Create a room and add user to online set
    const userId = user?._id?.toString();
    if (userId) {
        socket.join(userId);
        onlineUser.add(userId);
        io.emit('onlineUser', Array.from(onlineUser));
    }

    // Handle message-page event
    socket.on('message-page', async (otherUserId) => {
        console.log('message-page event received, otherUserId:', otherUserId);
        try {
            const userDetails = await UserModel.findById(otherUserId).select("-password");
            const payload = {
                _id: userDetails?._id,
                name: userDetails?.name,
                email: userDetails?.email,
                profile_pic: userDetails?.profile_pic,
                online: onlineUser.has(otherUserId)
            };
            console.log('User details payload:', payload);
            socket.emit('message-user', payload);
    
            const getConversationMessage = await ConversationModel.findOne({
                "$or": [
                    { sender: user._id, receiver: otherUserId },
                    { sender: otherUserId, receiver: user._id }
                ]
            }).populate('messages').sort({ updatedAt: -1 });
    
            console.log('Retrieved messages:', getConversationMessage?.messages);
            socket.emit('message', getConversationMessage?.messages || []);
        } catch (error) {
            console.error('Error handling message-page:', error);
        }
    });
    

    // Handle new message
    socket.on('new message', async (data) => {
        try {
            console.log('New message data:', data);
            
            let conversation = await ConversationModel.findOne({
                "$or": [
                    { sender: data?.sender, receiver: data?.receiver },
                    { sender: data?.receiver, receiver: data?.sender }
                ]
            });
    
            if (!conversation) {
                conversation = new ConversationModel({
                    sender: data?.sender,
                    receiver: data?.receiver
                });
                await conversation.save();
                console.log('Created new conversation:', conversation);
            }
    
            const message = new MessageModel({
                text: data.text,
                imageUrl: data.imageUrl,
                videoUrl: data.videoUrl,
                msgByUserId: data?.msgByUserId,
            });
            const savedMessage = await message.save();
            console.log('Saved new message:', savedMessage);
    
            conversation.messages.push(savedMessage._id);
            await conversation.save();
            console.log('Updated conversation with new message:', conversation);
    
            const getConversationMessage = await ConversationModel.findOne({
                "$or": [
                    { sender: data?.sender, receiver: data?.receiver },
                    { sender: data?.receiver, receiver: data?.sender }
                ]
            }).populate('messages').sort({ updatedAt: -1 });
    
            console.log('Retrieved conversation messages:', getConversationMessage?.messages);
    
            io.to(data?.sender).emit('message', getConversationMessage?.messages || []);
            io.to(data?.receiver).emit('message', getConversationMessage?.messages || []);
    
            // Send updated conversations
            const conversationSender = await getConversation(data?.sender);
            const conversationReceiver = await getConversation(data?.receiver);
    
            io.to(data?.sender).emit('conversation', conversationSender);
            io.to(data?.receiver).emit('conversation', conversationReceiver);
        } catch (error) {
            console.error('Error handling new message:', error);
        }
    });
    

    // Handle sidebar event
    socket.on('sidebar', async (currentUserId) => {
        console.log("current user", currentUserId);
        try {
            const conversation = await getConversation(currentUserId);
            socket.emit('conversation', conversation);
        } catch (error) {
            console.error('Error handling sidebar:', error);
        }
    });

    // Handle seen event
    socket.on('seen', async (msgByUserId) => {
        try {
            const conversation = await ConversationModel.findOne({
                "$or": [
                    { sender: user?._id, receiver: msgByUserId },
                    { sender: msgByUserId, receiver: user?._id }
                ]
            });

            const conversationMessageId = conversation?.messages || [];
            await MessageModel.updateMany(
                { _id: { "$in": conversationMessageId }, msgByUserId: msgByUserId },
                { "$set": { seen: true } }
            );

            // Send updated conversations
            const conversationSender = await getConversation(user?._id?.toString());
            const conversationReceiver = await getConversation(msgByUserId);

            io.to(user?._id?.toString()).emit('conversation', conversationSender);
            io.to(msgByUserId).emit('conversation', conversationReceiver);
        } catch (error) {
            console.error('Error handling seen event:', error);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        if (user) {
            const userId = user?._id?.toString();
            if (userId) {
                onlineUser.delete(userId);
                io.emit('onlineUser', Array.from(onlineUser));
            }
        }
        console.log('disconnect user ', socket.id);
    });
});

module.exports = {
    app,
    server
}
