const LABELS = {
    active: 'Active',
    low_stock: 'Low Stock',
    expired: 'Expired',
    out_of_stock: 'Out of Stock',
};

function StatusBadge({ status }) {
    return (
        <span className={`status-badge ${status}`}>
            {LABELS[status] || status}
        </span>
    );
}

export default StatusBadge;
