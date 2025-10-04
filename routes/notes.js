const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const notes = db.collection('notes');

        const filter = req.query.filter;

        let query;

        if (filter === 'created') {
            query = {
                userId: req.user.id,
                isShared : { $ne: true }
            };
        } else if (filter === 'shared') {
            query = {
                userId: req.user.id,
                isShared: true
            };
        } else {
            query = { userId: req.user.id };
        }

        console.log('Fetching notes with filter:', filter, 'Query:', query);

        const allNotes = await notes.find(query).sort({ createdAt: -1 }).toArray();


        res.json({
            message: 'Notes retrieved successfully!',
            notes: allNotes
        })
    } catch (error) {
        console.error('Error getting notes:' , error);
        res.status(500).json({ message: 'Server Error'});
    }
});

// Create new note
router.post('/', async (req, res) => {
    try{
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        const db = getDB();
        const notes = db.collection('notes');

        const newNote = {
            title: title,
            content: content,
            userId: req.user.id,
            createdAt: new Date()
        };

        const result = await notes.insertOne(newNote);

        res.status(201).json({
            message: 'Note created successfully!',
            noteId: result.insertedId
        });

    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ message: 'Server error'});
    }
});


router.put('/:id', async (req, res) => {
    console.log("PUT ROUTE HIT!");
    try {
        const noteId = req.params.id;
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        const db = getDB();
        const notes = db.collection('notes');

        const { ObjectId } = require('mongodb');
        const objectId = new ObjectId(noteId);

        const result = await notes.updateOne(
            { _id: objectId, userId: req.user.id },
            {
                $set: {
                    title: title,
                    content: content,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.json({
            message: 'Note update successfully!',
            noteId: noteId
        });
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: 'Error updating note' });
    }
});

router.post('/:id/share', async (req, res) => {
    try {
        const noteId = req.params.id;
        const { username } = req.body;

        console.log('Sharing note: ', noteId, ' with user: ', username);

        if(!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        if(username === req.user.username) {
            return res.status(400).json({ message: 'Cannot share note with yourself' });
        }

        const db = getDB();
        const notes = db.collection('notes');
        const users = db.collection('users');

        const recipient = await users.findOne({ username: username });

        if(!recipient) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('Found recipient:', recipient.username);

        const { ObjectId } = require('mongodb');
        const originalNote = await notes.findOne({
            _id: new ObjectId(noteId),
            userId: req.user.id
        });

        if (!originalNote) {
            return res.status(404).json({ message: 'Note not found or you do not own this note' });
        }

        console.log('Found original note:', originalNote.title);

        const sharedNote = {
            title: originalNote.title,
            content: originalNote.content,
            userId: recipient._id.toString(),
            sharedBy: req.user.username,
            isShared: true,
            createdAt: new Date()
        };

        const result = await notes.insertOne(sharedNote);

        console.log('Created shared note copy:', result.insertedId);

        res.json({
            message: `Note shared successfully with ${username}!`,
            sharedNoteId: result.insertedId
        });
    } catch (error) {
        console.error('Error sharing note:', error);
        res.status(500).json({ message: 'Error sharing note' });
    }
});

router.delete('/', async (req, res) => {
    try {
        const db = getDB();
        const notes = db.collection('notes');

        const result = await notes.deleteMany({ userId: req.user.id });

        res.json({
            message: `Cleared ${result.deletedCount} notes!`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error clearing notes:', error);
        res.status(500).json({ message: 'Error clearing notes'});
    }
});

router.delete('/:id', async (req, res) => {
    try{
        const noteId = req.params.id;

        const db = getDB();

        const notes = db.collection('notes');

        const { ObjectId } = require('mongodb');

        const objectId = new ObjectId(noteId);

        const result = await notes.deleteOne({ _id: objectId, userId: req.user.id });

        if(result.deletedCount === 0){
            return res.status(404).json({ message: 'Note not found' });
        }

        res.json({
            message: 'Note deleted successfully!',
            deletedId: noteId
        });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ message: 'Error deleting note' });
    }
});



module.exports = router;