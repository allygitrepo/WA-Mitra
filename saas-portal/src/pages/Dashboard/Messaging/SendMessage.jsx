import React, { useState, useEffect } from 'react';
import { Send, Users, FileUp, Image as ImageIcon, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { instanceService, messageService } from '../../../api/services';
import './Messaging.css';

const SendMessage = () => {
  const { searchQuery } = useOutletContext();
  const [mode, setMode] = useState('single'); // 'single' or 'bulk'
  const [instances, setInstances] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const [singleData, setSingleData] = useState({
    number: '',
    message: '',
    file: null
  });

  const [bulkData, setBulkData] = useState({
    numbers: '',
    message: '',
    file: null
  });

  useEffect(() => {
    fetchInstances();
  }, []);

  const fetchInstances = async () => {
    try {
      const res = await instanceService.getInstances();
      const active = (res.data.instances || []).filter(i => i.liveStatus === 'connected');
      setInstances(active);
      if (active.length > 0) setSelectedInstance(active[0].instanceKey);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e, currentMode) => {
    const file = e.target.files[0];
    if (!file) return;

    if (currentMode === 'single') {
      setSingleData({ ...singleData, file: file });
    } else {
      setBulkData({ ...bulkData, file: file });
    }
  };

  const removeFile = (currentMode) => {
    if (currentMode === 'single') {
      setSingleData({ ...singleData, file: null });
    } else {
      setBulkData({ ...bulkData, file: null });
    }
  };

  const handleSendSingle = async (e) => {
    e.preventDefault();
    if (!selectedInstance) return setStatus({ type: 'error', message: 'Please select an instance' });
    
    setLoading(true);
    try {
      await messageService.sendMessage({
        ...singleData,
        instanceKey: selectedInstance
      });
      setStatus({ type: 'success', message: 'Message sent successfully!' });
      setSingleData({ number: '', message: '', file: null });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to send message' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendBulk = async (e) => {
    e.preventDefault();
    if (!selectedInstance) return setStatus({ type: 'error', message: 'Please select an instance' });

    setLoading(true);
    try {
      const numbersArray = bulkData.numbers.split(',').map(n => n.trim()).filter(n => n);
      await messageService.sendBulk({
        instanceKey: selectedInstance,
        numbers: numbersArray,
        message: bulkData.message,
        file: bulkData.file
      });
      setStatus({ type: 'success', message: 'Bulk messages queued!' });
      setBulkData({ numbers: '', message: '', file: null });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to queue messages' });
    } finally {
      setLoading(false);
    }
  };

  const currentFile = mode === 'single' ? singleData.file : bulkData.file;

  return (
    <div className="messaging-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Messaging Portal</h1>
          <p className="page-subtitle">Send single or bulk messages via your linked instances.</p>
        </div>
      </div>

      <div className="messaging-card glass">
        <div className="messaging-tabs">
          <button 
            className={`tab-item ${mode === 'single' ? 'active' : ''}`}
            onClick={() => setMode('single')}
          >
            <Send size={18} /> <span>Single Message</span>
          </button>
          <button 
            className={`tab-item ${mode === 'bulk' ? 'active' : ''}`}
            onClick={() => setMode('bulk')}
          >
            <Users size={18} /> <span>Bulk Messaging</span>
          </button>
        </div>

        <div className="messaging-body">
          <div className="form-row" style={{marginBottom: '24px'}}>
            <div className="form-group" style={{maxWidth: '400px'}}>
              <label>Select WhatsApp Instance</label>
              <select 
                className="auth-input" 
                style={{paddingLeft: '14px'}}
                value={selectedInstance}
                onChange={(e) => setSelectedInstance(e.target.value)}
              >
                {instances.length === 0 && <option value="">No connected instances found</option>}
                {instances
                  .filter(i => (i.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()))
                  .map(inst => (
                    <option key={inst.instanceKey} value={inst.instanceKey}>
                      {inst.name} ({inst.phone})
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          {status && (
            <div className={`status-alert ${status.type}`}>
              {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{status.message}</span>
              <button className="close-alert" onClick={() => setStatus(null)}><X size={14} /></button>
            </div>
          )}

          <form className="messaging-form" onSubmit={mode === 'single' ? handleSendSingle : handleSendBulk}>
            <div className="form-group">
              <label>{mode === 'single' ? 'Recipient Number' : 'Recipient Numbers (Comma separated)'}</label>
              {mode === 'single' ? (
                <input 
                  type="text" 
                  className="auth-input" 
                  style={{paddingLeft: '14px'}} 
                  placeholder="e.g. 919876543210"
                  value={singleData.number}
                  onChange={(e) => setSingleData({...singleData, number: e.target.value})}
                  required
                />
              ) : (
                <textarea 
                  className="auth-input" 
                  style={{paddingLeft: '14px', height: '100px', resize: 'none'}} 
                  placeholder="919876543210, 918877665544, ..."
                  value={bulkData.numbers}
                  onChange={(e) => setBulkData({...bulkData, numbers: e.target.value})}
                  required
                ></textarea>
              )}
            </div>

            <div className="form-group">
              <label>Message Content</label>
              <textarea 
                className="auth-input" 
                style={{paddingLeft: '14px', height: mode === 'single' ? '120px' : '150px', resize: 'none'}} 
                placeholder="Type your message here..."
                value={mode === 'single' ? singleData.message : bulkData.message}
                onChange={(e) => mode === 'single' ? setSingleData({...singleData, message: e.target.value}) : setBulkData({...bulkData, message: e.target.value})}
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label>Attachment (Optional)</label>
              <div className="file-upload-zone">
                <input 
                  type="file" 
                  id="file-input-single" 
                  onChange={(e) => handleFileChange(e, mode)}
                  hidden 
                />
                <label htmlFor="file-input-single" className="file-label">
                  {!currentFile ? (
                    <span className="file-placeholder">
                      <FileUp size={24} /> 
                      Click to upload image or document
                    </span>
                  ) : (
                    <div className="file-info" style={{flexDirection: 'column', padding: '10px'}}>
                       <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <FileText size={24} />
                        <span className="file-name">{currentFile.name}</span>
                        <button type="button" className="remove-file" onClick={() => removeFile(mode)}>
                          <X size={18} />
                        </button>
                       </div>
                       <span style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px'}}>File ready for sending</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="form-actions" style={{justifyContent: 'flex-start', borderTop: 'none', padding: 0}}>
              <button type="submit" className="btn-primary" disabled={loading || !selectedInstance} style={{minWidth: '200px'}}>
                {loading ? 'Processing...' : (mode === 'single' ? 'Send Message' : 'Send Bulk Messages')} 
                {mode === 'single' ? <Send size={18} /> : <Users size={18} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SendMessage;
