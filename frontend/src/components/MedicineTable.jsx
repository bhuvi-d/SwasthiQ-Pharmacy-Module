import StatusBadge from './StatusBadge';

function MedicineTable({ medicines, onEdit }) {
    if (!medicines.length) {
        return <p className="empty-msg">No medicines found.</p>;
    }

    /* Quantity color: yellow if low_stock, red if out_of_stock */
    const qtyClass = (status) => {
        if (status === 'low_stock') return 'td-qty low';
        if (status === 'out_of_stock') return 'td-qty out';
        return 'td-qty';
    };

    return (
        <table className="medicine-table">
            <thead>
                <tr>
                    <th>Medicine Name</th>
                    <th>Generic Name</th>
                    <th>Batch No</th>
                    <th>Expiry Date</th>
                    <th>Quantity</th>
                    <th>Cost Price</th>
                    <th>MRP</th>
                    <th>Supplier</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {medicines.map((m) => (
                    <tr key={m.id}>
                        <td className="td-name">{m.name}</td>
                        <td>{m.generic_name}</td>
                        <td>{m.batch_no}</td>
                        <td>{m.expiry_date}</td>
                        <td className={qtyClass(m.status)}>{m.quantity}</td>
                        <td>₹{Number(m.price).toFixed(2)}</td>
                        <td>₹{m.mrp ? Number(m.mrp).toFixed(2) : '0.00'}</td>
                        <td>{m.supplier || '—'}</td>
                        <td><StatusBadge status={m.status} /></td>
                        <td><button className="btn-edit" onClick={() => onEdit(m)}>Edit</button></td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default MedicineTable;
