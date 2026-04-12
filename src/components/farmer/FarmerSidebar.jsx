import React from 'react';
import { Users, UserCircle, Sprout, Landmark } from 'lucide-react';
import SidebarNavLink from '../common/SidebarNavLink';

const FarmerSidebar = () => {
  return (
    <>
      <SidebarNavLink to="/dashboard/farmer-registry" icon={<Users size={20} />}>
        Farmer Registry
      </SidebarNavLink>
      <SidebarNavLink to="/dashboard/livestock-registry" icon={<UserCircle size={20} />}>
        Livestock Registry
      </SidebarNavLink>
      <SidebarNavLink to="/dashboard/crop-registry" icon={<Sprout size={20} />}>
        Crop Registry
      </SidebarNavLink>
      <SidebarNavLink to="/dashboard/finance-portal" icon={<Landmark size={20} />}>
        Finance Portal
      </SidebarNavLink>
    </>
  );
};

export default FarmerSidebar;
