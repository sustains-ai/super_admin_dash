import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, faKey, faShieldAlt, faArrowLeft, 
  faCheck, faTimes, faEye, faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import './PasswordRecovery.css';

const PasswordRecovery = ({ onBackToLogin }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/auth/password-reset/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        setSuccess('OTP sent successfully! Please check your email.');
        setStep(2);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/auth/password-reset/confirm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(),
          otp: otp.trim(),
          new_password: 'temp' // We'll set the actual password in the next step
        }),
      });

      if (response.ok) {
        setSuccess('OTP verified successfully!');
        setStep(3);
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/auth/password-reset/confirm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(),
          otp: otp.trim(),
          new_password: newPassword.trim()
        }),
      });

      if (response.ok) {
        setSuccess('Password reset successfully! You can now login with your new password.');
        setTimeout(() => {
          onBackToLogin();
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/auth/password-reset/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        setSuccess('New OTP sent successfully! Please check your email.');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, color: 'danger', text: 'Very Weak' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    const strengthMap = {
      1: { color: 'danger', text: 'Very Weak' },
      2: { color: 'warning', text: 'Weak' },
      3: { color: 'info', text: 'Fair' },
      4: { color: 'primary', text: 'Good' },
      5: { color: 'success', text: 'Strong' }
    };
    
    return { strength, ...strengthMap[strength] };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="password-recovery-container">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5} xl={4}>
            <Card className="shadow-lg">
              <Card.Header className="bg-primary text-white text-center">
                <h4 className="mb-0">
                  <FontAwesomeIcon icon={faShieldAlt} className="me-2" />
                  Password Recovery
                </h4>
              </Card.Header>
              <Card.Body className="p-4">
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError('')}>
                    <FontAwesomeIcon icon={faTimes} className="me-2" />
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                    <FontAwesomeIcon icon={faCheck} className="me-2" />
                    {success}
                  </Alert>
                )}

                {/* Step 1: Email Input */}
                {step === 1 && (
                  <div>
                    <div className="text-center mb-4">
                      <FontAwesomeIcon icon={faEnvelope} size="3x" className="text-primary mb-3" />
                      <h5>Enter Your Email</h5>
                      <p className="text-muted">
                        We'll send you a one-time password to reset your account.
                      </p>
                    </div>
                    
                    <Form onSubmit={handleSendOTP}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email address"
                          required
                        />
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
                              Sending OTP...
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                              Send OTP
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          onClick={onBackToLogin}
                        >
                          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                          Back to Login
                        </Button>
                      </div>
                    </Form>
                  </div>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                  <div>
                    <div className="text-center mb-4">
                      <FontAwesomeIcon icon={faKey} size="3x" className="text-primary mb-3" />
                      <h5>Enter OTP</h5>
                      <p className="text-muted">
                        We've sent a 6-digit code to <strong>{email}</strong>
                      </p>
                    </div>
                    
                    <Form onSubmit={handleVerifyOTP}>
                      <Form.Group className="mb-3">
                        <Form.Label>One-Time Password</Form.Label>
                        <Form.Control
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                          required
                        />
                        <Form.Text className="text-muted">
                          Enter the 6-digit code from your email
                        </Form.Text>
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
                              Verifying...
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faCheck} className="me-2" />
                              Verify OTP
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          onClick={handleResendOTP}
                          disabled={loading}
                        >
                          Resend OTP
                        </Button>
                        <Button 
                          variant="link" 
                          onClick={() => setStep(1)}
                          className="text-decoration-none"
                        >
                          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                          Back to Email
                        </Button>
                      </div>
                    </Form>
                  </div>
                )}

                {/* Step 3: New Password */}
                {step === 3 && (
                  <div>
                    <div className="text-center mb-4">
                      <FontAwesomeIcon icon={faKey} size="3x" className="text-primary mb-3" />
                      <h5>Set New Password</h5>
                      <p className="text-muted">
                        Create a strong password for your account
                      </p>
                    </div>
                    
                    <Form onSubmit={handleResetPassword}>
                      <Form.Group className="mb-3">
                        <Form.Label>New Password</Form.Label>
                        <div className="input-group">
                          <Form.Control
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
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
                        
                        {/* Password Strength Indicator */}
                        {newPassword && (
                          <div className="mt-2">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <small className="text-muted">Password Strength:</small>
                              <small className={`text-${passwordStrength.color}`}>
                                {passwordStrength.text}
                              </small>
                            </div>
                            <div className="progress" style={{ height: '4px' }}>
                              <div 
                                className={`progress-bar bg-${passwordStrength.color}`}
                                style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Confirm Password</Form.Label>
                        <div className="input-group">
                          <Form.Control
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                          />
                          <Button
                            variant="outline-secondary"
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                          </Button>
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                          <Form.Text className="text-danger">
                            Passwords do not match
                          </Form.Text>
                        )}
                      </Form.Group>
                      
                      <div className="d-grid gap-2">
                        <Button 
                          type="submit" 
                          variant="primary" 
                          disabled={loading || newPassword !== confirmPassword}
                          className="mb-2"
                        >
                          {loading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Resetting Password...
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faCheck} className="me-2" />
                              Reset Password
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="link" 
                          onClick={() => setStep(2)}
                          className="text-decoration-none"
                        >
                          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                          Back to OTP
                        </Button>
                      </div>
                    </Form>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default PasswordRecovery;
