import React, { useState, useEffect } from 'react';
import { Check, Zap, Smartphone, MessageSquare, Shield, Layers, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosConfig';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import './Packages.css';

const Packages = ({ hideHeader = false, showButtons = true }) => {
  const [packages, setPackages] = useState([]);
  const [purchasedIds, setPurchasedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchPackages();
      if (user) await fetchAvailability();
      setLoading(false);
    };
    loadData();
  }, [user]);

  const fetchPackages = async () => {
    try {
      const res = await API.get('/plans/all');
      setPackages(res.data.packages || []);
    } catch (err) {
      console.error("Fetch Packages Error:", err);
    }
  };

  const fetchAvailability = async () => {
    try {
      const res = await API.get('/plans/availability');
      setPurchasedIds(res.data.purchasedPackageIds || []);
    } catch (err) {
      console.error("Fetch Availability Error:", err);
    }
  };

  const handleActivate = async (pkg) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadingToast = toast.loading(`Initiating order for ${pkg.name}...`);
    try {
      setProcessingId(pkg.id);
      const res = await API.post('/payments/create-order', { packageId: pkg.id });

      if (res.data.isFree) {
        updateUser({ packageId: res.data.packageId });
        toast.success("Free package activated successfully!", { id: loadingToast });
        navigate('/dashboard');
        return;
      }

      // Handle Razorpay
      const options = {
        key: res.data.key,
        amount: res.data.amount,
        currency: res.data.currency,
        name: "WA-Mitra",
        description: `Activation of ${pkg.name} plan`,
        order_id: res.data.orderId,
        handler: async (response) => {
          const verificationToast = toast.loading("Verifying payment transaction...");
          try {
            const verifyRes = await API.post('/payments/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentRecordId: res.data.paymentRecordId
            });
            updateUser({ packageId: verifyRes.data.packageId });
            toast.success("Payment successful! Your package is now active.", { id: verificationToast });
            navigate('/dashboard');
          } catch (err) {
            toast.error("Payment verification failed. Please contact support.", { id: verificationToast });
          }
        },
        prefill: {
          name: user.username,
          email: user.email,
        },
        theme: {
          color: "#00a884",
        },
      };

      toast.dismiss(loadingToast);
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate activation", { id: loadingToast });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return (
    <div className="packages-loading">
      <div className="loader-spinner"></div>
      <p>Loading the best plans for you...</p>
    </div>
  );

  if (packages.length === 0) return null;

  const getGridClass = () => {
    const count = packages.length;
    if (count <= 5) return `grid-row-${count}`;
    return 'grid-multi';
  };

  return (
    <section className="pricing-section" id="pricing">
      <div className="container">
        {!hideHeader && (
          <div className="section-head text-center mb-12">
            <h2 className="section-title">Flexible Pricing Plans</h2>
            <p className="section-subtitle">Choose the perfect plan for your business scale. No hidden fees.</p>
          </div>
        )}

        <div className={`packages-grid ${getGridClass()}`}>
          {packages.map((pkg, index) => (
            <div key={pkg.id} className={`package-card glass animate-fade-in delay-${index} ${user?.packageId === pkg.id ? 'active-pkg' : ''}`}>
              {user?.packageId === pkg.id && <div className="active-badge">Active Plan</div>}
              <div className="package-header">
                <div className="pkg-icon">
                  {pkg.instanceLimit > 10 ? <Layers size={24} /> : pkg.instanceLimit > 1 ? <Zap size={24} /> : <Smartphone size={24} />}
                </div>
                <h3 className="package-name">{pkg.name}</h3>
                <div className="package-price">
                  <span className="currency">₹</span>
                  <span className="amount">{pkg.price}</span>
                  <span className="period">{pkg.duration === -1 ? '/ Lifetime' : `/ ${pkg.duration} Days`}</span>
                </div>
              </div>

              <div className="package-features">
                <div className="feature-item">
                  <Check size={18} className="text-success" />
                  <span>{pkg.instanceLimit === -1 ? 'Unlimited' : pkg.instanceLimit} WhatsApp Instances</span>
                </div>
                <div className="feature-item">
                  <Check size={18} className="text-success" />
                  <span>{pkg.messageLimit === -1 ? 'Unlimited' : pkg.messageLimit.toLocaleString()} Total Messages</span>
                </div>
                <div className="feature-item">
                  <Check size={18} className="text-success" />
                  <span>{pkg.dailyMessageLimit === -1 ? 'Unlimited' : pkg.dailyMessageLimit} Daily Messages</span>
                </div>
                <div className="feature-item">
                  {pkg.canSendMedia ? (
                    <Check size={18} className="text-success" />
                  ) : (
                    <span className="no-check">×</span>
                  )}
                  <span className={!pkg.canSendMedia ? 'text-muted' : ''}>Media Files (Images, PDF)</span>
                </div>
                <div className="feature-item">
                  <Check size={18} className="text-success" />
                  <span>API Access & Webhooks</span>
                </div>
              </div>

              {showButtons && (
                <button
                  className={`pkg-btn ${index === 1 ? 'btn-primary' : 'btn-outline'} ${processingId === pkg.id ? 'loading' : ''}`}
                  onClick={() => handleActivate(pkg)}
                  disabled={processingId === pkg.id || user?.packageId === pkg.id || (pkg.isOneTime && purchasedIds.includes(pkg.id))}
                >
                  {processingId === pkg.id ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : user?.packageId === pkg.id ? (
                    'Active'
                  ) : (pkg.isOneTime && purchasedIds.includes(pkg.id)) ? (
                    'Already Used'
                  ) : (
                    pkg.price === 0 ? 'Activate Free' : 'Get Started'
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Packages;
