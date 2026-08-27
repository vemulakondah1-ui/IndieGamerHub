import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import ThreadCard from '../components/ThreadCard/ThreadCard';
import { forumService, gameService } from '../services';
import { useAuth } from '../context/AuthContext';
import './ForumPages.css';

export function ForumPage() {
  const { gameId } = useParams();
  const { isLoggedIn } = useAuth();
  const [game, setGame] = useState(null);
  const [threads, setThreads] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      gameService.getGame(gameId),
      forumService.getGameThreads(gameId),
    ]).then(([gameRes, threadsRes]) => {
      setGame(gameRes.data.data);
      setThreads(threadsRes.data.data || []);
      setPagination(threadsRes.data.pagination || {});
    }).catch(console.error).finally(() => setLoading(false));
  }, [gameId]);

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { setError('Title and body are required'); return; }
    setSubmitting(true);
    setError('');
    try {
      const { data } = await forumService.createThread(gameId, form);
      setThreads((prev) => [data.data, ...prev]);
      setForm({ title: '', body: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create thread');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container forum-container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>›</span>
          <Link to="/games">Games</Link>
          <span>›</span>
          {game && <Link to={`/games/${gameId}`}>{game.title}</Link>}
          <span>›</span>
          <span>Forum</span>
        </nav>

        {/* Forum Header */}
        <div className="forum-header">
          <div>
            <h1 className="forum-title">
              {game?.title ? `${game.title} — Forum` : 'Forum'}
            </h1>
            <p className="text-muted text-sm">{pagination.total || 0} threads</p>
          </div>
          <div className="forum-actions">
            {game && <Link to={`/games/${gameId}`} className="btn btn-ghost btn-sm">← Back to Game</Link>}
            {isLoggedIn && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancel' : '+ New Thread'}
              </button>
            )}
          </div>
        </div>

        {/* New Thread Form */}
        {showForm && (
          <div className="thread-form-wrapper animate-fade-in">
            <h3 className="thread-form__title">Start a New Discussion</h3>
            <form onSubmit={handleCreateThread} className="thread-form">
              <div className="form-group">
                <label className="form-label">Thread Title *</label>
                <input
                  className="form-input"
                  placeholder="What do you want to discuss?"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Content *</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="Share your thoughts, questions, or tips..."
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  rows={5}
                  required
                />
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="flex gap-sm">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Posting...' : 'Post Thread'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Thread List */}
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : threads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>No threads yet</h3>
            <p>Be the first to start a discussion!</p>
            {isLoggedIn && (
              <button className="btn btn-primary mt-md" onClick={() => setShowForm(true)}>Start a Thread</button>
            )}
          </div>
        ) : (
          <div className="threads-list">
            {threads.map((thread) => <ThreadCard key={thread._id} thread={thread} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export function ThreadPage() {
  const { threadId } = useParams();
  const { user, isLoggedIn } = useAuth();
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      forumService.getThread(threadId),
      forumService.getThreadPosts(threadId),
    ]).then(([threadRes, postsRes]) => {
      setThread(threadRes.data.data);
      setPosts(postsRes.data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [threadId]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const { data } = await forumService.createPost(threadId, { content: replyContent });
      setPosts((prev) => [...prev, data.data]);
      setReplyContent('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await forumService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post');
    }
  };

  if (loading) return <div className="page-wrapper loading-center"><div className="spinner" /></div>;
  if (!thread) return <div className="page-wrapper loading-center"><h2>Thread not found</h2></div>;

  return (
    <div className="page-wrapper">
      <div className="container forum-container">
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>›</span>
          <Link to={`/games/${thread.game?._id}`}>{thread.game?.title || 'Game'}</Link>
          <span>›</span>
          <Link to={`/games/${thread.game?._id}/forum`}>Forum</Link>
          <span>›</span>
          <span>{thread.title}</span>
        </nav>

        {/* Thread Header */}
        <div className="thread-header">
          <div className="thread-header__badges">
            {thread.isPinned && <span className="badge badge-gold">📌 Pinned</span>}
            {thread.isLocked && <span className="badge badge-primary">🔒 Locked</span>}
          </div>
          <h1 className="thread-title">{thread.title}</h1>
          <p className="text-muted text-sm">
            by <strong>{thread.author?.username}</strong> · {thread.postCount} replies
          </p>
        </div>

        {/* Original Post */}
        <div className="post-card post-card--op">
          <div className="post-author">
            <div className="post-avatar">
              {thread.author?.avatar
                ? <img src={thread.author.avatar} alt="" />
                : <span>{thread.author?.username?.[0]?.toUpperCase()}</span>
              }
            </div>
            <div>
              <p className="post-username">{thread.author?.username}</p>
              <p className="post-role">{thread.author?.role}</p>
            </div>
          </div>
          <div className="post-content">{thread.body}</div>
        </div>

        {/* Replies */}
        <div className="posts-list">
          {posts.map((post, idx) => (
            <PostCard
              key={post._id}
              post={post}
              index={idx + 1}
              currentUserId={user?._id}
              userRole={user?.role}
              onDelete={handleDeletePost}
            />
          ))}
        </div>

        {/* Reply Form */}
        {isLoggedIn && !thread.isLocked && (
          <div className="reply-form-wrapper">
            <h3 className="reply-form__title">Post a Reply</h3>
            <form onSubmit={handleReply}>
              <textarea
                className="form-input form-textarea"
                placeholder="Share your thoughts..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={4}
                required
              />
              {error && <div className="alert alert-error mt-sm">{error}</div>}
              <button type="submit" className="btn btn-primary mt-md" disabled={submitting || !replyContent.trim()}>
                {submitting ? 'Posting...' : '↩ Post Reply'}
              </button>
            </form>
          </div>
        )}
        {thread.isLocked && (
          <div className="alert alert-info">🔒 This thread is locked and no longer accepts replies.</div>
        )}
        {!isLoggedIn && (
          <div className="alert alert-info">
            <Link to="/login" className="font-bold">Sign in</Link> to reply to this thread.
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, index, currentUserId, userRole, onDelete }) {
  const isOwner = currentUserId === post.author?._id;
  const isAdmin = userRole === 'admin';

  return (
    <div className="post-card">
      <div className="post-card__left">
        <div className="post-avatar">
          {post.author?.avatar
            ? <img src={post.author.avatar} alt="" />
            : <span>{post.author?.username?.[0]?.toUpperCase() || '?'}</span>
          }
        </div>
        <span className="post-number">#{index}</span>
      </div>
      <div className="post-card__main">
        <div className="post-meta">
          <span className="post-username">{post.author?.username}</span>
          {post.author?.role !== 'gamer' && (
            <span className={`badge badge-${post.author?.role === 'admin' ? 'gold' : 'cyan'}`} style={{ fontSize: '10px' }}>
              {post.author?.role}
            </span>
          )}
          <span className="post-time text-muted text-xs">
            {new Date(post.createdAt).toLocaleDateString()}
            {post.isEdited && ' (edited)'}
          </span>
        </div>
        <p className="post-content">{post.content}</p>
        {(isOwner || isAdmin) && (
          <button className="post-delete-btn" onClick={() => onDelete(post._id)}>Delete</button>
        )}
      </div>
    </div>
  );
}
