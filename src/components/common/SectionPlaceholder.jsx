import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, LayoutDashboard } from 'lucide-react';
import './SectionPlaceholder.css';

export default function SectionPlaceholder({
  title,
  description,
  overviewPath = '/dashboard/overview',
  breadcrumbs = [],
}) {
  return (
    <div className="content-area section-placeholder-wrap">
      <div className="section-placeholder-breadcrumb">
        <Link to={overviewPath} className="section-placeholder-crumb">
          <LayoutDashboard size={16} />
          Dashboard
        </Link>
        {breadcrumbs.map((label, i) => (
          <React.Fragment key={i}>
            <ChevronRight size={16} className="section-placeholder-sep" />
            <span className="section-placeholder-crumb muted">{label}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="section-placeholder-card">
        <h1 className="section-placeholder-title">{title}</h1>
        <p className="section-placeholder-desc">
          {description ||
            'This area is wired for navigation. Connect APIs and modules here as they are implemented.'}
        </p>
        <Link to={overviewPath} className="section-placeholder-back">
          ← Back to overview
        </Link>
      </div>
    </div>
  );
}
