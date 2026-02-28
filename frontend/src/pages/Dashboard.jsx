import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SummaryCard from '../components/SummaryCard';
import NewSaleModal from '../components/NewSaleModal';
import api from '../services/api';

/* ── SVG icons ────────────────────────────────────────────────── */
const DollarIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const CartIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>;
const WarnIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
const BagIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>;
const DownloadIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
const CartIconSmall = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>;

function Dashboard() {
    const [salesSummary, setSalesSummary] = useState(null);
    const [itemsSold, setItemsSold] = useState(null);
    const [lowStock, setLowStock] = useState([]);
    const [purchaseSummary, setPurchaseSummary] = useState(null);
    const [recentSales, setRecentSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSaleModal, setShowSaleModal] = useState(false);

    /* ── Make a Sale state ──────────────────────────────── */
    const [patientId, setPatientId] = useState('');
    const [medSearch, setMedSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [cart, setCart] = useState([]);
    const [paymentMode, setPaymentMode] = useState('Cash');

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            setError(null);
            const [s, i, l, p, r] = await Promise.all([
                api.get('/dashboard/sales-summary'),
                api.get('/dashboard/items-sold'),
                api.get('/dashboard/low-stock'),
                api.get('/dashboard/purchase-summary'),
                api.get('/dashboard/recent-sales'),
            ]);
            setSalesSummary(s.data.data);
            setItemsSold(i.data.data);
            setLowStock(l.data.data);
            setPurchaseSummary(p.data.data);
            setRecentSales(r.data.data || []);
        } catch (err) {
            setError('Failed to load dashboard data. Make sure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    /* ── Medicine search for sale ───────────────────────── */
    const handleMedSearch = async (query) => {
        try {
            const params = query ? { search: query } : {};
            const res = await api.get('/medicines', { params });
            const available = (res.data.data || []).filter(m => m.quantity > 0 && m.status !== 'expired');
            setSearchResults(available);
        } catch { setSearchResults([]); }
    };

    const onSearchChange = (e) => {
        const val = e.target.value;
        setMedSearch(val);
        handleMedSearch(val);
    };

    const onSearchFocus = () => {
        handleMedSearch(medSearch);
    };

    const addToCart = (med) => {
        if (cart.find(c => c.id === med.id)) return;
        setCart([...cart, { ...med, sellQty: 1 }]);
        setSearchResults([]);
        setMedSearch('');
    };

    const updateCartQty = (id, qty) => {
        setCart(cart.map(c => c.id === id ? { ...c, sellQty: Math.max(1, Math.min(qty, c.quantity)) } : c));
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(c => c.id !== id));
    };

    const handleBill = async () => {
        if (cart.length === 0) return alert('Add at least one medicine to the cart');
        try {
            for (const item of cart) {
                await api.post('/medicines/sales', {
                    medicine_id: item.id,
                    quantity_sold: item.sellQty,
                    customer_name: patientId || '',
                    payment_mode: paymentMode,
                });
            }
            setCart([]);
            setPatientId('');
            setMedSearch('');
            setPaymentMode('Cash');
            fetchAll();
        } catch (err) {
            alert('Failed to complete sale. Check stock availability.');
        }
    };

    const fmt = (v) => '₹' + Number(v).toLocaleString('en-IN');


    return (
        <div>
            {/* ── Header ──────────────────────────────────────── */}
            <div className="page-header">
                <div>
                    <h1>Pharmacy CRM</h1>
                    <p>Manage inventory, sales, and purchase orders</p>
                </div>
                <div className="header-actions">
                    <button className="btn-outline">{DownloadIcon} Export</button>
                    <Link to="/inventory"><button className="btn-primary">+ Add Medicine</button></Link>
                </div>
            </div>

            {error && <div className="error">{error}</div>}
            {loading && <div className="loading">Loading dashboard…</div>}

            {!loading && (
                <>
                    {/* ── Summary Cards ─────────────────────────────── */}
                    <div className="summary-cards">
                        <SummaryCard icon={DollarIcon} iconClass="icon-green" badge={salesSummary ? `+${salesSummary.total_transactions} Orders` : ''} badgeClass="badge-green" value={salesSummary ? fmt(salesSummary.total_sales) : '₹0'} label="Today's Sales" />
                        <SummaryCard icon={CartIcon} iconClass="icon-blue" badge={salesSummary ? `${salesSummary.total_transactions} Orders` : ''} badgeClass="badge-blue" value={itemsSold ? itemsSold.total_items_sold : 0} label="Items Sold Today" />
                        <SummaryCard icon={WarnIcon} iconClass="icon-warn" badge="Action Needed" badgeClass="badge-orange" value={lowStock ? lowStock.length : 0} label="Low Stock Items" />
                        <SummaryCard icon={BagIcon} iconClass="icon-purple" badge={purchaseSummary ? `${purchaseSummary.total_medicines} Items` : ''} badgeClass="badge-purple" value={purchaseSummary ? fmt(purchaseSummary.total_stock_value) : '₹0'} label="Purchase Orders" />
                    </div>

                    {/* ── Tabs ──────────────────────────────────────── */}
                    <div className="tabs-bar">
                        <div className="tabs">
                            <span className="tab active">{CartIconSmall} Sales</span>
                            <Link to="/inventory" className="tab"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /></svg> Purchase</Link>
                            <Link to="/inventory" className="tab"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg> Inventory</Link>
                        </div>
                        <div className="tab-actions">
                            <button className="btn-primary" onClick={() => setShowSaleModal(true)}>+ New Sale</button>
                            <button className="btn-outline-green">+ New Purchase</button>
                        </div>
                    </div>

                    {/* ── Make a Sale Card ──────────────────────────── */}
                    <div className="sale-card" id="sale-section">
                        <h3 className="sale-card-title">Make a Sale</h3>
                        <p className="sale-card-subtitle">Select medicines from inventory</p>

                        <div className="sale-inputs">
                            <input className="sale-input" placeholder="Patient Id" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
                            <div className="sale-search-wrap">
                                <svg className="sale-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                <input className="sale-input sale-search" placeholder="Search medicines..." value={medSearch} onChange={onSearchChange} onFocus={onSearchFocus} />
                            </div>
                            <button className="btn-enter" onClick={() => { if (searchResults.length > 0) addToCart(searchResults[0]); }}>Enter</button>
                            <select className="sale-payment" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                                <option value="UPI">UPI</option>
                            </select>
                            <button className="btn-bill" onClick={handleBill}>Bill</button>
                        </div>

                        {/* Search results dropdown */}
                        {searchResults.length > 0 && (
                            <div className="search-dropdown">
                                {searchResults.map(m => (
                                    <div key={m.id} className="search-dropdown-item" onClick={() => addToCart(m)}>
                                        <span>{m.name} — {m.generic_name}</span>
                                        <span className="search-dropdown-stock">Stock: {m.quantity}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Cart table */}
                        {cart.length > 0 && (
                            <table className="medicine-table" style={{ marginTop: '14px' }}>
                                <thead>
                                    <tr>
                                        <th>Medicine Name</th>
                                        <th>Generic Name</th>
                                        <th>Batch No</th>
                                        <th>Expiry Date</th>
                                        <th>Quantity</th>
                                        <th>MRP / Price</th>
                                        <th>Supplier</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map(c => (
                                        <tr key={c.id}>
                                            <td className="td-name">{c.name}</td>
                                            <td>{c.generic_name}</td>
                                            <td>{c.batch_no}</td>
                                            <td>{c.expiry_date}</td>
                                            <td>
                                                <input type="number" className="cart-qty-input" value={c.sellQty} min="1" max={c.quantity} onChange={(e) => updateCartQty(c.id, parseInt(e.target.value) || 1)} />
                                            </td>
                                            <td>₹{Number(c.mrp || c.price).toFixed(2)}</td>
                                            <td>{c.supplier || '—'}</td>
                                            <td><span className={`status-badge ${c.status}`}>{c.status === 'active' ? 'Active' : c.status === 'low_stock' ? 'Low Stock' : c.status}</span></td>
                                            <td><button className="btn-edit" onClick={() => removeFromCart(c.id)}>✕</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* ── Recent Sales ──────────────────────────────── */}
                    <h3 className="section-title">Recent Sales</h3>
                    <div className="recent-sales-list">
                        {recentSales.length === 0 ? (
                            <p className="empty-msg">No sales yet.</p>
                        ) : (
                            recentSales.map((sale, idx) => (
                                <div className="sale-item" key={sale.id}>
                                    <div className="sale-box">
                                        {CartIconSmall}
                                    </div>
                                    <div className="sale-info">
                                        <h4>INV-2024-{String(sale.id).padStart(4, '0')}</h4>
                                        <p>{sale.customer_name || 'Walk-in'} • {sale.quantity_sold} items • {sale.payment_mode || 'Cash'}</p>
                                    </div>
                                    <div className="sale-amount">
                                        <h4>{fmt(sale.total_price)}</h4>
                                        <p>{sale.created_at ? new Date(sale.created_at).toLocaleDateString('en-IN') : '—'}</p>
                                    </div>
                                    <span className="completed-badge">Completed</span>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {showSaleModal && <NewSaleModal onClose={() => setShowSaleModal(false)} onComplete={() => { setShowSaleModal(false); fetchAll(); }} />}
        </div>
    );
}

export default Dashboard;
