import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('Fetching dashboard data with token:', token ? 'Token exists' : 'No token');
      
      // Fetch user role table data
      const response = await fetch('http://localhost:8000/api/users/role_table/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Dashboard API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Dashboard API response data:', data);
        setUsers(data.users || []);
        setPages(data.pages || []);
        console.log('Set users:', data.users?.length || 0);
        console.log('Set pages:', data.pages?.length || 0);
      } else {
        const errorText = await response.text();
        console.error('Dashboard API error:', response.status, errorText);
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddNewUser = () => {
    setShowAddUserModal(true);
  };

  const handleManagePermissions = () => {
    setShowPermissionsModal(true);
  };

  const handleViewSystemLogs = () => {
    alert('System logs feature coming soon!');
  };

  const handleEditPermissions = (user) => {
    setSelectedUser(user);
    setShowPermissionsModal(true);
  };

  const getPermissionBadges = (permissions) => {
    if (!permissions || permissions.length === 0) {
      return <Badge bg="secondary">No Access</Badge>;
    }

    return permissions.map((perm, index) => (
      <Badge key={index} bg="primary" className="me-1">
        {perm}
      </Badge>
    ));
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

  console.log('Dashboard render - users:', users.length, 'pages:', pages.length);
  console.log('Users data:', users);
  console.log('Pages data:', pages);

  return (
    <div className="dashboard-container">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <Container>
          <span className="navbar-brand fw-bold">Super Admin Dashboard</span>
          <div className="navbar-nav ms-auto">
            <span className="navbar-text me-3">
              Welcome, {user?.email}
            </span>
            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              Logout
            </Button>
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
                <h5 className="mb-0">User Role Management</h5>
              </Card.Header>
              <Card.Body>
                {users.length === 0 ? (
                  <Alert variant="info">
                    No users found. The dashboard is loading user data...
                  </Alert>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Role</th>
                          {pages.map(page => (
                            <th key={page.id}>{page.display_name}</th>
                          ))}
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
                            <td>
                              <Badge bg={user.role === 'super_admin' ? 'danger' : 'info'}>
                                {user.role === 'super_admin' ? 'Super Admin' : 'User'}
                              </Badge>
                            </td>
                            {pages.map(page => (
                              <td key={page.id}>
                                {getPermissionBadges(user.page_permissions?.[page.name])}
                              </td>
                            ))}
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => handleEditPermissions(user)}
                              >
                                Edit Permissions
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mt-4">
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">Quick Actions</h5>
              </Card.Header>
              <Card.Body>
                <Button variant="primary" className="w-100 mb-2" onClick={handleAddNewUser}>
                  Add New User
                </Button>
                <Button variant="outline-primary" className="w-100 mb-2" onClick={handleManagePermissions}>
                  Manage Permissions
                </Button>
                <Button variant="outline-secondary" className="w-100 mb-2" onClick={() => navigate('/users')}>
                  User Management
                </Button>
                <Button variant="outline-secondary" className="w-100 mb-2" onClick={() => navigate('/permissions')}>
                  Permission Matrix
                </Button>
                <Button variant="outline-secondary" className="w-100" onClick={handleViewSystemLogs}>
                  View System Logs
                </Button>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">System Overview</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <span>Total Users:</span>
                  <Badge bg="primary">{users.length}</Badge>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Total Pages:</span>
                  <Badge bg="success">{pages.length}</Badge>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Active Sessions:</span>
                  <Badge bg="warning">3</Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Add User Modal */}
      <Modal show={showAddUserModal} onHide={() => setShowAddUserModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            User creation feature will be implemented in the next phase. For now, you can create users through the Django admin interface.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddUserModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Manage Permissions Modal */}
      <Modal show={showPermissionsModal} onHide={() => setShowPermissionsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Manage Permissions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            Permission management interface will be implemented in the next phase. For now, you can manage permissions through the Django admin interface.
          </Alert>
          {selectedUser && (
            <div className="mt-3">
              <strong>Selected User:</strong> {selectedUser.email}
            </div>
          )}
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

export default Dashboard;
