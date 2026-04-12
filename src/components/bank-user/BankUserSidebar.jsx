import React from 'react';
import { Briefcase, Users, Activity, FileText } from 'lucide-react';

const BankUserSidebar = () => {
  return (
    <>
      <div className="nav-item">
        <Briefcase size={20} />
        <span>Loan Applications</span>
      </div>
      <div className="nav-item">
        <Users size={20} />
        <span>Borrower Directory</span>
      </div>
      <div className="nav-item">
        <Activity size={20} />
        <span>Risk Assessment</span>
      </div>
      <div className="nav-item">
        <FileText size={20} />
        <span>Repayment Reports</span>
      </div>
    </>
  );
};

export default BankUserSidebar;
