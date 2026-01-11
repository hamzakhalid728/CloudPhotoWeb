const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = './database.json';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); 
app.use('/uploads', express.static('uploads'));

// Ensure uploads folder exists
if (!fs.existsSync('./uploads')){
    fs.mkdirSync('./uploads');
}

// Storage Engine
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, 'post-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 } 
}).single('image');

// Helper to read/write database
const getPosts = () => {
    try {
        const data = fs.readFileSync(DB_FILE);
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

const savePosts = (posts) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(posts, null, 2));
};

// --- REST Endpoints ---

// 1. Get all posts (Consumer View + Search)
app.get('/api/posts', (req, res) => {
    const posts = getPosts();
    res.json(posts);
});

// 2. Upload a new post (Creator View)
app.post('/api/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!req.file) return res.status(400).json({ error: 'No file selected!' });

        const posts = getPosts();
        
        const newPost = {
            id: Date.now(),
            title: req.body.title,
            caption: req.body.caption,
            location: req.body.location,
            people: req.body.people,
            imageUrl: `/uploads/${req.file.filename}`,
            comments: [],
            rating: 0
        };

        posts.unshift(newPost); // Add to top
        savePosts(posts);
        
        res.json({ message: 'Post uploaded successfully', post: newPost });
    });
});

// 3. Add a comment
app.post('/api/posts/:id/comment', (req, res) => {
    const postId = parseInt(req.params.id);
    const { text } = req.body;
    
    let posts = getPosts();
    let postIndex = posts.findIndex(p => p.id === postId);
    
    if (postIndex !== -1) {
        posts[postIndex].comments.push(text);
        savePosts(posts);
        res.json({ success: true, comments: posts[postIndex].comments });
    } else {
        res.status(404).json({ error: "Post not found" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});