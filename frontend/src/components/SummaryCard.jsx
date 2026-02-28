function SummaryCard({ icon, iconClass, badge, badgeClass, value, label }) {
    return (
        <div className="summary-card">
            <div className="summary-card-header">
                <div className={`summary-card-icon ${iconClass}`}>{icon}</div>
                {badge && <span className={`summary-card-badge ${badgeClass}`}>{badge}</span>}
            </div>
            <div className="summary-card-value">{value}</div>
            <div className="summary-card-label">{label}</div>
        </div>
    );
}

export default SummaryCard;
