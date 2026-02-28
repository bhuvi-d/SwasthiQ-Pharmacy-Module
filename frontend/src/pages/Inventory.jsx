import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SummaryCard from '../components/SummaryCard';
import MedicineTable from '../components/MedicineTable';
import AddMedicineModal from '../components/AddMedicineModal';
import api from '../services/api';

/* ── Inline SVG icons (top cards) ─────────────────────────────── */
const DollarIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const CartIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>;
const WarnIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
const BagIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>;
const DownloadIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;

/* ── Overview small SVG icons ─────────────────────────────────── */
const BoxIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /></svg>;
const CheckCircle = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const AlertTriangle = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
const DollarSmall = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;

function Inventory() {
    const [medicines, setMedicines] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editMed, setEditMed] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [salesSummary, setSalesSummary] = useState(null);
    const [itemsSold, setItemsSold] = useState(null);
    const [lowStock, setLowStock] = useState([]);
    const [purchaseSummary, setPurchaseSummary] = useState(null);

    useEffect(() => { fetchSummary(); }, []);
    useEffect(() => { fetchMedicines(); }, [search, statusFilter]);

    const fetchSummary = async () => {
        try {
            const [s, i, l, p] = await Promise.all([
                api.get('/dashboard/sales-summary'),
                api.get('/dashboard/items-sold'),
                api.get('/dashboard/low-stock'),
                api.get('/dashboard/purchase-summary'),
            ]);
            setSalesSummary(s.data.data);
            setItemsSold(i.data.data);
            setLowStock(l.data.data);
            setPurchaseSummary(p.data.data);
        } catch (e) { console.error(e); }
    };

    const fetchMedicines = async () => {
        try {
            setLoading(true);
            const params = {};
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/medicines', { params });
            setMedicines(res.data.data);
        } catch (err) { setError('Failed to load medicines'); }
        finally { setLoading(false); }
    };

    const handleSave = async (data) => {
        try {
            if (editMed) await api.put('/medicines/' + editMed.id, data);
            else await api.post('/medicines', data);
            setShowModal(false);
            setEditMed(null);
            fetchMedicines();
            fetchSummary();
        } catch (err) { alert('Failed to save medicine'); }
    };

    const fmt = (v) => '₹' + Number(v).toLocaleString('en-IN');
    const totalItems = medicines.length;
    const activeCount = medicines.filter(m => m.status === 'active').length;
    const lowCount = medicines.filter(m => m.status === 'low_stock').length;
    /* Total Value = only active + low_stock items (excludes expired & out_of_stock) */
    const totalValue = medicines
        .filter(m => m.status === 'active' || m.status === 'low_stock')
        .reduce((s, m) => s + m.quantity * m.price, 0);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Pharmacy CRM</h1>
                    <p>Manage inventory, sales, and purchase orders</p>
                </div>
                <div className="header-actions">
                    <button className="btn-outline">{DownloadIcon} Export</button>
                    <button className="btn-primary" onClick={() => { setEditMed(null); setShowModal(true); }}>+ Add Medicine</button>
                </div>
            </div>

            {error && <div className="error">{error}</div>}

            <div className="summary-cards">
                <SummaryCard icon={DollarIcon} iconClass="icon-green" badge={salesSummary ? `+${salesSummary.total_transactions} Orders` : ''} badgeClass="badge-green" value={salesSummary ? fmt(salesSummary.total_sales) : '₹0'} label="Today's Sales" />
                <SummaryCard icon={CartIcon} iconClass="icon-blue" badge={salesSummary ? `${salesSummary.total_transactions} Orders` : ''} badgeClass="badge-blue" value={itemsSold ? itemsSold.total_items_sold : 0} label="Items Sold Today" />
                <SummaryCard icon={WarnIcon} iconClass="icon-warn" badge="Action Needed" badgeClass="badge-orange" value={lowStock ? lowStock.length : 0} label="Low Stock Items" />
                <SummaryCard icon={BagIcon} iconClass="icon-purple" badge={purchaseSummary ? `${purchaseSummary.total_medicines} Items` : ''} badgeClass="badge-purple" value={purchaseSummary ? fmt(purchaseSummary.total_stock_value) : '₹0'} label="Purchase Orders" />
            </div>

            <div className="tabs-bar">
                <div className="tabs">
                    <Link to="/" className="tab"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg> Sales</Link>
                    <Link to="/inventory" className="tab"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /></svg> Purchase</Link>
                    <span className="tab active"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg> Inventory</span>
                </div>
                <div className="tab-actions">
                    <button className="btn-outline-green">+ New Sale</button>
                    <button className="btn-outline-green">+ New Purchase</button>
                </div>
            </div>

            <div className="overview-card">
                <h3>Inventory Overview</h3>
                <div className="overview-grid">
                    <div className="overview-item">
                        <span className="overview-label"><span className="ov-icon-blue">{BoxIcon}</span> Total Items</span>
                        <span className="overview-value">{totalItems}</span>
                    </div>
                    <div className="overview-item">
                        <span className="overview-label"><span className="ov-icon-green">{CheckCircle}</span> Active Stock</span>
                        <span className="overview-value">{activeCount}</span>
                    </div>
                    <div className="overview-item">
                        <span className="overview-label"><span className="ov-icon-yellow">{AlertTriangle}</span> Low Stock</span>
                        <span className="overview-value">{lowCount}</span>
                    </div>
                    <div className="overview-item">
                        <span className="overview-label"><span className="ov-icon-purple">{DollarSmall}</span> Total Value</span>
                        <span className="overview-value">{fmt(totalValue)}</span>
                    </div>
                </div>
            </div>

            <div className="table-card">
                <div className="table-top">
                    <h3>Complete Inventory</h3>
                    <div className="table-top-actions">
                        <button className="btn-outline small">🔍 Filter</button>
                        <button className="btn-outline small">{DownloadIcon} Export</button>
                    </div>
                </div>
                <div className="search-bar">
                    <input className="search-input" placeholder="Search medicines..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="low_stock">Low Stock</option>
                        <option value="expired">Expired</option>
                        <option value="out_of_stock">Out of Stock</option>
                    </select>
                </div>
                {loading ? <div className="loading">Loading…</div> : <MedicineTable medicines={medicines} onEdit={(m) => { setEditMed(m); setShowModal(true); }} />}
            </div>

            {showModal && <AddMedicineModal medicine={editMed} onClose={() => { setShowModal(false); setEditMed(null); }} onSave={handleSave} />}
        </div>
    );
}

export default Inventory;
