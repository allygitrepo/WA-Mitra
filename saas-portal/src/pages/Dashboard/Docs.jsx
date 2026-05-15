import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Book, Code, Terminal, Zap, ShieldCheck, Copy, Check, ArrowLeft } from 'lucide-react';
import './Docs.css';

const Docs = () => {
  const location = useLocation();
  const isExternal = location.pathname === '/docs';
  const baseUrl = "https://silverapi.allysoftsolutions.com/wa-mitra";
  const [copied, setCopied] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className={`docs-wrapper ${isExternal ? 'external-page' : ''}`}>
      <div className={`docs-container ${isExternal ? 'external-docs' : ''}`}>
        <div className="page-header">
          <div className="header-brand-section">
            {isExternal && (
              <div className="docs-logo-container">
                <img src="/Logo_Light.png" alt="Logo" className="logo-light" />
                <img src="/Logo_Dark.png" alt="Logo" className="logo-dark" />
              </div>
            )}
            <div>
              <h1 className="page-title">Documentation</h1>
              <p className="page-subtitle">Learn how to integrate and use the WA-Mitra API effectively.</p>
            </div>
          </div>
          {isExternal && (
            <Link to="/" className="btn-primary">
              <ArrowLeft size={18} />
              <span>Back to Site</span>
            </Link>
          )}
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
                <p>Link a WhatsApp account entirely via the API. This flow is ideal for creating "On-the-fly" sessions without pre-configuring them in the dashboard.</p>

                {/* Visual Flow Diagram */}
                <div className="flow-container">
                  <div className="flow-diagram">
                    <div className="flow-step">
                      <div className="flow-icon-wrapper"><Terminal size={26} /></div>
                      <div className="flow-label">1. Initiate</div>
                      <div className="flow-sublabel">POST request with Bearer Token</div>
                      <div className="flow-line"></div>
                    </div>

                    <div className="flow-step">
                      <div className="flow-icon-wrapper"><Code size={26} /></div>
                      <div className="flow-label">2. Get QR</div>
                      <div className="flow-sublabel">Store the Instance Key</div>
                      <div className="flow-line"></div>
                    </div>

                    <div className="flow-step">
                      <div className="flow-icon-wrapper"><Zap size={26} /></div>
                      <div className="flow-label">3. Scan</div>
                      <div className="flow-sublabel">Scan with WhatsApp App</div>
                      <div className="flow-line"></div>
                    </div>

                    <div className="flow-step">
                      <div className="flow-icon-wrapper linked-badge"><ShieldCheck size={26} /></div>
                      <div className="flow-label">4. Linked</div>
                      <div className="flow-sublabel">Ready to send messages</div>
                    </div>
                  </div>
                </div>

                <div className="step-list" style={{ marginTop: '40px' }}>
                  <div className="step-item">
                    <span className="step-number">1</span>
                    <div className="step-text">
                      <h4>Step 1: The Initial Handshake</h4>
                      <p>Send an empty body to create a new Whatsapp Instance. The server will return a unique <code>instanceKey</code> and the first QR code.</p>
                    </div>
                  </div>

                  <div className="postman-req">
                    <div className="pm-header">
                      <span className="pm-method" style={{ color: '#e2b0ff' }}>POST</span>
                      <span className="pm-url">{`${baseUrl}/api/v1/instance/initiate`}</span>
                    </div>
                    <div className="pm-section">
                      <span className="pm-section-title">Request Body (First Time)</span>
                      <div className="pm-val">{`{ }`}</div>
                    </div>
                  </div>

                  <div className="step-item">
                    <span className="step-number">2</span>
                    <div className="step-text">
                      <h4>Step 2: Polling & Refreshing</h4>
                      <p>The QR code expires in <strong>40 seconds</strong>. To get a fresh QR or check if the user has scanned, call the <strong>same endpoint</strong> using the <code>instanceKey</code> from Step 1.</p>
                    </div>
                  </div>

                  <div className="postman-req">
                    <div className="pm-header">
                      <span className="pm-method" style={{ color: '#e2b0ff' }}>POST</span>
                      <span className="pm-url">{`${baseUrl}/api/v1/instance/initiate`}</span>
                    </div>
                    <div className="pm-section">
                      <span className="pm-section-title">Request Body (Refresh)</span>
                      <div className="pm-val">{`{ 
  "instanceKey": "inst_8b108035af24b734",
  "name": "Support WhatsApp" // Optional custom name
}`}</div>
                    </div>
                  </div>
                </div>

                <h3 style={{ marginTop: '40px' }}>Initiation Response Reference</h3>
                <table className="param-table">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Type</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code style={{ color: '#61afef' }}>success</code></td>
                      <td><span className="badge badge-type">boolean</span></td>
                      <td>Returns true if everything is fine.</td>
                    </tr>
                    <tr>
                      <td><code style={{ color: '#61afef' }}>status</code></td>
                      <td><span className="badge badge-type">string</span></td>
                      <td><code>connecting</code>, <code>qr_ready</code>, or <code>connected</code>.</td>
                    </tr>
                    <tr>
                      <td><code style={{ color: '#61afef' }}>qr</code></td>
                      <td><span className="badge badge-type">string</span></td>
                      <td>The Base64 QR Image. Empty if already connected.</td>
                    </tr>
                    <tr>
                      <td><code style={{ color: '#61afef' }}>instanceKey</code></td>
                      <td><span className="badge badge-type">string</span></td>
                      <td>The permanent ID of this WhatsApp session.</td>
                    </tr>
                    <tr>
                      <td><code style={{ color: '#61afef' }}>validinsecond</code></td>
                      <td><span className="badge badge-type">number</span></td>
                      <td>The time in seconds for which the QR code is valid.</td>
                    </tr>
                  </tbody>
                </table>
                <div className="alert-box warning-alert" style={{ marginTop: '40px' }}>
                  <p>
                    <strong>⚠️ QR Code Note</strong> : The QR code will be in <strong>base64 format</strong> .You need to convert that into the image manually.
                  </p>
                </div>
                <div className="alert-box warning-alert" style={{ marginTop: '40px' }}>
                  <p>
                    <strong>⚠️ Expiration Note:</strong> The QR code will expire in <code>validinsecond</code> (40s). You will need to call the <strong>Initiate API</strong> again with your <code>instanceKey</code> to receive a fresh QR code as shown below. It is recommend to show the Timer to user
                  </p>
                </div>

                <h3 style={{ marginTop: '40px' }}>Refreshing/Polling QR Code</h3>
                <div className="postman-req">
                  <div className="pm-header">
                    <span className="pm-method" style={{ color: '#e2b0ff' }}>POST</span>
                    <span className="pm-url">{`${baseUrl}/api/v1/instance/initiate`}</span>
                  </div>
                  <div className="pm-section">
                    <span className="pm-section-title">Headers</span>
                    <div className="pm-row">
                      <span className="pm-key">Authorization</span>
                      <span className="pm-val">Bearer YOUR_MASTER_TOKEN</span>
                    </div>
                  </div>
                  <div className="pm-section">
                    <span className="pm-section-title">Request Body (JSON)</span>
                    <div className="pm-val">{`{ "instanceKey": "inst_123..." }`}</div>
                  </div>
                  <div className="pm-section">
                    <span className="pm-section-title">Response Body (JSON)</span>
                    <div className="pm-side-by-side">
                      <div className="pm-col">
                        <span className="pm-section-title" style={{ color: 'var(--primary)' }}>Case A: If Not Connected</span>
                        <pre><code>{`{
  "success": true,
  "status": "qr_ready",
  "qr": "data:image/png;base64,...",
  "validinsecond": 40,
  "instanceKey": "inst_123..."
}`}</code></pre>
                      </div>
                      <div className="pm-col">
                        <span className="pm-section-title" style={{ color: 'var(--primary)' }}>Case B: If Already Connected</span>
                        <pre><code>{`{
  "success": true,
  "status": "connected",
  "qr": "",
  "instanceKey": "inst_123...",
  "message": "Instance already connected"
}`}</code></pre>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 style={{ marginTop: '60px' }}>Fetching Instance Status</h3>
                <p>Check the live status of any instance at any time without triggering a session restart.</p>
                <div className="postman-req">
                  <div className="pm-header">
                    <span className="pm-method" style={{ color: '#61afef' }}>GET</span>
                    <span className="pm-url">{`${baseUrl}/api/v1/instance/status?instanceKey=inst_123`}</span>
                  </div>
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
                <h3>1. Sending Text Messages</h3>
                <p>Dispatch a plain text message to any WhatsApp number. Use <code>application/json</code> for these requests.</p>

                <div className="postman-req">
                  <div className="pm-header">
                    <span className="pm-method" style={{ color: '#e2b0ff' }}>POST</span>
                    <span className="pm-url">{`${baseUrl}/api/v1/messages/send`}</span>
                  </div>
                  <div className="pm-section">
                    <span className="pm-section-title">Body (JSON)</span>
                    <table className="param-table" style={{ margin: 0, background: 'transparent' }}>
                      <tbody>
                        <tr>
                          <td><code style={{ color: '#d19a66' }}>instanceKey</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Your connected instance key.</td>
                        </tr>
                        <tr>
                          <td><code style={{ color: '#d19a66' }}>number</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Phone with country code (e.g. 919876...).</td>
                        </tr>
                        <tr>
                          <td><code style={{ color: '#d19a66' }}>message</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>The text content of your message.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <h3 style={{ marginTop: '60px' }}>2. Sending Media (Images/Docs)</h3>
                <p>Upload files like JPG, PNG, PDF, or DOCX. These requests must use <code>multipart/form-data</code>.</p>

                <div className="postman-req">
                  <div className="pm-header">
                    <span className="pm-method" style={{ color: '#e2b0ff' }}>POST</span>
                    <span className="pm-url">{`${baseUrl}/api/v1/messages/send`}</span>
                  </div>
                  <div className="pm-section">
                    <span className="pm-section-title">Body (form-data)</span>
                    <table className="param-table" style={{ margin: 0, background: 'transparent' }}>
                      <tbody>
                        <tr>
                          <td><code style={{ color: '#d19a66' }}>instanceKey</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Your connected instance key.</td>
                        </tr>
                        <tr>
                          <td><code style={{ color: '#d19a66' }}>number</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Recipient phone with country code.</td>
                        </tr>
                        <tr>
                          <td><code style={{ color: '#d19a66' }}>file</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>The actual file to be uploaded.</td>
                        </tr>
                        <tr>
                          <td><code style={{ color: '#d19a66' }}>message</code></td>
                          <td><span className="badge badge-opt">Optional</span></td>
                          <td>Text caption to be sent along with the file.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <h3 style={{ marginTop: '60px' }}>3. Bulk Messaging</h3>
                <p>Send high-volume messages in a single request. The server manages queuing automatically.</p>

                <div className="postman-req">
                  <div className="pm-header">
                    <span className="pm-method" style={{ color: '#e2b0ff' }}>POST</span>
                    <span className="pm-url">{`${baseUrl}/api/v1/messages/bulk`}</span>
                  </div>
                  <div className="pm-section">
                    <span className="pm-section-title">Body Structure</span>
                    <pre><code>{`{
  "instanceKey": "inst_123...",
  "messages": [
    { "number": "9100000001", "message": "Hello Customer 1" },
    { "number": "9100000002", "message": "Hello Customer 2" }
  ]
}`}</code></pre>
                  </div>
                </div>
              </div>
            </section>

            {/* Best Practices */}
            <section id="best-practices" className="docs-section card glass">
              <div className="section-header">
                <ShieldCheck size={24} className="text-primary" />
                <h2>Error Codes & Best Practices</h2>
              </div>
              <div className="section-content">
                <table className="param-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Meaning</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>401</code></td>
                      <td>Unauthorized</td>
                      <td>Check your Master API Token.</td>
                    </tr>
                    <tr>
                      <td><code>403</code></td>
                      <td>Quota Exceeded</td>
                      <td>Upgrade your subscription package.</td>
                    </tr>
                    <tr>
                      <td><code>404</code></td>
                      <td>Not Found</td>
                      <td>Invalid <code>instanceKey</code> or endpoint URL.</td>
                    </tr>
                    <tr>
                      <td><code>500</code></td>
                      <td>Server Error</td>
                      <td>Ensure WhatsApp is connected (Check status API).</td>
                    </tr>
                  </tbody>
                </table>

                <div className="alert-box warning-alert">
                  <p>
                    <strong>⚠️ Warning:</strong> Avoid sending identical messages to thousands of numbers in a short time. We recommend a 1-2 second delay between messages to keep your WhatsApp account safe from being banned by Meta.
                  </p>
                </div>
              </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="docs-section card glass">
              <div className="section-header">
                <Zap size={24} className="text-primary" />
                <h2>Quick Start Q&A</h2>
              </div>
              <div className="section-content">
                <div className="faq-item">
                  <p className="faq-question">Q: How do I start with my token?</p>
                  <p className="faq-answer">A: Copy your Master Token from the profile, then call the <code>/initiate</code> endpoint with an empty body <code>{"{}"}</code>. This creates your first instance automatically.</p>
                </div>

                <div className="faq-item">
                  <p className="faq-question">Q: What do I do next after getting the QR?</p>
                  <p className="faq-answer">A: Display the QR to your user. Once they scan, the status will change to <code>"connected"</code>. You must save the <code>instanceKey</code> returned to perform any future actions.</p>
                </div>

                <div className="faq-item">
                  <p className="faq-question">Q: How to refresh the QR if it expires?</p>
                  <p className="faq-answer">A: Simply call the <code>/initiate</code> endpoint again, but this time pass your <code>instanceKey</code> in the body. You will receive a fresh QR code.</p>
                </div>

                <div className="faq-item">
                  <p className="faq-question">Q: How do I know if WhatsApp is connected?</p>
                  <p className="faq-answer">A: When user sends the InstanceKey along with the /initiate api request to refresh the QR code, then the API response for <code>/initiate</code> or <code>/status</code> will return <code>status: "connected"</code> and the <code>qr</code> field will be empty. Your instance is now live!</p>
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
                <li><a href="#sending-messages">Messaging API</a></li>
                <li><a href="#best-practices">Error Codes</a></li>
                <li><a href="#faq">Quick Q&A</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;
