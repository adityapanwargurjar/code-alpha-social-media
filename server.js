const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve frontend files

// --- USER PROFILES ---
// Get user profile with followers/following count
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await db('users').where({ id: req.params.id }).first();
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const followers = await db('follows').where({ following_id: req.params.id }).count('follower_id as count').first();
    const following = await db('follows').where({ follower_id: req.params.id }).count('following_id as count').first();
    
    res.json({ ...user, followersCount: followers.count, followingCount: following.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- POSTS & COMMENTS ---
// Create a post
app.post('/api/posts', async (req, res) => {
  const { user_id, content } = req.body;
  try {
    const [id] = await db('posts').insert({ user_id, content });
    res.status(201).json({ id, user_id, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all posts (with user details, likes count, and comments)
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await db('posts')
      .join('users', 'posts.user_id', '=', 'users.id')
      .select('posts.*', 'users.username');

    for (let post of posts) {
      // Get likes count
      const likes = await db('likes').where({ post_id: post.id }).count('user_id as count').first();
      post.likesCount = likes.count;

      // Get comments
      post.comments = await db('comments')
        .join('users', 'comments.user_id', '=', 'users.id')
        .where({ post_id: post.id })
        .select('comments.*', 'users.username');
    }
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a comment to a post
app.post('/api/posts/:id/comments', async (req, res) => {
  const { user_id, content } = req.body;
  try {
    await db('comments').insert({ post_id: req.params.id, user_id, content });
    res.status(201).json({ message: "Comment added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- LIKE / FOLLOW SYSTEM ---
// Like a post
app.post('/api/posts/:id/like', async (req, res) => {
  const { user_id } = req.body;
  try {
    const existing = await db('likes').where({ post_id: req.params.id, user_id }).first();
    if (existing) {
      await db('likes').where({ post_id: req.params.id, user_id }).del();
      return res.json({ liked: false });
    }
    await db('likes').insert({ post_id: req.params.id, user_id });
    res.json({ liked: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Follow a user
app.post('/api/users/:id/follow', async (req, res) => {
  const { follower_id } = req.body; // The user doing the following action
  const following_id = req.params.id; // The user being followed
  if (parseInt(follower_id) === parseInt(following_id)) {
    return res.status(400).json({ error: "You cannot follow yourself" });
  }
  try {
    const existing = await db('follows').where({ follower_id, following_id }).first();
    if (existing) {
      await db('follows').where({ follower_id, following_id }).del();
      return res.json({ followed: false });
    }
    await db('follows').insert({ follower_id, following_id });
    res.json({ followed: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
