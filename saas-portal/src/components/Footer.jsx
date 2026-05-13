import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Share2, Send, Briefcase, Code2, Globe } from 'lucide-react';
import useThemeStore from '../store/useThemeStore';
import './Footer.css';

const Footer = () => {
  const { theme } = useThemeStore();

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <footer className="main-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Section */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-logo">
              <img
                src={isDark ? '/Logo_Dark.png' : '/Logo_Light.png'}
                alt="WA-Mitra"
                style={{ height: '45px', marginBottom: '20px' }}
              />
            </Link>
            <p className="footer-description">
              Empowering businesses with enterprise-grade WhatsApp automation.
              Built for reliability, scale, and seamless communication.
            </p>

          </div>

          {/* Quick Links */}
          <div className="footer-links-col">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><Link to="/docs">API Reference</Link></li>
              {/* <li><a href="#pricing">Pricing Plans</a></li> */}
              {/* <li><Link to="/register">Free Trial</Link></li> */}
            </ul>
          </div>

          {/* Platform Section */}
          <div className="footer-links-col">
            <h4>Platform</h4>
            <ul>
              <li><a href="#features">Multi-Instance</a></li>
              <li><a href="#features">API Gateway</a></li>
              <li><a href="#features">Message Automation</a></li>
              <li><a href="#features">Real-time Webhooks</a></li>
              <li><a href="#features">Media Support</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-links-col">
            <h4>Contact Us</h4>
            <ul className="contact-list">
              <li>
                <Mail size={16} />
                <span className="contact-text">hr@allysoftsolutions.com</span>
              </li>

              <li>
                <MapPin size={16} />
                <span className="contact-text">Rajkot, Gujarat, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright-text">&copy; {new Date().getFullYear()} WA-Mitra. All rights reserved.</p>
          <p className="developed-by-text">
            Developed by <a href="https://allysoftsolutions.com" target="_blank" rel="noopener noreferrer" className="allysoft-link yellow-brand"> Allysoft Solutions</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
