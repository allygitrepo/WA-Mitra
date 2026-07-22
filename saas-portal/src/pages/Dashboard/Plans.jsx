import Packages from '../../components/Packages';
import './Dashboard.css';

const UserPlans = () => {
  return (
    <div className="user-plans-wrapper animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscription Plans</h1>
          <p className="page-subtitle">Upgrade your account to unlock more instances and higher message limits.</p>
        </div>
      </div>

      <div className="mt-8">
        <Packages showButtons={true} hideHeader={true} />
      </div>
    </div>
  );
};

export default UserPlans;
