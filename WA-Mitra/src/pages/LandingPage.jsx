import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Zap, 
  Globe, 
  CheckCircle, 
  MessageSquare, 
  Smartphone, 
  Code,
  ArrowRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-content animate-fade-in">
          <h1 className="hero-title">
            Connect Your Business with <span className="gradient-text">WhatsApp</span>
          </h1>
          <p className="hero-subtitle">
            The most powerful, reliable, and multi-tenant WhatsApp Gateway for developers and businesses. 
            Automate messages, manage sessions, and scale your communication effortlessly.
          </p>
          <div className="hero-btns">
            <Link to="/register" className="btn-primary">
              Get Started Now <ArrowRight size={20} />
            </Link>
            <a href="#how-it-works" className="btn-secondary">
              How it Works
            </a>
          </div>
        </div>
        <div className="hero-bg-glow"></div>
      </section>

      {/* Features Section */}
      <section className="features container">
        <div className="section-header">
          <h2 className="section-title">Why Choose WA-Mitra?</h2>
          <p className="section-subtitle">Premium features designed for production-level reliability.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card glass">
            <div className="feature-icon"><Zap /></div>
            <h3>Instant Setup</h3>
            <p>Scan QR and start sending messages in seconds. No complex API approvals needed.</p>
          </div>
          <div className="feature-card glass">
            <div className="feature-icon"><Shield /></div>
            <h3>Secure & Private</h3>
            <p>Your sessions are encrypted and stored securely. We never read your messages.</p>
          </div>
          <div className="feature-card glass">
            <div className="feature-icon"><Code /></div>
            <h3>Developer Friendly</h3>
            <p>Robust REST API and webhooks to integrate with any application easily.</p>
          </div>
          <div className="feature-card glass">
            <div className="feature-icon"><Globe /></div>
            <h3>Multi-Tenant</h3>
            <p>Manage multiple WhatsApp accounts under a single dashboard effortlessly.</p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
          </div>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">01</div>
              <h3>Create Account</h3>
              <p>Register and verify your email to access the portal.</p>
            </div>
            <div className="step">
              <div className="step-number">02</div>
              <h3>Link WhatsApp</h3>
              <p>Go to your dashboard and scan the QR code using your WhatsApp app.</p>
            </div>
            <div className="step">
              <div className="step-number">03</div>
              <h3>Send Messages</h3>
              <p>Start sending messages via our portal or API endpoints.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Test Service Section */}
      <section className="test-service container">
        <div className="test-card glass">
          <div className="test-content">
            <h2>Ready to Test?</h2>
            <p>You can try our bulk messaging service or single message API immediately after registration. Join 500+ businesses using WA-Mitra.</p>
            <ul className="test-features">
              <li><CheckCircle size={18} color="var(--success)" /> 10 Free Daily Messages</li>
              <li><CheckCircle size={18} color="var(--success)" /> API Access Included</li>
              <li><CheckCircle size={18} color="var(--success)" /> Multi-device Support</li>
            </ul>
            <Link to="/register" className="btn-primary">Register for Free</Link>
          </div>
          <div className="test-visual">
            <div className="mock-chat glass">
              <div className="chat-header">
                <div className="chat-avatar"></div>
                <span>WA-Mitra Bot</span>
              </div>
              <div className="chat-body">
                <div className="chat-bubble left">Hello! How can we help you?</div>
                <div className="chat-bubble right">I want to automate my alerts.</div>
                <div className="chat-bubble left">Perfect! WA-Mitra API is ready.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer container">
        <p>&copy; 2026 WA-Mitra. All rights reserved by Allysoft.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
