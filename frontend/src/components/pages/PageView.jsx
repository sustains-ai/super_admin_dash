import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Row, Col, Card, Button, Form, Alert, 
  Modal, Badge, Spinner, ListGroup, ButtonGroup
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faTrash, faEye, faHistory, 
  faSave, faTimes, faComment, faUser, faClock
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import './PageView.css';

const PageView = () => {
  const { pageName } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [page, setPage] = useState(null);
  const [comments, setComments] = useState([]);
  const [user, setUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Comment management states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [commentHistory, setCommentHistory] = useState([]);
  
  // Form states
  const [newComment, setNewComment] = useState('');
  const [editComment, setEditComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { authFetch } = useAuth();

  useEffect(() => {
    fetchPageData();
  }, [pageName]);

  const fetchPageData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get current user from auth context
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }

      // Fetch page details and comments using authFetch
      const [pageResponse, commentsResponse, permissionsResponse] = await Promise.all([
        authFetch(`http://localhost:8000/api/pages/${pageName}/`),
        authFetch(`http://localhost:8000/api/pages/${pageName}/comments/`),
        authFetch(`http://localhost:8000/api/users/profile/`)
      ]);

      if (pageResponse.ok && commentsResponse.ok && permissionsResponse.ok) {
        const [pageData, commentsData, userData] = await Promise.all([
          pageResponse.json(),
          commentsResponse.json(),
          permissionsResponse.json()
        ]);

        setPage(pageData);
        setComments(commentsData);
        
        // Check user permissions for this page
        const userPerms = userData.permissions?.find(p => p.page === pageName) || {};
        setUserPermissions(userPerms);
        
        // Redirect if no view permission
        if (!userPerms.view && userData.role !== 'super_admin') {
          setError('You do not have permission to view this page');
          setTimeout(() => navigate('/dashboard'), 2000);
          return;
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

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      const response = await authFetch(`http://localhost:8000/api/pages/${pageName}/comments/`, {
        method: 'POST',
        body: JSON.stringify({
          content: newComment.trim()
        }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments(prev => [comment, ...prev]);
        setNewComment('');
        setShowAddModal(false);
        setSuccess('Comment added successfully');
      } else {
        setError('Failed to add comment');
      }
    } catch (err) {
      setError('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async () => {
    if (!editComment.trim() || !selectedComment) return;
    
    setSubmitting(true);
    try {
      const response = await authFetch(`http://localhost:8000/api/comments/${selectedComment.id}/`, {
        method: 'PUT',
        body: JSON.stringify({
          content: editComment.trim()
        }),
      });

      if (response.ok) {
        const updatedComment = await response.json();
        setComments(prev => prev.map(c => 
          c.id === selectedComment.id ? updatedComment : c
        ));
        setEditComment('');
        setShowEditModal(false);
        setSelectedComment(null);
        setSuccess('Comment updated successfully');
      } else {
        setError('Failed to update comment');
      }
    } catch (err) {
      setError('Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const response = await authFetch(`http://localhost:8000/api/comments/${commentId}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        setSuccess('Comment deleted successfully');
      } else {
        setError('Failed to delete comment');
      }
    } catch (err) {
      setError('Failed to delete comment');
    }
  };

  const handleViewHistory = async (comment) => {
    setSelectedComment(comment);
    try {
      const response = await authFetch(`http://localhost:8000/api/comments/${comment.id}/history/`);

      if (response.ok) {
        const history = await response.json();
        setCommentHistory(history);
        setShowHistoryModal(true);
      } else {
        setError('Failed to load comment history');
      }
    } catch (err) {
      setError('Failed to load comment history');
    }
  };

  const openEditModal = (comment) => {
    setSelectedComment(comment);
    setEditComment(comment.content);
    setShowEditModal(true);
  };

  const canEdit = () => {
    return userPermissions.edit || user?.role === 'super_admin';
  };

  const canDelete = () => {
    return userPermissions.delete || user?.role === 'super_admin';
  };

  const canCreate = () => {
    return userPermissions.create || user?.role === 'super_admin';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getPermissionBadges = () => {
    const badges = [];
    if (userPermissions.view || user?.role === 'super_admin') {
      badges.push(<Badge key="view" bg="success">View</Badge>);
    }
    if (userPermissions.edit || user?.role === 'super_admin') {
      badges.push(<Badge key="edit" bg="primary">Edit</Badge>);
    }
    if (userPermissions.create || user?.role === 'super_admin') {
      badges.push(<Badge key="create" bg="info">Create</Badge>);
    }
    if (userPermissions.delete || user?.role === 'super_admin') {
      badges.push(<Badge key="delete" bg="danger">Delete</Badge>);
    }
    return badges;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error && !page) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <div className="page-view-container">
      <Container className="mt-4">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>{page?.display_name}</h2>
                <p className="text-muted mb-0">{page?.name}</p>
                <div className="mt-2">
                  {getPermissionBadges()}
                </div>
              </div>
              <ButtonGroup>
                {canCreate() && (
                  <Button variant="primary" onClick={() => setShowAddModal(true)}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Add Comment
                  </Button>
                )}
                <Button variant="outline-secondary" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
              </ButtonGroup>
            </div>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Comments Section */}
        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">
                  <FontAwesomeIcon icon={faComment} className="me-2" />
                  Comments ({comments.length})
                </h5>
              </Card.Header>
              <Card.Body>
                {comments.length === 0 ? (
                  <div className="text-center py-4">
                    <FontAwesomeIcon icon={faComment} size="3x" className="text-muted mb-3" />
                    <p className="text-muted">No comments yet. Be the first to add one!</p>
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {comments.map(comment => (
                      <ListGroup.Item key={comment.id} className="comment-item">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-2">
                              <FontAwesomeIcon icon={faUser} className="text-muted me-2" />
                              <strong>{comment.created_by_email}</strong>
                              <FontAwesomeIcon icon={faClock} className="text-muted ms-3 me-1" />
                              <small className="text-muted">{formatDate(comment.created_at)}</small>
                              {comment.modified_at !== comment.created_at && (
                                <Badge bg="warning" className="ms-2">Modified</Badge>
                              )}
                            </div>
                            <p className="mb-0">{comment.content}</p>
                          </div>
                          <div className="comment-actions">
                            <ButtonGroup size="sm">
                              {user?.role === 'super_admin' && (
                                <Button 
                                  variant="outline-info" 
                                  onClick={() => handleViewHistory(comment)}
                                  title="View History"
                                >
                                  <FontAwesomeIcon icon={faHistory} />
                                </Button>
                              )}
                              {canEdit() && (
                                <Button 
                                  variant="outline-primary" 
                                  onClick={() => openEditModal(comment)}
                                  title="Edit Comment"
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </Button>
                              )}
                              {canDelete() && (
                                <Button 
                                  variant="outline-danger" 
                                  onClick={() => handleDeleteComment(comment.id)}
                                  title="Delete Comment"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </Button>
                              )}
                            </ButtonGroup>
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Add Comment Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Comment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Comment</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Enter your comment..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddComment} 
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Adding...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} className="me-2" />
                Add Comment
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Comment Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Comment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Comment</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                placeholder="Enter your comment..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleEditComment} 
            disabled={submitting || !editComment.trim()}
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} className="me-2" />
                Update Comment
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Comment History Modal */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Comment History</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="comment-history">
            <h6>Original Comment:</h6>
            <Card className="mb-3">
              <Card.Body>
                <p className="mb-1">{selectedComment?.content}</p>
                <small className="text-muted">
                  Created by {selectedComment?.created_by_email} on {formatDate(selectedComment?.created_at)}
                </small>
              </Card.Body>
            </Card>
            
            <h6>Modification History:</h6>
            {commentHistory.length === 0 ? (
              <p className="text-muted">No modifications found.</p>
            ) : (
              <ListGroup>
                {commentHistory.map((history, index) => (
                  <ListGroup.Item key={index}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <strong>Modified by:</strong> {history.modified_by_email}<br />
                        <strong>Content:</strong> {history.content}<br />
                        <small className="text-muted">
                          Modified on {formatDate(history.modified_at)}
                        </small>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PageView;
