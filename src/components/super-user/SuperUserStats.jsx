import React from 'react';
import { Users, Server, MapPin, Activity, Bird, Database, Sprout, Shield, TrendingUp, TrendingDown, Globe, Tag, Calendar } from 'lucide-react';

const SuperUserStats = ({ dateFilter = 'Today', dataVersion = 0 }) => {
  const getGrowthPercentage = (baseValue, index) => {
    const basePercentages = [0.01, 0, 2.5, 1.2];
    let adjustment = 0;
    switch (dateFilter) {
      case 'Today': adjustment = Math.sin(dataVersion * 0.3) * 0.5; break;
      case 'Yesterday': adjustment = -0.1; break;
      case 'This Week': adjustment = Math.cos(dataVersion * 0.2) * 0.3; break;
      case 'This Month': adjustment = 0.05; break;
      case 'This Quarter': adjustment = 0.15; break;
      default: adjustment = 0;
    }
    const percentage = basePercentages[index] + adjustment;
    return {
      value: percentage,
      formatted: `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`,
      isPositive: percentage > 0,
      isNegative: percentage < 0,
      displayText: index === 1 ? 'Optimal Load' :
        index === 2 ? 'Growing' :
          index === 3 ? 'All healthy' :
            `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`
    };
  };

  const getGrowthIcon = (growth, index) => {
    if (index === 0) return <Server size={14} />;
    if (index === 1) return <Activity size={14} />;
    if (index === 2) return <Database size={14} />;
    if (index === 3) return <Shield size={14} />;
    return growth.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />;
  };

  const getGrowthColorClass = (growth, index) => {
    if (index === 1 || index === 3) return 'growth-positive';
    if (growth.isPositive) return 'growth-positive';
    if (growth.isNegative) return 'growth-negative';
    return 'growth-neutral';
  };

  const StatCard = ({ icon: Icon, colorClass, value, label, subtext, growth, footerIcon: FooterIcon, index }) => (
    <div className="stat-card">
      <div className={`stat-left`}>
        <div className={`stat-icon-container ${colorClass}-bg`}>
          <Icon size={36} className={`${colorClass}-text`} />
        </div>
      </div>
      <div className="stat-right">
        <div className="stat-growth-above">
          <div className={`stat-pill ${getGrowthColorClass(growth, index)}`}>
            {getGrowthIcon(growth, index)}
            <span>{growth.displayText}</span>
          </div>
        </div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        <div className="stat-divider"></div>
        <div className="stat-footer">
          <FooterIcon size={12} className="footer-icon" />
          <span>{subtext}</span>
        </div>
      </div>
    </div>
  );

  const growthData = [
    getGrowthPercentage(0.01, 0),
    getGrowthPercentage(0, 1),
    getGrowthPercentage(2.5, 2),
    getGrowthPercentage(1.2, 3)
  ];

  return (
    <>
      <StatCard
        icon={Users} colorClass="green" value="99.98%"
        label="API Uptime" subtext="System availability"
        growth={growthData[0]} footerIcon={Globe} index={0}
      />
      <StatCard
        icon={MapPin} colorClass="yellow" value="4,500"
        label="Requests / Min" subtext="Traffic load"
        growth={growthData[1]} footerIcon={Tag} index={1}
      />
      <StatCard
        icon={Bird} colorClass="red" value="1.4 TB"
        label="Database Storage" subtext="Resource usage"
        growth={growthData[2]} footerIcon={Calendar} index={2}
      />
      <StatCard
        icon={Sprout} colorClass="orange" value="24"
        label="Active Tenants" subtext="Platform partners"
        growth={growthData[3]} footerIcon={Shield} index={3}
      />
    </>
  );
};

export default SuperUserStats;
