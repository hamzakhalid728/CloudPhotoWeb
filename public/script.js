document.addEventListener('DOMContentLoaded', () => {
    
    // Check which page we are on
    const isCreatorPage = document.getElementById('uploadForm');
    const isFeedPage = document.getElementById('posts-grid');

    if (isCreatorPage) {
        setupCreator();
    } else if (isFeedPage) {
        loadPosts();
    }
});

// --- Creator Page Logic ---
function setupCreator() {
    const form = document.getElementById('uploadForm');
    const status = document.getElementById('statusMessage');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        status.textContent = "Uploading...";
        
        const formData = new FormData(form);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                status.textContent = "Upload Successful!";
                status.style.color = "green";
                form.reset();
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            status.textContent = "Error: " + err.message;
            status.style.color = "red";
        }
    });
}

// --- Consumer Page Logic ---
let allPosts = []; // Store posts globally for search filtering

async function loadPosts() {
    try {
        const response = await fetch('/api/posts');
        allPosts = await response.json();
        renderPosts(allPosts);
    } catch (err) {
        console.error("Failed to load posts", err);
    }
}

function renderPosts(posts) {
    const grid = document.getElementById('posts-grid');
    grid.innerHTML = ''; // Clear current

    if (posts.length === 0) {
        grid.innerHTML = '<p style="text-align:center; padding:20px;">No posts yet. Be the first to upload!</p>';
        return;
    }

    posts.forEach(post => {
        const div = document.createElement('div');
        div.className = 'post-card';
        
        // Render comments
        let commentsHtml = post.comments.map(c => `<div class="comment"><strong>User:</strong> ${c}</div>`).join('');

        div.innerHTML = `
            <div class="post-header">
                <div>
                    <strong>${post.title}</strong>
                    <div class="post-location">${post.location || 'Unknown Location'}</div>
                </div>
            </div>
            <img src="${post.imageUrl}" class="post-image" alt="${post.title}">
            <div class="post-footer">
                <div class="post-caption">
                    <strong>Creator</strong> ${post.caption} <br>
                    <span class="people-tag">With: ${post.people || 'No one'}</span>
                </div>
                
                <div class="comments-section" id="comments-${post.id}">
                    ${commentsHtml}
                </div>
                
                <div class="comment-input-area">
                    <input type="text" placeholder="Add a comment..." id="input-${post.id}">
                    <button onclick="postComment(${post.id})">Post</button>
                </div>
            </div>
        `;
        grid.appendChild(div);
    });
}

// Search Filter Logic
function filterPosts() {
    const query = document.getElementById('searchBar').value.toLowerCase();
    const filtered = allPosts.filter(post => 
        post.title.toLowerCase().includes(query) || 
        post.caption.toLowerCase().includes(query) ||
        post.location.toLowerCase().includes(query)
    );
    renderPosts(filtered);
}

// Comment Logic
async function postComment(postId) {
    const input = document.getElementById(`input-${postId}`);
    const text = input.value;
    
    if (!text) return;

    try {
        const response = await fetch(`/api/posts/${postId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (response.ok) {
            // Reload posts to show new comment (Simple approach)
            loadPosts();
        }
    } catch (err) {
        console.error("Failed to comment", err);
    }
}