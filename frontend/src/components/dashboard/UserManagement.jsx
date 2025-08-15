import { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, Badge, Alert, 
  Modal, Form, Spinner, Dropdown, ButtonGroup 
} from 'react-bootstrap';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  
  // Form states
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    role: 'user',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/users/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPages = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/pages/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPages(data);
      }
    } catch (err) {
      console.error('Failed to fetch pages:', err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    // Validation
    const errors = {};
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.username) errors.username = 'Username is required';
    if (!formData.password) errors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/users/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
          role: formData.role
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({ email: '', username: '', role: 'user', password: '', confirmPassword: '' });
        fetchUsers();
      } else {
        const data = await response.json();
        setFormErrors(data);
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/users/${selectedUser.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          role: formData.role
        }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedUser(null);
        setFormData({ email: '', username: '', role: 'user', password: '', confirmPassword: '' });
        fetchUsers();
      } else {
        const data = await response.json();
        setFormErrors(data);
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/users/${selectedUser.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        setError('Failed to delete user');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    }
  };

  const openCreateModal = () => {
    setFormData({ email: '', username: '', role: 'user', password: '', confirmPassword: '' });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      username: user.username,
      role: user.role,
      password: '',
      confirmPassword: ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const openPermissionsModal = (user) => {
    setSelectedUser(user);
    fetchPages();
    setShowPermissionsModal(true);
  };

  const getRoleBadge = (role) => {
    return (
      <Badge bg={role === 'super_admin' ? 'danger' : 'info'}>
        {role === 'super_admin' ? 'Super Admin' : 'User'}
      </Badge>
    );
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

  return (
    <div className="user-management-container">
      <Container className="mt-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <h2>User Management</h2>
              <Button variant="primary" onClick={openCreateModal}>
                <i className="fas fa-plus me-2"></i>
                Add New User
              </Button>
            </div>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Users</h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id}>
                          <td>
                            <div>
                              <strong>{user.email}</strong><br />
                              <small className="text-muted">{user.username}</small>
                            </div>
                          </td>
                          <td>{getRoleBadge(user.role)}</td>
                          <td>
                            <Badge bg={user.is_active ? 'success' : 'secondary'}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td>
                            <small>{new Date(user.created_at).toLocaleDateString()}</small>
                          </td>
                          <td>
                            <ButtonGroup size="sm">
                              <Button 
                                variant="outline-primary" 
                                onClick={() => openEditModal(user)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline-info" 
                                onClick={() => openPermissionsModal(user)}
                              >
                                Permissions
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                onClick={() => openDeleteModal(user)}
                                disabled={user.role === 'super_admin'}
                              >
                                Delete
                              </Button>
                            </ButtonGroup>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Create User Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateUser}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                isInvalid={!!formErrors.email}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.email}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                isInvalid={!!formErrors.username}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.username}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="user">User</option>
                <option value="super_admin">Super Admin</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                isInvalid={!!formErrors.password}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.password}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                isInvalid={!!formErrors.confirmPassword}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.confirmPassword}
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditUser}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                isInvalid={!!formErrors.email}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.email}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                isInvalid={!!formErrors.username}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.username}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="user">User</option>
                <option value="super_admin">Super Admin</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete User Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            Are you sure you want to delete the user <strong>{selectedUser?.email}</strong>?
            This action cannot be undone.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteUser}>
            Delete User
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Permissions Modal */}
      <Modal show={showPermissionsModal} onHide={() => setShowPermissionsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Manage Permissions - {selectedUser?.email}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            Permission management interface will be implemented in the next phase. 
            For now, you can manage permissions through the Django admin interface.
          </Alert>
          <div className="mt-3">
            <strong>Available Pages:</strong>
            <ul className="mt-2">
              {pages.map(page => (
                <li key={page.id}>{page.display_name}</li>
              ))}
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPermissionsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserManagement;
