import { Users, TrendingUp, TrendingDown, MapPin, Beef, Wheat, Map, Hash, Sun, Clock, Globe, Tag, Calendar, Activity, Shield } from 'lucide-react';


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

const FarmerStats = ({ dateFilter = 'Today' }) => {
  // Derived growth values based on date filter dynamically
  const getGrowthByFilter = (filter) => {
    switch (filter) {
      case 'Today': return [
        { value: 9.5, formatted: '+9.5%', isPositive: true },
        { value: 5.3, formatted: '+5.3%', isPositive: true },
        { value: 2.1, formatted: '+2.1%', isPositive: true },
        { value: -5.4, formatted: '-5.4%', isNegative: true }
      ];
      case 'Yesterday': return [
        { value: 7.2, formatted: '+7.2%', isPositive: true },
        { value: 4.1, formatted: '+4.1%', isPositive: true },
        { value: 1.8, formatted: '+1.8%', isPositive: true },
        { value: -3.2, formatted: '-3.2%', isNegative: true }
      ];
      case 'This Week': return [
        { value: 12.5, formatted: '+12.5%', isPositive: true },
        { value: 8.3, formatted: '+8.3%', isPositive: true },
        { value: -1.1, formatted: '-1.1%', isNegative: true },
        { value: -8.4, formatted: '-8.4%', isNegative: true }
      ];
      case 'This Month': return [
        { value: 24.5, formatted: '+24.5%', isPositive: true },
        { value: 18.3, formatted: '+18.3%', isPositive: true },
        { value: 12.1, formatted: '+12.1%', isPositive: true },
        { value: 5.4, formatted: '+5.4%', isPositive: true }
      ];
      case 'This Quarter': return [
        { value: 45.2, formatted: '+45.2%', isPositive: true },
        { value: -5.3, formatted: '-5.3%', isNegative: true },
        { value: -2.1, formatted: '-2.1%', isNegative: true },
        { value: 15.4, formatted: '+15.4%', isPositive: true }
      ];
      default: return [
        { value: 1.5, formatted: '+1.5%', isPositive: true },
        { value: 0.3, formatted: '+0.3%', isPositive: true },
        { value: -0.1, formatted: '-0.1%', isNegative: true },
        { value: 1.4, formatted: '+1.4%', isPositive: true }
      ];
    }
  };

  const growthData = getGrowthByFilter(dateFilter);

  // Derived stat values based on date filter dynamically
  const getValuesByFilter = (filter) => {
    switch (filter) {
      case 'Today': return ['1,245', '3,450', '890', '12'];
      case 'Yesterday': return ['2,104', '4,892', '1,102', '34'];
      case 'This Week': return ['8,930', '15,621', '4,561', '145'];
      case 'This Month': return ['28,941', '52,109', '18,401', '489'];
      case 'This Quarter': return ['85,123', '140,562', '65,920', '1,204'];
      default: return ['12,752', '28,297', '9,009', '61'];
    }
  };

  const statValues = getValuesByFilter(dateFilter);

  return (
    <>
      <StatCard
        icon={Users} colorClass="green" value={statValues[0]}
        label="Farmers Registered" subtext="Across all regions"
        growth={growthData[0]} footerIcon={Globe}
      />
      <StatCard
        icon={Beef} colorClass="yellow" value={statValues[1]}
        label="Livestock Records" subtext="Tagged animals"
        growth={growthData[1]} footerIcon={Tag}
      />
      <StatCard
        icon={Wheat} colorClass="red" value={statValues[2]}
        label="Crop Production Plots" subtext="2024 season"
        growth={growthData[2]} footerIcon={Calendar}
      />
      <StatCard
        icon={Clock} colorClass="orange" value={statValues[3]}
        label="Pending Verifications" subtext="Awaiting review"
        growth={growthData[3]} footerIcon={Clock}
      />
    </>

  );
};

export default FarmerStats;
