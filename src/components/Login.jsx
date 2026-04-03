import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import keycloak from "../keycloak";
import {
  Key,
  Building2,
  ShieldCheck,
  Search,
  Eye,
  EyeOff,
  ChevronRight,
  Check,
  HelpCircle,
  MapPin,
  Users,
  CreditCard,
  Settings,
  FileText,
  X,
  UserPlus,
  Printer,
  Info
} from 'lucide-react';
import './Login.css';

const roles = [
  {
    id: 'farmer',
    title: 'Farmer',
    subtitle: 'OMH PORTAL',
    description: 'Farmer portal & applications',
    icon: <Key size={20} />,
    theme: 'green'
  },
  {
    id: 'bank',
    title: 'Bank User',
    subtitle: 'DESKTOP PREFERRED',
    description: 'Manage loan products & criteria',
    icon: <Building2 size={20} />,
    theme: 'blue'
  },
  {
    id: 'admin',
    title: 'Admin User',
    subtitle: 'ADMIN',
    description: 'Portal oversight & consent logs',
    icon: <ShieldCheck size={20} />,
    theme: 'purple'
  },
  {
    id: 'super',
    title: 'Super User',
    subtitle: 'FULL ACCESS',
    description: 'All roles & system settings',
    icon: <Search size={20} />,
    theme: 'slate'
  }
];

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('farmer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const helpWindowRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (helpWindowRef.current && !helpWindowRef.current.contains(event.target)) {
        setIsHelpOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleMapping = {
    farmer: 'Farmer',
    bank: 'Bank User',
    admin: 'Admin',
    super: 'Super User'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await keycloak.login();
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  return (
    <div className="layout-container">
      {/* Left Section - Background Image and Messaging */}
      <div className="hero-section">
        <div className="hero-overlay"></div>
        <img src="/agriculture-bg.png" alt="Agriculture Background" className="hero-image" />

        <div className="hero-content">
          <h1>Transforming agriculture through data</h1>
          <p className="hero-subtext">
            OpenAgriNet Ethiopia connects farmers, banks, and institutions with
            integrated registries, finance tools, and consent management —
            powered by ATI and partner banks.
          </p>

          <div className="divider"></div>

          <div className="openagrinet-container">
            <div className="brand-identity">
              <div className="brand-header">
                <div className="brand-title">
                  <span className="brand-name">
                    <MapPin size={36} color="#22c55e" strokeWidth={2.5} className="brand-icon" />
                    OPENAGRINET
                  </span>
                  <span className="brand-tagline">Agricultural Transformation Platform</span>
                </div>
              </div>
              <div className="brand-body">


                <div className="feature-points-horizontal">
                  <div className="feature-point-inline">
                    <div className="feature-point-icon">
                      <Users size={20} />
                    </div>
                    <div className="feature-point-text">
                      <h4>Farmer & Cooperative Registry</h4>
                    </div>
                  </div>
                  <div className="feature-point-inline">
                    <div className="feature-point-icon">
                      <CreditCard size={20} />
                    </div>
                    <div className="feature-point-text">
                      <h4>Agricultural Finance Portal</h4>
                    </div>
                  </div>
                  <div className="feature-point-inline">
                    <div className="feature-point-icon">
                      <Settings size={20} />
                    </div>
                    <div className="feature-point-text">
                      <h4>Bank & ATI Admin Tools</h4>
                    </div>
                  </div>
                  <div className="feature-point-inline">
                    <div className="feature-point-icon">
                      <FileText size={20} />
                    </div>
                    <div className="feature-point-text">
                      <h4>Consent & Audit Logs</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="login-section">
        <div className="login-header-bar">
          <div className="ati-logo-container">
            <div className="key-badge">
              <Key size={32} color="#fff" />
            </div>
            <div className="ati-text">
              <span className="ati-brand">OPENAGRINET</span>
              <span className="ati-region">Ethiopia</span>
              <span className="ati-org">Agricultural Transformation Institute</span>
            </div>
          </div>
        </div>

        <div className="form-container">
          <h2 className="sign-in-title">Sign in</h2>
          <p className="sign-in-instruction">
            Select your role to continue. You can switch roles after signing in.
          </p>

          <div className="role-selector">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`role-card theme-${role.theme} ${selectedRole === role.id ? 'active' : ''}`}
                onClick={() => setSelectedRole(role.id)}
              >
                <div className="role-icon-container">
                  {role.icon}
                </div>
                <div className="role-info">
                  <div className="role-title-row">
                    <span className="role-title">{role.title}</span> &nbsp;&nbsp;
                    <span className="role-subtitle">{role.subtitle}</span>
                  </div>
                  <div className="role-description">{role.description}</div>
                </div>
                <div className="role-radio">
                  <div className={`radio-outer ${selectedRole === role.id ? 'selected' : ''}`}>
                    <div className="radio-inner"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form className="sign-in-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email or mobile number</label>
              <input
                type="text"
                id="email"
                placeholder="Optional — enter email or mobile for demo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group password-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Optional — leave blank for demo"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="show-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="forgot-password-row">
              <a href="#">Forgot password?</a>
            </div>

            <div className="form-actions-row">
              <button type="submit" className="login-submit-btn">
                Sign In
              </button>
              <button type="button" className="sign-up-btn">
                Sign Up
              </button>
              <div className="login-help-wrapper" ref={helpWindowRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className={`inline-help-btn ${isHelpOpen ? 'open' : ''}`}
                  onClick={() => setIsHelpOpen(!isHelpOpen)}
                >
                  {isHelpOpen ? <X size={24} /> : <HelpCircle size={24} />}
                </button>
                {isHelpOpen && (
                  <div className="help-popup-window login-help-popup">
                    <div className="help-popup-header">
                      <h4 className="help-popup-title">Platform Help & Support</h4>
                    </div>
                    <div className="help-popup-content">
                      <div className="help-section">
                        <h5 className="help-section-title">Adding a New Farmer</h5>
                        <p className="help-section-text">Click "Add New Farmer" and follow the 4-step registration wizard. All fields marked with * are required.</p>
                      </div>
                      <div className="help-section">
                        <h5 className="help-section-title">Searching & Filtering</h5>
                        <p className="help-section-text">Use the search bar to find farmers by ID or name. Apply filters by Region, Woreda, and Status to narrow results.</p>
                      </div>
                      <div className="help-section">
                        <h5 className="help-section-title">Viewing Farmer Details</h5>
                        <p className="help-section-text">Click the action menu (⋮) on any farmer row and select "View" to see complete profile information.</p>
                      </div>
                      <div className="help-section">
                        <h5 className="help-section-title">Printing ID Cards</h5>
                        <p className="help-section-text">Navigate to the farmer's profile and click "Print ID" to generate a printable ID card.</p>
                      </div>
                    </div>
                    <div className="help-popup-footer">
                      For technical support, contact: support@openagrinet.et
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>


    </div>
  );
};

export default Login;

