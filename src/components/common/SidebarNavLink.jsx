import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * Sidebar row that highlights when its route is active.
 * `end` — use on the home/overview link so child paths don’t keep it active.
 */
export default function SidebarNavLink({ to, end, icon, children, className = '', trailing = null }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `nav-item${isActive ? ' active' : ''}${className ? ` ${className}` : ''}`
      }
    >
      {icon}
      <span>{children}</span>
      {trailing}
    </NavLink>
  );
}
