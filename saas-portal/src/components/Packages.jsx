import { useState, useEffect } from 'react';
import { Check, Zap, Smartphone, Layers, Loader2, MessageSquare } from 'lucide-react';
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchPackages();
      if (user) await fetchAvailability();
      setLoading(false);
    };
    loadData();
  }, [user]);

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
        updateUser({ packageId: res.data.packageId, nextPackageId: res.data.nextPackageId, expiresAt: res.data.expiresAt });
        toast.success(res.data.message || "Package processed successfully!", { id: loadingToast });
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
            updateUser({ packageId: verifyRes.data.packageId, nextPackageId: verifyRes.data.nextPackageId, expiresAt: verifyRes.data.expiresAt });
            toast.success(verifyRes.data.message || "Payment verified and package processed successfully!", { id: verificationToast });
            navigate('/dashboard');
          } catch {
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
          {packages.map((pkg, index) => {
            const isActive = user?.packageId === pkg.id;
            const isNextScheduled = user?.nextPackageId === pkg.id;
            const isAlreadyPurchased = pkg.isOneTime && purchasedIds.includes(pkg.id);
            const numPrice = Number(pkg.price) || 0;
            const formattedPrice = numPrice === 0 ? '0' : numPrice.toLocaleString('en-IN');

            return (
              <div key={pkg.id} className={`package-card glass animate-fade-in delay-${index} ${isActive ? 'active-pkg' : ''} ${isNextScheduled ? 'scheduled-pkg' : ''}`}>
                {isActive && <div className="active-badge">Active Plan</div>}
                {isNextScheduled && <div className="active-badge" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>Scheduled Next</div>}
                <div className="package-header">
                  <div className="pkg-icon">
                    {pkg.instanceLimit > 10 ? <Layers size={24} /> : pkg.instanceLimit > 1 ? <Zap size={24} /> : <Smartphone size={24} />}
                  </div>
                  <h3 className="package-name">{pkg.name}</h3>
                  <div className="package-price">
                    <span className="currency">₹</span>
                    <span className="amount">{formattedPrice}</span>
                    <span className="period">{pkg.duration === -1 ? '/ Lifetime' : `/ ${pkg.duration} Days`}</span>
                  </div>
                </div>

                <div className="package-features">
                  <div className="feature-item">
                    <div className="feature-icon-box">
                      <Check size={13} />
                    </div>
                    <span><strong>{pkg.instanceLimit === -1 ? 'Unlimited' : pkg.instanceLimit}</strong> WhatsApp Instance{pkg.instanceLimit !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon-box">
                      <Check size={13} />
                    </div>
                    <span><strong>{pkg.messageLimit === -1 ? 'Unlimited' : pkg.messageLimit.toLocaleString('en-IN')}</strong> Total Messages</span>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon-box">
                      <Check size={13} />
                    </div>
                    <span><strong>{pkg.dailyMessageLimit === -1 ? 'Unlimited' : pkg.dailyMessageLimit.toLocaleString('en-IN')}</strong> Daily Messages</span>
                  </div>
                  <div className="feature-item">
                    <div className={`feature-icon-box ${!pkg.canSendMedia ? 'disabled' : ''}`}>
                      {pkg.canSendMedia ? <Check size={13} /> : <span style={{ fontSize: '12px', fontWeight: 'bold' }}>✕</span>}
                    </div>
                    <span className={!pkg.canSendMedia ? 'text-muted' : ''}>Media Files (Images, Documents)</span>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon-box">
                      <Check size={13} />
                    </div>
                    <span>API Access & Webhooks</span>
                  </div>
                </div>

                {showButtons && (
                  <button
                    className={`pkg-btn ${isActive ? 'btn-active' : isNextScheduled ? 'btn-scheduled' : 'premium-btn-primary'} ${processingId === pkg.id ? 'loading' : ''}`}
                    onClick={() => handleActivate(pkg)}
                    disabled={processingId === pkg.id || isNextScheduled || isAlreadyPurchased}
                    style={{
                      marginTop: '24px',
                      width: '100%',
                      height: '44px',
                      borderRadius: '10px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: (isNextScheduled || isAlreadyPurchased) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {processingId === pkg.id ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : isActive ? (
                      <>
                        <Zap size={16} /> Renew Plan
                      </>
                    ) : isNextScheduled ? (
                      <>
                        <Check size={16} /> Scheduled Next
                      </>
                    ) : isAlreadyPurchased ? (
                      'Already Purchased'
                    ) : (
                      Number(pkg.price) === 0 ? 'Activate Free' : 'Upgrade Plan'
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="plan-support-card-container">
          <div className="plan-support-card-modern">
            <div>
              <h3>Need a custom enterprise plan?</h3>
              <p>If our standard plans don't fit your scale, contact our team for a custom tailored solution.</p>
            </div>
            <button 
              type="button" 
              className="premium-btn-primary" 
              onClick={() => window.open(`https://wa.me/919023960106?text=${encodeURIComponent('Hello! I am interested in a custom enterprise plan for WA-Mitra.')}`, '_blank')} 
              style={{ height: '42px', padding: '0 24px', whiteSpace: 'nowrap', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <MessageSquare size={16} /> Contact Sales
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Packages;
