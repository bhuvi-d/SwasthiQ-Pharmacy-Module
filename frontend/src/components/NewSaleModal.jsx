import { useState } from 'react';
import api from '../services/api';

function NewSaleModal({ onClose, onComplete }) {
    const [patientName, setPatientName] = useState('');
    const [medSearch, setMedSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedMed, setSelectedMed] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [saving, setSaving] = useState(false);

    const handleSearch = async (query) => {
        setMedSearch(query);
        try {
            const params = query ? { search: query } : {};
            const res = await api.get('/medicines', { params });
            const available = (res.data.data || []).filter(m => m.quantity > 0 && m.status !== 'expired');
            setSearchResults(available);
        } catch { setSearchResults([]); }
    };

    const pickMedicine = (med) => {
        setSelectedMed(med);
        setMedSearch(med.name);
        setSearchResults([]);
        setQuantity(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedMed) return alert('Please select a medicine');
        if (quantity < 1 || quantity > selectedMed.quantity) return alert('Invalid quantity');

        setSaving(true);
        try {
            await api.post('/medicines/sales', {
                medicine_id: selectedMed.id,
                quantity_sold: quantity,
                customer_name: patientName || '',
                payment_mode: paymentMode,
            });
            onComplete();
        } catch (err) {
            alert('Sale failed. Check stock availability.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: '520px' }}>
                <h2>New Sale</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Patient / Customer Name</label>
                        <input placeholder="Enter patient name" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
                    </div>

                    <div className="form-group" style={{ position: 'relative' }}>
                        <label>Medicine</label>
                        <input
                            placeholder="Search medicines..."
                            value={medSearch}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => handleSearch(medSearch)}
                            required
                        />
                        {searchResults.length > 0 && (
                            <div className="modal-dropdown">
                                {searchResults.map(m => (
                                    <div key={m.id} className="modal-dropdown-item" onClick={() => pickMedicine(m)}>
                                        <div>
                                            <strong>{m.name}</strong>
                                            <span style={{ color: '#94a3b8', marginLeft: '8px', fontSize: '12px' }}>{m.generic_name}</span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                                            Stock: {m.quantity} | MRP: ₹{Number(m.mrp || m.price).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedMed && (
                        <div className="selected-med-info">
                            <span>✓ {selectedMed.name}</span>
                            <span>Batch: {selectedMed.batch_no}</span>
                            <span>Available: {selectedMed.quantity}</span>
                            <span>Price: ₹{Number(selectedMed.price).toFixed(2)}</span>
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label>Quantity</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                min="1"
                                max={selectedMed ? selectedMed.quantity : 999}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Payment Mode</label>
                            <select className="form-select" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                                <option value="UPI">UPI</option>
                            </select>
                        </div>
                    </div>

                    {selectedMed && (
                        <div className="sale-total">
                            Total: ₹{(quantity * selectedMed.price).toFixed(2)}
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={saving}>
                            {saving ? 'Processing...' : 'Complete Sale'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default NewSaleModal;
