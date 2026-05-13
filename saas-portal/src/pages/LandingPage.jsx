import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Shield,
  MessageSquare,
  Smartphone,
  Cpu,
  Layers,
  CheckCircle2,
  ArrowRight,
  Send,
  Code2,
  BarChart4,
  Plus,
  Minus
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <Navbar />

      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content animate-fade-in">
            <div className="badge">
              <span className="badge-dot"></span>
              New: Multi-Instance V2 is live
            </div>
            <h1>
              The Enterprise <span className="text-gradient">WhatsApp Gateway</span>
            </h1>
            <p className="hero-desc">
              Connect multiple WhatsApp instances through a unified REST API.
              Built for reliability, speed, and production-scale automation.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn-hero-primary">
                Get Started Free <ArrowRight size={20} />
              </Link>
              <Link to="/docs" className="btn-hero-secondary">
                View Documentation
              </Link>
            </div>
          </div>

          <div className="hero-visual animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="dashboard-preview glass">
              <div className="preview-header">
                <div className="preview-dots"><span></span><span></span><span></span></div>
                <div className="preview-title">Dashboard Overview</div>
              </div>
              <div className="preview-body">
                <div className="preview-stat-grid">
                  <div className="p-stat">
                    <span className="p-label">Active Instances</span>
                    <span className="p-value">12</span>
                  </div>
                  <div className="p-stat">
                    <span className="p-label">Messages Today</span>
                    <span className="p-value">2.4k</span>
                  </div>
                </div>
                <div className="preview-chart">
                  <div className="chart-bar" style={{ height: '40%' }}></div>
                  <div className="chart-bar" style={{ height: '60%' }}></div>
                  <div className="chart-bar" style={{ height: '45%' }}></div>
                  <div className="chart-bar" style={{ height: '80%' }}></div>
                  <div className="chart-bar" style={{ height: '55%' }}></div>
                  <div className="chart-bar" style={{ height: '70%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">Designed for Scale</h2>
            <p className="section-subtitle">Everything you need to power your business communication.</p>
          </div>

          <div className="features-grid">
            <FeatureCard
              icon={<Layers />}
              title="Multi-Instance"
              desc="Manage multiple WhatsApp accounts through a single portal with ease."
            />
            <FeatureCard
              icon={<Zap />}
              title="Lightning Fast"
              desc="Optimized Baileys-core for sub-second message delivery."
            />
            <FeatureCard
              icon={<Shield />}
              title="Secure Sessions"
              desc="End-to-end encrypted sessions with automatic auto-reconnect."
            />
            <FeatureCard
              icon={<Code2 />}
              title="RESTful API"
              desc="Simple JSON endpoints that integrate with any tech stack."
            />
            <FeatureCard
              icon={<BarChart4 />}
              title="Real-time Stats"
              desc="Monitor your message flow and instance health in real-time."
            />
            <FeatureCard
              icon={<Send />}
              title="Media Support"
              desc="Send images, PDFs, and documents as easily as text messages."
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">Have questions? We have answers.</p>
          </div>

          <div className="faq-list">
            <FAQItem 
              question="What is WA-Mitra?" 
              answer="WA-Mitra is an enterprise-grade WhatsApp Gateway that allows developers to connect multiple WhatsApp accounts and interact with them via a clean REST API. It's built for scale, automation, and high reliability." 
            />
            <FAQItem 
              question="How many WhatsApp instances can I connect?" 
              answer="Depending on your plan, you can connect anywhere from 1 to 100+ instances. Our infrastructure is designed to handle multiple concurrent sessions with automatic reconnection." 
            />
            <FAQItem 
              question="Is my data and session secure?" 
              answer="Yes. We use industry-standard encryption for session storage. Your WhatsApp sessions are managed securely, and we never access your message content beyond what is necessary for the API relay." 
            />
            <FAQItem 
              question="Do you support media messages?" 
              answer="Absolutely. You can send and receive images, videos, PDFs, audio files, and documents through our unified API endpoints." 
            />
            <FAQItem 
              question="Can I integrate WA-Mitra with my CRM?" 
              answer="Yes, our REST API and Webhook system make it incredibly easy to integrate with any platform, including Salesforce, HubSpot, or your custom internal CRM." 
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-card">
            <h2>Ready to automate your WhatsApp?</h2>
            <p>Join thousands of businesses scaling their communication with WA-Mitra.</p>
            <Link to="/register" className="btn-hero-primary">Start Your Free Trial</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="feature-card glass">
    <div className="feature-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{desc}</p>
  </div>
);

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className={`faq-item glass ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
      <div className="faq-question">
        <span>{question}</span>
        <div className="faq-toggle">
          {isOpen ? <Minus size={20} /> : <Plus size={20} />}
        </div>
      </div>
      {isOpen && (
        <div className="faq-answer animate-slide-down">
          {answer}
        </div>
      )}
    </div>
  );
};

export default LandingPage;
