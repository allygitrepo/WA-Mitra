import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Send, 
  MessageSquare, 
  Settings, 
  Smartphone,
  LogOut,
  ChevronRight
} from 'lucide-react';
import Overview from './dashboard/Overview';
import SendMessage from './dashboard/SendMessage';
import BulkMessage from './dashboard/BulkMessage';
import Navbar from '../components/Navbar';
import './Dashboard.css';

const Dashboard = () => {
  const location = useLocation();
  
  const menuItems = [
    { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Send Message', path: '/dashboard/send', icon: <Send size={20} /> },
    { name: 'Bulk Messages', path: '/dashboard/bulk', icon: <MessageSquare size={20} /> },
  ];

  return (
    <div className="dashboard-layout">
      <Navbar />
      
      <div className="dashboard-content container">
        <aside className="sidebar glass">
          <div className="sidebar-menu">
            {menuItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.name}</span>
                {location.pathname === item.path && <ChevronRight size={16} className="active-arrow" />}
              </Link>
            ))}
          </div>
        </aside>

        <main className="dashboard-main">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="send" element={<SendMessage />} />
            <Route path="bulk" element={<BulkMessage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
