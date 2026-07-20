
import Packages from '../../components/Packages';
import './Dashboard.css';

const UserPlans = () => {
  return (
    <div className="user-plans-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscription Plans</h1>
          <p className="page-subtitle">Upgrade your account to unlock more instances and higher message limits.</p>
        </div>
      </div>

      <div className="mt-8">
        <Packages showButtons={false} />
      </div>

      <div className="plan-support-card glass mt-12 p-8 text-center">
        <h3>Need a custom plan?</h3>
        <p className="text-muted mt-2">If our standard plans don't fit your needs, contact our sales team for a tailored solution.</p>
        <button className="btn-outline-pill mt-6">Contact Sales</button>
      </div>
    </div>
  );
};

export default UserPlans;
