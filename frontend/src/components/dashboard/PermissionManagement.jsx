import { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Badge, Alert,
  Modal, Form, Spinner, ButtonGroup, Dropdown
} from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import './PermissionManagement.css';

const PermissionManagement = () => {
  const [users, setUsers] = useState([]);
  const [pages, setPages] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  // Form states
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [bulkPermissions, setBulkPermissions] = useState({
    users: [],
    pages: [],
    permissions: {
      view: false,
      edit: false,
      create: false,
      delete: false
    }
  });
  const [userPermissions, setUserPermissions] = useState({
    view: false,
    edit: false,
    create: false,
    delete: false
  });
  const [submitting, setSubmitting] = useState(false);

  const { authFetch } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch users, pages, and permissions in parallel using authFetch
      const [usersResponse, pagesResponse, permissionsResponse] = await Promise.all([
        authFetch('http://localhost:8000/api/users/'),
        authFetch('http://localhost:8000/api/pages/'),
        authFetch('http://localhost:8000/api/permissions/')
      ]);

      if (usersResponse.ok && pagesResponse.ok && permissionsResponse.ok) {
        const [usersData, pagesData, permissionsData] = await Promise.all([
          usersResponse.json(),
          pagesResponse.json(),
          permissionsResponse.json()
        ]);

        setUsers(usersData);
        setPages(pagesData);
        
        // Organize permissions by user and page
        const organizedPermissions = {};
        permissionsData.forEach(perm => {
          if (!organizedPermissions[perm.user]) {
            organizedPermissions[perm.user] = {};
          }
          if (!organizedPermissions[perm.user][perm.page]) {
            organizedPermissions[perm.user][perm.page] = [];
          }
          organizedPermissions[perm.user][perm.page].push(perm.permission_type);
        });
        setPermissions(organizedPermissions);
      } else {
        setError('Failed to load data');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (userId, pageName, permissionType) => {
    return permissions[userId]?.[pageName]?.includes(permissionType) || false;
  };

  const togglePermission = async (userId, pageName, permissionType) => {
    const currentPermission = hasPermission(userId, pageName, permissionType);
    
    try {
      if (currentPermission) {
        // Remove permission
        const response = await authFetch(`http://localhost:8000/api/permissions/`, {
          method: 'DELETE',
          body: JSON.stringify({
            user: userId,
            page: pageName,
            permission_type: permissionType
          }),
        });
        
        if (response.ok) {
          // Update local state
          setPermissions(prev => ({
            ...prev,
            [userId]: {
              ...prev[userId],
              [pageName]: prev[userId]?.[pageName]?.filter(p => p !== permissionType) || []
            }
          }));
          setSuccess(`Removed ${permissionType} permission for ${pageName}`);
        }
      } else {
        // Add permission
        const response = await authFetch('http://localhost:8000/api/permissions/', {
          method: 'POST',
          body: JSON.stringify({
            user: userId,
            page: pageName,
            permission_type: permissionType
          }),
        });
        
        if (response.ok) {
          // Update local state
          setPermissions(prev => ({
            ...prev,
            [userId]: {
              ...prev[userId],
              [pageName]: [...(prev[userId]?.[pageName] || []), permissionType]
            }
          }));
          setSuccess(`Added ${permissionType} permission for ${pageName}`);
        }
      }
    } catch (err) {
      setError('Failed to update permission');
    }
  };

  const openBulkModal = () => {
    setBulkPermissions({
      users: [],
      pages: [],
      permissions: {
        view: false,
        edit: false,
        create: false,
        delete: false
      }
    });
    setShowBulkModal(true);
  };

  const openUserModal = (user) => {
    setSelectedUser(user);
    setUserPermissions({
      view: false,
      edit: false,
      create: false,
      delete: false
    });
    setShowUserModal(true);
  };

  const handleBulkUpdate = async () => {
    if (bulkPermissions.users.length === 0 || bulkPermissions.pages.length === 0) {
      setError('Please select at least one user and one page');
      return;
    }

    setSubmitting(true);
    try {
      // Create permissions for all selected combinations
      const promises = [];
      bulkPermissions.users.forEach(userId => {
        bulkPermissions.pages.forEach(pageName => {
          Object.entries(bulkPermissions.permissions).forEach(([permType, enabled]) => {
            if (enabled) {
              promises.push(
                authFetch('http://localhost:8000/api/permissions/', {
                  method: 'POST',
                  body: JSON.stringify({
                    user: userId,
                    page: pageName,
                    permission_type: permType
                  }),
                })
              );
            }
          });
        });
      });

      await Promise.all(promises);
      setShowBulkModal(false);
      setSuccess('Bulk permissions updated successfully');
      fetchData(); // Refresh data
    } catch (err) {
      setError('Failed to update bulk permissions');
    } finally {
      setSubmitting(false);
    }
  };

  const getPermissionBadges = (userId, pageName) => {
    const userPerms = permissions[userId]?.[pageName] || [];
    if (userPerms.length === 0) {
      return <Badge bg="secondary">No Access</Badge>;
    }

    return userPerms.map((perm, index) => (
      <Badge key={index} bg="primary" className="me-1">
        {perm}
      </Badge>
    ));
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
    <div className="permission-management-container">
      <Container className="mt-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <h2>Permission Management</h2>
              <ButtonGroup>
                <Button variant="primary" onClick={openBulkModal}>
                  <i className="fas fa-users me-2"></i>
                  Bulk Update
                </Button>
                <Button variant="outline-secondary" onClick={fetchData}>
                  <i className="fas fa-sync-alt me-2"></i>
                  Refresh
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

        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Permission Matrix</h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        {pages.map(page => (
                          <th key={page.id} className="text-center">
                            <div>{page.display_name}</div>
                            <small className="text-muted">{page.name}</small>
                          </th>
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
                          <td>{getRoleBadge(user.role)}</td>
                          {pages.map(page => (
                            <td key={page.id} className="text-center">
                              <div className="permission-cell">
                                {getPermissionBadges(user.id, page.name)}
                                <div className="permission-controls mt-2">
                                  <Form.Check
                                    inline
                                    type="checkbox"
                                    label="View"
                                    checked={hasPermission(user.id, page.name, 'view')}
                                    onChange={() => togglePermission(user.id, page.name, 'view')}
                                    disabled={user.role === 'super_admin'}
                                  />
                                  <Form.Check
                                    inline
                                    type="checkbox"
                                    label="Edit"
                                    checked={hasPermission(user.id, page.name, 'edit')}
                                    onChange={() => togglePermission(user.id, page.name, 'edit')}
                                    disabled={user.role === 'super_admin'}
                                  />
                                  <Form.Check
                                    inline
                                    type="checkbox"
                                    label="Create"
                                    checked={hasPermission(user.id, page.name, 'create')}
                                    onChange={() => togglePermission(user.id, page.name, 'create')}
                                    disabled={user.role === 'super_admin'}
                                  />
                                  <Form.Check
                                    inline
                                    type="checkbox"
                                    label="Delete"
                                    checked={hasPermission(user.id, page.name, 'delete')}
                                    onChange={() => togglePermission(user.id, page.name, 'delete')}
                                    disabled={user.role === 'super_admin'}
                                  />
                                </div>
                              </div>
                            </td>
                          ))}
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => openUserModal(user)}
                              disabled={user.role === 'super_admin'}
                            >
                              Manage
                            </Button>
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

      {/* Bulk Update Modal */}
      <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Bulk Permission Update</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Select Users</Form.Label>
                <Form.Select 
                  multiple 
                  value={bulkPermissions.users}
                  onChange={(e) => setBulkPermissions(prev => ({
                    ...prev,
                    users: Array.from(e.target.selectedOptions, option => option.value)
                  }))}
                >
                  {users.filter(user => user.role !== 'super_admin').map(user => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Hold Ctrl/Cmd to select multiple users
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Select Pages</Form.Label>
                <Form.Select 
                  multiple 
                  value={bulkPermissions.pages}
                  onChange={(e) => setBulkPermissions(prev => ({
                    ...prev,
                    pages: Array.from(e.target.selectedOptions, option => option.value)
                  }))}
                >
                  {pages.map(page => (
                    <option key={page.id} value={page.name}>
                      {page.display_name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Hold Ctrl/Cmd to select multiple pages
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3">
            <Form.Label>Permissions to Grant</Form.Label>
            <div>
              <Form.Check
                inline
                type="checkbox"
                label="View"
                checked={bulkPermissions.permissions.view}
                onChange={(e) => setBulkPermissions(prev => ({
                  ...prev,
                  permissions: { ...prev.permissions, view: e.target.checked }
                }))}
              />
              <Form.Check
                inline
                type="checkbox"
                label="Edit"
                checked={bulkPermissions.permissions.edit}
                onChange={(e) => setBulkPermissions(prev => ({
                  ...prev,
                  permissions: { ...prev.permissions, edit: e.target.checked }
                }))}
              />
              <Form.Check
                inline
                type="checkbox"
                label="Create"
                checked={bulkPermissions.permissions.create}
                onChange={(e) => setBulkPermissions(prev => ({
                  ...prev,
                  permissions: { ...prev.permissions, create: e.target.checked }
                }))}
              />
              <Form.Check
                inline
                type="checkbox"
                label="Delete"
                checked={bulkPermissions.permissions.delete}
                onChange={(e) => setBulkPermissions(prev => ({
                  ...prev,
                  permissions: { ...prev.permissions, delete: e.target.checked }
                }))}
              />
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleBulkUpdate} disabled={submitting}>
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              'Update Permissions'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* User Permission Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Manage Permissions - {selectedUser?.email}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="table-responsive">
            <Table striped bordered>
              <thead>
                <tr>
                  <th>Page</th>
                  <th>View</th>
                  <th>Edit</th>
                  <th>Create</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {pages.map(page => (
                  <tr key={page.id}>
                    <td>
                      <strong>{page.display_name}</strong><br />
                      <small className="text-muted">{page.name}</small>
                    </td>
                    <td className="text-center">
                      <Form.Check
                        type="checkbox"
                        checked={hasPermission(selectedUser?.id, page.name, 'view')}
                        onChange={() => togglePermission(selectedUser?.id, page.name, 'view')}
                      />
                    </td>
                    <td className="text-center">
                      <Form.Check
                        type="checkbox"
                        checked={hasPermission(selectedUser?.id, page.name, 'edit')}
                        onChange={() => togglePermission(selectedUser?.id, page.name, 'edit')}
                      />
                    </td>
                    <td className="text-center">
                      <Form.Check
                        type="checkbox"
                        checked={hasPermission(selectedUser?.id, page.name, 'create')}
                        onChange={() => togglePermission(selectedUser?.id, page.name, 'create')}
                      />
                    </td>
                    <td className="text-center">
                      <Form.Check
                        type="checkbox"
                        checked={hasPermission(selectedUser?.id, page.name, 'delete')}
                        onChange={() => togglePermission(selectedUser?.id, page.name, 'delete')}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PermissionManagement;
