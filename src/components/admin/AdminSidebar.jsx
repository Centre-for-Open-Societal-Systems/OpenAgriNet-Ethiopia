import React from 'react';
import { Users, UserCircle, Sprout, Landmark } from 'lucide-react';

const AdminSidebar = () => {
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
    </>
  );
};

export default AdminSidebar;
