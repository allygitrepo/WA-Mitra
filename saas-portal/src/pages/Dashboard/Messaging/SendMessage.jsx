import { useState, useEffect } from 'react';
import { Send, Users, FileUp, FileText, X, CheckCircle2, AlertCircle, Plus, Trash2, Loader2, MessageSquare, Edit2 } from 'lucide-react';
import { useOutletContext, useSearchParams, Link } from 'react-router-dom';
import { instanceService, messageService, templateService, scheduleService, cycleService, campaignService } from '../../../api/services';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import './Messaging.css';
import CustomModal from '../../../components/CustomModal';
import CustomDateInput from '../../../components/CustomDateInput';
import useAuthStore from '../../../store/useAuthStore';
import { createPortal } from 'react-dom';
import { io } from 'socket.io-client';

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
    } else if (typeParam === 'campaigns') {
      setMode('campaigns');
    }

    const titles = {
      contact: 'Direct Messaging',
      bulk: 'Bulk Campaigns',
      group: 'Group Broadcasting',
      schedule: 'Message Scheduling',
      cycling: 'Message Cycling',
      campaigns: 'Campaigns History'
    };
    document.title = `${titles[typeParam] || 'Direct Messaging'} | WA-Mitra`;
  }, [typeParam]);
  const [instances, setInstances] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressData, setProgressData] = useState(null);

  useEffect(() => {
    if (!selectedInstance) return;

    const socketUrl = import.meta.env.VITE_API_BASE_URL.split('/wa-mitra')[0];
    const socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('join_room', selectedInstance);
    });

    socket.on('bulk_progress', (data) => {
      console.log('Socket bulk progress:', data);
      if (data.type === 'start') {
        setProgressData({
          total: data.total,
          sent: 0,
          failed: 0,
          currentNumber: '',
          status: 'sending'
        });
      } else if (data.type === 'progress') {
        setProgressData({
          total: data.total,
          sent: data.sent,
          failed: data.failed,
          currentNumber: data.currentNumber,
          status: 'sending'
        });
      } else if (data.type === 'pause') {
        setProgressData(prev => ({
          ...prev,
          status: 'paused',
          message: data.message || 'Taking a 15-second break...'
        }));
      } else if (data.type === 'done') {
        setProgressData(prev => ({
          ...prev,
          sent: data.results.sent,
          failed: data.results.failed,
          status: 'done'
        }));
        fetchCampaigns();

        if (data.results.failed === 0) {
          toast.success(`Sent all ${data.results.sent} messages successfully!`, { id: 'bulk-campaign-toast', duration: 5000 });
        } else {
          toast.success(`Process complete: ${data.results.sent} sent, ${data.results.failed} failed.`, { id: 'bulk-campaign-toast', duration: 6000 });
        }
      }
    });

    socket.on('bulk_message_status_update', (data) => {
      setTrackingCampaignData(prev => {
        if (!prev || prev.campaign.id !== data.campaignId) return prev;
        const updated = prev.statuses.map(s => {
          if (s.recipient === data.recipient) {
            return { ...s, status: data.status };
          }
          return s;
        });
        return { ...prev, statuses: updated };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedInstance]);

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
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvData, setCsvData] = useState({
    headers: [],
    placeholders: [],
    rows: [],
    fileName: '',
    phoneHeader: ''
  });
  const [analyzingContacts, setAnalyzingContacts] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Campaigns states
  const [savedCampaigns, setSavedCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [saveCampaignCheckbox, setSaveCampaignCheckbox] = useState(false);
  const [campaignNameInput, setCampaignNameInput] = useState('');
  const [showCampaignTrackerModal, setShowCampaignTrackerModal] = useState(false);
  const [trackingCampaignId, setTrackingCampaignId] = useState(null);
  const [trackingCampaignData, setTrackingCampaignData] = useState(null);
  const [loadingTrackingData, setLoadingTrackingData] = useState(false);

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
  const [scheduleShowSaveDialog, setScheduleShowSaveDialog] = useState(false);
  const [scheduleNewTemplateName, setScheduleNewTemplateName] = useState('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleSelectedGroups, setScheduleSelectedGroups] = useState([]);
  const [scheduleGroupSearchQuery, setScheduleGroupSearchQuery] = useState('');
  const [isOpenScheduleGroupDropdown, setIsOpenScheduleGroupDropdown] = useState(false);
  const [scheduleGroups, setScheduleGroups] = useState([]);
  const [loadingScheduleGroups, setLoadingScheduleGroups] = useState(false);
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
  const [cycleSendTime, setCycleSendTime] = useState('');
  const [cycleMessage, setCycleMessage] = useState('');
  const [cycleFile, setCycleFile] = useState(null);
  const [cycleMediaPreviewUrl, setCycleMediaPreviewUrl] = useState('');
  const [cyclingCampaigns, setCyclingCampaigns] = useState([]);
  const [cycleShowSaveDialog, setCycleShowSaveDialog] = useState(false);
  const [cycleNewTemplateName, setCycleNewTemplateName] = useState('');
  const [cycleSelectedGroups, setCycleSelectedGroups] = useState([]);
  const [cycleGroupSearchQuery, setCycleGroupSearchQuery] = useState('');
  const [isOpenCycleGroupDropdown, setIsOpenCycleGroupDropdown] = useState(false);
  const [cycleGroups, setCycleGroups] = useState([]);
  const [loadingCycleGroups, setLoadingCycleGroups] = useState(false);

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

  const toggleCycleCustomDate = (dayNum) => {
    if (cycleCustomDates.includes(dayNum)) {
      setCycleCustomDates(prev => prev.filter(d => d !== dayNum));
    } else {
      setCycleCustomDates(prev => [...prev, dayNum].sort((a, b) => a - b));
    }
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
    } else if (cycleInputMethod === 'group') {
      if (cycleSelectedGroups.length === 0) {
        toast.error('Please select at least one WhatsApp group.');
        return;
      }
      recipientsList = cycleSelectedGroups.map(g => g.id);
    } else {
      const manualNumbers = cycleNumbers.map(n => n.trim()).filter(n => n);
      const groupJids = cycleSelectedGroups.map(g => g.id);
      recipientsList = [...manualNumbers, ...groupJids];

      if (recipientsList.length === 0) {
        toast.error('Please enter at least one recipient number or select a group.');
        return;
      }
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
        setCycleSelectedGroups([]);
        setCycleGroupSearchQuery('');
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
      return 'Sent';
    }

    const totalSecs = Math.floor(diffMs / 1000);
    const totalMins = Math.floor(totalSecs / 60);
    const totalHours = Math.floor(totalMins / 60);

    if (totalHours >= 1) {
      const days = Math.floor(totalHours / 24);
      const remainingHours = totalHours % 24;
      const remainingMins = totalMins % 60;
      if (days > 0) {
        return `${days}d ${remainingHours}h ${remainingMins}m`;
      }
      return `${remainingHours}h ${remainingMins}m`;
    } else {
      const mins = totalMins % 60;
      const secs = totalSecs % 60;
      const minsStr = String(mins).padStart(2, '0');
      const secsStr = String(secs).padStart(2, '0');
      return `${minsStr}:${secsStr}sec`;
    }
  };

  const getCycleRemainingTime = (cycle) => {
    if (!cycle || cycle.status !== 'active') return 'Paused';
    try {
      const now = new Date();
      const [sendHour, sendMin] = cycle.sendTime.split(':').map(Number);

      let nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sendHour, sendMin, 0, 0);
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      const formatLocal = (d) => {
        const yr = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const dy = String(d.getDate()).padStart(2, '0');
        return `${yr}-${mo}-${dy}`;
      };

      if (cycle.frequency === 'daily') {
        // Daily
      } else if (cycle.frequency === 'alternate') {
        const config = cycle.frequencyConfig || {};
        const localTodayStr = formatLocal(now);
        if (cycle.lastRunDate === localTodayStr) {
          nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, sendHour, sendMin, 0, 0);
        } else {
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          const localYesterdayStr = formatLocal(yesterday);
          if (cycle.lastRunDate === localYesterdayStr) {
            nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, sendHour, sendMin, 0, 0);
          } else if (!cycle.lastRunDate && config.startFrom === 'tomorrow') {
            const created = new Date(cycle.createdAt);
            if (formatLocal(created) === localTodayStr) {
              nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, sendHour, sendMin, 0, 0);
            }
          }
        }
      } else if (cycle.frequency === 'weekly') {
        const config = cycle.frequencyConfig || {};
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const targetDayIndex = daysOfWeek.indexOf(config.selectedDay);
        if (targetDayIndex !== -1) {
          while (nextRun.getDay() !== targetDayIndex) {
            nextRun.setDate(nextRun.getDate() + 1);
          }
        }
      } else if (cycle.frequency === 'monthly') {
        const config = cycle.frequencyConfig || {};
        const targetDateVal = Number(config.selectedDate);
        if (targetDateVal) {
          let loops = 0;
          while (nextRun.getDate() !== targetDateVal && loops < 366) {
            nextRun.setDate(nextRun.getDate() + 1);
            loops++;
          }
        }
      } else if (cycle.frequency === 'custom') {
        const config = cycle.frequencyConfig || {};
        if (config.selectedDays && Array.isArray(config.selectedDays) && config.selectedDays.length > 0) {
          const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const allowedIndices = config.selectedDays.map(d => daysOfWeek.indexOf(d));
          let loops = 0;
          while (!allowedIndices.includes(nextRun.getDay()) && loops < 30) {
            nextRun.setDate(nextRun.getDate() + 1);
            loops++;
          }
        } else if (config.selectedDates && Array.isArray(config.selectedDates) && config.selectedDates.length > 0) {
          let found = false;
          let loops = 0;
          while (loops < 366) {
            const formatted = formatLocal(nextRun);
            const dayNum = nextRun.getDate();
            if (
              config.selectedDates.includes(formatted) ||
              config.selectedDates.includes(dayNum) ||
              config.selectedDates.includes(String(dayNum))
            ) {
              found = true;
              break;
            }
            nextRun.setDate(nextRun.getDate() + 1);
            loops++;
          }
          if (!found) return 'No future dates';
        }
      }

      const diffMs = nextRun - now;
      if (diffMs <= 0) return 'Sending now...';

      const totalSecs = Math.floor(diffMs / 1000);
      const totalMins = Math.floor(totalSecs / 60);
      const totalHours = Math.floor(totalMins / 60);

      if (totalHours >= 1) {
        const days = Math.floor(totalHours / 24);
        const remainingHours = totalHours % 24;
        const remainingMins = totalMins % 60;
        if (days > 0) {
          return `${days}d ${remainingHours}h ${remainingMins}m`;
        }
        return `${remainingHours}h ${remainingMins}m`;
      } else {
        const mins = totalMins % 60;
        const secs = totalSecs % 60;
        const minsStr = String(mins).padStart(2, '0');
        const secsStr = String(secs).padStart(2, '0');
        return `${minsStr}:${secsStr}sec`;
      }
    } catch (err) {
      console.error(err);
      return 'N/A';
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

    let numbersList = [];
    if (scheduleInputMethod === 'csv') {
      if (scheduleCsvData.rows.length === 0) {
        toast.error('Please upload a valid CSV/Excel file first.');
        return;
      }
      numbersList = scheduleCsvData.rows.map(r => r._cleanPhone);
    } else if (scheduleInputMethod === 'group') {
      if (scheduleSelectedGroups.length === 0) {
        toast.error('Please select at least one WhatsApp group.');
        return;
      }
      numbersList = scheduleSelectedGroups.map(g => g.id);
    } else {
      const manualNumbers = scheduleNumbers.map(n => n.trim()).filter(n => n);
      const groupJids = scheduleSelectedGroups.map(g => g.id);
      numbersList = [...manualNumbers, ...groupJids];

      if (numbersList.length === 0) {
        toast.error('Please enter at least one recipient number or select a group.');
        return;
      }
    }

    if (!scheduleMessage.trim()) {
      toast.error('Message content cannot be empty.');
      return;
    }

    const activeInstanceObj = instances.find(i => i.instanceKey === selectedInstance);
    const instanceName = activeInstanceObj ? activeInstanceObj.name : 'Instance';

    const campaignData = {
      name: scheduleCampaignName.trim() || `Schedule Campaign ${new Date().toLocaleDateString('en-GB')}`,
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
        setScheduleSelectedGroups([]);
        setScheduleGroupSearchQuery('');
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
    fetchCampaigns();
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
    const fetchAllGroups = async () => {
      if (!selectedInstance) {
        setGroups([]);
        setScheduleGroups([]);
        setCycleGroups([]);
        setSelectedGroups([]);
        setScheduleSelectedGroups([]);
        setCycleSelectedGroups([]);
        return;
      }
      setLoadingGroups(true);
      setLoadingScheduleGroups(true);
      setLoadingCycleGroups(true);
      try {
        const res = await instanceService.getGroups(selectedInstance);
        const fetchedGroups = res.data.groups || [];
        setGroups(fetchedGroups);
        setScheduleGroups(fetchedGroups);
        setCycleGroups(fetchedGroups);

        // Reset selections when switching active instance key
        setSelectedGroups([]);
        setScheduleSelectedGroups([]);
        setCycleSelectedGroups([]);
        setGroupSearchQuery('');
        setScheduleGroupSearchQuery('');
        setCycleGroupSearchQuery('');
      } catch (err) {
        console.error("Failed to fetch instance groups:", err);
        setGroups([]);
        setScheduleGroups([]);
        setCycleGroups([]);
        setSelectedGroups([]);
        setScheduleSelectedGroups([]);
        setCycleSelectedGroups([]);
      } finally {
        setLoadingGroups(false);
        setLoadingScheduleGroups(false);
        setLoadingCycleGroups(false);
      }
    };
    fetchAllGroups();
  }, [selectedInstance]);

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

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.searchable-dropdown-container')) {
        setIsOpenScheduleGroupDropdown(false);
        setScheduleGroupSearchQuery('');
      }
    };

    if (isOpenScheduleGroupDropdown) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isOpenScheduleGroupDropdown]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.searchable-dropdown-container')) {
        setIsOpenCycleGroupDropdown(false);
        setCycleGroupSearchQuery('');
      }
    };

    if (isOpenCycleGroupDropdown) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isOpenCycleGroupDropdown]);

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
      setAnalysisResult(null);

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
    setAnalysisResult(null);
  };

  const handleAnalyzeContacts = async () => {
    if (!selectedInstance) {
      toast.error('Please select an active WhatsApp instance first.');
      return;
    }
    if (csvData.rows.length === 0) {
      toast.error('No contact numbers found to analyze.');
      return;
    }

    setAnalyzingContacts(true);
    const loadingToast = toast.loading('Analyzing WhatsApp status of your numbers...');
    try {
      const numbersToCheck = csvData.rows.map(r => r._cleanPhone);
      const res = await instanceService.checkNumbers(selectedInstance, numbersToCheck);

      if (res.data.success) {
        const results = res.data.results;
        const existsCount = results.filter(r => r.exists).length;
        const nonExistsCount = results.filter(r => !r.exists).length;
        const nonWhatsAppNumbers = results.filter(r => !r.exists).map(r => r.number);

        setAnalysisResult({
          onWhatsAppCount: existsCount,
          notOnWhatsAppCount: nonExistsCount,
          nonWhatsAppNumbers
        });
        toast.success(`Analysis complete: ${existsCount} are on WhatsApp, ${nonExistsCount} are not.`, { id: loadingToast });
      } else {
        toast.error('Failed to check numbers on WhatsApp', { id: loadingToast });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to analyze contacts', { id: loadingToast });
    } finally {
      setAnalyzingContacts(false);
    }
  };

  const handleCleanContacts = () => {
    if (!analysisResult) return;
    const { nonWhatsAppNumbers } = analysisResult;

    const cleanedRows = csvData.rows.filter(r => !nonWhatsAppNumbers.includes(r._cleanPhone));
    setCsvData(prev => ({
      ...prev,
      rows: cleanedRows
    }));
    setAnalysisResult(null);
    toast.success(`Removed ${nonWhatsAppNumbers.length} non-WhatsApp numbers! remaining: ${cleanedRows.length} contacts.`);
  };

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const res = await campaignService.getCampaigns();
      if (res.data.success) {
        setSavedCampaigns(res.data.campaigns);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleLoadCampaign = (campaign) => {
    if (!campaign.contacts || campaign.contacts.length === 0) {
      toast.error('This campaign has no contact lists saved.');
      return;
    }

    const phoneHeader = Object.keys(campaign.contacts[0] || {}).find(k => k.toLowerCase().includes('phone') || k.toLowerCase().includes('number') || k.toLowerCase().includes('recipient')) || 'Phone number';
    
    // Explicitly guarantee every loaded contact has _cleanPhone correctly resolved
    const processedContacts = campaign.contacts.map(c => {
      const rawNum = c[phoneHeader];
      const cleanNum = rawNum ? rawNum.toString().replace(/\D/g, '') : '';
      return {
        ...c,
        _cleanPhone: c._cleanPhone || cleanNum
      };
    });

    setCsvData({
      headers: Object.keys(campaign.contacts[0] || {}).filter(h => h !== '_cleanPhone' && h !== 'message'),
      placeholders: Object.keys(campaign.contacts[0] || {}).filter(h => h !== '_cleanPhone' && h !== phoneHeader && h !== 'message'),
      rows: processedContacts,
      fileName: campaign.name,
      phoneHeader: phoneHeader
    });
    setBulkInputMethod('csv');
    setAnalysisResult(null); // Clear previous analysis to prevent stale warnings
    toast.success(`Loaded campaign "${campaign.name}"!`);
  };

  const handleTrackCampaign = async (id) => {
    setTrackingCampaignId(id);
    setShowCampaignTrackerModal(true);
    setLoadingTrackingData(true);
    try {
      const res = await campaignService.getCampaignStatus(id);
      if (res.data.success) {
        setTrackingCampaignData(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load campaign status data.');
    } finally {
      setLoadingTrackingData(false);
    }
  };

  const handleDeleteCampaign = (id, e) => {
    e.stopPropagation();
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Saved Campaign?',
      message: 'Are you sure you want to delete this saved campaign list? This action cannot be undone.',
      okText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await campaignService.deleteCampaign(id);
          if (res.data.success) {
            toast.success(res.data.message);
            fetchCampaigns();
          }
        } catch (err) {
          console.error(err);
          toast.error('Failed to delete campaign.');
        }
      },
      onCancel: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleRenameCampaign = (id, currentName, e) => {
    if (e) e.stopPropagation();
    setModalConfig({
      isOpen: true,
      type: 'prompt',
      title: 'Rename Campaign',
      message: 'Enter a new name for this campaign:',
      placeholder: 'e.g. July Promotion',
      defaultValue: currentName,
      okText: 'Rename',
      cancelText: 'Cancel',
      onConfirm: async (newName) => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        if (!newName || !newName.trim()) return;
        try {
          const res = await campaignService.updateCampaign(id, { name: newName.trim() });
          if (res.data.success) {
            toast.success(res.data.message || 'Campaign renamed successfully.');
            fetchCampaigns();
          }
        } catch (err) {
          console.error(err);
          toast.error(err.response?.data?.message || 'Failed to rename campaign.');
        }
      },
      onCancel: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
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
    const loadingToast = toast.loading(`Initiating campaign (0/${totalCount})...`, {
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

        const missingInCsv = msgPlaceholders.filter(p => !csvData.placeholders.includes(p));

        if (missingInCsv.length > 0) {
          const errorMsg = `Header mismatch! Missing columns in file for placeholders: ${missingInCsv.map(p => `"${p}"`).join(', ')}. Please ensure these columns exist in your CSV/Excel file (case-sensitive).`;
          toast.error(errorMsg, { id: loadingToast });
          setLoading(false);
          return;
        }

        // Dynamic templating for each CSV row
        messagesArray = csvData.rows.map(row => {
          let compiledMessage = bulkData.message;
          // Substitute placeholders
          csvData.headers.forEach(header => {
            const escapedHeader = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

      // Initialize progress modal state
      setProgressData({
        total: messagesArray.length,
        sent: 0,
        failed: 0,
        currentNumber: messagesArray[0]?.number || '',
        status: 'sending'
      });
      toast.dismiss(loadingToast);

      const token = useAuthStore.getState().token;
      const headers = {
        'x-user-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let body;
      if (bulkData.file) {
        const formData = new FormData();
        formData.append('instanceKey', selectedInstance);
        formData.append('messages', JSON.stringify(messagesArray));
        formData.append('file', bulkData.file);
        if (campaignNameInput) {
          formData.append('campaignName', campaignNameInput);
        }
        if (bulkInputMethod === 'csv') {
          formData.append('contacts', JSON.stringify(csvData.rows));
          formData.append('template', bulkData.message);
        }
        body = formData;
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          instanceKey: selectedInstance,
          messages: messagesArray,
          campaignName: campaignNameInput || undefined,
          contacts: bulkInputMethod === 'csv' ? csvData.rows : undefined,
          template: bulkData.message
        });
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/messages/bulk`, {
        method: 'POST',
        headers,
        body
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = 'Failed to process bulk messages';
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.message || errorMsg;
        } catch {
          // Ignored
        }
        throw new Error(errorMsg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (!part.trim()) continue;
          try {
            const data = JSON.parse(part);
            if (data.type === 'progress') {
              setProgressData({
                total: data.total,
                sent: data.sent,
                failed: data.failed,
                currentNumber: data.currentNumber,
                status: 'sending'
              });
            } else if (data.type === 'done') {
              setProgressData(prev => ({
                ...prev,
                sent: data.results.sent,
                failed: data.results.failed,
                status: 'done'
              }));

              if (data.results.failed === 0) {
                toast.success(`Sent all ${data.results.sent} messages successfully!`, { duration: 5000 });
              } else {
                toast.success(`Process complete: ${data.results.sent} sent, ${data.results.failed} failed.`, { duration: 6000 });
              }
            }
          } catch (e) {
            console.error("Failed to parse progress chunk:", e, part);
          }
        }
      }

      // Reset state
      setBulkData({ numbers: [''], message: '', file: null });
      setNumberCount(1);
      if (bulkInputMethod === 'csv') {
        clearCSV();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to process bulk messages');
      setProgressData(prev => prev ? { ...prev, status: 'error', errorMsg: err.message || 'An unexpected error occurred.' } : null);
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

      const missingInCsv = msgPlaceholders.filter(p => !csvData.placeholders.includes(p));

      if (missingInCsv.length > 0) {
        const errorMsg = `Header mismatch! Missing columns in file for placeholders: ${missingInCsv.map(p => `"${p}"`).join(', ')}. Please ensure these columns exist in your CSV/Excel file (case-sensitive).`;
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

  const filteredScheduleGroupsList = scheduleGroups.filter(g => {
    if (!scheduleGroupSearchQuery.trim()) return true;
    return (g.subject || '').toLowerCase().includes(scheduleGroupSearchQuery.toLowerCase());
  });

  const filteredCycleGroupsList = cycleGroups.filter(g => {
    if (!cycleGroupSearchQuery.trim()) return true;
    return (g.subject || '').toLowerCase().includes(cycleGroupSearchQuery.toLowerCase());
  });

  const renderStatusTicks = (status) => {
    switch (status) {
      case 'read':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#53bdeb' }} title="Read">
            <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '11px' }}>
              <path d="M4.5 8L1.5 5L0.5 6L4.5 10L12.5 2L11.5 1L4.5 8Z" fill="currentColor" />
              <path d="M8.5 8L7.5 7L6.5 8L8.5 10L15.5 3L14.5 2L8.5 8Z" fill="currentColor" />
            </svg>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Read</span>
          </div>
        );
      case 'delivered':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8696a0' }} title="Delivered">
            <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '11px' }}>
              <path d="M4.5 8L1.5 5L0.5 6L4.5 10L12.5 2L11.5 1L4.5 8Z" fill="currentColor" />
              <path d="M8.5 8L7.5 7L6.5 8L8.5 10L15.5 3L14.5 2L8.5 8Z" fill="currentColor" />
            </svg>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Delivered</span>
          </div>
        );
      case 'sent':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8696a0' }} title="Sent">
            <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '11px' }}>
              <path d="M4.5 8L1.5 5L0.5 6L4.5 10L12.5 2L11.5 1L4.5 8Z" fill="currentColor" />
            </svg>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Sent</span>
          </div>
        );
      case 'failed':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }} title="Failed">
            <AlertCircle size={14} />
            <span style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Failed</span>
          </div>
        );
      case 'pending':
      default:
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }} title="Pending">
            <Loader2 size={14} className="animate-spin" />
            <span style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Pending</span>
          </div>
        );
    }
  };

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
      case 'campaigns':
        return {
          title: "Campaigns History",
          subtitle: "Track live status updates and manage your broadcast history."
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

  const renderCampaignsUI = () => {
    return (
      <div className="campaigns-history-layout animate-fade-in" style={{ width: '100%' }}>
        <div style={{ padding: '24px', background: 'var(--surface-card)', borderRadius: '16px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
            <FileText size={22} className="text-primary" /> Campaigns History & Tracking
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 24px 0' }}>
            View history of sent broadcasts, load templates, and track real-time delivery and read status.
          </p>

          {savedCampaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed var(--border)', borderRadius: '12px', background: 'var(--surface-hover)' }}>
              <AlertCircle size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-main)' }}>No Campaigns Found</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Send a bulk campaign with a specified Campaign Name to start tracking delivery status.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {savedCampaigns.map(camp => (
                <div key={camp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-hover)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <strong style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>{camp.name}</strong>
                      <button
                        type="button"
                        onClick={(e) => handleRenameCampaign(camp.id, camp.name, e)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                        title="Rename Campaign"
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span><strong>Contacts:</strong> {camp.contacts?.length || 0}</span>
                      <span>•</span>
                      <span><strong>Sent On:</strong> {new Date(camp.createdAt).toLocaleString()}</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="premium-btn-primary"
                      style={{ height: '36px', padding: '0 16px', fontSize: '0.85rem', borderRadius: '8px' }}
                      onClick={() => handleTrackCampaign(camp.id)}
                    >
                      Track Status
                    </button>
                    <Link
                      to="/dashboard/messaging?type=bulk"
                      className="premium-btn-outline"
                      style={{ height: '36px', padding: '0 16px', fontSize: '0.85rem', borderRadius: '8px', display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'var(--text-main)' }}
                      onClick={() => handleLoadCampaign(camp)}
                    >
                      Load List
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCampaign(camp.id, e)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-error)', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                      title="Delete Campaign"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

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
                  <CustomDateInput
                    value={scheduleTargetDate}
                    onChange={setScheduleTargetDate}
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
                <label>Recipients (Manual list, CSV/Excel or Groups Broadcast)</label>
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
                    <button
                      type="button"
                      className={`method-btn ${scheduleInputMethod === 'group' ? 'active' : ''}`}
                      onClick={() => setScheduleInputMethod('group')}
                    >
                      <MessageSquare size={16} /> WhatsApp Groups
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

                      <div className="form-group mt-4 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target Groups (Optional)</label>
                        <div className="searchable-dropdown-container" style={{ position: 'relative', marginTop: '8px' }}>
                          {/* Render Selected Groups Tags */}
                          {scheduleSelectedGroups.length > 0 && (
                            <div className="selected-groups-tags" style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '6px',
                              marginBottom: '10px'
                            }}>
                              {scheduleSelectedGroups.map(group => (
                                <div key={group.id} className="selected-group-tag">
                                  <span>{group.subject}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setScheduleSelectedGroups(prev => prev.filter(g => g.id !== group.id));
                                    }}
                                    className="selected-group-tag-remove"
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
                            placeholder={loadingScheduleGroups ? "Loading groups..." : "Search and select groups..."}
                            value={scheduleGroupSearchQuery}
                            onChange={(e) => {
                              setScheduleGroupSearchQuery(e.target.value);
                              setIsOpenScheduleGroupDropdown(true);
                            }}
                            onFocus={() => setIsOpenScheduleGroupDropdown(true)}
                            disabled={loadingScheduleGroups}
                          />

                          {isOpenScheduleGroupDropdown && !loadingScheduleGroups && (
                            <div className="group-dropdown-list" data-lenis-prevent style={{ zIndex: 10 }}>
                              {scheduleGroups.length === 0 ? (
                                <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                  No participating groups found for this instance
                                </div>
                              ) : filteredScheduleGroupsList.length === 0 ? (
                                <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                  No groups found matching search query
                                </div>
                              ) : (
                                <>
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const allFilteredSelected = filteredScheduleGroupsList.every(group =>
                                        scheduleSelectedGroups.some(g => g.id === group.id)
                                      );
                                      if (allFilteredSelected) {
                                        const filteredIds = filteredScheduleGroupsList.map(g => g.id);
                                        setScheduleSelectedGroups(prev => prev.filter(g => !filteredIds.includes(g.id)));
                                      } else {
                                        setScheduleSelectedGroups(prev => {
                                          const existingIds = prev.map(g => g.id);
                                          const toAdd = filteredScheduleGroupsList.filter(g => !existingIds.includes(g.id));
                                          return [...prev, ...toAdd];
                                        });
                                      }
                                    }}
                                    className="group-dropdown-item select-all-item"
                                    style={{
                                      borderBottom: '1px solid var(--border)',
                                      fontWeight: '600',
                                      color: 'var(--primary)',
                                      display: 'flex',
                                      justifyContent: 'flex-start',
                                      alignItems: 'center',
                                      gap: '10px',
                                      padding: '12px 14px',
                                      cursor: 'pointer',
                                      backgroundColor: 'rgba(0, 168, 132, 0.05)'
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={filteredScheduleGroupsList.every(group => scheduleSelectedGroups.some(g => g.id === group.id))}
                                      readOnly
                                      style={{
                                        width: '16px',
                                        height: '16px',
                                        cursor: 'pointer',
                                        accentColor: 'var(--primary)'
                                      }}
                                    />
                                    <span>
                                      Select All Matching ({filteredScheduleGroupsList.length})
                                    </span>
                                  </div>
                                  {filteredScheduleGroupsList.map(group => {
                                    const isSelected = scheduleSelectedGroups.some(g => g.id === group.id);
                                    return (
                                      <div
                                        key={group.id}
                                        onClick={() => {
                                          if (isSelected) {
                                            setScheduleSelectedGroups(prev => prev.filter(g => g.id !== group.id));
                                          } else {
                                            setScheduleSelectedGroups(prev => [...prev, group]);
                                          }
                                          setScheduleGroupSearchQuery('');
                                        }}
                                        className={`group-dropdown-item ${isSelected ? 'selected' : ''}`}
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'flex-start',
                                          alignItems: 'center',
                                          gap: '10px',
                                          padding: '10px 14px'
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          readOnly
                                          style={{
                                            width: '16px',
                                            height: '16px',
                                            cursor: 'pointer',
                                            accentColor: 'var(--primary)'
                                          }}
                                        />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <span className="group-subject">{group.subject}</span>
                                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({group.id})</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : scheduleInputMethod === 'csv' ? (
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
                  ) : (
                    <div className="searchable-dropdown-container animate-fade-in" style={{ position: 'relative', marginTop: '16px' }}>
                      {scheduleSelectedGroups.length > 0 && (
                        <div className="selected-groups-tags" style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px',
                          marginBottom: '10px'
                        }}>
                          {scheduleSelectedGroups.map(group => (
                            <div key={group.id} className="selected-group-tag">
                              <span>{group.subject}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setScheduleSelectedGroups(prev => prev.filter(g => g.id !== group.id));
                                }}
                                className="selected-group-tag-remove"
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
                        placeholder={loadingScheduleGroups ? "Loading groups..." : "Search and select groups..."}
                        value={scheduleGroupSearchQuery}
                        onChange={(e) => {
                          setScheduleGroupSearchQuery(e.target.value);
                          setIsOpenScheduleGroupDropdown(true);
                        }}
                        onFocus={() => setIsOpenScheduleGroupDropdown(true)}
                        disabled={loadingScheduleGroups}
                        required={scheduleSelectedGroups.length === 0}
                      />

                      {isOpenScheduleGroupDropdown && !loadingScheduleGroups && (
                        <div className="group-dropdown-list" data-lenis-prevent>
                          {scheduleGroups.length === 0 ? (
                            <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                              No participating groups found for this instance
                            </div>
                          ) : filteredScheduleGroupsList.length === 0 ? (
                            <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                              No groups found matching search query
                            </div>
                          ) : (
                            <>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const allFilteredSelected = filteredScheduleGroupsList.every(group =>
                                    scheduleSelectedGroups.some(g => g.id === group.id)
                                  );
                                  if (allFilteredSelected) {
                                    const filteredIds = filteredScheduleGroupsList.map(g => g.id);
                                    setScheduleSelectedGroups(prev => prev.filter(g => !filteredIds.includes(g.id)));
                                  } else {
                                    setScheduleSelectedGroups(prev => {
                                      const existingIds = prev.map(g => g.id);
                                      const toAdd = filteredScheduleGroupsList.filter(g => !existingIds.includes(g.id));
                                      return [...prev, ...toAdd];
                                    });
                                  }
                                }}
                                className="group-dropdown-item select-all-item"
                                style={{
                                  borderBottom: '1px solid var(--border)',
                                  fontWeight: '600',
                                  color: 'var(--primary)',
                                  display: 'flex',
                                  justifyContent: 'flex-start',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '12px 14px',
                                  cursor: 'pointer',
                                  backgroundColor: 'rgba(0, 168, 132, 0.05)'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={filteredScheduleGroupsList.every(group => scheduleSelectedGroups.some(g => g.id === group.id))}
                                  readOnly
                                  style={{
                                    width: '16px',
                                    height: '16px',
                                    cursor: 'pointer',
                                    accentColor: 'var(--primary)'
                                  }}
                                />
                                <span>
                                  Select All Matching ({filteredScheduleGroupsList.length})
                                </span>
                              </div>
                              {filteredScheduleGroupsList.map(group => {
                                const isSelected = scheduleSelectedGroups.some(g => g.id === group.id);
                                return (
                                  <div
                                    key={group.id}
                                    onClick={() => {
                                      if (isSelected) {
                                        setScheduleSelectedGroups(prev => prev.filter(g => g.id !== group.id));
                                      } else {
                                        setScheduleSelectedGroups(prev => [...prev, group]);
                                      }
                                      setScheduleGroupSearchQuery('');
                                    }}
                                    className={`group-dropdown-item ${isSelected ? 'selected' : ''}`}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'flex-start',
                                      alignItems: 'center',
                                      gap: '10px',
                                      padding: '10px 14px'
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      readOnly
                                      style={{
                                        width: '16px',
                                        height: '16px',
                                        cursor: 'pointer',
                                        accentColor: 'var(--primary)'
                                      }}
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span className="group-subject">{group.subject}</span>
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({group.id})</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          )}
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
                <label>Recipients (Manual list, CSV/Excel or Groups Broadcast)</label>
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
                    <button
                      type="button"
                      className={`method-btn ${cycleInputMethod === 'group' ? 'active' : ''}`}
                      onClick={() => setCycleInputMethod('group')}
                    >
                      <MessageSquare size={16} /> WhatsApp Groups
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

                      <div className="form-group mt-4 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target Groups (Optional)</label>
                        <div className="searchable-dropdown-container" style={{ position: 'relative', marginTop: '8px' }}>
                          {/* Render Selected Groups Tags */}
                          {cycleSelectedGroups.length > 0 && (
                            <div className="selected-groups-tags" style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '6px',
                              marginBottom: '10px'
                            }}>
                              {cycleSelectedGroups.map(group => (
                                <div key={group.id} className="selected-group-tag">
                                  <span>{group.subject}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCycleSelectedGroups(prev => prev.filter(g => g.id !== group.id));
                                    }}
                                    className="selected-group-tag-remove"
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
                            placeholder={loadingCycleGroups ? "Loading groups..." : "Search and select groups..."}
                            value={cycleGroupSearchQuery}
                            onChange={(e) => {
                              setCycleGroupSearchQuery(e.target.value);
                              setIsOpenCycleGroupDropdown(true);
                            }}
                            onFocus={() => setIsOpenCycleGroupDropdown(true)}
                            disabled={loadingCycleGroups}
                          />

                          {isOpenCycleGroupDropdown && !loadingCycleGroups && (
                            <div className="group-dropdown-list" data-lenis-prevent style={{ zIndex: 10 }}>
                              {cycleGroups.length === 0 ? (
                                <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                  No participating groups found for this instance
                                </div>
                              ) : filteredCycleGroupsList.length === 0 ? (
                                <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                  No groups found matching search query
                                </div>
                              ) : (
                                <>
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const allFilteredSelected = filteredCycleGroupsList.every(group =>
                                        cycleSelectedGroups.some(g => g.id === group.id)
                                      );
                                      if (allFilteredSelected) {
                                        const filteredIds = filteredCycleGroupsList.map(g => g.id);
                                        setCycleSelectedGroups(prev => prev.filter(g => !filteredIds.includes(g.id)));
                                      } else {
                                        setCycleSelectedGroups(prev => {
                                          const existingIds = prev.map(g => g.id);
                                          const toAdd = filteredCycleGroupsList.filter(g => !existingIds.includes(g.id));
                                          return [...prev, ...toAdd];
                                        });
                                      }
                                    }}
                                    className="group-dropdown-item select-all-item"
                                    style={{
                                      borderBottom: '1px solid var(--border)',
                                      fontWeight: '600',
                                      color: 'var(--primary)',
                                      display: 'flex',
                                      justifyContent: 'flex-start',
                                      alignItems: 'center',
                                      gap: '10px',
                                      padding: '12px 14px',
                                      cursor: 'pointer',
                                      backgroundColor: 'rgba(0, 168, 132, 0.05)'
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={filteredCycleGroupsList.every(group => cycleSelectedGroups.some(g => g.id === group.id))}
                                      readOnly
                                      style={{
                                        width: '16px',
                                        height: '16px',
                                        cursor: 'pointer',
                                        accentColor: 'var(--primary)'
                                      }}
                                    />
                                    <span>
                                      Select All Matching ({filteredCycleGroupsList.length})
                                    </span>
                                  </div>
                                  {filteredCycleGroupsList.map(group => {
                                    const isSelected = cycleSelectedGroups.some(g => g.id === group.id);
                                    return (
                                      <div
                                        key={group.id}
                                        onClick={() => {
                                          if (isSelected) {
                                            setCycleSelectedGroups(prev => prev.filter(g => g.id !== group.id));
                                          } else {
                                            setCycleSelectedGroups(prev => [...prev, group]);
                                          }
                                          setCycleGroupSearchQuery('');
                                        }}
                                        className={`group-dropdown-item ${isSelected ? 'selected' : ''}`}
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'flex-start',
                                          alignItems: 'center',
                                          gap: '10px',
                                          padding: '10px 14px'
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          readOnly
                                          style={{
                                            width: '16px',
                                            height: '16px',
                                            cursor: 'pointer',
                                            accentColor: 'var(--primary)'
                                          }}
                                        />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <span className="group-subject">{group.subject}</span>
                                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({group.id})</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : cycleInputMethod === 'csv' ? (
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
                  ) : (
                    <div className="searchable-dropdown-container animate-fade-in" style={{ position: 'relative', marginTop: '16px' }}>
                      {cycleSelectedGroups.length > 0 && (
                        <div className="selected-groups-tags" style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px',
                          marginBottom: '10px'
                        }}>
                          {cycleSelectedGroups.map(group => (
                            <div key={group.id} className="selected-group-tag">
                              <span>{group.subject}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCycleSelectedGroups(prev => prev.filter(g => g.id !== group.id));
                                }}
                                className="selected-group-tag-remove"
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
                        placeholder={loadingCycleGroups ? "Loading groups..." : "Search and select groups..."}
                        value={cycleGroupSearchQuery}
                        onChange={(e) => {
                          setCycleGroupSearchQuery(e.target.value);
                          setIsOpenCycleGroupDropdown(true);
                        }}
                        onFocus={() => setIsOpenCycleGroupDropdown(true)}
                        disabled={loadingCycleGroups}
                        required={cycleSelectedGroups.length === 0}
                      />

                      {isOpenCycleGroupDropdown && !loadingCycleGroups && (
                        <div className="group-dropdown-list" data-lenis-prevent>
                          {cycleGroups.length === 0 ? (
                            <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                              No participating groups found for this instance
                            </div>
                          ) : filteredCycleGroupsList.length === 0 ? (
                            <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                              No groups found matching search query
                            </div>
                          ) : (
                            <>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const allFilteredSelected = filteredCycleGroupsList.every(group =>
                                    cycleSelectedGroups.some(g => g.id === group.id)
                                  );
                                  if (allFilteredSelected) {
                                    const filteredIds = filteredCycleGroupsList.map(g => g.id);
                                    setCycleSelectedGroups(prev => prev.filter(g => !filteredIds.includes(g.id)));
                                  } else {
                                    setCycleSelectedGroups(prev => {
                                      const existingIds = prev.map(g => g.id);
                                      const toAdd = filteredCycleGroupsList.filter(g => !existingIds.includes(g.id));
                                      return [...prev, ...toAdd];
                                    });
                                  }
                                }}
                                className="group-dropdown-item select-all-item"
                                style={{
                                  borderBottom: '1px solid var(--border)',
                                  fontWeight: '600',
                                  color: 'var(--primary)',
                                  display: 'flex',
                                  justifyContent: 'flex-start',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '12px 14px',
                                  cursor: 'pointer',
                                  backgroundColor: 'rgba(0, 168, 132, 0.05)'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={filteredCycleGroupsList.every(group => cycleSelectedGroups.some(g => g.id === group.id))}
                                  readOnly
                                  style={{
                                    width: '16px',
                                    height: '16px',
                                    cursor: 'pointer',
                                    accentColor: 'var(--primary)'
                                  }}
                                />
                                <span>
                                  Select All Matching ({filteredCycleGroupsList.length})
                                </span>
                              </div>
                              {filteredCycleGroupsList.map(group => {
                                const isSelected = cycleSelectedGroups.some(g => g.id === group.id);
                                return (
                                  <div
                                    key={group.id}
                                    onClick={() => {
                                      if (isSelected) {
                                        setCycleSelectedGroups(prev => prev.filter(g => g.id !== group.id));
                                      } else {
                                        setCycleSelectedGroups(prev => [...prev, group]);
                                      }
                                      setCycleGroupSearchQuery('');
                                    }}
                                    className={`group-dropdown-item ${isSelected ? 'selected' : ''}`}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'flex-start',
                                      alignItems: 'center',
                                      gap: '10px',
                                      padding: '10px 14px'
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      readOnly
                                      style={{
                                        width: '16px',
                                        height: '16px',
                                        cursor: 'pointer',
                                        accentColor: 'var(--primary)'
                                      }}
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span className="group-subject">{group.subject}</span>
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({group.id})</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          )}
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
                    <th>Remaining time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cyclingCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
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
                            <span style={{
                              fontWeight: '600',
                              color: 'var(--primary)'
                            }}>
                              {getCycleRemainingTime(cycle)}
                            </span>
                          </td>
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
              </table>            </div>
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
        ) : typeParam === 'campaigns' ? (
          renderCampaignsUI()
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
                                <div key={group.id} className="selected-group-tag">
                                  <span>{group.subject}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedGroups(prev => prev.filter(g => g.id !== group.id));
                                    }}
                                    className="selected-group-tag-remove"
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
                            <div className="group-dropdown-list" data-lenis-prevent>
                              {groups.length === 0 ? (
                                <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                  No participating groups found for this instance
                                </div>
                              ) : filteredGroupsList.length === 0 ? (
                                <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                  No groups found matching search query
                                </div>
                              ) : (
                                <>
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const allFilteredSelected = filteredGroupsList.every(group =>
                                        selectedGroups.some(g => g.id === group.id)
                                      );
                                      if (allFilteredSelected) {
                                        const filteredIds = filteredGroupsList.map(g => g.id);
                                        setSelectedGroups(prev => prev.filter(g => !filteredIds.includes(g.id)));
                                      } else {
                                        setSelectedGroups(prev => {
                                          const existingIds = prev.map(g => g.id);
                                          const toAdd = filteredGroupsList.filter(g => !existingIds.includes(g.id));
                                          return [...prev, ...toAdd];
                                        });
                                      }
                                    }}
                                    className="group-dropdown-item select-all-item"
                                    style={{
                                      borderBottom: '1px solid var(--border)',
                                      fontWeight: '600',
                                      color: 'var(--primary)',
                                      display: 'flex',
                                      justifyContent: 'flex-start',
                                      alignItems: 'center',
                                      gap: '10px',
                                      padding: '12px 14px',
                                      cursor: 'pointer',
                                      backgroundColor: 'rgba(0, 168, 132, 0.05)'
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={filteredGroupsList.every(group => selectedGroups.some(g => g.id === group.id))}
                                      readOnly
                                      style={{
                                        width: '16px',
                                        height: '16px',
                                        cursor: 'pointer',
                                        accentColor: 'var(--primary)'
                                      }}
                                    />
                                    <span>
                                      Select All Matching ({filteredGroupsList.length})
                                    </span>
                                  </div>
                                  {filteredGroupsList.map(group => {
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
                                        className={`group-dropdown-item ${isSelected ? 'selected' : ''}`}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          padding: '10px 14px'
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            readOnly
                                            style={{
                                              width: '16px',
                                              height: '16px',
                                              cursor: 'pointer',
                                              accentColor: 'var(--primary)'
                                            }}
                                          />
                                          <span style={{ fontWeight: '500' }}>{group.subject}</span>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{group.participantsCount} members</span>
                                      </div>
                                    );
                                  })}
                                </>
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
                            onClick={() => {
                              setBulkInputMethod('csv');
                              setIsCsvModalOpen(true);
                            }}
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
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', border: '1px dashed var(--border)', borderRadius: '16px', background: 'var(--surface-hover)', padding: '32px 24px', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                <FileUp size={48} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                                <div>
                                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: 'var(--text-main)', fontWeight: '600' }}>No Contacts Loaded</h4>
                                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '360px' }}>
                                    Please upload a CSV/Excel file or select a saved list/campaign to load contact details.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  className="premium-btn-primary"
                                  onClick={() => setIsCsvModalOpen(true)}
                                  style={{ height: '42px', padding: '0 24px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                  <FileUp size={16} /> Import Contacts List
                                </button>
                              </div>
                            ) : (
                              <div className="csv-success-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border)', borderRadius: '16px', background: 'var(--surface-hover)', padding: '20px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                  <div style={{ background: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.2)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                    <FileText size={24} />
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: '700' }}>
                                      {csvData.fileName}
                                    </h4>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                                      <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{csvData.rows.length} contacts configured</span>
                                      <span>•</span>
                                      <span>Phone column: <strong>{csvData.phoneHeader}</strong></span>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button
                                      type="button"
                                      className="premium-btn-outline"
                                      onClick={() => setIsCsvModalOpen(true)}
                                      style={{ height: '36px', padding: '0 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                      title="Configure Import"
                                    >
                                      <Edit2 size={14} /> Configure List
                                    </button>
                                    <button
                                      type="button"
                                      onClick={clearCSV}
                                      style={{ background: 'none', border: 'none', color: 'var(--text-error)', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                                      title="Remove list"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
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
                          </div>
                        )}

                        {/* Campaign Name Input */}
                        <div style={{ margin: '20px 0 10px 0', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
                            Campaign / List Name
                          </label>
                          <input
                            type="text"
                            className="auth-input"
                            style={{ paddingLeft: '14px' }}
                            placeholder="Enter campaign name to save and track status (e.g. July Promotion)"
                            value={campaignNameInput}
                            onChange={(e) => setCampaignNameInput(e.target.value)}
                          />
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px', paddingLeft: '2px' }}>
                            Providing a name saves this list & template in your history for live delivery tracking and future re-use.
                          </span>
                        </div>
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

      {/* Bulk Progress Modal */}
      {progressData && createPortal(
        <div className="progress-modal-overlay">
          <div className="progress-modal-content glass animate-scale-up" onClick={e => e.stopPropagation()}>
            <h3 className="progress-modal-title">Bulk Message Campaign</h3>

            <div className="progress-status-container">
              <div className="progress-circle-wrapper">
                <svg className="progress-ring" width="120" height="120">
                  <circle
                    className="progress-ring__circle-bg"
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="8"
                    fill="transparent"
                    r="50"
                    cx="60"
                    cy="60"
                  />
                  <circle
                    className="progress-ring__circle"
                    stroke="var(--primary)"
                    strokeWidth="8"
                    fill="transparent"
                    r="50"
                    cx="60"
                    cy="60"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - (progressData.sent + progressData.failed) / progressData.total)}`}
                    style={{ transition: 'stroke-dashoffset 0.35s', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                </svg>
                <div className="progress-percentage">
                  {Math.round(((progressData.sent + progressData.failed) / progressData.total) * 100)}%
                </div>
              </div>

              <div className="progress-stats">
                <div className="progress-stat-item">
                  <span className="label">Total Recipient(s)</span>
                  <span className="value">{progressData.total}</span>
                </div>
                <div className="progress-stat-item">
                  <span className="label">Processed</span>
                  <span className="value">{progressData.sent + progressData.failed}</span>
                </div>
                <div className="progress-stat-item">
                  <span className="label text-success">Sent Successfully</span>
                  <span className="value text-success">{progressData.sent}</span>
                </div>
                <div className="progress-stat-item">
                  <span className="label text-error">Failed</span>
                  <span className="value text-error">{progressData.failed}</span>
                </div>
              </div>
            </div>

            <div className="progress-current-action">
              {progressData.status === 'done' ? (
                <div className="text-success font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} />
                  Campaign complete!
                </div>
              ) : progressData.status === 'error' ? (
                <div className="text-error font-bold flex items-center justify-center gap-2">
                  <AlertCircle size={18} />
                  {progressData.errorMsg}
                </div>
              ) : progressData.status === 'paused' ? (
                <div className="text-warning font-bold flex flex-col items-center justify-center gap-1" style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
                  <Loader2 size={16} className="animate-spin" />
                  <div>{progressData.message || 'Taking a 15-second break...'}</div>
                </div>
              ) : (
                <div className="text-muted text-sm flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  Sending to {progressData.currentNumber}...
                </div>
              )}
            </div>

            <div className="progress-modal-actions">
              <button
                className="btn-primary"
                disabled={progressData.status !== 'done' && progressData.status !== 'error'}
                onClick={() => setProgressData(null)}
                style={{ minWidth: '120px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Campaign Status Tracker Modal */}
      {showCampaignTrackerModal && createPortal(
        <div className="progress-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="progress-modal-content glass animate-scale-up" style={{ maxWidth: '600px', width: '90%', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: '700' }}>
                Campaign Status: {trackingCampaignData?.campaign?.name || 'Loading...'}
              </h3>
              <button 
                type="button" 
                onClick={() => {
                  setShowCampaignTrackerModal(false);
                  setTrackingCampaignData(null);
                }} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {loadingTrackingData ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '12px' }}>
                <Loader2 className="animate-spin text-primary" size={32} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Fetching campaign metrics...</span>
              </div>
            ) : trackingCampaignData ? (
              <div>
                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: 'var(--surface-hover)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Sent</span>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>
                      {trackingCampaignData.statuses.filter(s => ['sent', 'delivered', 'read'].includes(s.status)).length}
                    </strong>
                  </div>
                  <div style={{ background: 'var(--surface-hover)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Delivered</span>
                    <strong style={{ fontSize: '1.2rem', color: '#3b82f6' }}>
                      {trackingCampaignData.statuses.filter(s => ['delivered', 'read'].includes(s.status)).length}
                    </strong>
                  </div>
                  <div style={{ background: 'var(--surface-hover)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Read</span>
                    <strong style={{ fontSize: '1.2rem', color: '#10b981' }}>
                      {trackingCampaignData.statuses.filter(s => s.status === 'read').length}
                    </strong>
                  </div>
                  <div style={{ background: 'var(--surface-hover)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Failed</span>
                    <strong style={{ fontSize: '1.2rem', color: '#ef4444' }}>
                      {trackingCampaignData.statuses.filter(s => s.status === 'failed').length}
                    </strong>
                  </div>
                </div>

                {/* Recipient Wise Status Table */}
                <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: 'var(--surface-hover)', borderBottom: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
                    Recipient-wise Status Logs
                  </div>
                  <div style={{ maxHeight: '220px', overflowY: 'auto' }} data-lenis-prevent>
                    <table className="csv-preview-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '8px 12px' }}>Recipient</th>
                          <th style={{ padding: '8px 12px' }}>Status</th>
                          <th style={{ padding: '8px 12px' }}>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trackingCampaignData.statuses.map(st => (
                          <tr key={st.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 12px', color: 'var(--text-main)' }}>{st.recipient}</td>
                            <td style={{ padding: '8px 12px' }}>
                              {renderStatusTicks(st.status)}
                            </td>
                            <td style={{ padding: '8px 12px', color: st.status === 'failed' ? '#ef4444' : 'var(--text-muted)', fontSize: '0.8rem' }}>
                              {st.status === 'failed' 
                                ? (st.errorMessage || 'Failed') 
                                : new Date(st.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                No tracking statistics available.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <button
                type="button"
                className="premium-btn-primary"
                onClick={() => {
                  setShowCampaignTrackerModal(false);
                  setTrackingCampaignData(null);
                }}
                style={{ height: '36px', padding: '0 16px', fontSize: '0.85rem' }}
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CSV/Excel Import Wizard Modal */}
      {isCsvModalOpen && createPortal(
        <div className="progress-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="progress-modal-content glass animate-scale-up" 
               style={{ 
                 maxWidth: csvData.fileName ? '950px' : '500px', 
                 width: '95%', 
                 padding: '24px', 
                 maxHeight: '90vh', 
                 overflowY: 'auto',
                 display: 'block',
                 textAlign: 'left'
               }} 
               onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                  <FileUp size={22} className="text-primary" /> Contacts Import Wizard
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Upload a contact list sheet or choose from your campaign history to proceed.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsCsvModalOpen(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Dynamic Grid Layout */}
            {!csvData.fileName ? (
              /* Welcoming View - Single Column */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Drag & Drop Zone */}
                <div className="csv-dropzone">
                  <input
                    type="file"
                    id="csv-modal-file-input"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    hidden
                  />
                  <label htmlFor="csv-modal-file-input" className="csv-dropzone-label" style={{ padding: '24px 16px', cursor: 'pointer' }}>
                    <FileUp size={36} className="upload-icon" style={{ color: 'var(--primary)', marginBottom: '8px' }} />
                    <span className="upload-title" style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>Choose CSV/Excel File</span>
                    <span className="upload-subtitle" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Drag and drop or click to browse (.csv, .xlsx, .xls)</span>
                  </label>
                </div>

                {/* Load from Saved Dropdown */}
                {savedCampaigns.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--surface-hover)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                      — OR SELECT A SAVED CAMPAIGN LIST —
                    </span>
                    <select
                      className="auth-input"
                      style={{ paddingLeft: '14px', height: '38px', background: 'var(--surface-card)', fontSize: '0.82rem' }}
                      onChange={(e) => {
                        if (e.target.value) {
                          const selectedCamp = savedCampaigns.find(c => String(c.id) === e.target.value);
                          if (selectedCamp) handleLoadCampaign(selectedCamp);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Select a saved list/campaign...</option>
                      {savedCampaigns.map(camp => (
                        <option key={camp.id} value={camp.id}>
                          {camp.name} ({camp.contacts?.length || 0} contacts)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Download Template & Guideline */}
                <div style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: '600' }}>Need a template format?</span>
                    <button type="button" className="download-template-link" onClick={downloadCSVTemplate} style={{ margin: 0, padding: '4px 8px', height: 'auto', background: 'rgba(37, 211, 102, 0.1)', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '6px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '600' }}>
                      <FileText size={12} /> Download Template
                    </button>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'flex-start', lineHeight: '1.4' }}>
                    <AlertCircle size={13} className="text-warning" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>The <strong>first column</strong> in your file must contain the phone numbers. Other columns will be used as placeholders (e.g. <code>{"{Name}"}</code>) and must match your message template exactly.</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Configured Split Screen View - Left: Stats & Controls | Right: Data Table Preview */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px', alignItems: 'start' }}>
                
                {/* Left Column: List details, WhatsApp validation, guidelines */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* File Badge */}
                  <div style={{ background: 'rgba(37, 211, 102, 0.06)', border: '1px solid rgba(37, 211, 102, 0.2)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loaded Contacts</span>
                      <button 
                        type="button" 
                        onClick={clearCSV}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '700', padding: 0 }}
                      >
                        Remove List
                      </button>
                    </div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-main)', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {csvData.fileName}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <strong>{csvData.rows.length}</strong> unique rows parsed.
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Phone column: <strong style={{ color: 'var(--text-main)' }}>{csvData.phoneHeader}</strong>
                    </div>
                  </div>

                  {/* Actions & WhatsApp Analysis */}
                  <div style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                    <h5 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '600' }}>WhatsApp Availability Check</h5>
                    {!analysisResult ? (
                      <div>
                        <p style={{ margin: '0 0 12px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Check if these numbers have registered WhatsApp accounts to prevent failures.
                        </p>
                        <button
                          type="button"
                          className="premium-btn-primary"
                          onClick={handleAnalyzeContacts}
                          disabled={analyzingContacts}
                          style={{ height: '36px', padding: '0 16px', fontSize: '0.8rem', width: '100%' }}
                        >
                          {analyzingContacts ? (
                            <>
                              <Loader2 className="animate-spin" size={14} style={{ marginRight: '6px' }} /> Checking WhatsApp...
                            </>
                          ) : 'Check Numbers on WhatsApp'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', background: 'var(--surface-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <span style={{ color: '#10b981', fontWeight: '600' }}>WhatsApp: {analysisResult.onWhatsAppCount}</span>
                          <span style={{ color: '#ef4444', fontWeight: '600' }}>Not on WA: {analysisResult.notOnWhatsAppCount}</span>
                        </div>
                        {analysisResult.notOnWhatsAppCount > 0 && (
                          <button
                            type="button"
                            className="premium-btn-outline"
                            onClick={handleCleanContacts}
                            style={{ height: '36px', width: '100%', fontSize: '0.8rem', borderColor: '#ef4444', color: '#ef4444' }}
                          >
                            Remove {analysisResult.notOnWhatsAppCount} invalid numbers
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Option to Upload Another CSV / Select Campaign */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <label htmlFor="csv-modal-file-input" className="premium-btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '36px', width: '100%', fontSize: '0.8rem', margin: 0, padding: 0, cursor: 'pointer', textAlign: 'center' }}>
                      <FileUp size={14} /> Upload Different File
                    </label>
                  </div>

                  {/* Guidelines Download */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Template format required?</span>
                    <button type="button" className="download-template-link" onClick={downloadCSVTemplate} style={{ margin: 0, padding: '4px 8px', height: 'auto', background: 'none', color: 'var(--primary)', border: 'none', textDecoration: 'underline', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      Download Sample File
                    </button>
                  </div>
                </div>

                {/* Right Column: Table Preview Grid */}
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Data Preview (Showing first 5 rows)</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '400', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>Placeholders: {csvData.placeholders.map(p => `{${p}}`).join(', ') || 'None'}</span>
                  </div>
                  <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ maxHeight: '280px', overflowY: 'auto' }} data-lenis-prevent>
                      <table className="csv-preview-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--surface-hover)' }}>
                            <th style={{ padding: '10px 12px', fontWeight: '600' }}>#</th>
                            {csvData.headers.map((h, idx) => (
                              <th key={idx} style={{ padding: '10px 12px', fontWeight: '600' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.rows.slice(0, 5).map((row, rIdx) => {
                            const isNonWhatsApp = analysisResult?.nonWhatsAppNumbers?.includes(row._cleanPhone);
                            return (
                              <tr key={rIdx} style={{ borderBottom: '1px solid var(--border)', background: isNonWhatsApp ? 'rgba(239, 68, 68, 0.08)' : 'transparent' }}>
                                <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{rIdx + 1}</td>
                                {csvData.headers.map((h, cIdx) => (
                                  <td key={cIdx} style={{ padding: '10px 12px', color: 'var(--text-main)' }}>
                                    {row[h]}
                                    {h === csvData.phoneHeader && isNonWhatsApp && (
                                      <span style={{ color: '#ef4444', fontSize: '0.75rem', marginLeft: '6px', fontWeight: '600' }}>(Not on WA)</span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {csvData.rows.length > 5 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'right' }}>
                      Showing first 5 rows of {csvData.rows.length} total rows.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button
                type="button"
                className="premium-btn-outline"
                onClick={() => setIsCsvModalOpen(false)}
                style={{ height: '38px', padding: '0 16px', fontSize: '0.85rem' }}
              >
                Close
              </button>
              <button
                type="button"
                className="premium-btn-primary"
                onClick={() => setIsCsvModalOpen(false)}
                disabled={!csvData.fileName}
                style={{ height: '38px', padding: '0 20px', fontSize: '0.85rem' }}
              >
                Apply Contacts List
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SendMessage;
