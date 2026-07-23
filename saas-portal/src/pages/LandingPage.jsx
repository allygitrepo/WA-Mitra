import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Shield,
  Layers,
  ArrowRight,
  Send,
  Code2,
  BarChart4,
  Plus,
  Minus,
  CheckCircle2,
  Smartphone,
  Activity,
  Globe,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Packages from '../components/Packages';
import useAuthStore from '../store/useAuthStore';
import './LandingPage.css';

const LandingPage = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="landing-container animate-fade-in">
      <Navbar />

      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <div className="badge-pill">
              <span className="badge-pulse-dot"></span>
              <span>New Release V2.0 • Multi-Instance REST Gateway is Live</span>
            </div>
            
            <h1 className="hero-title">
              The Enterprise <br />
              <span className="text-emerald-gradient">WhatsApp Gateway</span>
            </h1>
            
            <p className="hero-desc">
              Connect multiple WhatsApp instances, blast bulk campaigns, schedule automated messaging, and integrate real-time webhooks through a high-performance REST API.
            </p>

            <div className="hero-actions">
              {!isAuthenticated ? (
                <Link to="/register" className="btn-hero-primary">
                  Get Started Free <ArrowRight size={18} />
                </Link>
              ) : (
                <Link to="/dashboard" className="btn-hero-primary">
                  Go to Dashboard <ArrowRight size={18} />
                </Link>
              )}
              <Link to="/docs" className="btn-hero-secondary">
                View API Documentation
              </Link>
            </div>

            <div className="hero-trust-metrics">
              <div className="metric-item">
                <span className="metric-val">99.99%</span>
                <span className="metric-lbl">Uptime SLA</span>
              </div>
              <div className="metric-divider"></div>
              <div className="metric-item">
                <span className="metric-val">Sub-second</span>
                <span className="metric-lbl">Message Delivery</span>
              </div>
              <div className="metric-divider"></div>
              <div className="metric-item">
                <span className="metric-val">256-bit</span>
                <span className="metric-lbl">Session Encryption</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="dashboard-preview-card glass-hero-card">
              <div className="preview-top-bar">
                <div className="preview-dots">
                  <span className="dot-red"></span>
                  <span className="dot-yellow"></span>
                  <span className="dot-green"></span>
                </div>
                <div className="preview-live-status">
                  <span className="live-ping"></span> Gateway Connected
                </div>
              </div>

              <div className="preview-inner">
                <div className="preview-stat-row">
                  <div className="p-stat-box">
                    <div className="p-stat-icon emerald"><Smartphone size={18} /></div>
                    <div>
                      <span className="p-stat-num">12</span>
                      <span className="p-stat-title">Active Instances</span>
                    </div>
                  </div>
                  <div className="p-stat-box">
                    <div className="p-stat-icon indigo"><Send size={18} /></div>
                    <div>
                      <span className="p-stat-num">48.2k</span>
                      <span className="p-stat-title">Messages Sent</span>
                    </div>
                  </div>
                </div>

                <div className="preview-log-preview">
                  <div className="log-row-item">
                    <CheckCircle2 size={15} className="text-emerald" />
                    <span className="log-text">Campaign #104 delivered to +91 90239...</span>
                    <span className="log-time">Just now</span>
                  </div>
                  <div className="log-row-item">
                    <CheckCircle2 size={15} className="text-emerald" />
                    <span className="log-text">Auto-reply triggered for keyword "PRICE"</span>
                    <span className="log-time">2m ago</span>
                  </div>
                  <div className="log-row-item">
                    <CheckCircle2 size={15} className="text-emerald" />
                    <span className="log-text">Instance "Sales-01" reconnected</span>
                    <span className="log-time">5m ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-head-centered">
            <span className="section-tag">ENGINEERED FOR PRODUCTION</span>
            <h2 className="section-title">Built for Modern Businesses & Developers</h2>
            <p className="section-subtitle">Everything you need to automate, broadcast, and scale your WhatsApp communication seamlessly.</p>
          </div>

          <div className="features-grid">
            <FeatureCard
              icon={<Layers size={24} />}
              badgeColor="emerald"
              title="Multi-Instance Orchestration"
              desc="Connect and manage multiple WhatsApp accounts from a centralized SaaS dashboard with automated failover."
            />
            <FeatureCard
              icon={<Zap size={24} />}
              badgeColor="indigo"
              title="Lightning Fast REST API"
              desc="Sub-second message dispatching with simple JSON payloads, webhooks, and granular error tracebacks."
            />
            <FeatureCard
              icon={<MessageSquare size={24} />}
              badgeColor="cyan"
              title="AI Keyword Auto-Replies"
              desc="Set up smart keyword triggers, automated greetings, and instant customer support flows without writing code."
            />
            <FeatureCard
              icon={<Code2 size={24} />}
              badgeColor="purple"
              title="Bulk Messaging & Scheduling"
              desc="Schedule broadcasts, cycle numbers automatically to prevent rate-limits, and monitor campaign performance."
            />
            <FeatureCard
              icon={<BarChart4 size={24} />}
              badgeColor="emerald"
              title="Real-time Analytics & Logs"
              desc="Track message delivery rates, status callbacks, failure reasons, and export detailed PDF/CSV reports."
            />
            <FeatureCard
              icon={<Shield size={24} />}
              badgeColor="cyan"
              title="Encrypted Isolated Sessions"
              desc="Every WhatsApp session is isolated with individual container sessions and auto-reconnect listeners."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section Wrapper */}
      <section id="pricing" className="pricing-landing-wrapper">
        <div className="container">
          <div className="section-head-centered">
            <span className="section-tag">TRANSPARENT PRICING</span>
            <h2 className="section-title">Simple Plans for Every Scale</h2>
            <p className="section-subtitle">Pick the right package for your WhatsApp gateway needs. Upgrade or switch plans anytime.</p>
          </div>
          <Packages hideHeader={true} showButtons={true} />
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="container">
          <div className="section-head-centered">
            <span className="section-tag">GOT QUESTIONS?</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">Find answers to common questions about WA-Mitra features, API, and billing.</p>
          </div>

          <div className="faq-list">
            <FAQItem
              question="What is WA-Mitra WhatsApp Gateway?"
              answer="WA-Mitra is an enterprise-grade WhatsApp REST API Gateway that enables businesses and developers to connect multiple WhatsApp accounts and automate messaging, bulk broadcasts, and webhook integrations."
            />
            <FAQItem
              question="How many WhatsApp instances can I run simultaneously?"
              answer="Depending on your selected plan, you can connect from 1 to multiple active WhatsApp instances. Each instance runs in an isolated session with independent QR pairing."
            />
            <FAQItem
              question="Can I send images, PDFs, and documents via API?"
              answer="Yes! WA-Mitra fully supports text, images, videos, audio files, PDFs, and documents through clean REST API endpoints."
            />
            <FAQItem
              question="How does message scheduling and auto-replies work?"
              answer="You can set up keyword rules in your dashboard for instant auto-replies, or use our scheduling tool to queue bulk campaigns at specific dates and times."
            />
            <FAQItem
              question="Can I upgrade or renew my plan anytime?"
              answer="Yes, you can upgrade your plan or renew existing active plans directly from your dashboard using Razorpay instant checkout."
            />
          </div>
        </div>
      </section>

      {/* CTA Conversion Banner */}
      <section className="cta-banner-section">
        <div className="container">
          <div className="cta-glass-card">
            <div className="cta-content">
              <h2>Ready to Supercharge Your WhatsApp Messaging?</h2>
              <p>Start connecting instances and sending messages in under 2 minutes.</p>
            </div>
            <div className="cta-btn-wrap">
              <Link to="/register" className="btn-hero-primary btn-cta-large">
                Get Started Free <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, badgeColor = "emerald" }) => (
  <div className="landing-feature-card glass-card">
    <div className={`landing-feature-icon ${badgeColor}`}>
      {icon}
    </div>
    <h3>{title}</h3>
    <p>{desc}</p>
  </div>
);

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`landing-faq-item glass-card ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
      <div className="faq-question-row">
        <h3>{question}</h3>
        <div className="faq-icon-toggle">
          {isOpen ? <Minus size={18} /> : <Plus size={18} />}
        </div>
      </div>
      {isOpen && (
        <div className="faq-answer-content animate-slide-down">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
