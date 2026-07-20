import { useState, useEffect, useCallback } from 'react';
import { Key, Plus, Trash2, Copy, CheckCircle2, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { tokenService } from '../../../api/services';
import toast from 'react-hot-toast';
import CustomModal from '../../../components/CustomModal';
import './Tokens.css';

const Tokens = () => {
  const { searchQuery } = useOutletContext();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [visibleTokens, setVisibleTokens] = useState({});
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const fetchTokens = useCallback(async () => {
    try {
      const res = await tokenService.getTokens();
      setTokens(res.data.tokens || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    setTimeout(() => {
      if (active) {
        fetchTokens();
      }
    }, 0);
    return () => {
      active = false;
    };
  }, [fetchTokens]);

  const handleCreate = async () => {
    const loadingToast = toast.loading("Generating token...");
    try {
      await tokenService.createToken();
      fetchTokens();
      toast.success("Token generated successfully!", { id: loadingToast });
    } catch {
      toast.error("Failed to generate token", { id: loadingToast });
    }
  };

  const executeDelete = async (id) => {
    const loadingToast = toast.loading("Revoking token...");
    try {
      await tokenService.deleteToken(id);
      fetchTokens();
      toast.success("Token revoked successfully!", { id: loadingToast });
    } catch {
      toast.error("Failed to delete token", { id: loadingToast });
    }
  };

  const handleDelete = (id) => {
    setModalConfig({
      isOpen: true,
      title: 'Revoke API Token?',
      message: 'Deleting this token will instantly break any applications or API integrations using it. This action cannot be undone. Continue?',
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        executeDelete(id);
      },
      onCancel: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleVisibility = (id) => {
    setVisibleTokens(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredTokens = tokens.filter(t => 
    (t.token?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="tokens-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Master API Tokens</h1>
          <p className="page-subtitle">Manage tokens for external integration with your custom apps.</p>
        </div>
        {!loading && tokens.length === 0 && (
          <button className="btn-primary" onClick={handleCreate}>
            <Plus size={18} /> Generate New Token
          </button>
        )}
      </div>

      <div className="token-info-banner glass">
        <ShieldAlert size={24} className="text-error" />
        <div>
          <h4>Security Warning</h4>
          <p>Treat your API tokens like passwords. Never share them or commit them to public repositories.</p>
        </div>
      </div>

      <div className="tokens-list">
        {filteredTokens.length === 0 && !loading && (
          <div className="empty-state glass">
            <p>{searchQuery ? "No matching tokens found." : "No tokens found. Generate one to start using the External API."}</p>
          </div>
        )}
        
        {filteredTokens.map((token) => (
          <div key={token.id} className="token-card glass">
            <div className="token-meta">
              <Key size={20} className="text-muted" />
              <div className="token-details">
                <span className="token-label">Master API Token</span>
                <div className="token-value-container">
                  <code className="token-value">
                    {visibleTokens[token.id] ? token.token : '••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                  </code>
                  <button 
                    type="button"
                    className="btn-toggle-visibility"
                    onClick={() => toggleVisibility(token.id)}
                    title={visibleTokens[token.id] ? "Hide Token" : "Show Token"}
                  >
                    {visibleTokens[token.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="token-actions">
              <button 
                className="btn-icon-text" 
                onClick={() => copyToClipboard(token.token, token.id)}
              >
                {copiedId === token.id ? (
                  <><CheckCircle2 size={18} className="text-success" /> Copied</>
                ) : (
                  <><Copy size={18} /> Copy</>
                )}
              </button>
              <button className="btn-icon-text text-error" onClick={() => handleDelete(token.id)}>
                <Trash2 size={18} /> Revoke
              </button>
            </div>
          </div>
        ))}
      </div>
      <CustomModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
        okText="Yes, Revoke"
        cancelText="Keep Token"
      />
    </div>
  );
};

export default Tokens;
