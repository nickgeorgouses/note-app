require('dotenv').config();
const express = require('express');
const { connectDB } = require('./config/database');
const app = express();
const PORT = process.env.PORT || 3000;
//Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Static files middleware
app.use(express.static('public'));



app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));


//This is my middleware to parse json data from requests
app.get('/', (req, res) => {
    res.send('Hello, this is the Note App!');
});

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await connectDB();
});