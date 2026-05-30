let currentUserId = 1;
let viewedProfileId = 1;

// Load dynamic data on startup
document.addEventListener("DOMContentLoaded", () => {
  switchUser();
});

function switchUser() {
  currentUserId = document.getElementById('user-selector').value;
  // Automatically view the profile of the current active user first
  loadProfile(currentUserId);
  loadFeed();
}

async function loadProfile(userId) {
  viewedProfileId = userId;
  const res = await fetch(`/api/users/${userId}`);
  const user = await res.json();
  
  document.getElementById('prof-username').innerText = user.username;
  document.getElementById('prof-bio').innerText = user.bio || 'No bio status';
  document.getElementById('prof-followers').innerText = user.followersCount;
  document.getElementById('prof-following').innerText = user.followingCount;

  // Toggle visible state of follow button (hide if viewing your own profile)
  const followBtn = document.getElementById('follow-btn');
  if (parseInt(currentUserId) === parseInt(viewedProfileId)) {
    followBtn.style.display = 'none';
  } else {
    followBtn.style.display = 'inline-block';
  }
}

async function loadFeed() {
  const res = await fetch('/api/posts');
  const posts = await res.json();
  const feedDiv = document.getElementById('feed');
  feedDiv.innerHTML = '';

  posts.forEach(post => {
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    
    // Setup comments markup
    let commentsHTML = post.comments.map(c => `
      <div class="comment"><strong>${c.username}:</strong> ${c.content}</div>
    `).join('');

    postCard.innerHTML = `
      <div>
        <span class="post-author" onclick="loadProfile(${post.user_id})">@${post.username}</span>
        <p>${post.content}</p>
      </div>
      <div class="actions">
        <button onclick="likePost(${post.id})">👍 Like (${post.likesCount})</button>
      </div>
      <div class="comment-section">
        <h5>Comments</h5>
        <div class="comments-list">${commentsHTML}</div>
        <div class="comment-input-group">
          <input type="text" id="comment-in-${post.id}" placeholder="Write a comment...">
          <button onclick="addComment(${post.id})">Reply</button>
        </div>
      </div>
    `;
    feedDiv.appendChild(postCard);
  });
}

async function createPost() {
  const contentInput = document.getElementById('post-content');
  const content = contentInput.value.trim();
  if(!content) return;

  await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: currentUserId, content })
  });

  contentInput.value = '';
  loadFeed();
}

async function likePost(postId) {
  await fetch(`/api/posts/${postId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: currentUserId })
  });
  loadFeed();
}

async function addComment(postId) {
  const input = document.getElementById(`comment-in-${postId}`);
  const content = input.value.trim();
  if(!content) return;

  await fetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: currentUserId, content })
  });

  input.value = '';
  loadFeed();
}

async function toggleFollow() {
  await fetch(`/api/users/${viewedProfileId}/follow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ follower_id: currentUserId })
  });
  loadProfile(viewedProfileId); // Refresh stats
}
