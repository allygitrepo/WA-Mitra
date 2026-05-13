import React from 'react';
import { Book, Code, Terminal, Zap, ShieldCheck, Copy, Check } from 'lucide-react';
import './Docs.css';

const Docs = () => {
  const baseUrl = "https://silverapi.allysoftsolutions.com/wa-mitra";
  const [copied, setCopied] = React.useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="docs-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documentation</h1>
          <p className="page-subtitle">Learn how to integrate and use the WA-Mitra API effectively.</p>
        </div>
      </div>

      <div className="docs-layout">
        <div className="docs-main">
          {/* Getting Started */}
          <section id="getting-started" className="docs-section card glass">
            <div className="section-header">
              <Zap size={24} className="text-primary" />
              <h2>Getting Started</h2>
            </div>
            <div className="section-content">
              <p>WA-Mitra is a powerful multi-tenant WhatsApp Gateway that allows you to manage multiple sessions and send messages via a simple REST API.</p>
              <div className="step-list">
                <div className="step-item">
                  <span className="step-number">1</span>
                  <div className="step-text">
                    <h4>Create an Instance</h4>
                    <p>Go to the <strong>Instances</strong> tab and click "New Instance". Give it a name like "Support Line".</p>
                  </div>
                </div>
                <div className="step-item">
                  <span className="step-number">2</span>
                  <div className="step-text">
                    <h4>Link WhatsApp</h4>
                    <p>Click the "Power" icon on your instance and scan the generated QR code with your WhatsApp mobile app.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Authentication */}
          <section id="authentication" className="docs-section card glass">
            <div className="section-header">
              <ShieldCheck size={24} className="text-primary" />
              <h2>Authentication</h2>
            </div>
            <div className="section-content">
              <p>All API requests must include your Master API Token. Use the <code>Authorization</code> header with the <code>Bearer</code> scheme.</p>
              
              <div className="postman-req">
                <div className="pm-header">
                  <span className="pm-method">HEADERS</span>
                </div>
                <div className="pm-section">
                  <div className="pm-row">
                    <span className="pm-key">Authorization</span>
                    <span className="pm-val">Bearer mitra_abc123...</span>
                  </div>
                  <div className="pm-row">
                    <span className="pm-key">Content-Type</span>
                    <span className="pm-val">application/json</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Zero-Config Session Flow */}
          <section id="zero-config" className="docs-section card glass">
            <div className="section-header">
              <Zap size={24} className="text-primary" />
              <h2>Zero-Config External Sessions</h2>
            </div>
            <div className="section-content">
              <p>Create and link a new session entirely via the API by calling the initiate endpoint with an empty body.</p>
              
              <div className="postman-req">
                <div className="pm-header">
                  <span className="pm-method" style={{color: '#e2b0ff'}}>POST</span>
                  <span className="pm-url">{`${baseUrl}/api/v1/instance/initiate`}</span>
                </div>
                <div className="pm-section">
                  <span className="pm-section-title">Headers</span>
                  <div className="pm-row">
                    <span className="pm-key">Authorization</span>
                    <span className="pm-val">Bearer mitra_your_token</span>
                  </div>
                </div>
                <div className="pm-section">
                  <span className="pm-section-title">Body (JSON)</span>
                  <div className="pm-val">{`{ }`}</div>
                </div>
              </div>

              <div className="code-block-wrap">
                <div className="code-header"><span>Example Response</span></div>
                <pre><code>{`{
  "success": true,
  "qr": "data:image/png;base64,...",
  "instanceKey": "inst_8b108035af24b734"
}`}</code></pre>
              </div>
            </div>
          </section>

          {/* Send Message */}
          <section id="sending-messages" className="docs-section card glass">
            <div className="section-header">
              <Terminal size={24} className="text-primary" />
              <h2>Sending Messages</h2>
            </div>
            <div className="section-content">
              <h3>Send Text Message</h3>
              <p>Dispatch a plain text message to any WhatsApp number worldwide.</p>

              <div className="postman-req">
                <div className="pm-header">
                  <span className="pm-method" style={{color: '#e2b0ff'}}>POST</span>
                  <span className="pm-url">{`${baseUrl}/api/v1/messages/send`}</span>
                </div>
                <div className="pm-section">
                  <span className="pm-section-title">Body (JSON)</span>
                  <div className="code-block-wrap" style={{margin: 0, background: 'transparent'}}>
                    <pre style={{padding: 0}}><code>{`{
  "instanceKey": "inst_8b108035af24b734",
  "number": "919876543210",
  "message": "Hello from API!"
}`}</code></pre>
                  </div>
                </div>
              </div>

              <h3 style={{marginTop: '40px'}}>Send Media/Document</h3>
              <p>Use <code>form-data</code> to upload files and documents.</p>

              <div className="postman-req">
                <div className="pm-header">
                  <span className="pm-method" style={{color: '#e2b0ff'}}>POST</span>
                  <span className="pm-url">{`${baseUrl}/api/v1/messages/send`}</span>
                </div>
                <div className="pm-section">
                  <span className="pm-section-title">Body (form-data)</span>
                  <div className="pm-row">
                    <span className="pm-key">instanceKey</span>
                    <span className="pm-val">inst_8b108035af24b734</span>
                  </div>
                  <div className="pm-row">
                    <span className="pm-key">number</span>
                    <span className="pm-val">919876543210</span>
                  </div>
                  <div className="pm-row">
                    <span className="pm-key">file</span>
                    <span className="pm-val">attachment.pdf (File)</span>
                  </div>
                  <div className="pm-row">
                    <span className="pm-key">message</span>
                    <span className="pm-val">Here is your invoice</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="docs-sidebar">
          <div className="card glass sticky-docs-nav">
            <h3>Quick Navigation</h3>
            <ul>
              <li><a href="#getting-started">Getting Started</a></li>
              <li><a href="#authentication">Authentication</a></li>
              <li><a href="#zero-config">Zero-Config Sessions</a></li>
              <li><a href="#sending-messages">Sending Messages</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;
