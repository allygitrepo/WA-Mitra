import { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axiosConfig';
import toast from 'react-hot-toast';
import '../Dashboard/Dashboard.css';
import './Admin.css';

const CreateAdmin = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading("Creating administrator...");
    try {
      await API.post('/admin/users/create', { ...formData, role: 'admin' });
      toast.success("Admin created successfully!", { id: loadingToast });
      navigate('/admin/users');
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create admin", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-admin-container animate-fade-in">
      <button className="back-btn mb-6" onClick={() => navigate('/admin/users')}>
        <ArrowLeft size={18} /> Back to Users
      </button>

      <div className="page-header mb-8">
        <div>
          <h1 className="page-title">Create Administrator</h1>
          <p className="page-subtitle text-muted">Add a new colleague with full platform access. Portal Admins can manage everything.</p>
        </div>
      </div>

      <div className="create-admin-card glass mx-auto max-w-lg p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="form-group-modern">
            <label>Full Name</label>
            <div className="input-with-icon">
              <User size={18} className="icon" />
              <input 
                type="text" 
                placeholder="Enter admin name"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group-modern">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="icon" />
              <input 
                type="email" 
                placeholder="admin@wamitra.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group-modern">
            <label>Login Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="icon" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
              <button 
                type="button" 
                className="eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-create-admin mt-4" disabled={loading}>
            {loading ? "Creating..." : (
              <>
                <ShieldCheck size={20} />
                <span>Create Administrator</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAdmin;
