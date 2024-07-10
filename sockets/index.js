const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const getUserDetailsFromToken = require('../helper/getUserDetailsFromToken');
const UserModel = require('../models/UserModel');
const { ConversationModel, MessageModel } = require('../models/ConversationModel');
const getConversation = require('../helper/getConversation');

const app = express();

// Create an HTTP server
const server = http.createServer(app);

// Initialize Socket.io with CORS configuration
const io = new Server(server, {
    cors: {
        origin: 'https://talkrr-chatwithyourlovedones.netlify.app',
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Set to keep track of online users
const onlineUsers = new Set();

io.on('connection', async (socket) => {
    console.log("Connected user:", socket.id);

    const token = socket.handshake.auth.token;

    // Fetch user details from token
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

    const userId = user._id?.toString();

    if (userId) {
        // Join the user's room
        socket.join(userId);
        onlineUsers.add(userId);
        io.emit('onlineUser', Array.from(onlineUsers));
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
                online: onlineUsers.has(otherUserId)
            };
            console.log('User details payload:', payload);
            socket.emit('message-user', payload);

            const conversation = await ConversationModel.findOne({
                "$or": [
                    { sender: user._id, receiver: otherUserId },
                    { sender: otherUserId, receiver: user._id }
                ]
            }).populate('messages').sort({ updatedAt: -1 });

            console.log('Retrieved messages:', conversation?.messages);
            socket.emit('message', conversation?.messages || []);
        } catch (error) {
            console.error('Error handling message-page:', error);
        }
    });

    // Handle new message event
    socket.on('new message', async (data) => {
        try {
            console.log('New message data:', data);

            let conversation = await ConversationModel.findOne({
                "$or": [
                    { sender: data.sender, receiver: data.receiver },
                    { sender: data.receiver, receiver: data.sender }
                ]
            });

            if (!conversation) {
                conversation = new ConversationModel({
                    sender: data.sender,
                    receiver: data.receiver
                });
                await conversation.save();
                console.log('Created new conversation:', conversation);
            }

            const message = new MessageModel({
                text: data.text,
                imageUrl: data.imageUrl,
                videoUrl: data.videoUrl,
                msgByUserId: data.msgByUserId
            });
            const savedMessage = await message.save();
            console.log('Saved new message:', savedMessage);

            conversation.messages.push(savedMessage._id);
            await conversation.save();
            console.log('Updated conversation with new message:', conversation);

            const updatedConversation = await ConversationModel.findOne({
                "$or": [
                    { sender: data.sender, receiver: data.receiver },
                    { sender: data.receiver, receiver: data.sender }
                ]
            }).populate('messages').sort({ updatedAt: -1 });

            console.log('Retrieved updated conversation messages:', updatedConversation?.messages);

            io.to(data.sender).emit('message', updatedConversation?.messages || []);
            io.to(data.receiver).emit('message', updatedConversation?.messages || []);

            // Send updated conversations to both users
            const conversationSender = await getConversation(data.sender);
            const conversationReceiver = await getConversation(data.receiver);

            io.to(data.sender).emit('conversation', conversationSender);
            io.to(data.receiver).emit('conversation', conversationReceiver);
        } catch (error) {
            console.error('Error handling new message:', error);
        }
    });

    // Handle sidebar event
    socket.on('sidebar', async (currentUserId) => {
        console.log("Current user:", currentUserId);
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
                    { sender: user._id, receiver: msgByUserId },
                    { sender: msgByUserId, receiver: user._id }
                ]
            });

            const conversationMessageIds = conversation?.messages || [];
            await MessageModel.updateMany(
                { _id: { "$in": conversationMessageIds }, msgByUserId: msgByUserId },
                { "$set": { seen: true } }
            );

            // Send updated conversations to both users
            const conversationSender = await getConversation(user._id?.toString());
            const conversationReceiver = await getConversation(msgByUserId);

            io.to(user._id?.toString()).emit('conversation', conversationSender);
            io.to(msgByUserId).emit('conversation', conversationReceiver);
        } catch (error) {
            console.error('Error handling seen event:', error);
        }
    });
    socket.on('offer', (data) => {
        console.log('Received offer:', data);
        io.to(data.receiver).emit('offer', {
            offer: data.offer,
            sender: data.sender
        });
    });

    // Handle video call answer
    socket.on('answer', (data) => {
        console.log('Received answer:', data);
        io.to(data.receiver).emit('answer', {
            answer: data.answer,
            sender: data.sender
        });
    });

    // Handle ICE candidate
    socket.on('ice-candidate', (data) => {
        console.log('Received ICE candidate:', data);
        io.to(data.receiver).emit('ice-candidate', {
            candidate: data.candidate,
            sender: data.sender
        });
    });

    
    // Handle disconnection
    socket.on('disconnect', () => {
        if (user) {
            const userId = user._id?.toString();
            if (userId) {
                onlineUsers.delete(userId);
                io.emit('onlineUser', Array.from(onlineUsers));
            }
        }
        console.log('Disconnected user:', socket.id);
    });
});

module.exports = {
    app,
    server
};
