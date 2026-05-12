import React, { useState } from 'react';
import { Layers, Send, AlertCircle, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { messageService } from '../../services/api';
import './DashboardViews.css';

const BulkMessage = () => {
  const [messages, setMessages] = useState([{ number: '', message: '' }]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const addRow = () => {
    setMessages([...messages, { number: '', message: '' }]);
  };

  const removeRow = (index) => {
    if (messages.length === 1) return;
    setMessages(messages.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const newMessages = [...messages];
    newMessages[index][field] = value;
    setMessages(newMessages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      await messageService.sendBulk({ messages });
      setStatus({ type: 'success', message: `Bulk message job started for ${messages.length} recipients!` });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to start bulk job.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-message-view animate-fade-in">
      <div className="view-header">
        <h1>Bulk Messaging</h1>
        <p>Send personalized messages to multiple recipients at once.</p>
      </div>

      <div className="bulk-container glass">
        {status && (
          <div className={`status-alert ${status.type}`}>
            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="bulk-table">
            <div className="table-header">
              <span>Recipients</span>
              <span>Message Content</span>
              <span></span>
            </div>
            {messages.map((msg, index) => (
              <div key={index} className="table-row">
                <input 
                  type="text" 
                  placeholder="919876543210" 
                  value={msg.number}
                  onChange={(e) => handleChange(index, 'number', e.target.value)}
                  required 
                />
                <textarea 
                  placeholder="Hello there..." 
                  rows="1"
                  value={msg.message}
                  onChange={(e) => handleChange(index, 'message', e.target.value)}
                  required
                ></textarea>
                <button type="button" onClick={() => removeRow(index)} className="remove-btn">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="bulk-actions">
            <button type="button" className="btn-secondary-outline" onClick={addRow}>
              <Plus size={20} /> Add Recipient
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Queuing...' : `Send to ${messages.length} Recipients`} <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkMessage;
