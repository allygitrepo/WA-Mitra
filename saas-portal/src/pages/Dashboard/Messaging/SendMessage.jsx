import React, { useState, useEffect } from 'react';
import { Send, Users, FileUp, Image as ImageIcon, FileText, X, CheckCircle2, AlertCircle, Plus, Trash2, Loader2 } from 'lucide-react';
import { useOutletContext, Link } from 'react-router-dom';
import { instanceService, messageService, templateService } from '../../../api/services';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import './Messaging.css';
import CustomModal from '../../../components/CustomModal';

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

  // New States for CSV Bulk Upload
  const [bulkInputMethod, setBulkInputMethod] = useState('manual'); // 'manual' or 'csv'
  const [csvData, setCsvData] = useState({
    headers: [],
    placeholders: [],
    rows: [],
    fileName: '',
    phoneHeader: ''
  });

  // Template Management States
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    placeholder: '',
    defaultValue: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  // Load templates from database on mount (with localStorage fallback)
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await templateService.getTemplates();
        setSavedTemplates(response.data || []);
      } catch (err) {
        console.error('Failed to fetch templates from DB:', err);
        const local = localStorage.getItem('wa_mitra_message_templates');
        if (local) {
          try {
            setSavedTemplates(JSON.parse(local));
          } catch (e) {
            console.error(e);
          }
        }
      }
    };
    loadTemplates();
  }, []);

  const handleSaveTemplate = async () => {
    const currentMessage = mode === 'single' ? singleData.message : bulkData.message;
    if (!currentMessage.trim()) {
      toast.error('Message content is empty. Type a template message first.');
      return;
    }
    if (!newTemplateName.trim()) {
      toast.error('Please enter a name for your template.');
      return;
    }

    // Check if name already exists
    if (savedTemplates.some(t => t.name.toLowerCase() === newTemplateName.trim().toLowerCase())) {
      toast.error('A template with this name already exists.');
      return;
    }

    try {
      const response = await templateService.createTemplate({
        name: newTemplateName.trim(),
        content: currentMessage
      });

      if (response.data) {
        // API returns { success: true, template: {...} }
        const newTpl = response.data.template || response.data;
        const updated = [newTpl, ...savedTemplates];
        setSavedTemplates(updated);
        localStorage.setItem('wa_mitra_message_templates', JSON.stringify(updated));
        setNewTemplateName('');
        setShowSaveDialog(false);
        toast.success(`Template "${newTpl.name}" saved to database!`);
      }
    } catch (err) {
      console.error('Error saving template:', err);
      toast.error(err.response?.data?.message || 'Failed to save template.');
    }
  };

  const handleSelectTemplate = (content) => {
    if (mode === 'single') {
      setSingleData({ ...singleData, message: content });
    } else {
      setBulkData({ ...bulkData, message: content });
    }
    toast.success('Template loaded into editor.');
  };

  const handleDeleteTemplate = async (id, e) => {
    e.stopPropagation();
    try {
      // If it is a numeric ID from the database, delete it from the backend
      if (id && (typeof id === 'number' || !id.toString().startsWith('tpl_'))) {
        const response = await templateService.deleteTemplate(id);
        if (response.data?.success) {
          const updated = savedTemplates.filter(t => t.id !== id);
          setSavedTemplates(updated);
          localStorage.setItem('wa_mitra_message_templates', JSON.stringify(updated));
          toast.success('Template deleted from database.');
        } else {
          // If delete was successful but returned standard response
          const updated = savedTemplates.filter(t => t.id !== id);
          setSavedTemplates(updated);
          localStorage.setItem('wa_mitra_message_templates', JSON.stringify(updated));
          toast.success('Template deleted.');
        }
      } else {
        // Purely local temporary template delete
        const updated = savedTemplates.filter(t => t.id !== id);
        setSavedTemplates(updated);
        localStorage.setItem('wa_mitra_message_templates', JSON.stringify(updated));
        toast.success('Template deleted.');
      }
    } catch (err) {
      console.error('Error deleting template:', err);
      toast.error(err.response?.data?.message || 'Failed to delete template from database.');
    }
  };

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

    // Strict 20MB limit check: 20 * 1024 * 1024 bytes = 20,971,520 bytes
    const MAX_SIZE_BYTES = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('File size exceeds the maximum 20MB limit.');
      e.target.value = ''; // Reset input element value
      return;
    }

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

  // CSV Parsing helper function
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return { headers: [], rows: [] };
    
    const parseLine = (line) => {
      const result = [];
      let curVal = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(curVal.trim());
          curVal = '';
        } else {
          curVal += char;
        }
      }
      result.push(curVal.trim());
      return result;
    };

    const rawHeaders = parseLine(lines[0]);
    // Filter out any empty headers and normalize
    const headers = rawHeaders
      .map(h => h.replace(/^["']|["']$/g, '').trim())
      .filter(h => h);
    
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = parseLine(lines[i]).map(v => v.replace(/^["']|["']$/g, '').trim());
      const rowObj = {};
      headers.forEach((header, index) => {
        rowObj[header] = values[index] || '';
      });
      rows.push(rowObj);
    }
    return { headers, rows };
  };

  // Unified file upload and parsing handler (supports CSV, XLSX, XLS)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['csv', 'xlsx', 'xls'];
    if (!allowedExtensions.includes(extension)) {
      toast.error('Unsupported file format. Please upload .csv, .xlsx, or .xls files.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();

    // Helper to process headers and rows after parsing
    const processParsedData = (headers, rows, fileName) => {
      if (headers.length === 0 || rows.length === 0) {
        toast.error('Invalid sheet structure or empty file.');
        return;
      }

      // Detect phone number column case-insensitively
      const phoneHeader = headers.find(h => /phone|number|mobile|contact/i.test(h)) || headers[0];
      const placeholders = headers.filter(h => h !== phoneHeader);

      // Deduplicate by clean phone number
      const uniqueRows = [];
      const seen = new Set();
      let duplicateCount = 0;

      rows.forEach(row => {
        const rawNum = row[phoneHeader];
        if (!rawNum) return;
        const cleanNum = rawNum.toString().replace(/\D/g, '');
        if (cleanNum) {
          if (!seen.has(cleanNum)) {
            seen.add(cleanNum);
            uniqueRows.push({
              ...row,
              _cleanPhone: cleanNum
            });
          } else {
            duplicateCount++;
          }
        }
      });

      if (uniqueRows.length === 0) {
        toast.error('No valid phone numbers found in the file.');
        return;
      }

      setCsvData({
        headers,
        placeholders,
        rows: uniqueRows,
        fileName: fileName,
        phoneHeader
      });

      toast.success(
        `Parsed ${uniqueRows.length} unique contacts successfully.` + 
        (duplicateCount > 0 ? ` (${duplicateCount} duplicate numbers ignored)` : '')
      );
    };

    if (extension === 'csv') {
      reader.onload = (event) => {
        const text = event.target.result;
        const { headers, rows } = parseCSV(text);
        processParsedData(headers, rows, file.name);
      };
      reader.readAsText(file);
    } else {
      // xlsx or xls binary parsing
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert sheet to json array of arrays
          const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (sheetData.length === 0) {
            toast.error('The uploaded Excel sheet is empty.');
            return;
          }

          const rawHeaders = sheetData[0];
          const headers = rawHeaders.map(h => (h ? h.toString().trim() : '')).filter(h => h);
          
          const rows = [];
          for (let i = 1; i < sheetData.length; i++) {
            const rowData = sheetData[i];
            if (!rowData || rowData.length === 0) continue;
            const rowObj = {};
            let hasData = false;
            headers.forEach((header, index) => {
              const val = rowData[index];
              rowObj[header] = val !== undefined && val !== null ? val.toString().trim() : '';
              if (rowObj[header]) hasData = true;
            });
            if (hasData) {
              rows.push(rowObj);
            }
          }

          processParsedData(headers, rows, file.name);
        } catch (err) {
          console.error(err);
          toast.error('Failed to parse Excel file. Please ensure it is not corrupted.');
        }
      };
      reader.readAsArrayBuffer(file);
    }

    // Reset file input value so same file can be uploaded again if cleared
    e.target.value = '';
  };

  const clearCSV = () => {
    setCsvData({
      headers: [],
      placeholders: [],
      rows: [],
      fileName: '',
      phoneHeader: ''
    });
  };

  // CSV Template download
  const downloadCSVTemplate = () => {
    const headers = ['Phone number', 'Name', 'Day', 'Time'];
    const rows = [
      ['919876543210', 'Rahul Sharma', 'Monday', '10:00 AM'],
      ['918765432109', 'Priya Patel', 'Tuesday', '02:30 PM']
    ];
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'wa_mitra_bulk_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cursor-aware placeholder insertion
  const handleInsertPlaceholder = (placeholderName) => {
    const textarea = document.getElementById('bulk-message-textarea');
    const currentMessage = mode === 'single' ? singleData.message : bulkData.message;
    const setMessage = mode === 'single'
      ? (msg) => setSingleData({ ...singleData, message: msg })
      : (msg) => setBulkData({ ...bulkData, message: msg });

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const insertText = `{${placeholderName}}`;
      
      const newText = currentMessage.substring(0, start) + insertText + currentMessage.substring(end);
      setMessage(newText);

      // Restore focus and move selection cursor right after insertion
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
      }, 0);
    } else {
      setMessage(currentMessage + `{${placeholderName}}`);
    }
  };

  const executeSendSingle = async () => {
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

  const executeSendBulk = async () => {
    setLoading(true);
    const totalCount = bulkInputMethod === 'csv' ? csvData.rows.length : bulkData.numbers.length;
    const loadingToast = toast.loading(`Sending bulk messages (0/${totalCount})...`, {
      style: { minWidth: '250px' }
    });

    try {
      let messagesArray = [];

      if (bulkInputMethod === 'csv') {
        if (csvData.rows.length === 0) {
          toast.error('Please upload a valid CSV file first', { id: loadingToast });
          setLoading(false);
          return;
        }

        // Dynamic templating for each CSV row
        messagesArray = csvData.rows.map(row => {
          let compiledMessage = bulkData.message;
          // Substitute placeholders
          csvData.headers.forEach(header => {
            const escapedHeader = header.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`{${escapedHeader}}`, 'g');
            compiledMessage = compiledMessage.replace(regex, row[header] || '');
          });

          return {
            number: row._cleanPhone,
            message: compiledMessage
          };
        });
      } else {
        // Manual bulk numbers
        messagesArray = bulkData.numbers
          .map(n => n.trim())
          .filter(n => n)
          .map(n => ({
            number: n,
            message: bulkData.message
          }));
      }

      if (messagesArray.length === 0) {
        toast.error('Please add at least one recipient number', { id: loadingToast });
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

      // Reset state
      setBulkData({ numbers: [''], message: '', file: null });
      setNumberCount(1);
      if (bulkInputMethod === 'csv') {
        clearCSV();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process bulk messages', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const autoSaveTemplate = async (tplName, content) => {
    if (savedTemplates.some(t => t.name.toLowerCase() === tplName.toLowerCase())) {
      toast.error('A template with this name already exists. Sending message without saving.');
      return;
    }
    try {
      const response = await templateService.createTemplate({
        name: tplName,
        content: content
      });
      if (response.data) {
        const newTpl = response.data.template || response.data;
        const updated = [newTpl, ...savedTemplates];
        setSavedTemplates(updated);
        localStorage.setItem('wa_mitra_message_templates', JSON.stringify(updated));
        toast.success(`Template "${newTpl.name}" saved to database!`);
      }
    } catch (err) {
      console.error('Error auto-saving template:', err);
      toast.error('Failed to save template to database.');
    }
  };

  const handleSendSingle = (e) => {
    e.preventDefault();
    if (!selectedInstance) return toast.error('Please select an instance');
    
    // Check if prompt is needed
    const currentMessage = singleData.message;
    if (!currentMessage || !currentMessage.trim()) {
      executeSendSingle();
      return;
    }

    const hasMatchingTemplate = savedTemplates.some(t => t.content.trim() === currentMessage.trim());
    if (hasMatchingTemplate) {
      executeSendSingle();
      return;
    }

    // Open custom confirmation modal
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title: 'Save Template?',
      message: 'Would you like to save this custom message as a template before sending?',
      okText: 'Yes, Save',
      cancelText: 'No, Just Send',
      onConfirm: () => {
        // Switch to naming prompt
        setModalConfig({
          isOpen: true,
          type: 'prompt',
          title: 'Name Template',
          message: 'Enter a name for this WhatsApp message template:',
          placeholder: 'e.g. Appointment Reminder',
          defaultValue: '',
          okText: 'Save & Send',
          cancelText: 'Cancel & Send',
          onConfirm: async (tplName) => {
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            if (tplName && tplName.trim()) {
              await autoSaveTemplate(tplName.trim(), currentMessage);
            }
            executeSendSingle();
          },
          onCancel: () => {
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            executeSendSingle();
          }
        });
      },
      onCancel: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        executeSendSingle();
      }
    });
  };

  const handleSendBulk = (e) => {
    e.preventDefault();
    if (!selectedInstance) return toast.error('Please select an instance');

    // Check if prompt is needed
    const currentMessage = bulkData.message;
    if (!currentMessage || !currentMessage.trim()) {
      executeSendBulk();
      return;
    }

    const hasMatchingTemplate = savedTemplates.some(t => t.content.trim() === currentMessage.trim());
    if (hasMatchingTemplate) {
      executeSendBulk();
      return;
    }

    // Open custom confirmation modal
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title: 'Save Template?',
      message: 'Would you like to save this custom message as a template before sending?',
      okText: 'Yes, Save',
      cancelText: 'No, Just Send',
      onConfirm: () => {
        // Switch to naming prompt
        setModalConfig({
          isOpen: true,
          type: 'prompt',
          title: 'Name Template',
          message: 'Enter a name for this WhatsApp message template:',
          placeholder: 'e.g. Bulk Promo',
          defaultValue: '',
          okText: 'Save & Send',
          cancelText: 'Cancel & Send',
          onConfirm: async (tplName) => {
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            if (tplName && tplName.trim()) {
              await autoSaveTemplate(tplName.trim(), currentMessage);
            }
            executeSendBulk();
          },
          onCancel: () => {
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            executeSendBulk();
          }
        });
      },
      onCancel: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        executeSendBulk();
      }
    });
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
            type="button"
            className={`tab-item ${mode === 'single' ? 'active' : ''}`}
            onClick={() => setMode('single')}
          >
            <Send size={18} /> <span>Single Message</span>
          </button>
          <button 
            type="button"
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
                  <div className="input-method-selector">
                    <button
                      type="button"
                      className={`method-btn ${bulkInputMethod === 'manual' ? 'active' : ''}`}
                      onClick={() => setBulkInputMethod('manual')}
                    >
                      <Users size={16} /> Manual Input
                    </button>
                    <button
                      type="button"
                      className={`method-btn ${bulkInputMethod === 'csv' ? 'active' : ''}`}
                      onClick={() => setBulkInputMethod('csv')}
                    >
                      <FileUp size={16} /> CSV Upload
                    </button>
                  </div>

                  {bulkInputMethod === 'manual' ? (
                    <>
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

                      <div className="numbers-list-grid" data-lenis-prevent>
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
                                required={bulkInputMethod === 'manual'}
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
                    </>
                  ) : (
                    <div className="csv-upload-container animate-fade-in">
                      {!csvData.fileName ? (
                        <div className="csv-dropzone">
                          <input 
                            type="file" 
                            id="csv-file-input" 
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileUpload}
                            hidden 
                          />
                          <label htmlFor="csv-file-input" className="csv-dropzone-label">
                            <FileUp size={32} className="upload-icon" />
                            <span className="upload-title">Choose CSV/Excel File</span>
                            <span className="upload-subtitle">Drag and drop or click to browse (.csv, .xlsx, .xls)</span>
                          </label>
                        </div>
                      ) : (
                        <div className="csv-success-card">
                          <div className="csv-success-header">
                            <div className="csv-file-info">
                              <div className="csv-icon-wrapper">
                                <FileText size={24} className="csv-icon" />
                              </div>
                              <div>
                                <span className="csv-filename">{csvData.fileName}</span>
                                <span className="csv-details">
                                  {csvData.rows.length} unique contacts parsed successfully
                                </span>
                              </div>
                            </div>
                            <button type="button" className="csv-clear-btn" onClick={clearCSV} title="Clear uploaded CSV">
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="csv-template-action">
                        <button type="button" className="download-template-link" onClick={downloadCSVTemplate}>
                          <FileText size={14} /> Download Sample CSV Template
                        </button>
                      </div>

                      {csvData.rows.length > 0 && (
                        <div className="csv-preview-section">
                          <div className="preview-header">
                            <h3>CSV Data Preview ({csvData.rows.length} Contacts)</h3>
                            <span className="phone-indicator">Phone number column detected: <strong>{csvData.phoneHeader}</strong></span>
                          </div>
                          <div className="csv-preview-table-container" data-lenis-prevent>
                            <table className="csv-preview-table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  {csvData.headers.map((h, idx) => (
                                    <th key={idx}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {csvData.rows.slice(0, 10).map((row, rIdx) => (
                                  <tr key={rIdx}>
                                    <td>{rIdx + 1}</td>
                                    {csvData.headers.map((h, cIdx) => (
                                      <td key={cIdx}>{row[h]}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {csvData.rows.length > 10 && (
                            <div className="preview-footer">
                              Showing first 10 rows of {csvData.rows.length} total unique rows.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <div className="message-header-row">
                <label style={{margin: 0}}>Message Content</label>
                {mode === 'bulk' && bulkInputMethod === 'csv' && csvData.placeholders.length > 0 && (
                  <div className="placeholder-container">
                    <span className="placeholder-label">Placeholders (Tap to insert):</span>
                    <div className="placeholder-tags">
                      {csvData.placeholders.map((placeholder) => (
                        <button
                          key={placeholder}
                          type="button"
                          className="placeholder-tag"
                          onClick={() => handleInsertPlaceholder(placeholder)}
                          title={`Click to insert {${placeholder}}`}
                        >
                          +{placeholder}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Template Controls Bar */}
              <div className="template-controls-bar">
                 <div className="template-selector-wrapper">
                  {savedTemplates.length > 0 ? (
                    <>
                      <span className="template-label">Load Template:</span>
                      <div className="template-dropdown-container">
                        <select
                          className="template-select"
                          value={selectedTemplateId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedTemplateId(val);
                            if (val) {
                              const t = savedTemplates.find(tpl => tpl.id.toString() === val.toString());
                              if (t) handleSelectTemplate(t.content);
                            }
                          }}
                          data-lenis-prevent
                        >
                          <option value="">-- Choose Template --</option>
                          {savedTemplates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                        {selectedTemplateId && (
                          <button
                            type="button"
                            className="delete-template-btn-icon"
                            onClick={async (e) => {
                              await handleDeleteTemplate(selectedTemplateId, e);
                              setSelectedTemplateId('');
                            }}
                            title="Delete this template"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <span className="template-label" style={{ opacity: 0.6 }}>No saved templates yet. Create one on the right!</span>
                  )}
                </div>
                
                <div className="save-template-trigger-wrapper">
                  {!showSaveDialog ? (
                    <button
                      type="button"
                      className="save-template-trigger-btn"
                      onClick={() => setShowSaveDialog(true)}
                      title="Save current message as a reusable template"
                    >
                      Save as Template
                    </button>
                  ) : (
                    <div className="save-template-inline-form">
                      <input
                        type="text"
                        placeholder="Template Name"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        className="template-name-input"
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn-save-confirm"
                        onClick={handleSaveTemplate}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn-save-cancel"
                        onClick={() => {
                          setShowSaveDialog(false);
                          setNewTemplateName('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <textarea 
                id="bulk-message-textarea"
                data-lenis-prevent
                className="auth-input" 
                style={{
                  paddingLeft: '14px', 
                  height: mode === 'single' ? '120px' : '150px', 
                  resize: 'none',
                  borderRadius: '0 0 8px 8px',
                  borderTop: 'none'
                }} 
                placeholder={
                  mode === 'single' 
                    ? "Type your message here..." 
                    : "Type your message here... E.g. Hello {name}, your appointment for {day} and {time} has been booked."
                }
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
                      <span>Click to upload image or document <strong style={{ color: 'var(--primary)' }}>(Max 20MB)</strong></span>
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
      <CustomModal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        placeholder={modalConfig.placeholder}
        defaultValue={modalConfig.defaultValue}
        okText={modalConfig.okText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
      />
    </div>
  );
};

export default SendMessage;
