import { useState, useEffect } from 'react';

const EMPTY = { name: '', generic_name: '', batch_no: '', expiry_date: '', quantity: '', price: '', mrp: '', supplier: '' };

function AddMedicineModal({ medicine, onClose, onSave }) {
    const [form, setForm] = useState(EMPTY);

    useEffect(() => {
        setForm(medicine ? {
            name: medicine.name,
            generic_name: medicine.generic_name,
            batch_no: medicine.batch_no,
            expiry_date: medicine.expiry_date,
            quantity: medicine.quantity,
            price: medicine.price,
            mrp: medicine.mrp || '',
            supplier: medicine.supplier || '',
        } : EMPTY);
    }, [medicine]);

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const onSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...form,
            quantity: parseInt(form.quantity, 10),
            price: parseFloat(form.price),
            mrp: form.mrp ? parseFloat(form.mrp) : 0,
            supplier: form.supplier || '',
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>{medicine ? 'Edit Medicine' : 'Add Medicine'}</h2>
                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>Medicine Name</label>
                        <input name="name" value={form.name} onChange={onChange} required />
                    </div>
                    <div className="form-group">
                        <label>Generic Name</label>
                        <input name="generic_name" value={form.generic_name} onChange={onChange} required />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Batch No</label>
                            <input name="batch_no" value={form.batch_no} onChange={onChange} required />
                        </div>
                        <div className="form-group">
                            <label>Expiry Date</label>
                            <input type="date" name="expiry_date" value={form.expiry_date} onChange={onChange} required />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Quantity</label>
                            <input type="number" name="quantity" value={form.quantity} onChange={onChange} min="0" required />
                        </div>
                        <div className="form-group">
                            <label>Cost Price (₹)</label>
                            <input type="number" name="price" value={form.price} onChange={onChange} step="0.01" min="0.01" required />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>MRP (₹)</label>
                            <input type="number" name="mrp" value={form.mrp} onChange={onChange} step="0.01" min="0" />
                        </div>
                        <div className="form-group">
                            <label>Supplier</label>
                            <input name="supplier" value={form.supplier} onChange={onChange} placeholder="Supplier name" />
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-save">{medicine ? 'Update' : 'Add'} Medicine</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddMedicineModal;
