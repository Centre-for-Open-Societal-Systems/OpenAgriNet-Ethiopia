import React from 'react';
import { Users, UserCircle, Sprout, Landmark, Database, ChevronDown, Shield, Server, Settings } from 'lucide-react';

const SuperUserSidebar = () => {
  return (
    <>
      <div className="nav-item">
        <Users size={20} />
        <span>Farmer Registry</span>
      </div>
      <div className="nav-item">
        <UserCircle size={20} />
        <span>Livestock Registry</span>
      </div>
      <div className="nav-item">
        <Sprout size={20} />
        <span>Crop Registry</span>
      </div>
      <div className="nav-item">
        <Landmark size={20} />
        <span>Finance Portal</span>
      </div>
      <div className="nav-space"></div>
      <div className="nav-item">
        <Database size={20} />
        <span>Data Integration Hub</span>
        <ChevronDown size={16} className="ml-auto" />
      </div>
      <div className="nav-item">
        <Shield size={20} />
        <span>Administration</span>
        <ChevronDown size={16} className="ml-auto" />
      </div>
      <div className="nav-item">
        <Server size={20} />
        <span>System Health & Logs</span>
      </div>
      <div className="nav-item">
        <Settings size={20} />
        <span>Tenant Management</span>
      </div>
    </>
  );
};

export default SuperUserSidebar;
