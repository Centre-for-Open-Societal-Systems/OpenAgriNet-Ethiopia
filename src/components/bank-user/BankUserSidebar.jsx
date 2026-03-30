import React from 'react';
import { Briefcase, Users, Activity, FileText } from 'lucide-react';
import SidebarNavLink from '../common/SidebarNavLink';

const BankUserSidebar = () => {
  return (
    <>
      <SidebarNavLink to="/dashboard/loan-applications" icon={<Briefcase size={20} />}>
        Loan Applications
      </SidebarNavLink>
      <SidebarNavLink to="/dashboard/borrower-directory" icon={<Users size={20} />}>
        Borrower Directory
      </SidebarNavLink>
      <SidebarNavLink to="/dashboard/risk-assessment" icon={<Activity size={20} />}>
        Risk Assessment
      </SidebarNavLink>
      <SidebarNavLink to="/dashboard/repayment-reports" icon={<FileText size={20} />}>
        Repayment Reports
      </SidebarNavLink>
    </>
  );
};

export default BankUserSidebar;
