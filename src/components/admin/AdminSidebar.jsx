import React from 'react';
import { Users, UserCircle, Sprout, Landmark, MapPin, Mountain, LeafyGreen } from 'lucide-react';
import SidebarNavLink from '../common/SidebarNavLink';
import MasterDataSidebarGroup from '../common/MasterDataSidebarGroup';

const AdminSidebar = () => {
  return (
    <>
      <SidebarNavLink to="/dashboard/farmer-registry" icon={<Users size={20} />}>
        Farmer Registry
      </SidebarNavLink>
      <SidebarNavLink to="/dashboard/land-registry" icon={<MapPin size={20} />}>
        Land Registry
      </SidebarNavLink>
      <SidebarNavLink to="/dashboard/livestock-registry" icon={<UserCircle size={20} />}>
        Livestock Registry
      </SidebarNavLink>
      <SidebarNavLink to="/dashboard/crop-registry" icon={<Sprout size={20} />}>
        Crop Registry
      </SidebarNavLink>
      <SidebarNavLink to="/dashboard/soil-registry" icon={<Mountain size={20} />}>
        Soil Registry
      </SidebarNavLink>
      <SidebarNavLink to="/dashboard/seed-registry" icon={<LeafyGreen size={20} />}>
        Seed Registry
      </SidebarNavLink>
      <SidebarNavLink to="/dashboard/finance-portal" icon={<Landmark size={20} />}>
        Finance Portal
      </SidebarNavLink>
      <MasterDataSidebarGroup />
    </>
  );
};

export default AdminSidebar;
