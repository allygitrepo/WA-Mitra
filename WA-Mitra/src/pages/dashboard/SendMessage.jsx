import React, { useState } from 'react';
import { Send, FileUp, AlertCircle, CheckCircle } from 'lucide-react';
import { messageService } from '../../services/api';
import './DashboardViews.css';

const SendMessage = () => {
  const [formData, setFormData] = useState({
    number: '',
    message: '',
    file: null
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const data = new FormData();
    data.append('number', formData.number);
    data.append('message', formData.message);
    if (formData.file) data.append('file', formData.file);

    try {
      await messageService.sendMessage(data);
      setStatus({ type: 'success', message: 'Message sent successfully!' });
      setFormData({ number: '', message: '', file: null });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to send message.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="send-message-view animate-fade-in">
      <div className="view-header">
        <h1>Send Single Message</h1>
        <p>Send text, images, or documents to any WhatsApp number.</p>
      </div>

      <div className="form-card glass">
        {status && (
          <div className={`status-alert ${status.type}`}>
            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Phone Number</label>
            <input 
              type="text" 
              placeholder="e.g. 919876543210" 
              value={formData.number}
              onChange={(e) => setFormData({...formData, number: e.target.value})}
              required 
            />
            <small>Include country code without + or spaces.</small>
          </div>

          <div className="form-group">
            <label>Message Content</label>
            <textarea 
              placeholder="Type your message here..." 
              rows="5"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
            ></textarea>
          </div>

          <div className="form-group">
            <label>Attachment (Optional)</label>
            <div className="file-input-wrapper">
              <input 
                type="file" 
                id="file-upload"
                onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
              />
              <label htmlFor="file-upload" className="file-label">
                <FileUp size={20} />
                {formData.file ? formData.file.name : 'Choose a file (Image/PDF/Doc)'}
              </label>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Message'} <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default SendMessage;
