import React, { useState, useEffect } from 'react';
import { Send, Users, FileUp, Image as ImageIcon, FileText, X, CheckCircle2, AlertCircle, Plus, Trash2, Loader2 } from 'lucide-react';
import { useOutletContext, Link, useSearchParams } from 'react-router-dom';
import { instanceService, messageService, templateService, scheduleService, cycleService } from '../../../api/services';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import './Messaging.css';
import CustomModal from '../../../components/CustomModal';

const SendMessage = () => {
  const { searchQuery } = useOutletContext();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') || 'contact';
  const [mode, setMode] = useState('single'); // 'single' or 'bulk'

  useEffect(() => {
    if (typeParam === 'contact') {
      setMode('single');
      setRecipientType('number');
    } else if (typeParam === 'bulk') {
      setMode('bulk');
    } else if (typeParam === 'group') {
      setMode('single');
      setRecipientType('group');
    }

    const titles = {
      contact: 'Direct Messaging',
      bulk: 'Bulk Campaigns',
      group: 'Group Broadcasting',
      schedule: 'Message Scheduling',
      cycling: 'Message Cycling'
    };
    document.title = `${titles[typeParam] || 'Direct Messaging'} | WA-Mitra`;
  }, [typeParam]);
  const [instances, setInstances] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const [singleData, setSingleData] = useState({
    number: '',
    message: '',
    file: null
  });

  const [recipientType, setRecipientType] = useState('number'); // 'number' or 'group'
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [isOpenGroupDropdown, setIsOpenGroupDropdown] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);

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
    onConfirm: () => { },
    onCancel: () => { }
  });

  const [mediaPreviewUrl, setMediaPreviewUrl] = useState('');

  // Scheduling States
  const [scheduleCampaignName, setScheduleCampaignName] = useState('');
  const [scheduleTargetDate, setScheduleTargetDate] = useState('');
  const [scheduleTargetTime, setScheduleTargetTime] = useState('');
  const [scheduleInputMethod, setScheduleInputMethod] = useState('manual'); // 'manual' or 'csv'
  const [scheduleNumbers, setScheduleNumbers] = useState(['']);
  const [scheduleNumberCount, setScheduleNumberCount] = useState(1);
  const [scheduleCsvData, setScheduleCsvData] = useState({
    headers: [],
    placeholders: [],
    rows: [],
    fileName: '',
    phoneHeader: ''
  });
  const [scheduleMessage, setScheduleMessage] = useState('');
  const [scheduleFile, setScheduleFile] = useState(null);
  const [scheduleMediaPreviewUrl, setScheduleMediaPreviewUrl] = useState('');
  const [scheduledCampaigns, setScheduledCampaigns] = useState(() => {
    const local = localStorage.getItem('wa_mitra_scheduled_campaigns');
    return local ? JSON.parse(local) : [];
  });
  const [timeTicker, setTimeTicker] = useState(0);
  const [scheduleShowSaveDialog, setScheduleShowSaveDialog] = useState(false);
  const [scheduleNewTemplateName, setScheduleNewTemplateName] = useState('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showCycleForm, setShowCycleForm] = useState(false);

  // Cycling (Recurring Campaign) States
  const [cycleCampaignName, setCycleCampaignName] = useState('');
  const [cycleInputMethod, setCycleInputMethod] = useState('manual'); // 'manual' or 'csv'
  const [cycleNumbers, setCycleNumbers] = useState(['']);
  const [cycleNumberCount, setCycleNumberCount] = useState(1);
  const [cycleCsvData, setCycleCsvData] = useState({
    headers: [],
    placeholders: [],
    rows: [],
    fileName: '',
    phoneHeader: ''
  });
  const [cycleFrequency, setCycleFrequency] = useState('daily'); // 'daily', 'alternate', 'weekly', 'monthly', 'custom'
  const [cycleAlternateStart, setCycleAlternateStart] = useState('today'); // 'today' or 'tomorrow'
  const [cycleWeeklyDay, setCycleWeeklyDay] = useState('Monday');
  const [cycleMonthlyDate, setCycleMonthlyDate] = useState(1);
  const [cycleCustomType, setCycleCustomType] = useState('days'); // 'days' or 'dates'
  const [cycleCustomDays, setCycleCustomDays] = useState([]); // ['Monday', 'Wednesday']
  const [cycleCustomDates, setCycleCustomDates] = useState([]); // ['2026-06-01']
  const [cycleCustomDateInput, setCycleCustomDateInput] = useState('');
  const [cycleCalendarMonth, setCycleCalendarMonth] = useState(() => new Date());
  const [cycleSendTime, setCycleSendTime] = useState('');
  const [cycleMessage, setCycleMessage] = useState('');
  const [cycleFile, setCycleFile] = useState(null);
  const [cycleMediaPreviewUrl, setCycleMediaPreviewUrl] = useState('');
  const [cyclingCampaigns, setCyclingCampaigns] = useState([]);
  const [cycleShowSaveDialog, setCycleShowSaveDialog] = useState(false);
  const [cycleNewTemplateName, setCycleNewTemplateName] = useState('');

  // Load recurring cycling campaigns from database on mount
  useEffect(() => {
    const loadCycles = async () => {
      try {
        const response = await cycleService.getCycles();
        setCyclingCampaigns(response.data || []);
      } catch (err) {
        console.error('Failed to load cycles from database:', err);
      }
    };
    loadCycles();
  }, []);

  // Update media preview for cycling
  useEffect(() => {
    if (!cycleFile) {
      setCycleMediaPreviewUrl('');
      return;
    }
    const isImage = cycleFile.type?.startsWith('image/') ||
      ['.jpg', '.jpeg', '.png', '.gif'].some(ext => cycleFile.name?.toLowerCase().endsWith(ext));
    if (isImage) {
      const objectUrl = URL.createObjectURL(cycleFile);
      setCycleMediaPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setCycleMediaPreviewUrl('');
    }
  }, [cycleFile]);

  const handleCycleNumberCountChange = (count) => {
    const val = parseInt(count) || 0;
    setCycleNumberCount(val);
    if (val > 0) {
      const newNumbers = [...cycleNumbers];
      if (val > newNumbers.length) {
        for (let i = newNumbers.length; i < val; i++) newNumbers.push('');
      } else {
        newNumbers.length = val;
      }
      setCycleNumbers(newNumbers);
    }
  };

  const addCycleNumberField = () => {
    setCycleNumbers([...cycleNumbers, '']);
    setCycleNumberCount(cycleNumbers.length + 1);
  };

  const removeCycleNumberField = (index) => {
    if (cycleNumbers.length <= 1) return;
    const newNumbers = cycleNumbers.filter((_, i) => i !== index);
    setCycleNumbers(newNumbers);
    setCycleNumberCount(newNumbers.length);
  };

  const updateCycleNumber = (index, value) => {
    const newNumbers = [...cycleNumbers];
    newNumbers[index] = value;
    setCycleNumbers(newNumbers);
  };

  const handleCycleFileUpload = (e) => {
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

    const processParsedData = (headers, rows, fileName) => {
      if (headers.length === 0 || rows.length === 0) {
        toast.error('Invalid sheet structure or empty file.');
        return;
      }

      const phoneHeader = headers[0];
      const placeholders = headers.slice(1);

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

      setCycleCsvData({
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
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
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
    e.target.value = '';
  };

  const clearCycleCSV = () => {
    setCycleCsvData({
      headers: [],
      placeholders: [],
      rows: [],
      fileName: '',
      phoneHeader: ''
    });
  };

  const handleCycleSaveTemplate = async () => {
    if (!cycleMessage.trim()) {
      toast.error('Message content is empty. Type a template message first.');
      return;
    }
    if (!cycleNewTemplateName.trim()) {
      toast.error('Please enter a name for your template.');
      return;
    }
    if (savedTemplates.some(t => t.name.toLowerCase() === cycleNewTemplateName.trim().toLowerCase())) {
      toast.error('A template with this name already exists.');
      return;
    }
    try {
      const response = await templateService.createTemplate({
        name: cycleNewTemplateName.trim(),
        content: cycleMessage
      });
      if (response.data) {
        const newTpl = response.data.template || response.data;
        const updated = [newTpl, ...savedTemplates];
        setSavedTemplates(updated);
        localStorage.setItem('wa_mitra_message_templates', JSON.stringify(updated));
        setCycleNewTemplateName('');
        setCycleShowSaveDialog(false);
        toast.success(`Template "${newTpl.name}" saved!`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save template.');
    }
  };

  const handleCycleFormatText = (formatType) => {
    const textarea = document.getElementById('cycle-message-textarea');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = cycleMessage.substring(start, end);
    let prefix = '';
    let suffix = '';
    switch (formatType) {
      case 'bold': prefix = '*'; suffix = '*'; break;
      case 'italic': prefix = '_'; suffix = '_'; break;
      case 'underline': prefix = '__'; suffix = '__'; break;
      case 'strikethrough': prefix = '~'; suffix = '~'; break;
      case 'code': prefix = '`'; suffix = '`'; break;
      default: break;
    }
    const formattedText = prefix + selectedText + suffix;
    const newText = cycleMessage.substring(0, start) + formattedText + cycleMessage.substring(end);
    setCycleMessage(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  const handleCycleInsertPlaceholder = (placeholderName) => {
    const textarea = document.getElementById('cycle-message-textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const insertText = `{${placeholderName}}`;
      const newText = cycleMessage.substring(0, start) + insertText + cycleMessage.substring(end);
      setCycleMessage(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
      }, 0);
    } else {
      setCycleMessage(cycleMessage + `{${placeholderName}}`);
    }
  };

  const toggleCycleCustomDay = (day) => {
    if (cycleCustomDays.includes(day)) {
      setCycleCustomDays(prev => prev.filter(d => d !== day));
    } else {
      setCycleCustomDays(prev => [...prev, day]);
    }
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handleCalendarPrevMonth = () => {
    setCycleCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleCalendarNextMonth = () => {
    setCycleCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const toggleCycleCustomDate = (dayNum) => {
    if (cycleCustomDates.includes(dayNum)) {
      setCycleCustomDates(prev => prev.filter(d => d !== dayNum));
    } else {
      setCycleCustomDates(prev => [...prev, dayNum].sort((a, b) => a - b));
    }
  };

  const addCycleCustomDate = () => {
    if (!cycleCustomDateInput) return;
    if (cycleCustomDates.includes(cycleCustomDateInput)) {
      toast.error('Date already added');
      return;
    }
    setCycleCustomDates(prev => [...prev, cycleCustomDateInput].sort());
    setCycleCustomDateInput('');
  };

  const removeCycleCustomDate = (index) => {
    setCycleCustomDates(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateCycleCampaign = async (e) => {
    e.preventDefault();
    if (!selectedInstance) {
      toast.error('Please select a WhatsApp instance.');
      return;
    }
    if (!cycleCampaignName.trim()) {
      toast.error('Please enter a campaign name.');
      return;
    }
    if (!cycleSendTime) {
      toast.error('Please select a send time.');
      return;
    }

    let recipientsList = [];
    if (cycleInputMethod === 'csv') {
      if (cycleCsvData.rows.length === 0) {
        toast.error('Please upload a valid CSV/Excel file first.');
        return;
      }
      recipientsList = cycleCsvData.rows.map(r => r._cleanPhone);
    } else {
      const filtered = cycleNumbers.map(n => n.trim()).filter(n => n);
      if (filtered.length === 0) {
        toast.error('Please enter at least one recipient number.');
        return;
      }
      recipientsList = filtered;
    }

    if (!cycleMessage.trim()) {
      toast.error('Message content cannot be empty.');
      return;
    }

    // Build frequency config
    const frequencyConfig = {};
    if (cycleFrequency === 'alternate') {
      frequencyConfig.startFrom = cycleAlternateStart;
    } else if (cycleFrequency === 'weekly') {
      frequencyConfig.selectedDay = cycleWeeklyDay;
    } else if (cycleFrequency === 'monthly') {
      frequencyConfig.selectedDate = cycleMonthlyDate;
    } else if (cycleFrequency === 'custom') {
      if (cycleCustomType === 'days') {
        if (cycleCustomDays.length === 0) {
          toast.error('Please select at least one day.');
          return;
        }
        frequencyConfig.selectedDays = cycleCustomDays;
      } else {
        if (cycleCustomDates.length === 0) {
          toast.error('Please add at least one date.');
          return;
        }
        frequencyConfig.selectedDates = cycleCustomDates;
      }
    }

    const campaignData = {
      name: cycleCampaignName.trim(),
      instanceKey: selectedInstance,
      frequency: cycleFrequency,
      frequencyConfig,
      sendTime: cycleSendTime,
      recipients: recipientsList,
      message: cycleMessage,
      file: cycleFile // uploaded as multipart/form-data
    };

    const loadingToast = toast.loading('Creating cycle campaign...');
    try {
      const res = await cycleService.createCycle(campaignData);
      if (res.data && res.data.success) {
        const newCycle = res.data.cycle;
        setCyclingCampaigns(prev => [newCycle, ...prev]);
        toast.success('Cycle campaign scheduled successfully!', { id: loadingToast });

        // Reset Form Fields
        setCycleCampaignName('');
        setCycleSendTime('');
        setCycleMessage('');
        setCycleFile(null);
        setCycleNumbers(['']);
        setCycleNumberCount(1);
        setCycleCustomDays([]);
        setCycleCustomDates([]);
        clearCycleCSV();
        setShowCycleForm(false);
      }
    } catch (err) {
      console.error('Error creating cycle campaign:', err);
      toast.error(err.response?.data?.message || 'Failed to create campaign.', { id: loadingToast });
    }
  };

  const handleDeleteCycleCampaign = async (id) => {
    const loadingToast = toast.loading('Deleting campaign cycle...');
    try {
      const res = await cycleService.deleteCycle(id);
      if (res.data && res.data.success) {
        setCyclingCampaigns(prev => prev.filter(c => c.id !== id));
        toast.success('Campaign cycle deleted successfully.', { id: loadingToast });
      }
    } catch (err) {
      console.error('Error deleting cycle campaign:', err);
      toast.error(err.response?.data?.message || 'Failed to delete campaign.', { id: loadingToast });
    }
  };

  // Auto-save scheduled campaigns to localStorage
  useEffect(() => {
    localStorage.setItem('wa_mitra_scheduled_campaigns', JSON.stringify(scheduledCampaigns));
  }, [scheduledCampaigns]);

  // Load schedules from database on mount (with localStorage fallback)
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const response = await scheduleService.getSchedules();
        setScheduledCampaigns(response.data || []);
      } catch (err) {
        console.error('Failed to fetch schedules from DB:', err);
        const local = localStorage.getItem('wa_mitra_scheduled_campaigns');
        if (local) {
          try {
            setScheduledCampaigns(JSON.parse(local));
          } catch (e) {
            console.error(e);
          }
        }
      }
    };
    loadSchedules();
  }, []);

  // Keep remaining time ticker updating every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTicker(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update media preview for scheduling
  useEffect(() => {
    if (!scheduleFile) {
      setScheduleMediaPreviewUrl('');
      return;
    }
    const isImage = scheduleFile.type?.startsWith('image/') ||
      ['.jpg', '.jpeg', '.png', '.gif'].some(ext => scheduleFile.name?.toLowerCase().endsWith(ext));
    if (isImage) {
      const objectUrl = URL.createObjectURL(scheduleFile);
      setScheduleMediaPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setScheduleMediaPreviewUrl('');
    }
  }, [scheduleFile]);

  const handleScheduleNumberCountChange = (count) => {
    const val = parseInt(count) || 0;
    setScheduleNumberCount(val);
    if (val > 0) {
      const newNumbers = [...scheduleNumbers];
      if (val > newNumbers.length) {
        for (let i = newNumbers.length; i < val; i++) newNumbers.push('');
      } else {
        newNumbers.length = val;
      }
      setScheduleNumbers(newNumbers);
    }
  };

  const addScheduleNumberField = () => {
    setScheduleNumbers([...scheduleNumbers, '']);
    setScheduleNumberCount(scheduleNumbers.length + 1);
  };

  const removeScheduleNumberField = (index) => {
    if (scheduleNumbers.length <= 1) return;
    const newNumbers = scheduleNumbers.filter((_, i) => i !== index);
    setScheduleNumbers(newNumbers);
    setScheduleNumberCount(newNumbers.length);
  };

  const updateScheduleNumber = (index, value) => {
    const newNumbers = [...scheduleNumbers];
    newNumbers[index] = value;
    setScheduleNumbers(newNumbers);
  };

  const handleScheduleFileUpload = (e) => {
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

    const processParsedData = (headers, rows, fileName) => {
      if (headers.length === 0 || rows.length === 0) {
        toast.error('Invalid sheet structure or empty file.');
        return;
      }

      const phoneHeader = headers[0];
      const placeholders = headers.slice(1);

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

      setScheduleCsvData({
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
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
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
    e.target.value = '';
  };

  const clearScheduleCSV = () => {
    setScheduleCsvData({
      headers: [],
      placeholders: [],
      rows: [],
      fileName: '',
      phoneHeader: ''
    });
  };

  const handleScheduleSaveTemplate = async () => {
    if (!scheduleMessage.trim()) {
      toast.error('Message content is empty. Type a template message first.');
      return;
    }
    if (!scheduleNewTemplateName.trim()) {
      toast.error('Please enter a name for your template.');
      return;
    }
    if (savedTemplates.some(t => t.name.toLowerCase() === scheduleNewTemplateName.trim().toLowerCase())) {
      toast.error('A template with this name already exists.');
      return;
    }
    try {
      const response = await templateService.createTemplate({
        name: scheduleNewTemplateName.trim(),
        content: scheduleMessage
      });
      if (response.data) {
        const newTpl = response.data.template || response.data;
        const updated = [newTpl, ...savedTemplates];
        setSavedTemplates(updated);
        localStorage.setItem('wa_mitra_message_templates', JSON.stringify(updated));
        setScheduleNewTemplateName('');
        setScheduleShowSaveDialog(false);
        toast.success(`Template "${newTpl.name}" saved!`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save template.');
    }
  };

  const handleScheduleFormatText = (formatType) => {
    const textarea = document.getElementById('schedule-message-textarea');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = scheduleMessage.substring(start, end);
    let prefix = '';
    let suffix = '';
    switch (formatType) {
      case 'bold': prefix = '*'; suffix = '*'; break;
      case 'italic': prefix = '_'; suffix = '_'; break;
      case 'underline': prefix = '__'; suffix = '__'; break;
      case 'strikethrough': prefix = '~'; suffix = '~'; break;
      case 'code': prefix = '`'; suffix = '`'; break;
      default: break;
    }
    const formattedText = prefix + selectedText + suffix;
    const newText = scheduleMessage.substring(0, start) + formattedText + scheduleMessage.substring(end);
    setScheduleMessage(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  const handleScheduleInsertPlaceholder = (placeholderName) => {
    const textarea = document.getElementById('schedule-message-textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const insertText = `{${placeholderName}}`;
      const newText = scheduleMessage.substring(0, start) + insertText + scheduleMessage.substring(end);
      setScheduleMessage(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
      }, 0);
    } else {
      setScheduleMessage(scheduleMessage + `{${placeholderName}}`);
    }
  };

  const getRemainingTime = (targetDate, targetTime) => {
    if (!targetDate || !targetTime) return 'Invalid Date/Time';
    const target = new Date(`${targetDate}T${targetTime}`);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();

    if (diffMs <= 0) {
      return 'Sent / Pending execution';
    }

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      const hours = diffHours % 24;
      return `${diffDays}d ${hours}h remaining`;
    } else if (diffHours > 0) {
      const mins = diffMins % 60;
      return `${diffHours}h ${mins}m remaining`;
    } else if (diffMins > 0) {
      const secs = diffSecs % 60;
      return `${diffMins}m ${secs}s remaining`;
    } else {
      return `${diffSecs}s remaining`;
    }
  };

  const handleCreateScheduleCampaign = async (e) => {
    e.preventDefault();
    if (!selectedInstance) {
      toast.error('Please select a WhatsApp instance.');
      return;
    }
    if (!scheduleTargetDate || !scheduleTargetTime) {
      toast.error('Please select both a target date and time.');
      return;
    }

    const targetDateTime = new Date(`${scheduleTargetDate}T${scheduleTargetTime}`);
    if (targetDateTime.getTime() <= Date.now()) {
      toast.error('Target date/time must be in the future.');
      return;
    }

    let recipientsCount = 0;
    let numbersList = [];
    if (scheduleInputMethod === 'csv') {
      if (scheduleCsvData.rows.length === 0) {
        toast.error('Please upload a valid CSV/Excel file first.');
        return;
      }
      recipientsCount = scheduleCsvData.rows.length;
      numbersList = scheduleCsvData.rows.map(r => r._cleanPhone);
    } else {
      const filtered = scheduleNumbers.map(n => n.trim()).filter(n => n);
      if (filtered.length === 0) {
        toast.error('Please enter at least one recipient number.');
        return;
      }
      recipientsCount = filtered.length;
      numbersList = filtered;
    }

    if (!scheduleMessage.trim()) {
      toast.error('Message content cannot be empty.');
      return;
    }

    const activeInstanceObj = instances.find(i => i.instanceKey === selectedInstance);
    const instanceName = activeInstanceObj ? activeInstanceObj.name : 'Instance';

    const campaignData = {
      name: scheduleCampaignName.trim() || `Schedule Campaign ${new Date().toLocaleDateString()}`,
      instanceKey: selectedInstance,
      targetDate: scheduleTargetDate,
      targetTime: scheduleTargetTime,
      recipients: numbersList,
      message: scheduleMessage,
      file: scheduleFile
    };

    const loadingToast = toast.loading('Scheduling campaign...');
    try {
      const res = await scheduleService.createSchedule(campaignData);
      if (res.data && res.data.success) {
        const newCampaign = res.data.schedule;
        const uiCampaign = {
          ...newCampaign,
          instanceName
        };
        setScheduledCampaigns(prev => [uiCampaign, ...prev]);
        toast.success('Campaign scheduled successfully!', { id: loadingToast });

        // Reset Form Fields
        setScheduleCampaignName('');
        setScheduleTargetDate('');
        setScheduleTargetTime('');
        setScheduleMessage('');
        setScheduleFile(null);
        setScheduleNumbers(['']);
        setScheduleNumberCount(1);
        clearScheduleCSV();
        setShowScheduleForm(false);
      }
    } catch (err) {
      console.error('Error creating schedule:', err);
      toast.error(err.response?.data?.message || 'Failed to schedule campaign.', { id: loadingToast });
    }
  };

  const handleDeleteScheduleCampaign = async (id) => {
    const loadingToast = toast.loading('Canceling scheduled campaign...');
    try {
      const res = await scheduleService.deleteSchedule(id);
      if (res.data && res.data.success) {
        setScheduledCampaigns(prev => prev.filter(c => c.id !== id));
        toast.success('Scheduled campaign canceled successfully.', { id: loadingToast });
      }
    } catch (err) {
      console.error('Error deleting schedule:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel scheduled campaign.', { id: loadingToast });
    }
  };

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

  useEffect(() => {
    const fetchGroups = async () => {
      if (!selectedInstance || recipientType !== 'group' || mode !== 'single') {
        setGroups([]);
        setGroupSearchQuery('');
        setSelectedGroups([]);
        return;
      }
      setLoadingGroups(true);
      try {
        const res = await instanceService.getGroups(selectedInstance);
        const fetchedGroups = res.data.groups || [];
        setGroups(fetchedGroups);
        if (fetchedGroups.length > 0 && selectedGroups.length === 0) {
          setSelectedGroups([fetchedGroups[0]]);
        }
        setGroupSearchQuery('');
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Failed to fetch WhatsApp groups');
        setGroups([]);
        setSelectedGroups([]);
        setGroupSearchQuery('');
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchGroups();
  }, [selectedInstance, recipientType, mode]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.searchable-dropdown-container')) {
        setIsOpenGroupDropdown(false);
        setGroupSearchQuery('');
      }
    };

    if (isOpenGroupDropdown) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isOpenGroupDropdown]);

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

      // Enforce first column must be the phone number column
      const phoneHeader = headers[0];
      const placeholders = headers.slice(1);

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

  const getMismatchedPlaceholders = () => {
    if (mode !== 'bulk' || bulkInputMethod !== 'csv' || !csvData.fileName) return [];
    const message = bulkData.message;
    if (!message) return [];

    const placeholderRegex = /\{([^{}]+)\}/g;
    const matches = [];
    let match;
    while ((match = placeholderRegex.exec(message)) !== null) {
      matches.push(match[1]);
    }

    const uniqueMsgPlaceholders = [...new Set(matches)];
    const csvHeadersLower = csvData.headers.map(h => h.toLowerCase());
    return uniqueMsgPlaceholders.filter(p => !csvHeadersLower.includes(p.toLowerCase()));
  };

  const executeSendSingle = async () => {
    const loadingToast = toast.loading('Sending message...');
    setLoading(true);
    try {
      if (recipientType === 'group') {
        if (selectedGroups.length === 0) {
          toast.error('Please select at least one WhatsApp group', { id: loadingToast });
          setLoading(false);
          return;
        }

        // Loop through all selected groups sequentially
        for (let i = 0; i < selectedGroups.length; i++) {
          const group = selectedGroups[i];
          toast.loading(`Sending message to group (${i + 1}/${selectedGroups.length}): ${group.subject}...`, { id: loadingToast });

          await messageService.sendMessage({
            ...singleData,
            number: group.id,
            instanceKey: selectedInstance
          });

          // 1-second timeout delay between dispatches to maintain Baileys connection stability
          if (i < selectedGroups.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        toast.success(`Message sent to all ${selectedGroups.length} groups successfully!`, { id: loadingToast });
        setSelectedGroups([]);
        setGroupSearchQuery('');
        setSingleData({ number: '', message: '', file: null });
      } else {
        await messageService.sendMessage({
          ...singleData,
          instanceKey: selectedInstance
        });
        toast.success('Message sent successfully!', { id: loadingToast });
        setSingleData({ number: '', message: '', file: null });
      }
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

        // Validate that headers exactly match message placeholders
        const placeholderRegex = /\{([^{}]+)\}/g;
        const matches = [];
        let match;
        while ((match = placeholderRegex.exec(bulkData.message)) !== null) {
          matches.push(match[1]);
        }
        const msgPlaceholders = [...new Set(matches)];

        const sortedMsgPlaceholders = [...msgPlaceholders].sort();
        const sortedCsvPlaceholders = [...csvData.placeholders].sort();

        const isExactlySame = sortedMsgPlaceholders.length === sortedCsvPlaceholders.length &&
          sortedMsgPlaceholders.every((val, index) => val === sortedCsvPlaceholders[index]);

        if (!isExactlySame) {
          const missingInCsv = msgPlaceholders.filter(p => !csvData.placeholders.includes(p));
          const extraInCsv = csvData.placeholders.filter(p => !msgPlaceholders.includes(p));

          let errorMsg = 'Header mismatch! ';
          if (missingInCsv.length > 0) {
            errorMsg += `Missing columns in file for placeholders: ${missingInCsv.map(p => `"${p}"`).join(', ')}. `;
          }
          if (extraInCsv.length > 0) {
            errorMsg += `Extra unused columns in file: ${extraInCsv.map(p => `"${p}"`).join(', ')}. `;
          }
          errorMsg += 'Please ensure placeholders and file columns match exactly (case-sensitive).';

          toast.error(errorMsg, { id: loadingToast });
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

    if (bulkInputMethod === 'csv') {
      if (csvData.rows.length === 0) {
        toast.error('Please upload a valid CSV/Excel file first');
        return;
      }

      // Extract placeholders from message
      const placeholderRegex = /\{([^{}]+)\}/g;
      const matches = [];
      let match;
      while ((match = placeholderRegex.exec(bulkData.message)) !== null) {
        matches.push(match[1]);
      }
      const msgPlaceholders = [...new Set(matches)];

      const sortedMsgPlaceholders = [...msgPlaceholders].sort();
      const sortedCsvPlaceholders = [...csvData.placeholders].sort();

      const isExactlySame = sortedMsgPlaceholders.length === sortedCsvPlaceholders.length &&
        sortedMsgPlaceholders.every((val, index) => val === sortedCsvPlaceholders[index]);

      if (!isExactlySame) {
        const missingInCsv = msgPlaceholders.filter(p => !csvData.placeholders.includes(p));
        const extraInCsv = csvData.placeholders.filter(p => !msgPlaceholders.includes(p));

        let errorMsg = 'Header mismatch! ';
        if (missingInCsv.length > 0) {
          errorMsg += `Missing columns in file for placeholders: ${missingInCsv.map(p => `"${p}"`).join(', ')}. `;
        }
        if (extraInCsv.length > 0) {
          errorMsg += `Extra unused columns in file: ${extraInCsv.map(p => `"${p}"`).join(', ')}. `;
        }
        errorMsg += 'Please ensure placeholders and file columns match exactly (case-sensitive).';

        toast.error(errorMsg);
        return;
      }
    }

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

  useEffect(() => {
    if (!currentFile) {
      setMediaPreviewUrl('');
      return;
    }

    const isImage = currentFile.type?.startsWith('image/') ||
      ['.jpg', '.jpeg', '.png', '.gif'].some(ext => currentFile.name?.toLowerCase().endsWith(ext));

    if (isImage) {
      const objectUrl = URL.createObjectURL(currentFile);
      setMediaPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setMediaPreviewUrl('');
    }
  }, [currentFile]);

  const activeInstanceObj = instances.find(i => i.instanceKey === selectedInstance);
  const instanceNameForHeader = activeInstanceObj ? activeInstanceObj.name : 'WA-Mitra Gateway';
  const instanceAvatarForHeader = activeInstanceObj ? activeInstanceObj.profilePic : null;

  const formatPreviewText = (text) => {
    if (!text) return '';

    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // Underline formatting: __text__ -> <u>text</u>
    escaped = escaped.replace(/__(.*?)__/g, '<u>$1</u>');

    // Bold formatting: *text* -> <strong>text</strong>
    escaped = escaped.replace(/\*(.*?)\*/g, '<strong>$1</strong>');

    // Italic formatting: _text_ -> <em>text</em>
    escaped = escaped.replace(/_(.*?)_/g, '<em>$1</em>');

    // Strikethrough formatting: ~text~ -> <del>text</del>
    escaped = escaped.replace(/~(.*?)~/g, '<del>$1</del>');

    // Monospace code formatting: `code` -> <code>code</code>
    escaped = escaped.replace(/`(.*?)`/g, '<code>$1</code>');

    // Placeholders: {PlaceholderName} -> <span class="preview-placeholder-badge">{PlaceholderName}</span>
    escaped = escaped.replace(/\{([^{}]+)\}/g, '<span class="preview-placeholder-badge">{$1}</span>');

    // Line breaks: \n -> <br />
    escaped = escaped.replace(/\n/g, '<br />');

    return escaped;
  };

  const handleFormatText = (formatType) => {
    const textarea = document.getElementById('bulk-message-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = mode === 'single' ? singleData.message : bulkData.message;
    const selectedText = text.substring(start, end);

    let prefix = '';
    let suffix = '';

    switch (formatType) {
      case 'bold':
        prefix = '*';
        suffix = '*';
        break;
      case 'italic':
        prefix = '_';
        suffix = '_';
        break;
      case 'underline':
        prefix = '__';
        suffix = '__';
        break;
      case 'strikethrough':
        prefix = '~';
        suffix = '~';
        break;
      case 'code':
        prefix = '`';
        suffix = '`';
        break;
      default:
        break;
    }

    const formattedText = prefix + selectedText + suffix;
    const newText = text.substring(0, start) + formattedText + text.substring(end);

    const setMessage = mode === 'single'
      ? (msg) => setSingleData({ ...singleData, message: msg })
      : (msg) => setBulkData({ ...bulkData, message: msg });

    setMessage(newText);

    // Refocus and select the formatted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  // Filter groups alphabetically-sorted list by search query. Show all if empty.
  const filteredGroupsList = groups.filter(g => {
    if (!groupSearchQuery.trim()) return true;
    return (g.subject || '').toLowerCase().includes(groupSearchQuery.toLowerCase());
  });

  const getHeaderDetails = () => {
    switch (typeParam) {
      case 'bulk':
        return {
          title: "Bulk Campaigns",
          subtitle: "Broadcast customized messages to a list of contacts manually or via CSV/Excel."
        };
      case 'group':
        return {
          title: "Group Broadcasting",
          subtitle: "Dispatch messages to multiple WhatsApp participating groups."
        };
      case 'schedule':
        return {
          title: "Message Scheduling",
          subtitle: "Schedule automated campaigns to run at specific dates and times."
        };
      case 'cycling':
        return {
          title: "Message Cycling",
          subtitle: "Rotate messaging across multiple linked instances to distribute traffic."
        };
      case 'contact':
      default:
        return {
          title: "Direct Messaging",
          subtitle: "Send single WhatsApp messages to specific contact numbers."
        };
    }
  };

  const headerDetails = getHeaderDetails();

  const renderSchedulingUI = () => {
    return (
      <div className="messaging-body animate-fade-in" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {!showScheduleForm ? (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
                onClick={() => setShowScheduleForm(true)}
              >
                <Plus size={18} /> Schedule a Campaign
              </button>
            </div>
          ) : (
            <div className="scheduling-form-card glass" style={{ padding: '24px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>Create New Scheduled Campaign</h3>
                <button
                  type="button"
                  className="btn-save-cancel"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
                  onClick={() => setShowScheduleForm(false)}
                >
                  <X size={14} /> Close Form
                </button>
              </div>

            {/* Instance, Name, Target Date, Target Time */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div className="form-group">
                <label>Select WhatsApp Instance</label>
                <select
                  className="auth-input"
                  style={{ paddingLeft: '14px' }}
                  value={selectedInstance}
                  onChange={e => setSelectedInstance(e.target.value)}
                  required
                >
                  {instances.length === 0 && <option value="">No connected instances found</option>}
                  {instances.map(inst => (
                    <option key={inst.instanceKey} value={inst.instanceKey}>{inst.name} ({inst.phone})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Campaign Name <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>(Optional)</span></label>
                <input
                  type="text"
                  className="auth-input"
                  style={{ paddingLeft: '14px' }}
                  placeholder="e.g. Weekly Promotion"
                  value={scheduleCampaignName}
                  onChange={e => setScheduleCampaignName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Target Date</label>
                <input
                  type="date"
                  className="auth-input"
                  style={{ paddingLeft: '14px' }}
                  value={scheduleTargetDate}
                  onChange={e => setScheduleTargetDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Target Time</label>
                <input
                  type="time"
                  className="auth-input"
                  style={{ paddingLeft: '14px' }}
                  value={scheduleTargetTime}
                  onChange={e => setScheduleTargetTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Recipients numbers same as bulk */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label>Recipients (Manual list or CSV/Excel Broadcast)</label>
              <div className="bulk-numbers-section" style={{ marginTop: '8px' }}>
                <div className="input-method-selector">
                  <button
                    type="button"
                    className={`method-btn ${scheduleInputMethod === 'manual' ? 'active' : ''}`}
                    onClick={() => setScheduleInputMethod('manual')}
                  >
                    <Users size={16} /> Manual Input
                  </button>
                  <button
                    type="button"
                    className={`method-btn ${scheduleInputMethod === 'csv' ? 'active' : ''}`}
                    onClick={() => setScheduleInputMethod('csv')}
                  >
                    <FileUp size={16} /> CSV Upload
                  </button>
                </div>

                {scheduleInputMethod === 'manual' ? (
                  <>
                    <div className="form-group mb-4" style={{ maxWidth: '250px' }}>
                      <label style={{ fontSize: '0.8rem', opacity: 0.8 }}>How many numbers do you have? (Optional)</label>
                      <input
                        type="number"
                        className="auth-input"
                        style={{ paddingLeft: '14px' }}
                        placeholder="Enter count"
                        value={scheduleNumberCount}
                        min="1"
                        onChange={(e) => handleScheduleNumberCountChange(e.target.value)}
                      />
                    </div>

                    <div className="numbers-list-grid" data-lenis-prevent style={{ maxHeight: '200px' }}>
                      {scheduleNumbers.map((num, idx) => (
                        <div key={idx} className="number-input-row">
                          <div className="input-with-count">
                            <span className="idx-tag">{idx + 1}</span>
                            <input
                              type="text"
                              className="auth-input"
                              style={{ paddingLeft: '35px' }}
                              placeholder="919876543210"
                              value={num}
                              onChange={(e) => updateScheduleNumber(idx, e.target.value)}
                              required={scheduleInputMethod === 'manual'}
                            />
                          </div>
                          {scheduleNumbers.length > 1 && (
                            <button type="button" className="remove-num-btn" onClick={() => removeScheduleNumberField(idx)}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button type="button" className="add-number-btn mt-4" onClick={addScheduleNumberField}>
                      <Plus size={16} /> Add Another Number
                    </button>
                  </>
                ) : (
                  <div className="csv-upload-container animate-fade-in">
                    {!scheduleCsvData.fileName ? (
                      <div className="csv-dropzone">
                        <input
                          type="file"
                          id="schedule-csv-file-input"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleScheduleFileUpload}
                          hidden
                        />
                        <label htmlFor="schedule-csv-file-input" className="csv-dropzone-label">
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
                              <span className="csv-filename">{scheduleCsvData.fileName}</span>
                              <span className="csv-details">
                                {scheduleCsvData.rows.length} unique contacts parsed successfully
                              </span>
                            </div>
                          </div>
                          <button type="button" className="csv-clear-btn" onClick={clearScheduleCSV} title="Clear uploaded CSV">
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="csv-template-action" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                      <button type="button" className="download-template-link" onClick={downloadCSVTemplate}>
                        <FileText size={14} /> Download Sample CSV Template
                      </button>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#eab308',
                        background: 'rgba(234, 179, 8, 0.1)',
                        border: '1px solid rgba(234, 179, 8, 0.2)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '8px'
                      }}>
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        <span><strong>Note:</strong> The first column in the file must contain the phone numbers. Other columns will be used as placeholders (e.g. <code>{"{Name}"}</code>).</span>
                      </div>
                    </div>

                    {scheduleCsvData.rows.length > 0 && (
                      <div className="csv-preview-section">
                        <div className="preview-header">
                          <h3>CSV Data Preview ({scheduleCsvData.rows.length} Contacts)</h3>
                          <span className="phone-indicator">Phone column: <strong>{scheduleCsvData.phoneHeader}</strong></span>
                        </div>
                        <div className="csv-preview-table-container" data-lenis-prevent style={{ maxHeight: '150px' }}>
                          <table className="csv-preview-table">
                            <thead>
                              <tr>
                                <th>#</th>
                                {scheduleCsvData.headers.map((h, idx) => (
                                  <th key={idx}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {scheduleCsvData.rows.slice(0, 5).map((row, rIdx) => (
                                <tr key={rIdx}>
                                  <td>{rIdx + 1}</td>
                                  {scheduleCsvData.headers.map((h, cIdx) => (
                                    <td key={cIdx}>{row[h]}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Template select and editor */}
            <div className="messaging-layout" style={{ marginTop: '20px' }}>
              <div className="messaging-form-col">
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <div className="message-header-row">
                <label style={{ margin: 0 }}>Message Content</label>
                {scheduleInputMethod === 'csv' && scheduleCsvData.placeholders.length > 0 && (
                  <div className="placeholder-container">
                    <span className="placeholder-label">Placeholders:</span>
                    <div className="placeholder-tags">
                      {scheduleCsvData.placeholders.map((placeholder) => (
                        <button
                          key={placeholder}
                          type="button"
                          className="placeholder-tag"
                          onClick={() => handleScheduleInsertPlaceholder(placeholder)}
                        >
                          +{placeholder}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="template-controls-bar">
                <div className="template-selector-wrapper">
                  {savedTemplates.length > 0 ? (
                    <>
                      <span className="template-label">Load Template:</span>
                      <select
                        className="template-select"
                        value=""
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const t = savedTemplates.find(tpl => tpl.id.toString() === val.toString());
                            if (t) setScheduleMessage(t.content);
                          }
                        }}
                      >
                        <option value="">-- Choose Template --</option>
                        {savedTemplates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <span className="template-label" style={{ opacity: 0.6 }}>No templates found</span>
                  )}
                </div>

                <div className="save-template-trigger-wrapper">
                  {!scheduleShowSaveDialog ? (
                    <button
                      type="button"
                      className="save-template-trigger-btn"
                      onClick={() => setScheduleShowSaveDialog(true)}
                    >
                      Save as Template
                    </button>
                  ) : (
                    <div className="save-template-inline-form">
                      <input
                        type="text"
                        placeholder="Template Name"
                        value={scheduleNewTemplateName}
                        onChange={(e) => setScheduleNewTemplateName(e.target.value)}
                        className="template-name-input"
                      />
                      <button type="button" className="btn-save-confirm" onClick={handleScheduleSaveTemplate}>Save</button>
                      <button type="button" className="btn-save-cancel" onClick={() => {
                        setScheduleShowSaveDialog(false);
                        setScheduleNewTemplateName('');
                      }}>Cancel</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="formatting-toolbar">
                <button type="button" className="format-btn" onClick={() => handleScheduleFormatText('bold')}><strong>B</strong></button>
                <button type="button" className="format-btn" onClick={() => handleScheduleFormatText('italic')}><em>I</em></button>
                <button type="button" className="format-btn" onClick={() => handleScheduleFormatText('underline')}><u>U</u></button>
                <button type="button" className="format-btn" onClick={() => handleScheduleFormatText('strikethrough')}><del>S</del></button>
                <button type="button" className="format-btn" onClick={() => handleScheduleFormatText('code')}><code>&lt;/&gt;</code></button>
              </div>

              <textarea
                id="schedule-message-textarea"
                className="auth-input"
                style={{
                  paddingLeft: '14px',
                  height: '120px',
                  resize: 'none',
                  borderRadius: '0 0 8px 8px',
                  borderTop: 'none'
                }}
                placeholder="Type your scheduled message here..."
                value={scheduleMessage}
                onChange={(e) => setScheduleMessage(e.target.value)}
                required
              ></textarea>
            </div>

            {/* Media file selection (Optional) */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label>Media file (Optional)</label>
              <div className="file-upload-zone">
                <input 
                  type="file" 
                  id="schedule-file-input" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const MAX_SIZE_BYTES = 20 * 1024 * 1024;
                      if (file.size > MAX_SIZE_BYTES) {
                        toast.error('File size exceeds the maximum 20MB limit.');
                        e.target.value = '';
                        return;
                      }
                      setScheduleFile(file);
                    }
                  }}
                  hidden 
                />
                <label htmlFor="schedule-file-input" className="file-label">
                  {!scheduleFile ? (
                    <span className="file-placeholder">
                      <FileUp size={24} /> 
                      <span>Click to upload image or document <strong style={{ color: 'var(--primary)' }}>(Max 20MB)</strong></span>
                    </span>
                  ) : (
                    <div className="file-info" style={{ flexDirection: 'column', padding: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={24} />
                        <span className="file-name">{scheduleFile.name}</span>
                        <button type="button" className="remove-file" onClick={() => setScheduleFile(null)}>
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <button type="button" className="btn-primary" onClick={handleCreateScheduleCampaign}>
              Schedule Campaign <Send size={16} />
            </button>
          </div>

          <div className="messaging-preview-col animate-fade-in">
            <div className="wa-preview-wrapper">
              <div className="wa-preview-header-main">
                <span>Message Preview</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.7 }}>Live Mockup</span>
              </div>
              <div className="wa-phone-container">
                {/* Phone Header */}
                <div className="wa-phone-header">
                  <div className="wa-avatar">
                    {instanceAvatarForHeader ? (
                      <img src={instanceAvatarForHeader} alt="Avatar" />
                    ) : (
                      <span>{instanceNameForHeader.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="wa-header-info">
                    <span className="wa-header-name">{instanceNameForHeader}</span>
                    <span className="wa-header-status">online</span>
                  </div>
                  <div className="wa-header-actions">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px', opacity: 0.9 }}>
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px', opacity: 0.9 }}>
                      <path d="M23 7a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7z"></path>
                      <path d="M23 7l-9.5 6.5L1 7"></path>
                    </svg>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', lineHeight: 1, cursor: 'default' }}>⋮</span>
                  </div>
                </div>

                {/* Chat Area */}
                <div className="wa-chat-area" data-lenis-prevent>
                  <div className="wa-chat-spacer"></div>
                  {/* Date Tag */}
                  <div style={{
                    alignSelf: 'center',
                    background: 'rgba(255, 255, 255, 0.75)',
                    color: '#54656f',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '0.68rem',
                    fontWeight: '600',
                    boxShadow: '0 1px 0.5px rgba(0,0,0,0.06)',
                    marginBottom: '14px',
                    textTransform: 'uppercase'
                  }} className="wa-date-tag">
                    Today
                  </div>

                  {/* Chat Bubble */}
                  <div className="wa-chat-bubble outgoing">
                    {/* Media Render */}
                    {scheduleFile && (
                      scheduleMediaPreviewUrl ? (
                        <div className="wa-preview-media">
                          <img src={scheduleMediaPreviewUrl} alt="Upload Preview" />
                        </div>
                      ) : (
                        <div className="wa-doc-preview">
                          <span className="wa-doc-icon" style={{ fontSize: '1.1rem' }}>📁</span>
                          <div className="wa-doc-details">
                            <span className="wa-doc-name">{scheduleFile.name}</span>
                            <span className="wa-doc-size">
                              {(scheduleFile.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                      )
                    )}

                    {/* Text Render */}
                    <div
                      className="wa-bubble-text"
                      dangerouslySetInnerHTML={{
                        __html: formatPreviewText(scheduleMessage) || '<span style="color: var(--text-muted); font-style: italic;">No message content</span>'
                      }}
                    />

                    {/* Meta Information (Time & Double Checkticks) */}
                    <div className="wa-bubble-meta">
                      <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="wa-checkmark">
                        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '13px', height: '9px' }}>
                          <path d="M4.5 8L1.5 5L0.5 6L4.5 10L12.5 2L11.5 1L4.5 8Z" fill="currentColor" />
                          <path d="M8.5 8L7.5 7L6.5 8L8.5 10L15.5 3L14.5 2L8.5 8Z" fill="currentColor" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Table display */}
          <div className="schedules-list-card glass" style={{ padding: '24px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-main)' }}>Active Schedules</h3>
            <div className="csv-preview-table-container" style={{ maxHeight: 'none' }}>
              <table className="csv-preview-table">
                <thead>
                  <tr>
                    <th>Campaign name</th>
                    <th>instance</th>
                    <th>Date&Time</th>
                    <th>Remaining time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                        No campaigns scheduled yet.
                      </td>
                    </tr>
                  ) : (
                    scheduledCampaigns.map((camp) => (
                      <tr key={camp.id}>
                        <td style={{ fontWeight: '600' }}>{camp.name}</td>
                        <td>{camp.instanceName}</td>
                        <td>{camp.targetDate} {camp.targetTime}</td>
                        <td>
                          <span style={{
                            fontWeight: '600',
                            color: getRemainingTime(camp.targetDate, camp.targetTime).includes('remaining') ? 'var(--primary)' : 'var(--text-muted)'
                          }}>
                            {getRemainingTime(camp.targetDate, camp.targetTime)}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="remove-num-btn"
                            style={{ width: '28px', height: '28px' }}
                            onClick={() => handleDeleteScheduleCampaign(camp.id)}
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCyclingUI = () => {
    return (
      <div className="messaging-body animate-fade-in" style={{ padding: '32px' }}>
        <form onSubmit={handleCreateCycleCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {!showCycleForm ? (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
                onClick={() => setShowCycleForm(true)}
              >
                <Plus size={18} /> Cycle a Campaign
              </button>
            </div>
          ) : (
            <div className="cycling-form-card glass" style={{ padding: '24px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>Create Message Cycling (Recurring Campaign)</h3>
                <button
                  type="button"
                  className="btn-save-cancel"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
                  onClick={() => setShowCycleForm(false)}
                >
                  <X size={14} /> Close Form
                </button>
              </div>

            {/* Instance & Campaign Name */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label>Select WhatsApp Instance</label>
                <select
                  className="auth-input"
                  style={{ paddingLeft: '14px' }}
                  value={selectedInstance}
                  onChange={e => setSelectedInstance(e.target.value)}
                  required
                >
                  {instances.length === 0 && <option value="">No connected instances found</option>}
                  {instances.map(inst => (
                    <option key={inst.instanceKey} value={inst.instanceKey}>{inst.name} ({inst.phone})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Campaign Name</label>
                <input
                  type="text"
                  className="auth-input"
                  style={{ paddingLeft: '14px' }}
                  placeholder="e.g. Daily Promo Rotation"
                  value={cycleCampaignName}
                  onChange={e => setCycleCampaignName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Time to Send</label>
                <input
                  type="time"
                  className="auth-input"
                  style={{ paddingLeft: '14px' }}
                  value={cycleSendTime}
                  onChange={e => setCycleSendTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Frequency Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px', alignItems: 'end' }}>
              <div className="form-group">
                <label>Frequency</label>
                <select
                  className="auth-input"
                  style={{ paddingLeft: '14px' }}
                  value={cycleFrequency}
                  onChange={e => setCycleFrequency(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="alternate">Alternate Days</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* alternate: start from today or tomorrow */}
              {cycleFrequency === 'alternate' && (
                <div className="form-group animate-fade-in">
                  <label>Start From</label>
                  <select
                    className="auth-input"
                    style={{ paddingLeft: '14px' }}
                    value={cycleAlternateStart}
                    onChange={e => setCycleAlternateStart(e.target.value)}
                  >
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                  </select>
                </div>
              )}

              {/* Weekly: select a day */}
              {cycleFrequency === 'weekly' && (
                <div className="form-group animate-fade-in">
                  <label>Select Day of Week</label>
                  <select
                    className="auth-input"
                    style={{ paddingLeft: '14px' }}
                    value={cycleWeeklyDay}
                    onChange={e => setCycleWeeklyDay(e.target.value)}
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
              )}

              {/* Custom: select multiple dates or days */}
              {cycleFrequency === 'custom' && (
                <div className="form-group animate-fade-in" style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Custom Selection Mode</label>
                    <select
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
                      value={cycleCustomType}
                      onChange={e => setCycleCustomType(e.target.value)}
                    >
                      <option value="days">Multiple Days</option>
                      <option value="dates">Specific Dates</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Monthly Date Sub-Selector Rendering */}
            {cycleFrequency === 'monthly' && (
              <div className="form-group animate-fade-in" style={{ marginBottom: '24px', background: 'var(--bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <label style={{ fontSize: '0.85rem', marginBottom: '10px', display: 'block' }}>Select Date of Month</label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(7, 1fr)', 
                  gap: '8px', 
                  maxWidth: '320px',
                  background: 'rgba(255, 255, 255, 0.01)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)'
                }}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                    const isSelected = cycleMonthlyDate === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setCycleMonthlyDate(d)}
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          border: '1px solid',
                          borderColor: isSelected ? 'var(--primary)' : 'transparent',
                          background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.03)',
                          color: isSelected ? '#ffffff' : 'var(--text)',
                          fontSize: '0.85rem',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Days/Dates Sub-Selector Rendering */}
            {cycleFrequency === 'custom' && (
              <div className="form-group animate-fade-in" style={{ marginBottom: '24px', background: 'var(--bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                {cycleCustomType === 'days' ? (
                  <div>
                    <label style={{ fontSize: '0.85rem', marginBottom: '10px', display: 'block' }}>Select Days of the Week</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                        const isSelected = cycleCustomDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleCycleCustomDay(day)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid',
                              borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                              background: isSelected ? 'rgba(0, 168, 132, 0.08)' : 'transparent',
                              color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              transition: 'var(--transition)'
                            }}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: '0.85rem', marginBottom: '10px', display: 'block' }}>Select Dates of the Month</label>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(7, 1fr)', 
                      gap: '8px', 
                      maxWidth: '320px',
                      background: 'rgba(255, 255, 255, 0.01)',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)'
                    }}>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                        const isSelected = cycleCustomDates.includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => toggleCycleCustomDate(d)}
                            style={{
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              border: '1px solid',
                              borderColor: isSelected ? 'var(--primary)' : 'transparent',
                              background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.03)',
                              color: isSelected ? '#ffffff' : 'var(--text)',
                              fontSize: '0.85rem',
                              fontWeight: isSelected ? 'bold' : 'normal',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected dates summary */}
                    {cycleCustomDates.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Selected Dates ({cycleCustomDates.length}):</span>
                          <button
                            type="button"
                            onClick={() => setCycleCustomDates([])}
                            style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                          >
                            Clear All
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '100px', overflowY: 'auto', padding: '4px' }} data-lenis-prevent>
                          {cycleCustomDates.map((date, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontSize: '0.75rem',
                                color: 'var(--text)'
                              }}
                            >
                              <span>{date}</span>
                              <button
                                type="button"
                                onClick={() => toggleCycleCustomDate(date)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Recipients Section */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label>Recipients (Manual list or CSV/Excel Broadcast)</label>
              <div className="bulk-numbers-section" style={{ marginTop: '8px' }}>
                <div className="input-method-selector">
                  <button
                    type="button"
                    className={`method-btn ${cycleInputMethod === 'manual' ? 'active' : ''}`}
                    onClick={() => setCycleInputMethod('manual')}
                  >
                    <Users size={16} /> Manual Input
                  </button>
                  <button
                    type="button"
                    className={`method-btn ${cycleInputMethod === 'csv' ? 'active' : ''}`}
                    onClick={() => setCycleInputMethod('csv')}
                  >
                    <FileUp size={16} /> CSV Upload
                  </button>
                </div>

                {cycleInputMethod === 'manual' ? (
                  <>
                    <div className="form-group mb-4" style={{ maxWidth: '250px' }}>
                      <label style={{ fontSize: '0.8rem', opacity: 0.8 }}>How many numbers do you have? (Optional)</label>
                      <input
                        type="number"
                        className="auth-input"
                        style={{ paddingLeft: '14px' }}
                        placeholder="Enter count"
                        value={cycleNumberCount}
                        min="1"
                        onChange={(e) => handleCycleNumberCountChange(e.target.value)}
                      />
                    </div>

                    <div className="numbers-list-grid" data-lenis-prevent style={{ maxHeight: '200px' }}>
                      {cycleNumbers.map((num, idx) => (
                        <div key={idx} className="number-input-row">
                          <div className="input-with-count">
                            <span className="idx-tag">{idx + 1}</span>
                            <input
                              type="text"
                              className="auth-input"
                              style={{ paddingLeft: '35px' }}
                              placeholder="919876543210"
                              value={num}
                              onChange={(e) => updateCycleNumber(idx, e.target.value)}
                              required={cycleInputMethod === 'manual'}
                            />
                          </div>
                          {cycleNumbers.length > 1 && (
                            <button type="button" className="remove-num-btn" onClick={() => removeCycleNumberField(idx)}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button type="button" className="add-number-btn mt-4" onClick={addCycleNumberField}>
                      <Plus size={16} /> Add Another Number
                    </button>
                  </>
                ) : (
                  <div className="csv-upload-container animate-fade-in">
                    {!cycleCsvData.fileName ? (
                      <div className="csv-dropzone">
                        <input
                          type="file"
                          id="cycle-csv-file-input"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleCycleFileUpload}
                          hidden
                        />
                        <label htmlFor="cycle-csv-file-input" className="csv-dropzone-label">
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
                              <span className="csv-filename">{cycleCsvData.fileName}</span>
                              <span className="csv-details">
                                {cycleCsvData.rows.length} unique contacts parsed successfully
                              </span>
                            </div>
                          </div>
                          <button type="button" className="csv-clear-btn" onClick={clearCycleCSV} title="Clear uploaded CSV">
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="csv-template-action" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                      <button type="button" className="download-template-link" onClick={downloadCSVTemplate}>
                        <FileText size={14} /> Download Sample CSV Template
                      </button>
                    </div>

                    {cycleCsvData.rows.length > 0 && (
                      <div className="csv-preview-section">
                        <div className="preview-header">
                          <h3>CSV Data Preview ({cycleCsvData.rows.length} Contacts)</h3>
                          <span className="phone-indicator">Phone column: <strong>{cycleCsvData.phoneHeader}</strong></span>
                        </div>
                        <div className="csv-preview-table-container" data-lenis-prevent style={{ maxHeight: '150px' }}>
                          <table className="csv-preview-table">
                            <thead>
                              <tr>
                                <th>#</th>
                                {cycleCsvData.headers.map((h, idx) => (
                                  <th key={idx}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {cycleCsvData.rows.slice(0, 5).map((row, rIdx) => (
                                <tr key={rIdx}>
                                  <td>{rIdx + 1}</td>
                                  {cycleCsvData.headers.map((h, cIdx) => (
                                    <td key={cIdx}>{row[h]}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Template & Message Content */}
            <div className="messaging-layout" style={{ marginTop: '20px' }}>
              <div className="messaging-form-col">
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <div className="message-header-row">
                <label style={{ margin: 0 }}>Message Content</label>
                {cycleInputMethod === 'csv' && cycleCsvData.placeholders.length > 0 && (
                  <div className="placeholder-container">
                    <span className="placeholder-label">Placeholders:</span>
                    <div className="placeholder-tags">
                      {cycleCsvData.placeholders.map((placeholder) => (
                        <button
                          key={placeholder}
                          type="button"
                          className="placeholder-tag"
                          onClick={() => handleCycleInsertPlaceholder(placeholder)}
                        >
                          +{placeholder}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="template-controls-bar">
                <div className="template-selector-wrapper">
                  {savedTemplates.length > 0 ? (
                    <>
                      <span className="template-label">Load Template:</span>
                      <select
                        className="template-select"
                        value=""
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const t = savedTemplates.find(tpl => tpl.id.toString() === val.toString());
                            if (t) setCycleMessage(t.content);
                          }
                        }}
                      >
                        <option value="">-- Choose Template --</option>
                        {savedTemplates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <span className="template-label" style={{ opacity: 0.6 }}>No templates found</span>
                  )}
                </div>

                <div className="save-template-trigger-wrapper">
                  {!cycleShowSaveDialog ? (
                    <button
                      type="button"
                      className="save-template-trigger-btn"
                      onClick={() => setCycleShowSaveDialog(true)}
                    >
                      Save as Template
                    </button>
                  ) : (
                    <div className="save-template-inline-form">
                      <input
                        type="text"
                        placeholder="Template Name"
                        value={cycleNewTemplateName}
                        onChange={(e) => setCycleNewTemplateName(e.target.value)}
                        className="template-name-input"
                      />
                      <button type="button" className="btn-save-confirm" onClick={handleCycleSaveTemplate}>Save</button>
                      <button type="button" className="btn-save-cancel" onClick={() => {
                        setCycleShowSaveDialog(false);
                        setCycleNewTemplateName('');
                      }}>Cancel</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="formatting-toolbar">
                <button type="button" className="format-btn" onClick={() => handleCycleFormatText('bold')}><strong>B</strong></button>
                <button type="button" className="format-btn" onClick={() => handleCycleFormatText('italic')}><em>I</em></button>
                <button type="button" className="format-btn" onClick={() => handleCycleFormatText('underline')}><u>U</u></button>
                <button type="button" className="format-btn" onClick={() => handleCycleFormatText('strikethrough')}><del>S</del></button>
                <button type="button" className="format-btn" onClick={() => handleCycleFormatText('code')}><code>&lt;/&gt;</code></button>
              </div>

              <textarea
                id="cycle-message-textarea"
                className="auth-input"
                style={{
                  paddingLeft: '14px',
                  height: '120px',
                  resize: 'none',
                  borderRadius: '0 0 8px 8px',
                  borderTop: 'none'
                }}
                placeholder="Type recurring message content..."
                value={cycleMessage}
                onChange={(e) => setCycleMessage(e.target.value)}
                required
              ></textarea>
            </div>

            {/* Media file selection (6) */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label>Media file (Optional)</label>
              <div className="file-upload-zone">
                <input
                  type="file"
                  id="cycle-file-input"
                  onChange={(e) => setCycleFile(e.target.files[0])}
                  hidden
                />
                <label htmlFor="cycle-file-input" className="file-label">
                  {!cycleFile ? (
                    <span className="file-placeholder">
                      <FileUp size={24} />
                      <span>Click to upload image or document <strong style={{ color: 'var(--primary)' }}>(Max 20MB)</strong></span>
                    </span>
                  ) : (
                    <div className="file-info" style={{ flexDirection: 'column', padding: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={24} />
                        <span className="file-name">{cycleFile.name}</span>
                        <button type="button" className="remove-file" onClick={() => setCycleFile(null)}>
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Schedule (7) */}
            <button type="submit" className="btn-primary" style={{ minWidth: '200px' }}>
              Schedule Cycling Campaign <Send size={16} />
            </button>
          </div>

          <div className="messaging-preview-col animate-fade-in">
            <div className="wa-preview-wrapper">
              <div className="wa-preview-header-main">
                <span>Message Preview</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.7 }}>Live Mockup</span>
              </div>
              <div className="wa-phone-container">
                {/* Phone Header */}
                <div className="wa-phone-header">
                  <div className="wa-avatar">
                    {instanceAvatarForHeader ? (
                      <img src={instanceAvatarForHeader} alt="Avatar" />
                    ) : (
                      <span>{instanceNameForHeader.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="wa-header-info">
                    <span className="wa-header-name">{instanceNameForHeader}</span>
                    <span className="wa-header-status">online</span>
                  </div>
                  <div className="wa-header-actions">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px', opacity: 0.9 }}>
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px', opacity: 0.9 }}>
                      <path d="M23 7a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7z"></path>
                      <path d="M23 7l-9.5 6.5L1 7"></path>
                    </svg>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', lineHeight: 1, cursor: 'default' }}>⋮</span>
                  </div>
                </div>

                {/* Chat Area */}
                <div className="wa-chat-area" data-lenis-prevent>
                  <div className="wa-chat-spacer"></div>
                  {/* Date Tag */}
                  <div style={{
                    alignSelf: 'center',
                    background: 'rgba(255, 255, 255, 0.75)',
                    color: '#54656f',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '0.68rem',
                    fontWeight: '600',
                    boxShadow: '0 1px 0.5px rgba(0,0,0,0.06)',
                    marginBottom: '14px',
                    textTransform: 'uppercase'
                  }} className="wa-date-tag">
                    Today
                  </div>

                  {/* Chat Bubble */}
                  <div className="wa-chat-bubble outgoing">
                    {/* Media Render */}
                    {cycleFile && (
                      cycleMediaPreviewUrl ? (
                        <div className="wa-preview-media">
                          <img src={cycleMediaPreviewUrl} alt="Upload Preview" />
                        </div>
                      ) : (
                        <div className="wa-doc-preview">
                          <span className="wa-doc-icon" style={{ fontSize: '1.1rem' }}>📁</span>
                          <div className="wa-doc-details">
                            <span className="wa-doc-name">{cycleFile.name}</span>
                            <span className="wa-doc-size">
                              {(cycleFile.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                      )
                    )}

                    {/* Text Render */}
                    <div
                      className="wa-bubble-text"
                      dangerouslySetInnerHTML={{
                        __html: formatPreviewText(cycleMessage) || '<span style="color: var(--text-muted); font-style: italic;">No message content</span>'
                      }}
                    />

                    {/* Meta Information (Time & Double Checkticks) */}
                    <div className="wa-bubble-meta">
                      <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="wa-checkmark">
                        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '13px', height: '9px' }}>
                          <path d="M4.5 8L1.5 5L0.5 6L4.5 10L12.5 2L11.5 1L4.5 8Z" fill="currentColor" />
                          <path d="M8.5 8L7.5 7L6.5 8L8.5 10L15.5 3L14.5 2L8.5 8Z" fill="currentColor" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* List display */}
          <div className="schedules-list-card glass" style={{ padding: '24px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-main)' }}>Active Message Cycles</h3>
            <div className="csv-preview-table-container" style={{ maxHeight: 'none' }}>
              <table className="csv-preview-table">
                <thead>
                  <tr>
                    <th>Campaign name</th>
                    <th>instance</th>
                    <th>Frequency</th>
                    <th>Time to send</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cyclingCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                        No recurring cycles scheduled yet.
                      </td>
                    </tr>
                  ) : (
                    cyclingCampaigns.map((cycle) => {
                      // Human-readable frequency config
                      let freqDetail = cycle.frequency;
                      const config = cycle.frequencyConfig || {};
                      if (cycle.frequency === 'alternate') {
                        freqDetail = `Alternate (starts ${config.startFrom})`;
                      } else if (cycle.frequency === 'weekly') {
                        freqDetail = `Weekly on ${config.selectedDay}`;
                      } else if (cycle.frequency === 'monthly') {
                        freqDetail = `Monthly on day ${config.selectedDate}`;
                      } else if (cycle.frequency === 'custom') {
                        if (config.selectedDays) freqDetail = `Days: ${config.selectedDays.join(', ')}`;
                        else if (config.selectedDates) freqDetail = `Dates: ${config.selectedDates.join(', ')}`;
                      }

                      const activeInstance = instances.find(i => i.instanceKey === cycle.instanceKey);
                      const instName = activeInstance ? activeInstance.name : 'Active Instance';

                      return (
                        <tr key={cycle.id}>
                          <td style={{ fontWeight: '600' }}>{cycle.name}</td>
                          <td>{instName}</td>
                          <td style={{ textTransform: 'capitalize' }}>{freqDetail}</td>
                          <td>{cycle.sendTime}</td>
                          <td>
                            <button
                              type="button"
                              className="remove-num-btn"
                              style={{ width: '28px', height: '28px' }}
                              onClick={() => handleDeleteCycleCampaign(cycle.id)}
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </form>
      </div>
    );
  };

return (
  <div className="messaging-container">
    <div className="page-header">
      <div>
        <h1 className="page-title">{headerDetails.title}</h1>
        <p className="page-subtitle">{headerDetails.subtitle}</p>
      </div>
    </div>

    <div className="messaging-card glass">
      {typeParam === 'schedule' ? (
        renderSchedulingUI()
      ) : typeParam === 'cycling' ? (
        renderCyclingUI()
      ) : (
        <div className="messaging-body">
          <div className="form-row" style={{ marginBottom: '24px' }}>
            <div className="form-group" style={{ maxWidth: '400px' }}>
              <label>Select WhatsApp Instance</label>
              <select
                className="auth-input"
                style={{ paddingLeft: '14px' }}
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

          <div className="messaging-layout">
            <div className="messaging-form-col">
              <form className="messaging-form" onSubmit={mode === 'single' ? handleSendSingle : handleSendBulk}>
                <div className="form-group">
                  <label>
                    {mode === 'single'
                      ? (recipientType === 'number' ? 'Recipient Number' : 'Select WhatsApp Group')
                      : 'Recipient Numbers'}
                  </label>

                  {mode === 'single' ? (
                    recipientType === 'number' ? (
                      <input
                        type="text"
                        className="auth-input"
                        style={{ paddingLeft: '14px' }}
                        placeholder="e.g. 919876543210"
                        value={singleData.number}
                        onChange={(e) => setSingleData({ ...singleData, number: e.target.value })}
                        required
                      />
                    ) : (
                      <div className="searchable-dropdown-container" style={{ position: 'relative' }}>
                        {/* Render Selected Groups Tags */}
                        {selectedGroups.length > 0 && (
                          <div className="selected-groups-tags" style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px',
                            marginBottom: '10px'
                          }}>
                            {selectedGroups.map(group => (
                              <div
                                key={group.id}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  borderRadius: '6px',
                                  padding: '4px 10px',
                                  fontSize: '0.85rem',
                                  color: 'var(--text)'
                                }}
                              >
                                <span>{group.subject}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedGroups(prev => prev.filter(g => g.id !== group.id));
                                  }}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <input
                          type="text"
                          className="auth-input"
                          style={{ paddingLeft: '14px', width: '100%' }}
                          placeholder={loadingGroups ? "Loading groups..." : "Search and select groups..."}
                          value={groupSearchQuery}
                          onChange={(e) => {
                            setGroupSearchQuery(e.target.value);
                            setIsOpenGroupDropdown(true);
                          }}
                          onFocus={() => setIsOpenGroupDropdown(true)}
                          disabled={loadingGroups}
                          required={selectedGroups.length === 0}
                        />

                        {isOpenGroupDropdown && !loadingGroups && (
                          <div
                            className="dropdown-list-portal glass"
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              zIndex: 1000,
                              maxHeight: '220px',
                              overflowY: 'auto',
                              marginTop: '6px',
                              borderRadius: '8px',
                              background: 'rgba(20, 20, 25, 0.95)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
                            }}
                            data-lenis-prevent
                          >
                            {groups.length === 0 ? (
                              <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                No participating groups found for this instance
                              </div>
                            ) : filteredGroupsList.length === 0 ? (
                              <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                No groups found matching search query
                              </div>
                            ) : (
                              filteredGroupsList.map(group => {
                                const isSelected = selectedGroups.some(g => g.id === group.id);
                                return (
                                  <div
                                    key={group.id}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedGroups(prev => prev.filter(g => g.id !== group.id));
                                      } else {
                                        setSelectedGroups(prev => [...prev, group]);
                                      }
                                      setGroupSearchQuery('');
                                    }}
                                    style={{
                                      padding: '10px 14px',
                                      cursor: 'pointer',
                                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                      color: isSelected ? 'var(--primary)' : 'var(--text)',
                                      background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      fontSize: '0.9rem',
                                      transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent'}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ fontWeight: '500' }}>{group.subject}</span>
                                      {isSelected && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>(Selected)</span>}
                                    </div>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{group.participantsCount} members</span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    )
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
                          <div className="form-group mb-4" style={{ maxWidth: '250px' }}>
                            <label style={{ fontSize: '0.8rem', opacity: 0.8 }}>How many numbers do you have? (Optional)</label>
                            <input
                              type="number"
                              className="auth-input"
                              style={{ paddingLeft: '14px' }}
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
                                    style={{ paddingLeft: '35px' }}
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

                          <div className="csv-template-action" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                            <button type="button" className="download-template-link" onClick={downloadCSVTemplate}>
                              <FileText size={14} /> Download Sample CSV Template
                            </button>
                            <div style={{
                              fontSize: '0.8rem',
                              color: '#eab308',
                              background: 'rgba(234, 179, 8, 0.1)',
                              border: '1px solid rgba(234, 179, 8, 0.2)',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginTop: '8px'
                            }}>
                              <AlertCircle size={16} style={{ flexShrink: 0 }} />
                              <span><strong>Note:</strong> The <strong>first column</strong> in your file must contain the phone numbers. Other columns will be used as placeholders (e.g. <code>{"{Name}"}</code>) and must match your message template exactly.</span>
                            </div>
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
                    <label style={{ margin: 0 }}>Message Content</label>
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

                  <div className="formatting-toolbar">
                    <button
                      type="button"
                      className="format-btn"
                      onClick={() => handleFormatText('bold')}
                      title="Make Text Bold (*bold*)"
                    >
                      <strong>B</strong>
                    </button>
                    <button
                      type="button"
                      className="format-btn"
                      onClick={() => handleFormatText('italic')}
                      title="Make Text Italic (_italic_)"
                    >
                      <em>I</em>
                    </button>
                    <button
                      type="button"
                      className="format-btn"
                      onClick={() => handleFormatText('underline')}
                      title="Underline Text (__underline__)"
                    >
                      <u>U</u>
                    </button>
                    <button
                      type="button"
                      className="format-btn"
                      onClick={() => handleFormatText('strikethrough')}
                      title="Strikethrough Text (~strikethrough~)"
                    >
                      <del>S</del>
                    </button>
                    <button
                      type="button"
                      className="format-btn"
                      onClick={() => handleFormatText('code')}
                      title="Monospace / Code Font (`code`)"
                    >
                      <code>&lt;/&gt;</code>
                    </button>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      Formatting Toolbar
                    </span>
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
                    onChange={(e) => mode === 'single' ? setSingleData({ ...singleData, message: e.target.value }) : setBulkData({ ...bulkData, message: e.target.value })}
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
                        <div className="file-info" style={{ flexDirection: 'column', padding: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileText size={24} />
                            <span className="file-name">{currentFile.name}</span>
                            <button type="button" className="remove-file" onClick={() => removeFile(mode)}>
                              <X size={18} />
                            </button>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>File ready for sending</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="form-actions" style={{ justifyContent: 'flex-start', borderTop: 'none', padding: 0 }}>
                  <button type="submit" className="btn-primary" disabled={loading || !selectedInstance} style={{ minWidth: '200px' }}>
                    {loading ? 'Processing...' : (mode === 'single' ? 'Send Message' : 'Send Bulk Messages')}
                    {mode === 'single' ? <Send size={18} /> : <Users size={18} />}
                  </button>
                </div>
              </form>
            </div>

            <div className="messaging-preview-col animate-fade-in">
              <div className="wa-preview-wrapper">
                <div className="wa-preview-header-main">
                  <span>Message Preview</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.7 }}>Live Mockup</span>
                </div>
                <div className="wa-phone-container">
                  {/* Phone Header */}
                  <div className="wa-phone-header">
                    <div className="wa-avatar">
                      {instanceAvatarForHeader ? (
                        <img src={instanceAvatarForHeader} alt="Avatar" />
                      ) : (
                        <span>{instanceNameForHeader.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="wa-header-info">
                      <span className="wa-header-name">{instanceNameForHeader}</span>
                      <span className="wa-header-status">online</span>
                    </div>
                    <div className="wa-header-actions">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px', opacity: 0.9 }}>
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px', opacity: 0.9 }}>
                        <path d="M23 7a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7z"></path>
                        <path d="M23 7l-9.5 6.5L1 7"></path>
                      </svg>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold', lineHeight: 1, cursor: 'default' }}>⋮</span>
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="wa-chat-area" data-lenis-prevent>
                    <div className="wa-chat-spacer"></div>
                    {/* Date Tag */}
                    <div style={{
                      alignSelf: 'center',
                      background: 'rgba(255, 255, 255, 0.75)',
                      color: '#54656f',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '0.68rem',
                      fontWeight: '600',
                      boxShadow: '0 1px 0.5px rgba(0,0,0,0.06)',
                      marginBottom: '14px',
                      textTransform: 'uppercase'
                    }} className="wa-date-tag">
                      Today
                    </div>

                    {/* Chat Bubble */}
                    <div className="wa-chat-bubble outgoing">
                      {/* Media Render */}
                      {currentFile && (
                        mediaPreviewUrl ? (
                          <div className="wa-preview-media">
                            <img src={mediaPreviewUrl} alt="Upload Preview" />
                          </div>
                        ) : (
                          <div className="wa-doc-preview">
                            <span className="wa-doc-icon" style={{ fontSize: '1.1rem' }}>📁</span>
                            <div className="wa-doc-details">
                              <span className="wa-doc-name">{currentFile.name}</span>
                              <span className="wa-doc-size">
                                {(currentFile.size / (1024 * 1024)).toFixed(2)} MB
                              </span>
                            </div>
                          </div>
                        )
                      )}

                      {/* Text Render */}
                      <div
                        className="wa-bubble-text"
                        dangerouslySetInnerHTML={{
                          __html: formatPreviewText(mode === 'single' ? singleData.message : bulkData.message) || '<span style="color: var(--text-muted); font-style: italic;">No message content</span>'
                        }}
                      />

                      {/* Meta Information (Time & Double Checkticks) */}
                      <div className="wa-bubble-meta">
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="wa-checkmark">
                          <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '13px', height: '9px' }}>
                            <path d="M4.5 8L1.5 5L0.5 6L4.5 10L12.5 2L11.5 1L4.5 8Z" fill="currentColor" />
                            <path d="M8.5 8L7.5 7L6.5 8L8.5 10L15.5 3L14.5 2L8.5 8Z" fill="currentColor" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
