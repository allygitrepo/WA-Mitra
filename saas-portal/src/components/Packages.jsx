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
            const isPopular = packages.length >= 4 ? index === 2 : index === 1;
            const numPrice = Number(pkg.price) || 0;
            const formattedPrice = numPrice === 0 ? '0' : numPrice.toLocaleString('en-IN');

            return (
              <div 
                key={pkg.id} 
                className={`package-card animate-fade-in delay-${index} ${isPopular ? 'popular-card' : ''} ${isActive ? 'active-pkg' : ''} ${isNextScheduled ? 'scheduled-pkg' : ''}`}
              >
                {isPopular && !isActive && <div className="popular-badge">⭐ MOST POPULAR</div>}
                {isActive && <div className="active-badge">Active Plan</div>}
                {isNextScheduled && !isActive && <div className="active-badge scheduled-badge">Scheduled Next</div>}
                
                <div className="package-header">
                  <div className="pkg-icon-circle">
                    {pkg.instanceLimit > 10 ? <Layers size={24} /> : pkg.instanceLimit > 1 ? <Zap size={24} /> : <Smartphone size={24} />}
                  </div>
                  <h3 className="package-name">{pkg.name}</h3>
                  <div className="package-price-wrap">
                    <div className="package-price">
                      <span className="currency">₹</span>
                      <span className="amount">{formattedPrice}</span>
                      <span className="period">{pkg.duration === -1 ? '/ lifetime' : `/ ${pkg.duration} Days`}</span>
                    </div>
                    <span className="billing-subtext">{pkg.duration === -1 ? 'One-time billing' : 'Billed per month'}</span>
                  </div>
                </div>

                <div className="price-divider"></div>

                <div className="package-features">
                  <div className="feature-item">
                    <div className="feature-check-box">
                      <Check size={12} />
                    </div>
                    <span><strong>{pkg.instanceLimit === -1 ? 'Unlimited' : pkg.instanceLimit}</strong> WhatsApp Instance{pkg.instanceLimit !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="feature-item">
                    <div className="feature-check-box">
                      <Check size={12} />
                    </div>
                    <span>Unlimited Contacts</span>
                  </div>
                  <div className="feature-item">
                    <div className="feature-check-box">
                      <Check size={12} />
                    </div>
                    <span>Bulk Messaging ({pkg.messageLimit === -1 ? 'Unlimited' : pkg.messageLimit.toLocaleString('en-IN')} Msg)</span>
                  </div>
                  <div className="feature-item">
                    <div className="feature-check-box">
                      <Check size={12} />
                    </div>
                    <span>Campaign Management</span>
                  </div>
                  <div className="feature-item">
                    <div className="feature-check-box">
                      <Check size={12} />
                    </div>
                    <span>API Access & Integrations</span>
                  </div>
                  <div className="feature-item">
                    <div className={`feature-check-box ${!pkg.canSendMedia ? 'disabled' : ''}`}>
                      {pkg.canSendMedia ? <Check size={12} /> : <span style={{ fontSize: '11px', fontWeight: 'bold' }}>✕</span>}
                    </div>
                    <span className={!pkg.canSendMedia ? 'text-muted' : ''}>Media Support (Images, PDFs)</span>
                  </div>
                  <div className="feature-item">
                    <div className="feature-check-box">
                      <Check size={12} />
                    </div>
                    <span>Analytics Reports & Logs</span>
                  </div>
                  <div className="feature-item">
                    <div className="feature-check-box">
                      <Check size={12} />
                    </div>
                    <span>Instant Webhooks</span>
                  </div>
                </div>

                {showButtons && (
                  <button
                    className={`pkg-choose-btn ${isActive ? 'btn-active' : isNextScheduled ? 'btn-scheduled' : 'btn-emerald-gradient'} ${processingId === pkg.id ? 'loading' : ''}`}
                    onClick={() => handleActivate(pkg)}
                    disabled={processingId === pkg.id || isNextScheduled || isAlreadyPurchased}
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
                      Number(pkg.price) === 0 ? 'Activate Free' : 'Choose Plan'
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
              <h3>Need something larger?</h3>
              <p>Enterprise solutions built for growing businesses.</p>
            </div>
            <button 
              type="button" 
              className="contact-sales-pill-btn" 
              onClick={() => window.open(`https://wa.me/919023960106?text=${encodeURIComponent('Hello! I am interested in an enterprise plan for WA-Mitra.')}`, '_blank')} 
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
