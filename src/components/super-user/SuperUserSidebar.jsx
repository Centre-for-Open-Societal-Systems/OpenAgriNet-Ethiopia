import React from 'react';
import {
  Users,
  UserCircle,
  Sprout,
  Landmark,
  Database,
  ChevronDown,
  Shield,
  Server,
  Settings,
  MapPin,
  Mountain,
  LeafyGreen,
  BookMarked,
} from 'lucide-react';
import SidebarNavLink from '../common/SidebarNavLink';

const SuperUserSidebar = () => {
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
      <div className="nav-space"></div>
      <SidebarNavLink
        to="/dashboard/data-integration-hub"
        icon={<Database size={20} />}
        trailing={<ChevronDown size={16} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
      >
        Data Integration Hub
      </SidebarNavLink>
      <SidebarNavLink to="/dashboard/catalogs" icon={<BookMarked size={20} />}>
        Catalogs
      </SidebarNavLink>
      <SidebarNavLink
        to="/dashboard/administration"
        icon={<Shield size={20} />}
        trailing={<ChevronDown size={16} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
      >
        Administration
      </SidebarNavLink>
      <SidebarNavLink to="/dashboard/system-health" icon={<Server size={20} />}>
        System Health & Logs
      </SidebarNavLink>
      <SidebarNavLink to="/dashboard/tenant-management" icon={<Settings size={20} />}>
        Tenant Management
      </SidebarNavLink>
    </>
  );
};

export default SuperUserSidebar;
