import { useState, useEffect, useCallback } from 'react';
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
  const [editingRule, setEditingRule] = useState(null);

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
        <div className="header-actions">
          <select 
            className="filter-select" 
            value={filterInstance} 
            onChange={(e) => setFilterInstance(e.target.value)}
          >
            <option>All Instances</option>
            {instances.map(inst => (
              <option key={inst.instanceKey} value={inst.instanceKey}>{inst.name}</option>
            ))}
          </select>
          <button 
            className="btn-primary" 
            onClick={() => {
              handleOpenAddModal();
            }}
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
      {showAddModal && (
        <div className="modal-overlay">
          <form className="modal-content glass animate-fade-in" onSubmit={handleFormSubmit}>
            <div className="modal-header">
              <h3>{editingRule ? 'Edit Auto-Reply Rule' : 'Create Auto-Reply Rule'}</h3>
              <button type="button" className="close-btn" onClick={() => { setShowAddModal(false); setEditingRule(null); }}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Target Instance</label>
                <select
                  className="auth-input"
                  style={{ paddingLeft: '14px' }}
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

              <div className="form-group">
                <label>Trigger Keyword</label>
                <input
                  type="text"
                  className="auth-input"
                  style={{ paddingLeft: '14px' }}
                  placeholder="e.g. price, hello, help"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Match Type</label>
                <div className="radio-group" style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <input 
                      type="radio" 
                      name="matchType" 
                      value="exact" 
                      checked={matchType === 'exact'}
                      onChange={() => setMatchType('exact')}
                    />
                    Exact Match
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <input 
                      type="radio" 
                      name="matchType" 
                      value="contains" 
                      checked={matchType === 'contains'}
                      onChange={() => setMatchType('contains')}
                    />
                    Contains Keyword
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Response Message</label>
                <textarea
                  className="auth-input"
                  style={{ paddingLeft: '14px', paddingTop: '10px', height: '120px', resize: 'vertical' }}
                  placeholder="Enter the automated reply message..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => { setShowAddModal(false); setEditingRule(null); }}>Cancel</button>
              <button type="submit" className="btn-primary">
                {editingRule ? 'Save Changes' : 'Create Rule'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AutoReplies;
