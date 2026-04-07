import React from 'react';
import { Briefcase, TrendingUp, TrendingDown, Users, Activity, Shield, Globe, Tag, Calendar } from 'lucide-react';

const BankUserStats = ({ dateFilter = 'Today', dataVersion = 0 }) => {
  const getGrowthPercentage = (baseValue, index) => {
    const basePercentages = [5.2, -1.8, 0.5, 3.7];
    let adjustment = 0;
    switch (dateFilter) {
      case 'Today': adjustment = Math.sin(dataVersion * 0.4) * 1.5; break;
      case 'Yesterday': adjustment = -0.5; break;
      case 'This Week': adjustment = Math.cos(dataVersion * 0.2) * 1; break;
      case 'This Month': adjustment = 0.3; break;
      case 'This Quarter': adjustment = 0.8; break;
      default: adjustment = 0;
    }
    const percentage = basePercentages[index] + adjustment;
    return {
      value: percentage,
      formatted: `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`,
      isPositive: percentage > 0,
      isNegative: percentage < 0
    };
  };

  const getGrowthIcon = (growth) => {
    return growth.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />;
  };

  const getGrowthColorClass = (growth) => {
    if (growth.isPositive) return 'growth-positive';
    if (growth.isNegative) return 'growth-negative';
    return 'growth-neutral';
  };

  const StatCard = ({ icon: Icon, colorClass, value, label, subtext, growth, footerIcon: FooterIcon }) => (
    <div className="stat-card">
      <div className={`stat-left`}>
        <div className={`stat-icon-container ${colorClass}-bg`}>
          <Icon size={36} className={`${colorClass}-text`} />
        </div>
      </div>
      <div className="stat-right">
        <div className="stat-growth-above">
          <div className={`stat-pill ${getGrowthColorClass(growth)}`}>
            {getGrowthIcon(growth)}
            <span>{growth.formatted}</span>
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
    getGrowthPercentage(5.2, 0),
    getGrowthPercentage(-1.8, 1),
    getGrowthPercentage(0.5, 2),
    getGrowthPercentage(3.7, 3)
  ];

  return (
    <>
      <StatCard
        icon={Briefcase} colorClass="green" value="342"
        label="Pending Loans" subtext="Current applications"
        growth={growthData[0]} footerIcon={Globe}
      />
      <StatCard
        icon={Users} colorClass="orange" value="$1.2M"
        label="Total Disbursed" subtext="Funds released"
        growth={growthData[1]} footerIcon={Tag}
      />
      <StatCard
        icon={Activity} colorClass="yellow" value="2.4%"
        label="Portfolio Default" subtext="Risk assessment"
        growth={growthData[2]} footerIcon={Calendar}
      />
      <StatCard
        icon={Shield} colorClass="red" value="1,402"
        label="Verified Farmers" subtext="KYC completed"
        growth={growthData[3]} footerIcon={Shield}
      />
    </>
  );
};

export default BankUserStats;
