import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faFileAlt, faCog, faChartBar, 
  faPlus, faUserCog, faShieldAlt, faClipboardList
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { user, authFetch, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch users and pages in parallel using authFetch
      const [usersResponse, pagesResponse] = await Promise.all([
        authFetch('http://localhost:8000/api/users/'),
        authFetch('http://localhost:8000/api/pages/')
      ]);

      if (usersResponse.ok && pagesResponse.ok) {
        const [usersData, pagesData] = await Promise.all([
          usersResponse.json(),
          pagesResponse.json()
        ]);

        setUsers(usersData);
        setPages(pagesData);
      } else {
        if (usersResponse.status === 401 || pagesResponse.status === 401) {
          setError('Session expired. Please login again.');
          setTimeout(() => {
            logout();
            navigate('/login');
          }, 2000);
        } else {
          setError('Failed to load dashboard data');
        }
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewUser = () => {
    navigate('/users');
  };

  const handleManagePermissions = () => {
    navigate('/permissions');
  };

  const handleViewSystemLogs = () => {
    setSuccess('System logs feature coming soon!');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <Container fluid>
          <Row className="align-items-center">
            <Col>
              <h1 className="dashboard-title">
                <FontAwesomeIcon icon={faShieldAlt} className="me-3" />
                Super Admin Dashboard
              </h1>
              <p className="dashboard-subtitle">
                Welcome back, {user?.email} ({user?.role === 'super_admin' ? 'Super Admin' : 'User'})
              </p>
            </Col>
            <Col xs="auto">
              <Button variant="outline-danger" onClick={handleLogout}>
                <FontAwesomeIcon icon={faCog} className="me-2" />
                Logout
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      <Container fluid className="mt-4">
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

        {/* Quick Stats */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="stat-icon bg-primary">
                    <FontAwesomeIcon icon={faUsers} />
                  </div>
                  <div className="stat-content">
                    <h3>{users.length}</h3>
                    <p>Total Users</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="stat-icon bg-success">
                    <FontAwesomeIcon icon={faFileAlt} />
                  </div>
                  <div className="stat-content">
                    <h3>{pages.length}</h3>
                    <p>Active Pages</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="stat-icon bg-warning">
                    <FontAwesomeIcon icon={faChartBar} />
                  </div>
                  <div className="stat-content">
                    <h3>{users.filter(u => u.is_active).length}</h3>
                    <p>Active Users</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="stat-icon bg-info">
                    <FontAwesomeIcon icon={faClipboardList} />
                  </div>
                  <div className="stat-content">
                    <h3>{users.filter(u => u.role === 'super_admin').length}</h3>
                    <p>Super Admins</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Main Content */}
        <Row>
          {/* Quick Actions */}
          <Col lg={4}>
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">
                  <FontAwesomeIcon icon={faUserCog} className="me-2" />
                  Quick Actions
                </h5>
              </Card.Header>
              <Card.Body>
                <Button variant="primary" className="w-100 mb-2" onClick={handleAddNewUser}>
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  Add New User
                </Button>
                <Button variant="outline-primary" className="w-100 mb-2" onClick={handleManagePermissions}>
                  <FontAwesomeIcon icon={faShieldAlt} className="me-2" />
                  Manage Permissions
                </Button>
                <Button variant="outline-secondary" className="w-100 mb-2" onClick={() => navigate('/users')}>
                  <FontAwesomeIcon icon={faUsers} className="me-2" />
                  User Management
                </Button>
                <Button variant="outline-secondary" className="w-100 mb-2" onClick={() => navigate('/permissions')}>
                  <FontAwesomeIcon icon={faClipboardList} className="me-2" />
                  Permission Matrix
                </Button>
                <Button variant="outline-secondary" className="w-100" onClick={handleViewSystemLogs}>
                  <FontAwesomeIcon icon={faChartBar} className="me-2" />
                  View System Logs
                </Button>
              </Card.Body>
            </Card>
          </Col>
          
          {/* Dynamic Pages Section */}
          <Col lg={8}>
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">
                  <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                  Dynamic Pages
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6 className="text-muted mb-3">Business Pages</h6>
                    <div className="d-grid gap-2">
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => navigate('/page/products_list')}
                        className="text-start"
                      >
                        <i className="fas fa-box me-2"></i>
                        Products List
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => navigate('/page/marketing_list')}
                        className="text-start"
                      >
                        <i className="fas fa-bullhorn me-2"></i>
                        Marketing List
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => navigate('/page/order_list')}
                        className="text-start"
                      >
                        <i className="fas fa-shopping-cart me-2"></i>
                        Order List
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => navigate('/page/media_plans')}
                        className="text-start"
                      >
                        <i className="fas fa-tv me-2"></i>
                        Media Plans
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => navigate('/page/offer_pricing_skus')}
                        className="text-start"
                      >
                        <i className="fas fa-tags me-2"></i>
                        Offer Pricing SKUs
                      </Button>
                    </div>
                  </Col>
                  <Col md={6}>
                    <h6 className="text-muted mb-3">Management Pages</h6>
                    <div className="d-grid gap-2">
                      <Button 
                        variant="outline-success" 
                        size="sm" 
                        onClick={() => navigate('/page/clients')}
                        className="text-start"
                      >
                        <i className="fas fa-users me-2"></i>
                        Clients
                      </Button>
                      <Button 
                        variant="outline-success" 
                        size="sm" 
                        onClick={() => navigate('/page/suppliers')}
                        className="text-start"
                      >
                        <i className="fas fa-truck me-2"></i>
                        Suppliers
                      </Button>
                      <Button 
                        variant="outline-success" 
                        size="sm" 
                        onClick={() => navigate('/page/customer_support')}
                        className="text-start"
                      >
                        <i className="fas fa-headset me-2"></i>
                        Customer Support
                      </Button>
                      <Button 
                        variant="outline-success" 
                        size="sm" 
                        onClick={() => navigate('/page/sales_reports')}
                        className="text-start"
                      >
                        <i className="fas fa-chart-line me-2"></i>
                        Sales Reports
                      </Button>
                      <Button 
                        variant="outline-success" 
                        size="sm" 
                        onClick={() => navigate('/page/finance_accounting')}
                        className="text-start"
                      >
                        <i className="fas fa-calculator me-2"></i>
                        Finance & Accounting
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recent Activity */}
        <Row className="mt-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-secondary text-white">
                <h5 className="mb-0">
                  <FontAwesomeIcon icon={faChartBar} className="me-2" />
                  Recent Activity
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="text-center py-4">
                  <FontAwesomeIcon icon={faChartBar} size="3x" className="text-muted mb-3" />
                  <p className="text-muted">Activity tracking coming soon!</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Dashboard;
