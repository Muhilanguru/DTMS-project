const StatsCard = ({ icon, label, value, subtext, variant = 'primary' }) => {
  return (
    <div className={`stats-card ${variant} animate-in`}>
      <div className={`stats-icon ${variant}`}>
        {icon}
      </div>
      <div className="stats-info">
        <div className="stats-label">{label}</div>
        <div className="stats-value">{value}</div>
        {subtext && <div className="stats-subtext">{subtext}</div>}
      </div>
    </div>
  );
};

export default StatsCard;
