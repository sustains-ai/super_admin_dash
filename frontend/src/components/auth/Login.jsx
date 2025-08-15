import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import AuthContext from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    console.log('Attempting login with:', formData);

    try {
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        console.log('Login successful, calling login function...');
        login(data.user, {
          access_token: data.access_token,
          refresh_token: data.refresh_token
        });
        
        console.log('Login function called, navigating...');
        // Redirect based on user role
        if (data.user.role === 'super_admin') {
          navigate('/dashboard');
        } else {
          // For regular users, redirect to their first accessible page
          navigate('/page/products_list');
        }
      } else {
        console.log('Login failed:', data);
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card shadow">
        <Card.Body className="p-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold text-primary">Super Admin Dashboard</h2>
            <p className="text-muted">Sign in to your account</p>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100 mb-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </Form>

          <div className="text-center">
            <small className="text-muted">
              Demo Credentials:<br />
              <strong>Super Admin:</strong> admin@superadmin.com<br />
              <strong>Password:</strong> vwP@TI^kpJ8r
            </small>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Login;
