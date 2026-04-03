import React from 'react';
import { Users, TrendingUp, TrendingDown, MapPin, Bird, Sprout, Globe, Tag, Calendar, Shield } from 'lucide-react';

const AdminStats = ({ dateFilter = 'Today', dataVersion = 0 }) => {
  // Function to calculate growth percentage based on date filter and data version
  const getGrowthPercentage = (baseValue, index) => {
    const basePercentages = [12.5, 8.3, 5.1, 15.2];
    let adjustment = 0;
    switch (dateFilter) {
      case 'Today': adjustment = Math.sin(dataVersion * 0.5) * 2; break;
      case 'Yesterday': adjustment = -0.8; break;
      case 'This Week': adjustment = Math.cos(dataVersion * 0.3) * 1.5; break;
      case 'This Month': adjustment = 0.5; break;
      case 'This Quarter': adjustment = 1.2; break;
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
    getGrowthPercentage(12.5, 0),
    getGrowthPercentage(8.3, 1),
    getGrowthPercentage(5.1, 2),
    getGrowthPercentage(15.2, 3)
  ];

  return (
    <>
      <StatCard
        icon={Users} colorClass="green" value="2.4M"
        label="Registered Farmers" subtext="Across all regions"
        growth={growthData[0]} footerIcon={Globe}
      />
      <StatCard
        icon={MapPin} colorClass="yellow" value="1.8M"
        label="Land Parcels" subtext="Verified plots"
        growth={growthData[1]} footerIcon={Tag}
      />
      <StatCard
        icon={Bird} colorClass="red" value="3.4M"
        label="Livestock Count" subtext="Tagged inventory"
        growth={growthData[2]} footerIcon={Calendar}
      />
      <StatCard
        icon={Sprout} colorClass="orange" value="850K ha"
        label="Active Crop Area" subtext="Meher season"
        growth={growthData[3]} footerIcon={Shield}
      />
    </>
  );
};

export default AdminStats;
