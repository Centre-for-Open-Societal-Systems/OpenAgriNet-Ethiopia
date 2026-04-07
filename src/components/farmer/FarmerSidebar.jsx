import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, UserCircle, Sprout, Landmark } from 'lucide-react';

const FarmerSidebar = () => {
  return (
    <>
      <NavLink to="/farmer-registry" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Users size={20} />
        <span>Farmer Registry</span>
      </NavLink>
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

export default FarmerSidebar;
