import React, { useState, useEffect } from 'react';
import { Send, Users, FileUp, Image as ImageIcon, FileText, X, CheckCircle2, AlertCircle, Plus, Trash2, Loader2 } from 'lucide-react';
import { useOutletContext, Link } from 'react-router-dom';
import { instanceService, messageService } from '../../../api/services';
import toast from 'react-hot-toast';
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
    numbers: [''],
    message: '',
    file: null
  });

  const [numberCount, setNumberCount] = useState(1);

  useEffect(() => {
    fetchInstances();
  }, []);

  const handleNumberCountChange = (count) => {
    const val = parseInt(count) || 0;
    setNumberCount(val);
    if (val > 0) {
      const newNumbers = [...bulkData.numbers];
      if (val > newNumbers.length) {
        for (let i = newNumbers.length; i < val; i++) newNumbers.push('');
      } else {
        newNumbers.length = val;
      }
      setBulkData({ ...bulkData, numbers: newNumbers });
    }
  };

  const addNumberField = () => {
    setBulkData({ ...bulkData, numbers: [...bulkData.numbers, ''] });
    setNumberCount(bulkData.numbers.length + 1);
  };

  const removeNumberField = (index) => {
    if (bulkData.numbers.length <= 1) return;
    const newNumbers = bulkData.numbers.filter((_, i) => i !== index);
    setBulkData({ ...bulkData, numbers: newNumbers });
    setNumberCount(newNumbers.length);
  };

  const updateNumber = (index, value) => {
    const newNumbers = [...bulkData.numbers];
    newNumbers[index] = value;
    setBulkData({ ...bulkData, numbers: newNumbers });
  };

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
    if (!selectedInstance) return toast.error('Please select an instance');
    
    const loadingToast = toast.loading('Sending message...');
    setLoading(true);
    try {
      await messageService.sendMessage({
        ...singleData,
        instanceKey: selectedInstance
      });
      toast.success('Message sent successfully!', { id: loadingToast });
      setSingleData({ number: '', message: '', file: null });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleSendBulk = async (e) => {
    e.preventDefault();
    if (!selectedInstance) return toast.error('Please select an instance');

    setLoading(true);
    const loadingToast = toast.loading(`Sending bulk messages (0/${bulkData.numbers.length})...`, {
      style: { minWidth: '250px' }
    });

    try {
      // Prepare the messages array as required by the backend
      const messagesArray = bulkData.numbers
        .map(n => n.trim())
        .filter(n => n)
        .map(n => ({
          number: n,
          message: bulkData.message
        }));

      if (messagesArray.length === 0) {
        toast.error('Please enter at least one recipient number', { id: loadingToast });
        setLoading(false);
        return;
      }

      const res = await messageService.sendBulk({
        instanceKey: selectedInstance,
        messages: messagesArray,
        file: bulkData.file
      });

      const { results } = res.data;
      
      if (results.failed === 0) {
        toast.success(`Sent all ${results.sent} messages successfully!`, { id: loadingToast, duration: 5000 });
      } else {
        toast.success(`Process complete: ${results.sent} sent, ${results.failed} failed.`, { id: loadingToast, duration: 6000 });
      }

      setBulkData({ numbers: [''], message: '', file: null });
      setNumberCount(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process bulk messages', { id: loadingToast });
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



          <form className="messaging-form" onSubmit={mode === 'single' ? handleSendSingle : handleSendBulk}>
            <div className="form-group">
              <label>{mode === 'single' ? 'Recipient Number' : 'Recipient Numbers'}</label>
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
                <div className="bulk-numbers-section">
                  <div className="form-group mb-4" style={{maxWidth: '250px'}}>
                    <label style={{fontSize: '0.8rem', opacity: 0.8}}>How many numbers do you have? (Optional)</label>
                    <input 
                      type="number" 
                      className="auth-input" 
                      style={{paddingLeft: '14px'}} 
                      placeholder="Enter count"
                      value={numberCount}
                      min="1"
                      onChange={(e) => handleNumberCountChange(e.target.value)}
                    />
                  </div>

                  <div className="numbers-list-grid">
                    {bulkData.numbers.map((num, idx) => (
                      <div key={idx} className="number-input-row">
                        <div className="input-with-count">
                          <span className="idx-tag">{idx + 1}</span>
                          <input 
                            type="text" 
                            className="auth-input" 
                            style={{paddingLeft: '35px'}} 
                            placeholder="919876543210"
                            value={num}
                            onChange={(e) => updateNumber(idx, e.target.value)}
                            required
                          />
                        </div>
                        {bulkData.numbers.length > 1 && (
                          <button type="button" className="remove-num-btn" onClick={() => removeNumberField(idx)}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button type="button" className="add-number-btn mt-4" onClick={addNumberField}>
                    <Plus size={16} /> Add Another Number
                  </button>
                </div>
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
