const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to handle JSON data
app.use(express.json());
app.use(express.static('public'));

// Database file path
const DB_FILE = 'database.json';

// Setup file storage for images
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb) {
        // Name the file simply with current time so it's unique
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Helper function: Read posts from file
function getPosts() {
    if (!fs.existsSync(DB_FILE)) return [];
    const data = fs.readFileSync(DB_FILE);
    return JSON.parse(data);
}

// Helper function: Save posts to file
function savePosts(posts) {
    fs.writeFileSync(DB_FILE, JSON.stringify(posts, null, 2));
}

// --- ROUTES ---

// 1. CREATOR: Upload a new Post
app.post('/upload', upload.single('photo'), (req, res) => {
    const posts = getPosts();
    
    const newPost = {
        id: Date.now(), // Use time as a simple ID
        imageUrl: '/uploads/' + req.file.filename,
        title: req.body.title,
        caption: req.body.caption,
        location: req.body.location,
        people: req.body.people,
        comments: [], // Start with empty comments
        ratings: []   // Start with empty ratings
    };

    posts.push(newPost);
    savePosts(posts);

    // Go back to the creator page after upload
    res.redirect('/creator.html');
});

// 2. CONSUMER: Get all posts (with Search support)
app.get('/api/posts', (req, res) => {
    const posts = getPosts();
    const searchQuery = req.query.search;

    if (searchQuery) {
        // Simple search: check if title or caption contains the text
        const filtered = posts.filter(post => {
            const text = (post.title + " " + post.caption).toLowerCase();
            return text.includes(searchQuery.toLowerCase());
        });
        res.json(filtered);
    } else {
        res.json(posts);
    }
});

// 3. CONSUMER: Add a Comment
app.post('/api/posts/comment', (req, res) => {
    const posts = getPosts();
    const { postId, commentText } = req.body;

    // Find the post by ID
    const post = posts.find(p => p.id == postId);
    if (post) {
        post.comments.push(commentText);
        savePosts(posts);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Post not found" });
    }
});

// 4. CONSUMER: Rate a Post (1-5 stars)
app.post('/api/posts/rate', (req, res) => {
    const posts = getPosts();
    const { postId, rating } = req.body;

    const post = posts.find(p => p.id == postId);
    if (post) {
        post.ratings.push(parseInt(rating));
        savePosts(posts);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Post not found" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});