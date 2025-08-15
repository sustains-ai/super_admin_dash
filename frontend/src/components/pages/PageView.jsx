import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert, Badge } from 'react-bootstrap';
import AuthContext from '../../context/AuthContext';
import './PageView.css';

const PageView = () => {
  const [page, setPage] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user } = useContext(AuthContext);
  const { pageName } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPageData();
  }, [pageName]);

  const fetchPageData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Fetch page details
      const pageResponse = await fetch(`http://localhost:8000/api/pages/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (pageResponse.ok) {
        const pages = await pageResponse.json();
        const currentPage = pages.find(p => p.name === pageName);
        setPage(currentPage);
        
        if (currentPage) {
          // Fetch comments for this page
          const commentsResponse = await fetch(`http://localhost:8000/api/pages/${currentPage.id}/comments/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            setComments(commentsData);
          }
        }
      } else {
        setError('Failed to load page data');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/comments/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: page.id,
          content: newComment
        }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments([...comments, comment]);
        setNewComment('');
      } else {
        setError('Failed to add comment');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/comments/${commentId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setComments(comments.filter(comment => comment.id !== commentId));
      } else {
        setError('Failed to delete comment');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    }
  };

  const hasPermission = (permission) => {
    if (user?.role === 'super_admin') return true;
    return user?.permissions?.[pageName]?.includes(permission) || false;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Page not found or you don't have access to this page.
        </Alert>
      </Container>
    );
  }

  return (
    <div className="page-view-container">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <Container>
          <span className="navbar-brand fw-bold">{page.display_name}</span>
          <div className="navbar-nav ms-auto">
            <Button 
              variant="outline-light" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="me-2"
            >
              Back to Dashboard
            </Button>
            <span className="navbar-text">
              Welcome, {user?.email}
            </span>
          </div>
        </Container>
      </nav>

      <Container className="mt-4">
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">{page.display_name}</h5>
              </Card.Header>
              <Card.Body>
                <p className="text-muted">{page.description || 'No description available.'}</p>
                
                <div className="permissions-info mb-4">
                  <h6>Your Permissions:</h6>
                  <div>
                    {hasPermission('view') && <Badge bg="success" className="me-1">View</Badge>}
                    {hasPermission('create') && <Badge bg="primary" className="me-1">Create</Badge>}
                    {hasPermission('edit') && <Badge bg="warning" className="me-1">Edit</Badge>}
                    {hasPermission('delete') && <Badge bg="danger" className="me-1">Delete</Badge>}
                    {!hasPermission('view') && !hasPermission('create') && !hasPermission('edit') && !hasPermission('delete') && 
                      <Badge bg="secondary">No Access</Badge>
                    }
                  </div>
                </div>

                <hr />

                <h6>Comments ({comments.length})</h6>
                
                {hasPermission('create') && (
                  <Form onSubmit={handleAddComment} className="mb-4">
                    <Form.Group>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                    </Form.Group>
                    <Button type="submit" variant="primary" className="mt-2">
                      Add Comment
                    </Button>
                  </Form>
                )}

                <div className="comments-section">
                  {comments.length === 0 ? (
                    <p className="text-muted">No comments yet.</p>
                  ) : (
                    comments.map(comment => (
                      <Card key={comment.id} className="mb-3 comment-card">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong>{comment.created_by_email}</strong>
                              <small className="text-muted ms-2">
                                {new Date(comment.created_at).toLocaleString()}
                              </small>
                            </div>
                            {hasPermission('delete') && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                          <p className="mt-2 mb-0">{comment.content}</p>
                        </Card.Body>
                      </Card>
                    ))
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default PageView;
