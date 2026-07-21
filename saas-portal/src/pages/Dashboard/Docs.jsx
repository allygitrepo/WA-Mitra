import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Code, Terminal, Zap, ShieldCheck, Copy, Check, ArrowLeft,
  Play, Pause, X, Laptop, Server, Smartphone, CheckCircle, MessageSquare
} from 'lucide-react';
import './Docs.css';

const CodeBlock = ({ code, id, copied, onCopy }) => {
  return (
    <div className="code-block-wrapper">
      <button
        className="copy-btn-code"
        onClick={() => onCopy(code, id)}
        title="Copy Code"
      >
        {copied === id ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <pre><code>{code}</code></pre>
    </div>
  );
};

const EndpointUrl = ({ method, url, id, copied, onCopy }) => {
  return (
    <div className="pm-header">
      <span className={`pm-method method-${method.toLowerCase()}`}>{method}</span>
      <span className="pm-url">{url}</span>
      <button
        className="copy-btn-api"
        onClick={() => onCopy(url, id)}
        title="Copy URL"
      >
        {copied === id ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
};

const Docs = () => {
  const location = useLocation();
  const isExternal = location.pathname === '/docs';
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api$/, '') || "https://silverapi.allysoftsolutions.com/wa-mitra";
  const [copied, setCopied] = useState(null);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    let timer;
    if (isPlaying && showFlowModal) {
      timer = setInterval(() => {
        setActiveStep((prev) => (prev % 4) + 1);
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, showFlowModal]);

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
              <h1 className="page-title">API Documentation</h1>
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
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Zap size={24} className="text-primary" />
                  <h2>Zero-Config External Sessions</h2>
                </div>
                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => setShowFlowModal(true)}>
                  <Zap size={16} className="animate-pulse" style={{ marginRight: '6px' }} />
                  <span>Interactive Flowchart</span>
                </button>
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
                    <EndpointUrl
                      method="POST"
                      url={`${baseUrl}/api/v1/instance/initiate`}
                      id="initiate_step1"
                      copied={copied}
                      onCopy={copyToClipboard}
                    />
                    <div className="pm-section">
                      <span className="pm-section-title">Request Body (First Time)</span>
                      <div className="pm-val">{`{ "name" : "WA-Mitra Instance" // Optional custom name}`}</div>
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
                    <EndpointUrl
                      method="POST"
                      url={`${baseUrl}/api/v1/instance/initiate`}
                      id="initiate_step2"
                      copied={copied}
                      onCopy={copyToClipboard}
                    />
                    <div className="pm-section">
                      <span className="pm-section-title">Request Body (Refresh)</span>
                      <div className="pm-val">{`{ 
  "instanceKey": "inst_8b108035af24b734",
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
                      <td><code className="code-key">success</code></td>
                      <td><span className="badge badge-type">boolean</span></td>
                      <td>Returns true if everything is fine.</td>
                    </tr>
                    <tr>
                      <td><code className="code-key">status</code></td>
                      <td><span className="badge badge-type">string</span></td>
                      <td><code>connecting</code>, <code>qr_ready</code>, or <code>connected</code>.</td>
                    </tr>
                    <tr>
                      <td><code className="code-key">qr</code></td>
                      <td><span className="badge badge-type">string</span></td>
                      <td>The Base64 QR Image. Empty if already connected.</td>
                    </tr>
                    <tr>
                      <td><code className="code-key">instanceKey</code></td>
                      <td><span className="badge badge-type">string</span></td>
                      <td>The permanent ID of this WhatsApp session.</td>
                    </tr>
                    <tr>
                      <td><code className="code-key">validinsecond</code></td>
                      <td><span className="badge badge-type">number</span></td>
                      <td>The time in seconds for which the QR code is valid.</td>
                    </tr>
                    <tr>
                      <td><code className="code-key">profileImage</code></td>
                      <td><span className="badge badge-type">string</span></td>
                      <td>The Base64 string of the WhatsApp profile picture.</td>
                    </tr>
                    <tr>
                      <td><code className="code-key">name</code></td>
                      <td><span className="badge badge-type">string</span></td>
                      <td>The WhatsApp profile name (Push Name).</td>
                    </tr>
                    <tr>
                      <td><code className="code-key">phone</code></td>
                      <td><span className="badge badge-type">string</span></td>
                      <td>The connected WhatsApp phone number.</td>
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
                <div className="alert-box warning-alert" style={{ marginTop: '20px' }}>
                  <p>
                    <strong>⚠️ Phone Number Isolation:</strong> The system enforces strict isolation. A WhatsApp phone number can only be connected to <strong>one instance</strong> across the entire platform at any given time. Connecting a number that is already active on another instance will be rejected.
                  </p>
                </div>

                <h3 style={{ marginTop: '40px' }}>Refreshing/Polling QR Code</h3>
                <div className="postman-req">
                  <EndpointUrl
                    method="POST"
                    url={`${baseUrl}/api/v1/instance/initiate`}
                    id="initiate_step3"
                    copied={copied}
                    onCopy={copyToClipboard}
                  />
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
                        <CodeBlock
                          id="case_a_resp"
                          code={`{
  "success": true,
  "status": "qr_ready",
  "qr": "data:image/png;base64,...",
  "validinsecond": 40,
  "instanceKey": "inst_123..."
}`}
                          copied={copied}
                          onCopy={copyToClipboard}
                        />
                      </div>
                      <div className="pm-col">
                        <span className="pm-section-title" style={{ color: 'var(--primary)' }}>Case B: If Already Connected</span>
                        <CodeBlock
                          id="case_b_resp"
                          code={`{
  "success": true,
  "status": "connected",
  "qr": "",
  "instanceKey": "inst_123...",
  "message": "Instance already connected",
  "profileImage": "data:image/jpeg;base64,...",
  "name": "Prashant Sarvaiya",
  "phone": "919316..."
}`}
                          copied={copied}
                          onCopy={copyToClipboard}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <h3 style={{ marginTop: '60px' }}>Fetching Instance Status</h3>
                <p>Check the live status of any instance at any time without triggering a session restart.</p>
                <div className="postman-req">
                  <EndpointUrl
                    method="GET"
                    url={`${baseUrl}/api/v1/instance/status?instanceKey=inst_123`}
                    id="status_step"
                    copied={copied}
                    onCopy={copyToClipboard}
                  />
                </div>

                <h3 style={{ marginTop: '60px' }}>Disconnect & Delete Instance</h3>
                <p>Permanently remove an instance from the database and clean up all session files. This is recommended for cleaning up unused keys to prevent server load.</p>
                <div className="postman-req">
                  <EndpointUrl
                    method="DELETE"
                    url={`${baseUrl}/api/v1/instance/delete?instanceKey=inst_123`}
                    id="delete_step"
                    copied={copied}
                    onCopy={copyToClipboard}
                  />
                  <div className="pm-section">
                    <span className="pm-section-title">Query Parameters</span>
                    <div className="pm-row">
                      <span className="pm-key">instanceKey</span>
                      <span className="pm-val">The ID of the instance to delete.</span>
                    </div>
                  </div>
                  <div className="pm-section">
                    <span className="pm-section-title">Success Response</span>
                    <CodeBlock
                      id="delete_resp"
                      code={`{
  "success": true,
  "message": "Instance deleted successfully"
}`}
                      copied={copied}
                      onCopy={copyToClipboard}
                    />
                  </div>
                </div>
                <h3 style={{ marginTop: '60px' }}>Listing All Instances</h3>
                <p>Fetch a list of all WhatsApp instances associated with your account.</p>
                <div className="postman-req">
                  <EndpointUrl
                    method="GET"
                    url={`${baseUrl}/api/v1/instance/list`}
                    id="list_step"
                    copied={copied}
                    onCopy={copyToClipboard}
                  />
                  <div className="pm-section">
                    <span className="pm-section-title">Success Response</span>
                    <CodeBlock
                      id="list_resp"
                      code={`{
  "success": true,
  "instances": [
    {
      "id": 1,
      "name": "Support Line",
      "instanceKey": "inst_123...",
      "status": "connected",
      "phone": "919876543210"
    }
  ]
}`}
                      copied={copied}
                      onCopy={copyToClipboard}
                    />
                  </div>
                </div>
                <h3 style={{ marginTop: '60px' }}>Listing All Instances</h3>
                <p>Fetch a list of all WhatsApp instances associated with your account.</p>
                <div className="postman-req">
                  <div className="pm-header">
                    <span className="pm-method method-get">GET</span>
                    <span className="pm-url">{`${baseUrl}/api/v1/instance/list`}</span>
                  </div>
                  <div className="pm-section">
                    <span className="pm-section-title">Success Response</span>
                    <pre><code>{`{
  "success": true,
  "instances": [
    {
      "id": 1,
      "name": "Support Line",
      "instanceKey": "inst_123...",
      "status": "connected",
      "phone": "919876543210"
    }
  ]
}`}</code></pre>
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
                  <EndpointUrl
                    method="POST"
                    url={`${baseUrl}/api/v1/messages/send`}
                    id="send_text_url"
                    copied={copied}
                    onCopy={copyToClipboard}
                  />
                  <div className="pm-section">
                    <span className="pm-section-title">Body (JSON)</span>
                    <table className="param-table" style={{ margin: 0, background: 'transparent' }}>
                      <tbody>
                        <tr>
                          <td><code className="code-key orange-key">instanceKey</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Your connected instance key.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">number</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Phone with country code (e.g. 919876...).</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">message</code></td>
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
                  <EndpointUrl
                    method="POST"
                    url={`${baseUrl}/api/v1/messages/send`}
                    id="send_media_url"
                    copied={copied}
                    onCopy={copyToClipboard}
                  />
                  <div className="pm-section">
                    <span className="pm-section-title">Body (form-data)</span>
                    <table className="param-table" style={{ margin: 0, background: 'transparent' }}>
                      <tbody>
                        <tr>
                          <td><code className="code-key orange-key">instanceKey</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Your connected instance key.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">number</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Recipient phone with country code.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">file</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>The actual file to be uploaded.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">message</code></td>
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
                  <EndpointUrl
                    method="POST"
                    url={`${baseUrl}/api/v1/messages/bulk`}
                    id="send_bulk_url"
                    copied={copied}
                    onCopy={copyToClipboard}
                  />
                  <div className="pm-section">
                    <span className="pm-section-title">Body Structure</span>
                    <CodeBlock
                      id="bulk_req_body"
                      code={`{
  "instanceKey": "inst_123...",
  "messages": [
    { "number": "9100000001", "message": "Hello Customer 1" },
    { "number": "9100000002", "message": "Hello Customer 2" }
  ]
}`}
                      copied={copied}
                      onCopy={copyToClipboard}
                    />
                  </div>
                </div>

                <h3 style={{ marginTop: '60px' }}>4. Scheduled Campaigns</h3>
                <p>Schedule a message to be sent at a specific date and time in the future. Can handle text and media. Must use <code>multipart/form-data</code>.</p>

                <div className="postman-req">
                  <EndpointUrl
                    method="POST"
                    url={`${baseUrl}/api/v1/messages/schedule`}
                    id="schedule_url"
                    copied={copied}
                    onCopy={copyToClipboard}
                  />
                  <div className="pm-section">
                    <span className="pm-section-title">Body (form-data)</span>
                    <table className="param-table" style={{ margin: 0, background: 'transparent' }}>
                      <tbody>
                        <tr>
                          <td><code className="code-key orange-key">instanceKey</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Your connected instance key.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">name</code></td>
                          <td><span className="badge badge-opt">Optional</span></td>
                          <td>Name of the schedule.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">targetDate</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Format: YYYY-MM-DD.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">targetTime</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Format: HH:mm.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">recipients</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>JSON stringified array of numbers e.g., <code>["91987..."]</code>.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">message</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Message text or caption.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">file</code></td>
                          <td><span className="badge badge-opt">Optional</span></td>
                          <td>Media file to send.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <h3 style={{ marginTop: '60px' }}>5. Recurring Cycle Campaigns</h3>
                <p>Create a recurring drip campaign that sends messages repeatedly based on a frequency. Must use <code>multipart/form-data</code>.</p>

                <div className="postman-req">
                  <EndpointUrl
                    method="POST"
                    url={`${baseUrl}/api/v1/messages/cycle`}
                    id="cycle_url"
                    copied={copied}
                    onCopy={copyToClipboard}
                  />
                  <div className="pm-section">
                    <span className="pm-section-title">Body (form-data)</span>
                    <table className="param-table" style={{ margin: 0, background: 'transparent' }}>
                      <tbody>
                        <tr>
                          <td><code className="code-key orange-key">instanceKey</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Your connected instance key.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">name</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Name of the cycle.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">frequency</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td><code>daily</code>, <code>weekly</code>, <code>monthly</code>, etc.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">sendTime</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Format: HH:mm.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">recipients</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>JSON stringified array of numbers.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">message</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Message text or caption.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">file</code></td>
                          <td><span className="badge badge-opt">Optional</span></td>
                          <td>Media file to send.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <h3 style={{ marginTop: '60px' }}>4. Scheduled Campaigns</h3>
                <p>Schedule a message to be sent at a specific date and time in the future. Can handle text and media. Must use <code>multipart/form-data</code>.</p>

                <div className="postman-req">
                  <div className="pm-header">
                    <span className="pm-method method-post">POST</span>
                    <span className="pm-url">{`${baseUrl}/api/v1/messages/schedule`}</span>
                  </div>
                  <div className="pm-section">
                    <span className="pm-section-title">Body (form-data)</span>
                    <table className="param-table" style={{ margin: 0, background: 'transparent' }}>
                      <tbody>
                        <tr>
                          <td><code className="code-key orange-key">instanceKey</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Your connected instance key.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">name</code></td>
                          <td><span className="badge badge-opt">Optional</span></td>
                          <td>Name of the schedule.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">targetDate</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Format: YYYY-MM-DD.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">targetTime</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Format: HH:mm.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">recipients</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>JSON stringified array of numbers e.g., <code>["91987..."]</code>.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">message</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Message text or caption.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">file</code></td>
                          <td><span className="badge badge-opt">Optional</span></td>
                          <td>Media file to send.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <h3 style={{ marginTop: '60px' }}>5. Recurring Cycle Campaigns</h3>
                <p>Create a recurring drip campaign that sends messages repeatedly based on a frequency. Must use <code>multipart/form-data</code>.</p>

                <div className="postman-req">
                  <div className="pm-header">
                    <span className="pm-method method-post">POST</span>
                    <span className="pm-url">{`${baseUrl}/api/v1/messages/cycle`}</span>
                  </div>
                  <div className="pm-section">
                    <span className="pm-section-title">Body (form-data)</span>
                    <table className="param-table" style={{ margin: 0, background: 'transparent' }}>
                      <tbody>
                        <tr>
                          <td><code className="code-key orange-key">instanceKey</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Your connected instance key.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">name</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Name of the cycle.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">frequency</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td><code>daily</code>, <code>weekly</code>, <code>monthly</code>, etc.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">sendTime</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Format: HH:mm.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">recipients</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>JSON stringified array of numbers.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">message</code></td>
                          <td><span className="badge badge-req">Required</span></td>
                          <td>Message text or caption.</td>
                        </tr>
                        <tr>
                          <td><code className="code-key orange-key">file</code></td>
                          <td><span className="badge badge-opt">Optional</span></td>
                          <td>Media file to send.</td>
                        </tr>
                      </tbody>
                    </table>
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

        {showFlowModal && (
          <div className="flow-modal-overlay" onClick={() => setShowFlowModal(false)}>
            <div className="flow-modal glass" onClick={(e) => e.stopPropagation()}>
              <div className="flow-modal-header">
                <div className="modal-title-area">
                  <Zap size={22} className="text-primary animate-pulse" />
                  <h3>Zero-Config Integration Flow</h3>
                </div>
                <button className="modal-close-btn" onClick={() => setShowFlowModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="flow-modal-body">
                {/* Stepper Steps */}
                <div className="modal-stepper">
                  {[
                    { num: 1, label: '1. Initiate Session', desc: 'POST /initiate' },
                    { num: 2, label: '2. Status Polling', desc: 'GET /status' },
                    { num: 3, label: '3. QR Scan & Link', desc: 'Scan QR Code' },
                    { num: 4, label: '4. Send API Message', desc: 'POST /messages/send' }
                  ].map((step) => (
                    <div
                      key={step.num}
                      className={`modal-step-tab ${activeStep === step.num ? 'active' : ''}`}
                      onClick={() => { setActiveStep(step.num); setIsPlaying(false); }}
                    >
                      <span className="tab-number">{step.num}</span>
                      <div className="tab-info">
                        <span className="tab-label">{step.label}</span>
                        <span className="tab-desc">{step.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Animated Arena */}
                <div className="animation-arena">
                  {/* Entity 1: Your System */}
                  <div className={`arena-entity entity-client ${activeStep === 1 || activeStep === 2 || activeStep === 4 ? 'focus' : ''}`}>
                    <div className="entity-icon-box">
                      <Laptop size={32} />
                    </div>
                    <span className="entity-name">Your Application</span>
                    <span className="entity-status">Status: Active</span>

                    {/* Step specific floating details */}
                    {activeStep === 1 && <div className="floating-bubble">POST /initiate</div>}
                    {activeStep === 2 && <div className="floating-bubble">GET /status</div>}
                    {activeStep === 3 && (
                      <div className="floating-qr-box animate-pulse">
                        <Code size={40} className="qr-fallback-icon" />
                        <span className="qr-badge">QR READY</span>
                      </div>
                    )}
                    {activeStep === 4 && <div className="floating-bubble">POST /send</div>}
                  </div>

                  {/* Connectors & Animation paths */}
                  <div className="arena-connector-path">
                    {/* Path 1: Client to Server */}
                    <div className="connector-line">
                      {/* Animated packets depending on activeStep */}
                      {activeStep === 1 && (
                        <div className="animated-packet to-right">
                          <span className="packet-tag post">POST</span>
                        </div>
                      )}
                      {activeStep === 2 && (
                        <div className="animated-packet to-right">
                          <span className="packet-tag get">GET</span>
                        </div>
                      )}
                      {activeStep === 4 && (
                        <div className="animated-packet to-right">
                          <span className="packet-tag post">POST</span>
                        </div>
                      )}
                      {/* Return packets */}
                      {activeStep === 1 && (
                        <div className="animated-packet to-left delay-1">
                          <span className="packet-data">QR Code</span>
                        </div>
                      )}
                      {activeStep === 2 && (
                        <div className="animated-packet to-left delay-1">
                          <span className="packet-data">qr_ready</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Entity 2: WA-Mitra Server */}
                  <div className={`arena-entity entity-server ${activeStep === 1 || activeStep === 2 || activeStep === 3 || activeStep === 4 ? 'focus' : ''}`}>
                    <div className="entity-icon-box">
                      <Server size={32} />
                    </div>
                    <span className="entity-name">WA-Mitra Server</span>
                    <span className="entity-status">API Gateway</span>
                    <div className="server-lights">
                      <span className="light green"></span>
                      <span className="light blue"></span>
                    </div>
                  </div>

                  {/* Connectors Path 2: Server to Phone */}
                  <div className="arena-connector-path">
                    <div className="connector-line">
                      {/* Handshake scan connection line */}
                      {activeStep === 3 && (
                        <div className="scan-laser-beam"></div>
                      )}
                      {activeStep === 4 && (
                        <div className="animated-packet to-right delay-2">
                          <span className="packet-data text-msg"><MessageSquare size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />Msg</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Entity 3: WhatsApp Phone */}
                  <div className={`arena-entity entity-phone ${activeStep === 3 || activeStep === 4 ? 'focus' : ''}`}>
                    <div className="entity-icon-box">
                      <Smartphone size={32} />
                    </div>
                    <span className="entity-name">WhatsApp Device</span>
                    <span className="entity-status">
                      {activeStep >= 3 ? (
                        <span className="connected-text"><CheckCircle size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />Connected</span>
                      ) : (
                        'Disconnected'
                      )}
                    </span>
                    {activeStep === 4 && (
                      <div className="floating-phone-message animate-bounce">
                        <MessageSquare size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                        <span>Hello!</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Explanation text */}
                <div className="flow-explanation-box">
                  <h4>
                    {activeStep === 1 && "Step 1: Initiate WhatsApp Session"}
                    {activeStep === 2 && "Step 2: Poll Session Status"}
                    {activeStep === 3 && "Step 3: Scan QR Code & Link Session"}
                    {activeStep === 4 && "Step 4: Dispatch Messages via API"}
                  </h4>
                  <p>
                    {activeStep === 1 && "Your application makes a POST request with your Bearer Token to /initiate. WA-Mitra spins up a secure Baileys virtual container and returns a unique instanceKey along with a Base64 QR code image."}
                    {activeStep === 2 && "Because the QR code lasts 40 seconds, your system polls /status or calls /initiate with the instanceKey to check connection state and pull fresh QR codes if needed."}
                    {activeStep === 3 && "The user scans the QR code using their WhatsApp mobile app (Linked Devices). WA-Mitra detects the login event, saves session tokens, and establishes a persistent socket connection."}
                    {activeStep === 4 && "With status 'connected', you send payload messages to /messages/send. WA-Mitra instantly routes the message to WhatsApp servers, displaying the sent bubble on the target recipient's phone."}
                  </p>
                </div>
              </div>

              {/* Controls footer */}
              <div className="flow-modal-footer">
                <div className="footer-playback-controls">
                  <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setIsPlaying(!isPlaying)} title={isPlaying ? 'Pause auto-play' : 'Play auto-play'}>
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>
                  <button
                    className="text-btn"
                    disabled={activeStep === 1}
                    onClick={() => { setActiveStep(prev => prev - 1); setIsPlaying(false); }}
                  >
                    Previous
                  </button>
                  <button
                    className="text-btn"
                    disabled={activeStep === 4}
                    onClick={() => { setActiveStep(prev => prev + 1); setIsPlaying(false); }}
                  >
                    Next
                  </button>
                </div>
                <button className="btn-secondary" onClick={() => setShowFlowModal(false)}>Close Diagram</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Docs;
