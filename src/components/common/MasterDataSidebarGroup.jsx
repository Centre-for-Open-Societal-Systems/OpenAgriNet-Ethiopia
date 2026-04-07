import React from 'react';
import { Sprout, MapPin, UserCircle } from 'lucide-react';
import SidebarNavLink from './SidebarNavLink';

export default function MasterDataSidebarGroup() {
  return (
    <div className="master-data-nav-group">
      <div className="master-data-nav-label">Master Data</div>
      <SidebarNavLink to="/dashboard/crop-master" icon={<Sprout size={18} />} className="nav-sub">
        Crop Master
      </SidebarNavLink>
      <SidebarNavLink to="/dashboard/livestock-master" icon={<UserCircle size={18} />} className="nav-sub">
        Livestock Master
      </SidebarNavLink>
      <SidebarNavLink to="/dashboard/location-master" icon={<MapPin size={18} />} className="nav-sub">
        Location Master
      </SidebarNavLink>
    </div>
  );
}
