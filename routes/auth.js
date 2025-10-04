const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;


        if (!username || !email || !password) {
            return res.status(400).json({
                message: 'Please provide username, email, and password'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters'
            });
        }

        const db = getDB();
        const users = db.collection('users');

        const existingUser = await users.findOne({
            $or: [
                { email: email },
                { username: username }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'User with this email or username already exists'
            });
        }


        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = {
            username: username,
            email: email,
            password: hashedPassword,
            createdAt: new Date()
        };

        const result = await users.insertOne(newUser);

        const notes = db.collection('notes');
        const welcomeNote = {
            title: "Shared with you",
            content: "This note was shared with you automatically by the owner (nickgeorgouses), try sharing a note with them too!",
            userId: result.insertedId.toString(),
            sharedBy: "nickgeorgouses",
            isShared: true,
            createdAt: new Date()
        };

        await notes.insertOne(welcomeNote);
        console.log('Welcome note created for new user');

        const token = jwt.sign(
            { userId: result.insertedId, username: username},
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token: token,
            user: {
                id: result.insertedId,
                username: username,
                email: email
            }
        });

    } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;


        if (!email || !password) {
            return res.status(400).json({
                message: 'Please provide email and password'
            });
        }

        const db = getDB();
        const users = db.collection('users');

        const user = await users.findOne({ email: email });

        if (!user) {
            return res.status(400).json({
                message: 'Invalid email or password'
            });
        }


        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid){
            return res.status(400).json({
                message: 'Invalid email or password'
            });
        }


        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful!',
            token: token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;