import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faLock, faSignInAlt, faEye, faEyeSlash, 
  faKey, faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import PasswordRecovery from './PasswordRecovery';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        login(data.user, {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
        // Redirect to dashboard after successful login
        navigate('/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (showPasswordRecovery) {
    return (
      <PasswordRecovery onBackToLogin={() => setShowPasswordRecovery(false)} />
    );
  }

  return (
    <div className="login-container">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5} xl={4}>
            <Card className="shadow-lg">
              <Card.Header className="bg-primary text-white text-center">
                <h4 className="mb-0">
                  <FontAwesomeIcon icon={faSignInAlt} className="me-2" />
                  Super Admin Dashboard
                </h4>
              </Card.Header>
              <Card.Body className="p-4">
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                <div className="text-center mb-4">
                  <FontAwesomeIcon icon={faUser} size="3x" className="text-primary mb-3" />
                  <h5>Welcome Back</h5>
                  <p className="text-muted">
                    Sign in to access your dashboard
                  </p>
                </div>
                
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <div className="input-group">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                      />
                      <Button
                        variant="outline-secondary"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                      </Button>
                    </div>
                  </Form.Group>
                  
                  <div className="d-grid gap-2">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      disabled={loading}
                      className="mb-2"
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Signing In...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faSignInAlt} className="me-2" />
                          Sign In
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="link" 
                      onClick={() => setShowPasswordRecovery(true)}
                      className="text-decoration-none"
                    >
                      <FontAwesomeIcon icon={faKey} className="me-2" />
                      Forgot Password?
                    </Button>
                  </div>
                </Form>
                

              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;
