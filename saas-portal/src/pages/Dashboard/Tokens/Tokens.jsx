import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { tokenService } from '../../../api/services';
import './Tokens.css';

const Tokens = () => {
  const { searchQuery } = useOutletContext();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const res = await tokenService.getTokens();
      setTokens(res.data.tokens || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await tokenService.createToken();
      fetchTokens();
    } catch (err) {
      alert("Failed to generate token");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deleting this token will break any apps using it. Continue?")) return;
    try {
      await tokenService.deleteToken(id);
      fetchTokens();
    } catch (err) {
      alert("Failed to delete token");
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
                <code className="token-value">{token.token}</code>
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
    </div>
  );
};

export default Tokens;
