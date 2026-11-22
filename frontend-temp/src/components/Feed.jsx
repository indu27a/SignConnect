import { useEffect, useState } from 'react'
import './Feed.css'

const API_URL = 'http://127.0.0.1:8000/api'

function Feed() {
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [message, setMessage] = useState('')
  const [likingPost, setLikingPost] = useState(null)

  const [comments, setComments] = useState({})
  const [commentInputs, setCommentInputs] = useState({})
  const [commentLoading, setCommentLoading] = useState(null)
  const [expandedComments, setExpandedComments] = useState({})

  const accessToken = localStorage.getItem('signconnect_access')
  const currentUsername = localStorage.getItem('signconnect_username')

  async function fetchPosts() {
    try {
      const response = await fetch(`${API_URL}/posts/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Unable to load community posts.')
      }

      const data = await response.json()
      setPosts(Array.isArray(data) ? data : data.results || [])
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  async function handleCreatePost(event) {
    event.preventDefault()

    if (!content.trim() && !image) {
      setMessage('Please write something or select an image.')
      return
    }

    setPosting(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('content', content)

      if (image) {
        formData.append('image', image)
      }

      const response = await fetch(`${API_URL}/posts/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          Object.values(data).flat().join(' ') ||
          'Unable to create post.'
        )
      }

      setContent('')
      setImage(null)
      setMessage('Your post has been published!')

      await fetchPosts()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setPosting(false)
    }
  }

  async function handleLike(postId) {
    if (likingPost === postId) return

    setLikingPost(postId)

    try {
      const response = await fetch(
        `${API_URL}/posts/${postId}/like/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to update like.')
      }

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_liked: data.liked,
                likes_count: data.likes_count,
              }
            : post
        )
      )
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLikingPost(null)
    }
  }

  async function fetchComments(postId) {
    try {
      const response = await fetch(
        `${API_URL}/posts/${postId}/comments/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Unable to load comments.')
      }

      const data = await response.json()

      setComments((current) => ({
        ...current,
        [postId]: Array.isArray(data) ? data : data.results || [],
      }))
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function toggleComments(postId) {
    const isExpanded = !!expandedComments[postId]

    setExpandedComments((current) => ({
      ...current,
      [postId]: !isExpanded,
    }))

    if (!isExpanded && !comments[postId]) {
      await fetchComments(postId)
    }
  }

  async function handleAddComment(event, postId) {
    event.preventDefault()

    const commentText = commentInputs[postId]?.trim()

    if (!commentText) return

    setCommentLoading(postId)
    setMessage('')

    try {
      const response = await fetch(
        `${API_URL}/posts/${postId}/comments/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: commentText }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          Object.values(data).flat().join(' ') ||
          'Unable to add comment.'
        )
      }

      setComments((current) => ({
        ...current,
        [postId]: [...(current[postId] || []), data],
      }))

      setCommentInputs((current) => ({
        ...current,
        [postId]: '',
      }))

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments_count: (post.comments_count || 0) + 1,
              }
            : post
        )
      )
    } catch (error) {
      setMessage(error.message)
    } finally {
      setCommentLoading(null)
    }
  }

  async function handleDeleteComment(postId, commentId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this comment?'
    )

    if (!confirmed) return

    try {
      const response = await fetch(
        `${API_URL}/posts/comments/${commentId}/delete/`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Unable to delete comment.')
      }

      setComments((current) => ({
        ...current,
        [postId]: (current[postId] || []).filter(
          (comment) => comment.id !== commentId
        ),
      }))

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments_count: Math.max(
                  0,
                  (post.comments_count || 0) - 1
                ),
              }
            : post
        )
      )
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="feed-page">

      <div className="feed-heading">
        <span>YOUR COMMUNITY</span>
        <h1>Community Feed</h1>
        <p>Discover stories and connect with people.</p>
      </div>

      <section className="create-post-card">
        <h2>Share something with your community</h2>

        <form onSubmit={handleCreatePost}>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="What's happening today?"
            rows={4}
          />

          <div className="create-post-actions">
            <label className="image-upload">
              + Add Photo
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setImage(event.target.files?.[0] || null)
                }
                hidden
              />
            </label>

            <button type="submit" disabled={posting}>
              {posting ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>

          {image && <p>Selected image: {image.name}</p>}
        </form>
      </section>

      {message && (
        <p className="feed-message" role="status">
          {message}
        </p>
      )}

      <section className="posts-list">
        <h2>Latest Posts</h2>

        {loading ? (
          <p>Loading posts...</p>
        ) : posts.length === 0 ? (
          <p>No posts yet. Be the first to share something!</p>
        ) : (
          posts.map((post) => (
            <article className="post-card" key={post.id}>

              <div className="post-author">
                <div className="post-avatar">
                  {post.author_username?.charAt(0).toUpperCase() || 'U'}
                </div>

                <div>
                  <strong>{post.author_username || 'Community Member'}</strong>
                  <span>Community member</span>
                </div>
              </div>

              {post.content && (
                <p className="post-content">{post.content}</p>
              )}

              {post.image && (
                <img
                  className="post-image"
                  src={
                    post.image.startsWith('http')
                      ? post.image
                      : `http://127.0.0.1:8000${post.image}`
                  }
                  alt="Community post"
                />
              )}

              <div className="post-interactions">
                <button
                  type="button"
                  className={`like-button ${post.is_liked ? 'liked' : ''}`}
                  onClick={() => handleLike(post.id)}
                  disabled={likingPost === post.id}
                  aria-pressed={!!post.is_liked}
                >
                  {post.is_liked ? '❤️ Liked' : '🤍 Like'}
                </button>

                <span className="likes-count">
                  {post.likes_count || 0}{' '}
                  {post.likes_count === 1 ? 'Like' : 'Likes'}
                </span>

                <button
                  type="button"
                  className="comment-toggle-button"
                  onClick={() => toggleComments(post.id)}
                >
                  💬 {post.comments_count || 0} Comments
                </button>
              </div>

              {expandedComments[post.id] && (
                <div className="comments-section">

                  <h3>Comments</h3>

                  <form
                    className="comment-form"
                    onSubmit={(event) =>
                      handleAddComment(event, post.id)
                    }
                  >
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentInputs[post.id] || ''}
                      onChange={(event) =>
                        setCommentInputs((current) => ({
                          ...current,
                          [post.id]: event.target.value,
                        }))
                      }
                    />

                    <button
                      type="submit"
                      disabled={
                        commentLoading === post.id ||
                        !commentInputs[post.id]?.trim()
                      }
                    >
                      {commentLoading === post.id
                        ? 'Sending...'
                        : 'Comment'}
                    </button>
                  </form>

                  <div className="comments-list">
                    {(comments[post.id] || []).map((comment) => (
                      <div className="comment-item" key={comment.id}>
                        <div className="comment-avatar">
                          {comment.username?.charAt(0).toUpperCase() || 'U'}
                        </div>

                        <div className="comment-body">
                          <strong>{comment.username}</strong>
                          <p>{comment.content}</p>
                        </div>

                        {comment.username === currentUsername && (
                          <button
                            type="button"
                            className="delete-comment-button"
                            onClick={() =>
                              handleDeleteComment(post.id, comment.id)
                            }
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}

                    {comments[post.id]?.length === 0 && (
                      <p className="no-comments">
                        No comments yet. Start the conversation!
                      </p>
                    )}
                  </div>

                </div>
              )}

            </article>
          ))
        )}
      </section>

    </div>
  )
}

export default Feed