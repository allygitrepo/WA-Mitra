import { useState, useEffect, useCallback } from 'react';
import { Calendar, Smartphone, Download, AlertCircle } from 'lucide-react';
import { messageService } from '../../api/services';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Reports.css';
import CustomDateInput from '../../components/CustomDateInput';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expandedInstance, setExpandedInstance] = useState(null); // { date, instanceId }

  const fetchReports = useCallback(async () => {
    try {
      const [repRes, logsRes] = await Promise.all([
        messageService.getReports(),
        messageService.getLogs()
      ]);
      setReports(repRes.data.reports || []);
      setLogs(logsRes.data.logs || []);
    } catch (err) {
      console.error("Fetch Reports Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    setTimeout(() => {
      if (active) {
        fetchReports();
      }
    }, 0);
    return () => {
      active = false;
    };
  }, [fetchReports]);

  // Filtered reports based on dates
  const filteredReports = reports.filter(item => {
    if (!fromDate && !toDate) return true;
    const reportDate = new Date(item.date);
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      if (reportDate < from) return false;
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      if (reportDate > to) return false;
    }
    return true;
  });

  // Group by date AND instanceId for rendering
  const groupedReports = filteredReports.reduce((acc, curr) => {
    const date = curr.date;
    const instId = curr.instanceId;
    if (!acc[date]) acc[date] = {};
    if (!acc[date][instId]) {
      acc[date][instId] = {
        instance: curr.instance,
        instanceId: instId,
        date: date,
        sent: 0,
        failed: 0
      };
    }
    if (curr.status === 'sent') acc[date][instId].sent += parseInt(curr.count);
    if (curr.status === 'failed') acc[date][instId].failed += parseInt(curr.count);
    return acc;
  }, {});

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 168, 132); // WhatsApp Green
    doc.text('WA-Mitra Message Report', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 30);
    
    if (fromDate || toDate) {
      doc.text(`Period: ${fromDate || 'Start'} to ${toDate || 'End'}`, 14, 37);
    }

    const tableRows = [];
    Object.keys(groupedReports).forEach(date => {
      Object.values(groupedReports[date]).forEach(stat => {
        tableRows.push([
          new Date(stat.date).toLocaleDateString('en-GB'),
          stat.instance?.name || 'Unknown',
          stat.sent,
          stat.failed
        ]);
      });
    });

    autoTable(doc, {
      startY: 45,
      head: [['Date', 'Instance Name', 'Sent Messages', 'Failed Messages']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [0, 168, 132] },
      margin: { top: 45 }
    });

    // Add Detailed logs table
    const detailedRows = [];
    const dateFilteredLogs = logs.filter(log => {
      if (!fromDate && !toDate) return true;
      const logDate = new Date(log.createdAt);
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (logDate < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (logDate > to) return false;
      }
      return true;
    });

    dateFilteredLogs.forEach(log => {
      detailedRows.push([
        new Date(log.createdAt).toLocaleString('en-GB'),
        log.instance?.name || 'Unknown',
        log.recipient,
        log.status === 'sent' ? 'Sent' : 'Failed',
        log.errorMessage || '-'
      ]);
    });

    if (detailedRows.length > 0) {
      const finalY = doc.lastAutoTable.finalY || 45;
      doc.setFontSize(14);
      doc.setTextColor(0, 168, 132);
      doc.text('Detailed Message Log', 14, finalY + 15);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Date & Time', 'Instance Name', 'Recipient Number', 'Status', 'Failure Reason']],
        body: detailedRows,
        theme: 'grid',
        headStyles: { fillColor: [0, 168, 132] },
        margin: { top: 45 }
      });
    }

    doc.save(`WA-Mitra_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="reports-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Message Reports</h1>
          <p className="page-subtitle">Track your message usage across all instances.</p>
        </div>
        <button className="btn-primary" onClick={downloadPDF} disabled={filteredReports.length === 0}>
          <Download size={18} /> Download PDF
        </button>
      </div>

      {/* Filters */}
      <div className="report-filters glass animate-fade-in">
        <div className="filter-group">
          <CustomDateInput 
            value={fromDate} 
            onChange={setFromDate}
            placeholder="From Date"
            style={{ maxWidth: '180px' }}
          />
          <span className="filter-separator">to</span>
          <CustomDateInput 
            value={toDate} 
            onChange={setToDate}
            placeholder="To Date"
            style={{ maxWidth: '180px' }}
          />
          <button 
            className="text-btn" 
            style={{ marginLeft: 'auto' }}
            onClick={() => { setFromDate(''); setToDate(''); }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="reports-content glass">
        {loading ? (
          <div className="loading-state">Loading reports...</div>
        ) : filteredReports.length === 0 ? (
          <div className="empty-state">No message data found for the selected period.</div>
        ) : (
          Object.keys(groupedReports).map(date => (
            <div key={date} className="report-group">
              <div className="date-header">
                <Calendar size={18} />
                <h3>{new Date(date).toLocaleDateString('en-GB')}</h3>
              </div>
              <div className="instance-stats-grid">
                {Object.values(groupedReports[date]).map((stat, i) => {
                  const isExpanded = expandedInstance?.date === date && expandedInstance?.instanceId === stat.instanceId;
                  const instanceFailures = logs.filter(l => 
                    l.status === 'failed' && 
                    l.instanceId === stat.instanceId && 
                    new Date(l.createdAt).toISOString().split('T')[0] === date
                  );

                  return (
                    <div key={i} className="stat-card-wrap">
                      <div 
                        className={`stat-item glass ${stat.failed > 0 ? 'has-failures' : ''} ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => stat.failed > 0 && setExpandedInstance(isExpanded ? null : { date, instanceId: stat.instanceId })}
                      >
                        <div className="stat-left">
                          <Smartphone size={20} className="text-primary" />
                          <div>
                            <h4>{stat.instance?.name || 'Unknown Instance'}</h4>
                            <p>ID: {stat.instanceId}</p>
                          </div>
                        </div>
                        <div className="stat-right">
                          <div className="stat-count">
                            <span className="count-badge sent">{stat.sent}</span>
                            <span className="count-label">Sent</span>
                          </div>
                          {stat.failed > 0 && (
                            <div className="stat-count">
                              <span className="count-badge failed">{stat.failed}</span>
                              <span className="count-label">Failed</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {isExpanded && instanceFailures.length > 0 && (
                        <div className="failure-details animate-slide-down">
                          <div className="failure-header">
                            <AlertCircle size={14} className="text-error" />
                            <span>Failure Reasons</span>
                          </div>
                          <div className="failure-list">
                            {instanceFailures.map((f, idx) => (
                              <div key={idx} className="failure-row">
                                <span className="fail-num">{f.recipient}</span>
                                <span className="fail-reason">{f.errorMessage || 'Unknown error'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reports;
