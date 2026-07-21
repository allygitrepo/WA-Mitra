import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Trash2,
  AlertCircle,
  X,
  Bot,
  ToggleLeft,
  ToggleRight,
  Edit2
} from 'lucide-react';
import { instanceService } from '../../api/services';
import API from '../../api/axiosConfig';
import toast from 'react-hot-toast';
import './AutoReplies.css';

const AutoReplies = () => {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState('');
  const [keyword, setKeyword] = useState('');
  const [matchType, setMatchType] = useState('exact');
  const [replyText, setReplyText] = useState('');
  const [filterInstance, setFilterInstance] = useState('All Instances');
  const [showInstanceDropdown, setShowInstanceDropdown] = useState(false);
  const instanceDropdownRef = useRef(null);
  const [editingRule, setEditingRule] = useState(null);
  const modalRef = useRef(null);

  // Click outside for instance filter dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (instanceDropdownRef.current && !instanceDropdownRef.current.contains(event.target)) {
        setShowInstanceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock scroll and prevent layout shift
  useEffect(() => {
    if (showAddModal) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [showAddModal]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showAddModal) {
        setShowAddModal(false);
        setEditingRule(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal]);

  // Handle Overlay Click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowAddModal(false);
      setEditingRule(null);
    }
  };

  // Focus trap accessibility
  useEffect(() => {
    if (showAddModal && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]'
      );
      if (focusableElements.length > 0) {
        setTimeout(() => {
          if (focusableElements[1]) {
            focusableElements[1].focus(); // target instance select
          } else {
            focusableElements[0].focus();
          }
        }, 100);
      }

      const handleTabKeyPress = (e) => {
        if (e.key === 'Tab') {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      window.addEventListener('keydown', handleTabKeyPress);
      return () => window.removeEventListener('keydown', handleTabKeyPress);
    }
  }, [showAddModal]);

  const fetchAllInstanceRules = useCallback(async (fetchedInstances) => {
    try {
      const rulesPromises = fetchedInstances.map(async (inst) => {
        try {
          const rulesRes = await API.get('/whatsapp/auto-reply/rules', {
            params: { instanceKey: inst.instanceKey }
          });
          return rulesRes.data.rules || [];
        } catch {
          return [];
        }
      });
      const allRulesArrays = await Promise.all(rulesPromises);
      return allRulesArrays.flat();
    } catch (err) {
      console.error(err);
      return [];
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await instanceService.getInstances();
      const fetchedInstances = res.data.instances || [];
      setInstances(fetchedInstances);
      
      // Auto select first instance if available
      if (fetchedInstances.length > 0) {
        setSelectedInstance(fetchedInstances[0].instanceKey);
      }

      const dbRules = await fetchAllInstanceRules(fetchedInstances);
      setRules(dbRules);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load instances.");
    } finally {
      setLoading(false);
    }
  }, [fetchAllInstanceRules]);

  // Load instances & rules
  useEffect(() => {
    let active = true;
    setTimeout(() => {
      if (active) {
        fetchData();
      }
    }, 0);
    return () => {
      active = false;
    };
  }, [fetchData]);

  // Sync function
  const syncWithBackend = async (instanceKey, instanceRules) => {
    try {
      await API.post('/whatsapp/auto-reply/sync', {
        instanceKey,
        rules: instanceRules
      });
    } catch (err) {
      console.error(`Failed to sync rules for instance ${instanceKey} to server:`, err);
      throw err;
    }
  };

  const handleOpenEditModal = (rule) => {
    setEditingRule(rule);
    setSelectedInstance(rule.instanceKey);
    setKeyword(rule.keyword);
    setMatchType(rule.matchType);
    setReplyText(rule.replyText);
    setShowAddModal(true);
  };

  const handleOpenAddModal = () => {
    setEditingRule(null);
    if (instances.length > 0) {
      setSelectedInstance(instances[0].instanceKey);
    }
    setKeyword('');
    setMatchType('exact');
    setReplyText('');
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInstance || !keyword.trim() || !replyText.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (editingRule) {
      // EDIT MODE
      const updatedRules = rules.map(r => {
        if (r.id === editingRule.id) {
          return {
            ...r,
            instanceKey: selectedInstance,
            keyword: keyword.trim(),
            matchType,
            replyText: replyText.trim()
          };
        }
        return r;
      });

      const loadingToast = toast.loading("Updating auto-reply rule...");
      try {
        await syncWithBackend(selectedInstance, updatedRules.filter(r => r.instanceKey === selectedInstance));
        
        if (editingRule.instanceKey !== selectedInstance) {
          await syncWithBackend(editingRule.instanceKey, updatedRules.filter(r => r.instanceKey === editingRule.instanceKey));
        }

        const dbRules = await fetchAllInstanceRules(instances);
        setRules(dbRules);

        setKeyword('');
        setReplyText('');
        setEditingRule(null);
        setShowAddModal(false);
        toast.success("Auto-reply rule updated successfully!", { id: loadingToast });
      } catch {
        toast.error("Failed to update auto-reply rule.", { id: loadingToast });
      }
    } else {
      // ADD MODE
      const newRule = {
        instanceKey: selectedInstance,
        keyword: keyword.trim(),
        matchType,
        replyText: replyText.trim(),
        isActive: true
      };

      const instanceRules = rules.filter(r => r.instanceKey === selectedInstance);
      const updatedInstRules = [...instanceRules, newRule];

      const loadingToast = toast.loading("Adding auto-reply rule...");
      try {
        await syncWithBackend(selectedInstance, updatedInstRules);
        
        const dbRules = await fetchAllInstanceRules(instances);
        setRules(dbRules);

        setKeyword('');
        setReplyText('');
        setShowAddModal(false);
        toast.success("Auto-reply rule added successfully!", { id: loadingToast });
      } catch {
        toast.error("Failed to add auto-reply rule.", { id: loadingToast });
      }
    }
  };

  const handleDeleteRule = async (ruleId, instanceKey) => {
    const loadingToast = toast.loading("Deleting rule...");
    try {
      const instRules = rules.filter(r => r.instanceKey === instanceKey && r.id !== ruleId);
      await syncWithBackend(instanceKey, instRules);

      const dbRules = await fetchAllInstanceRules(instances);
      setRules(dbRules);
      toast.success("Rule deleted successfully.", { id: loadingToast });
    } catch {
      toast.error("Failed to delete rule.", { id: loadingToast });
    }
  };

  const handleToggleRule = async (ruleId, instanceKey) => {
    const loadingToast = toast.loading("Updating rule status...");
    try {
      const instRules = rules.filter(r => r.instanceKey === instanceKey).map(r => {
        if (r.id === ruleId) {
          return { ...r, isActive: !r.isActive };
        }
        return r;
      });
      await syncWithBackend(instanceKey, instRules);

      const dbRules = await fetchAllInstanceRules(instances);
      setRules(dbRules);
      toast.success("Rule status updated.", { id: loadingToast });
    } catch {
      toast.error("Failed to update rule status.", { id: loadingToast });
    }
  };

  // Filter Logic
  const filteredRules = rules.filter(rule => {
    // Only show rules for instances that still exist
    const instanceExists = instances.some(inst => inst.instanceKey === rule.instanceKey);
    if (!instanceExists) return false;

    if (filterInstance === 'All Instances') return true;
    return rule.instanceKey === filterInstance;
  });

  const getInstanceName = (key) => {
    const inst = instances.find(i => i.instanceKey === key);
    return inst ? inst.name : 'Unknown Instance';
  };

  return (
    <div className="autoreplies-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Auto Replies</h1>
          <p className="page-subtitle">Configure auto-responses to incoming WhatsApp messages based on keyword matches.</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'center' }}>
          <div className="custom-dropdown-container" ref={instanceDropdownRef} style={{ position: 'relative' }}>
            <button 
              type="button"
              className="premium-select"
              onClick={() => setShowInstanceDropdown(!showInstanceDropdown)}
              style={{ height: '42px', padding: '0 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '150px', justifyContent: 'space-between', background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              <span>{filterInstance === 'All Instances' ? 'All Instances' : getInstanceName(filterInstance)}</span>
              <span style={{ fontSize: '10px', opacity: 0.6 }}>▼</span>
            </button>
            {showInstanceDropdown && (
              <div 
                className="premium-dropdown-list animate-slide-down" 
                style={{ 
                  position: 'absolute', 
                  top: '48px', 
                  right: 0, 
                  background: 'var(--card-bg)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '10px', 
                  boxShadow: 'var(--shadow-lg)', 
                  zIndex: 100, 
                  minWidth: '180px', 
                  padding: '6px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '4px' 
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setFilterInstance('All Instances');
                    setShowInstanceDropdown(false);
                  }}
                  className="premium-dropdown-item"
                  style={{
                    background: filterInstance === 'All Instances' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    color: filterInstance === 'All Instances' ? '#10B981' : 'var(--text-main)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: filterInstance === 'All Instances' ? '600' : '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 150ms ease'
                  }}
                >
                  <span>All Instances</span>
                  {filterInstance === 'All Instances' && <span style={{ color: '#10B981', fontSize: '12px' }}>✓</span>}
                </button>
                {instances.map((inst) => (
                  <button
                    key={inst.instanceKey}
                    type="button"
                    onClick={() => {
                      setFilterInstance(inst.instanceKey);
                      setShowInstanceDropdown(false);
                    }}
                    className="premium-dropdown-item"
                    style={{
                      background: filterInstance === inst.instanceKey ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                      color: filterInstance === inst.instanceKey ? '#10B981' : 'var(--text-main)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: filterInstance === inst.instanceKey ? '600' : '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <span>{inst.name}</span>
                    {filterInstance === inst.instanceKey && <span style={{ color: '#10B981', fontSize: '12px' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button 
            className="premium-btn-primary" 
            onClick={handleOpenAddModal}
            style={{ height: '42px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
          >
            <Plus size={18} /> New Rule
          </button>
        </div>
      </div>

      {instances.length === 0 && !loading && (
        <div className="limit-reached-alert animate-slide-down">
          <AlertCircle size={18} />
          <p>You need at least one connected WhatsApp instance to configure auto replies. Go to <strong>Instances</strong> page to create one.</p>
        </div>
      )}

      {loading ? (
        <div className="empty-state">Loading auto-reply rules...</div>
      ) : filteredRules.length === 0 ? (
        <div className="empty-state">
          <Bot size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p>No auto-reply rules configured yet.</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Click "New Rule" above to create your first keyword-based responder.
          </p>
        </div>
      ) : (
        <div className="rules-grid">
          {filteredRules.map((rule) => (
            <div key={rule.id} className="rule-card glass animate-fade-in" data-active={rule.isActive}>
              <div className="card-top">
                <span className="instance-badge">{getInstanceName(rule.instanceKey)}</span>
                <div className="card-actions">
                  <button 
                    className="icon-btn-sm" 
                    onClick={() => handleToggleRule(rule.id, rule.instanceKey)}
                    title={rule.isActive ? "Deactivate" : "Activate"}
                  >
                    {rule.isActive ? (
                      <ToggleRight size={24} className="text-primary" />
                    ) : (
                      <ToggleLeft size={24} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </button>
                  <button 
                    className="icon-btn-sm" 
                    onClick={() => handleOpenEditModal(rule)}
                    title="Edit Rule"
                  >
                    <Edit2 size={16} style={{ color: 'var(--text-muted)' }} />
                  </button>
                  <button 
                    className="icon-btn-sm" 
                    onClick={() => handleDeleteRule(rule.id, rule.instanceKey)}
                    title="Delete Rule"
                  >
                    <Trash2 size={18} className="text-error" />
                  </button>
                </div>
              </div>

              <div className="card-middle">
                <div className="rule-info-row">
                  <span className="info-label">Keyword:</span>
                  <code className="keyword-code">{rule.keyword}</code>
                </div>
                <div className="rule-info-row">
                  <span className="info-label">Match Type:</span>
                  <span className="match-type-badge">{rule.matchType === 'exact' ? 'Exact Match' : 'Contains'}</span>
                </div>
                <div className="rule-message-box">
                  <p className="message-label">Response Text:</p>
                  <p className="message-content">{rule.replyText}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Rule Modal */}
      {showAddModal && createPortal(
        <div 
          className="modal-overlay" 
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="premium-scrollable-modal" ref={modalRef}>
            <div className="form-header-modern">
              <h2 id="modal-title">{editingRule ? 'Edit Auto-Reply Rule' : 'Create Auto-Reply Rule'}</h2>
              <button type="button" className="close-btn" onClick={() => { setShowAddModal(false); setEditingRule(null); }}><X size={26} /></button>
            </div>
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Target Instance</label>
                  <select
                    className="premium-select"
                    style={{ width: '100%', height: '44px', paddingLeft: '14px', borderRadius: '10px' }}
                    value={selectedInstance}
                    onChange={(e) => setSelectedInstance(e.target.value)}
                    required
                  >
                    {instances.map(inst => (
                      <option key={inst.instanceKey} value={inst.instanceKey}>
                        {inst.name} ({inst.liveStatus})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Trigger Keyword</label>
                  <input
                    type="text"
                    className="auth-input"
                    style={{ paddingLeft: '14px', height: '44px', borderRadius: '10px' }}
                    placeholder="e.g. price, hello, help"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Match Type</label>
                  <div className="radio-group" style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-main)', fontSize: '14px', fontWeight: '500' }}>
                      <input 
                        type="radio" 
                        name="matchType" 
                        value="exact" 
                        checked={matchType === 'exact'}
                        onChange={() => setMatchType('exact')}
                        style={{ width: '18px', height: '18px', accentColor: '#10B981', cursor: 'pointer' }}
                      />
                      Exact Match
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-main)', fontSize: '14px', fontWeight: '500' }}>
                      <input 
                        type="radio" 
                        name="matchType" 
                        value="contains" 
                        checked={matchType === 'contains'}
                        onChange={() => setMatchType('contains')}
                        style={{ width: '18px', height: '18px', accentColor: '#10B981', cursor: 'pointer' }}
                      />
                      Contains Keyword
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Response Message</label>
                  <textarea
                    className="auth-input"
                    style={{ paddingLeft: '14px', paddingTop: '12px', height: '120px', borderRadius: '10px', resize: 'vertical' }}
                    placeholder="Enter the automated reply message..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-footer-modern">
                <button type="button" className="premium-btn-outline" onClick={() => { setShowAddModal(false); setEditingRule(null); }} style={{ width: '120px', height: '44px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>Cancel</button>
                <button type="submit" className="premium-btn-primary" style={{ width: '150px', height: '44px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {editingRule ? 'Save Changes' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AutoReplies;
