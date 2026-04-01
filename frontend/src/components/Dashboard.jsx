import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronRight, ChevronDown, Edit2, Plus, Trash2, Sun, Moon, LogOut, Search, Settings, FileSpreadsheet, Download, Upload, Network, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SettingsModal from './SettingsModal';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Semantic badge colors per architecture type
const ARCH_BADGE = {
    'VM':           'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    'Virtual':      'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    'Bare Metal':   'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    'Server':       'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    'Kubernetes':   'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    'Docker':       'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
    'Container':    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
    'LXC':          'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
    'Gateway':      'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    'Router':       'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    'Switch':       'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    'Firewall':     'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    'Load Balancer':'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    'Wifi':         'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
    'NFS':          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    'Storage':      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    'Printer':      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    'IoT Device':   'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
};

const MODAL_INPUT = 'w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow';
const MODAL_LABEL = 'block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5';

const Dashboard = () => {
    const { logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { t } = useTranslation();
    const [subnets, setSubnets] = useState([]);
    const [selectedSubnet, setSelectedSubnet] = useState(null);
    const [ips, setIps] = useState([]);
    const [showSubnetModal, setShowSubnetModal] = useState(false);
    const [showIpModal, setShowIpModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [editingSubnet, setEditingSubnet] = useState(null);
    const [editingIp, setEditingIp] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: null, id: null, name: '' });
    const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, subnet: null });
    const [showImportExportMenu, setShowImportExportMenu] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const fileInputRef = useRef(null);
    const [collapsedSubnets, setCollapsedSubnets] = useState(new Set());
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef(null);
    const [toasts, setToasts] = useState([]);

    // Form states
    const [newSubnet, setNewSubnet] = useState({ name: '', cidr: '', description: '', parent_id: null });
    const [newIp, setNewIp] = useState({ ip_address: '', dns_name: '', architecture: 'VM', function: '' });
    const [subnetFormLoading, setSubnetFormLoading] = useState(false);
    const [ipFormLoading, setIpFormLoading] = useState(false);

    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    useEffect(() => { fetchSubnets(); }, []);

    // Resize handlers
    const startResizing = React.useCallback(() => { setIsResizing(true); }, []);
    const stopResizing = React.useCallback(() => { setIsResizing(false); }, []);
    const resize = React.useCallback((e) => {
        if (isResizing) {
            const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left;
            if (newWidth > 180 && newWidth < 600) setSidebarWidth(newWidth);
        }
    }, [isResizing]);

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => { window.removeEventListener('mousemove', resize); window.removeEventListener('mouseup', stopResizing); };
    }, [resize, stopResizing]);

    useEffect(() => {
        const handleClick = () => setContextMenu(prev => prev.show ? { ...prev, show: false } : prev);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key !== 'Escape') return;
            if (showSubnetModal) { setShowSubnetModal(false); setNewSubnet({ name: '', cidr: '', description: '', parent_id: null }); }
            if (editingSubnet) setEditingSubnet(null);
            if (showIpModal) setShowIpModal(false);
            if (editingIp) setEditingIp(null);
            if (deleteConfirm.show) setDeleteConfirm({ show: false, type: null, id: null, name: '' });
            if (showSettingsModal) setShowSettingsModal(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showSubnetModal, editingSubnet, showIpModal, editingIp, deleteConfirm.show, showSettingsModal]);

    useEffect(() => {
        if (selectedSubnet) fetchIps(selectedSubnet.id);
        else setIps([]);
    }, [selectedSubnet]);

    const fetchSubnets = async () => {
        try { const res = await api.get('/subnets'); setSubnets(res.data); }
        catch (err) { console.error('Failed to fetch subnets', err); }
    };

    const fetchIps = async (subnetId) => {
        try { const res = await api.get(`/subnets/${subnetId}/ips`); setIps(res.data); }
        catch (err) { console.error('Failed to fetch IPs', err); }
    };

    const handleCreateSubnet = async (e) => {
        e.preventDefault();
        setSubnetFormLoading(true);
        try {
            await api.post('/subnets', newSubnet);
            setShowSubnetModal(false);
            setNewSubnet({ name: '', cidr: '', description: '', parent_id: null });
            fetchSubnets();
            showToast(t('subnet_created', 'Subnet created'), 'success');
        } catch (err) { showToast(err.response?.data?.msg || t('error_create_subnet'), 'error'); }
        finally { setSubnetFormLoading(false); }
    };

    const handleUpdateSubnet = async (e) => {
        e.preventDefault();
        setSubnetFormLoading(true);
        try {
            await api.put(`/subnets/${editingSubnet.id}`, editingSubnet);
            setEditingSubnet(null);
            fetchSubnets();
            if (selectedSubnet?.id === editingSubnet.id) setSelectedSubnet({ ...selectedSubnet, ...editingSubnet });
            showToast(t('subnet_updated', 'Subnet updated'), 'success');
        } catch (err) { showToast(err.response?.data?.msg || t('error_update_subnet'), 'error'); }
        finally { setSubnetFormLoading(false); }
    };

    const handleAddIp = async (e) => {
        e.preventDefault();
        setIpFormLoading(true);
        try {
            await api.post('/ips', { ...newIp, subnet_id: selectedSubnet.id });
            setShowIpModal(false);
            setNewIp({ ip_address: '', dns_name: '', architecture: 'VM', function: '' });
            fetchIps(selectedSubnet.id);
            showToast(t('ip_added', 'IP address added'), 'success');
        } catch (err) { showToast(err.response?.data?.msg || t('error_add_ip'), 'error'); }
        finally { setIpFormLoading(false); }
    };

    const handleUpdateIp = async (e) => {
        e.preventDefault();
        setIpFormLoading(true);
        try {
            await api.put(`/ips/${editingIp.id}`, editingIp);
            setEditingIp(null);
            fetchIps(selectedSubnet.id);
            showToast(t('ip_updated', 'IP address updated'), 'success');
        } catch (err) { showToast(err.response?.data?.msg || t('error_update_ip'), 'error'); }
        finally { setIpFormLoading(false); }
    };

    const handleDeleteIp = (e, id, ipAddress) => {
        e.preventDefault(); e.stopPropagation();
        setDeleteConfirm({ show: true, type: 'ip', id, name: ipAddress });
    };

    const handleDeleteSubnet = (e, id, name) => {
        e.preventDefault(); e.stopPropagation();
        setDeleteConfirm({ show: true, type: 'subnet', id, name });
    };

    const confirmDelete = async () => {
        const { type, id } = deleteConfirm;
        setDeleteConfirm({ show: false, type: null, id: null, name: '' });
        try {
            if (type === 'ip') { await api.delete(`/ips/${id}`); fetchIps(selectedSubnet.id); }
            else if (type === 'subnet') { await api.delete(`/subnets/${id}`); if (selectedSubnet?.id === id) setSelectedSubnet(null); fetchSubnets(); }
        } catch (err) { console.error(err); }
    };

    const cancelDelete = () => setDeleteConfirm({ show: false, type: null, id: null, name: '' });

    const handleContextMenu = (e, subnet) => {
        e.preventDefault();
        setContextMenu({ show: true, x: e.pageX, y: e.pageY, subnet });
    };

    const toggleCollapse = (e, id) => {
        e.stopPropagation();
        setCollapsedSubnets(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const subnetById = useMemo(() => new Map(subnets.map(s => [s.id, s])), [subnets]);

    const organizeSubnets = useMemo(() => {
        const buildTree = (parentId) =>
            subnets.filter(s => s.parent_id === parentId).map(s => ({ ...s, children: buildTree(s.id) }));
        return buildTree(null);
    }, [subnets]);

    const filteredIps = useMemo(() => {
        const term = searchTerm.toLowerCase();
        if (!term) return ips;
        return ips.filter(ip =>
            ip.ip_address.toLowerCase().includes(term) ||
            ip.dns_name?.toLowerCase().includes(term) ||
            ip.architecture?.toLowerCase().includes(term) ||
            ip.function?.toLowerCase().includes(term) ||
            ip.subnet_name?.toLowerCase().includes(term) ||
            ip.subnet_cidr?.toLowerCase().includes(term)
        );
    }, [ips, searchTerm]);

    const getSubnetPath = (subnetId) => {
        const path = [];
        let current = subnetById.get(subnetId);
        while (current) {
            path.unshift(current);
            current = current.parent_id ? subnetById.get(current.parent_id) : null;
        }
        return path;
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/export/ips', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'ipam_export.csv');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            setShowImportExportMenu(false);
        } catch (error) {
            console.error('Export failed', error);
            showToast(t('export_failed', 'Export failed'), 'error');
        }
    };

    const handleImportClick = () => { fileInputRef.current.click(); setShowImportExportMenu(false); };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        setImportLoading(true);
        try {
            const res = await api.post('/import/ips', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            showToast(`${t('import_success')} — ${t('import_created')}: ${res.data.created}, ${t('import_updated')}: ${res.data.updated}`, 'success');
            if (selectedSubnet) fetchIps(selectedSubnet.id);
        } catch (error) {
            console.error('Import failed', error);
            showToast(error.response?.data?.msg || t('import_failed'), 'error');
        } finally {
            setImportLoading(false);
            event.target.value = null;
        }
    };

    // ── Subnet tree item ────────────────────────────────────────────────────────
    const renderSubnetTree = (subnet, level = 0) => {
        const hasChildren = subnet.children && subnet.children.length > 0;
        const isCollapsed = collapsedSubnets.has(subnet.id);
        const isSelected = selectedSubnet?.id === subnet.id;

        return (
            <React.Fragment key={subnet.id}>
                <li
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-md mb-0.5 cursor-pointer group transition-colors select-none ${
                        isSelected ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                    style={{ paddingLeft: `${level * 14 + 8}px` }}
                    onClick={() => setSelectedSubnet(subnet)}
                    onContextMenu={(e) => handleContextMenu(e, subnet)}
                >
                    <span
                        className={`flex-shrink-0 transition-colors ${isSelected ? 'text-blue-200' : 'text-slate-600 group-hover:text-slate-400'}`}
                        onClick={(e) => hasChildren && toggleCollapse(e, subnet.id)}
                    >
                        {hasChildren
                            ? (isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />)
                            : <span className="inline-block w-[13px]" />}
                    </span>

                    <span className="truncate flex-1 text-sm font-medium">{subnet.name}</span>

                    <span className={`text-[10px] font-mono flex-shrink-0 px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                        isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-400'
                    }`}>
                        {subnet.ip_count}
                    </span>

                    <div className={`flex gap-0.5 flex-shrink-0 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setEditingSubnet(subnet); }}
                            className={`p-0.5 rounded transition-colors ${isSelected ? 'hover:bg-blue-700 text-blue-200' : 'hover:bg-slate-700 text-slate-400'}`}
                            title={t('edit')}
                            aria-label={`${t('edit')} ${subnet.name}`}
                        ><Edit2 size={11} /></button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setNewSubnet({ ...newSubnet, parent_id: subnet.id }); setShowSubnetModal(true); }}
                            className={`p-0.5 rounded transition-colors ${isSelected ? 'hover:bg-blue-700 text-blue-200' : 'hover:bg-slate-700 text-slate-400'}`}
                            title={t('add_child_subnet')}
                            aria-label={`${t('add_child_subnet')} ${subnet.name}`}
                        ><Plus size={11} /></button>
                        <button
                            onClick={(e) => handleDeleteSubnet(e, subnet.id, subnet.name)}
                            className={`p-0.5 rounded transition-colors ${isSelected ? 'hover:bg-blue-700 text-red-300' : 'hover:bg-slate-700 text-slate-400 hover:text-red-400'}`}
                            title={t('delete')}
                            aria-label={`${t('delete')} ${subnet.name}`}
                        ><Trash2 size={11} /></button>
                    </div>
                </li>
                {hasChildren && !isCollapsed && subnet.children.map(child => renderSubnetTree(child, level + 1))}
            </React.Fragment>
        );
    };

    const subnetPath = useMemo(
        () => selectedSubnet ? getSubnetPath(selectedSubnet.id) : [],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [selectedSubnet, subnetById]
    );

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden">

            {/* ── Sidebar ──────────────────────────────────────────────────────── */}
            <div
                ref={sidebarRef}
                className="bg-slate-900 flex flex-col flex-shrink-0 relative"
                style={{ width: sidebarWidth }}
            >
                {/* App header */}
                <div className="flex items-center justify-between px-3 h-13 border-b border-slate-800 py-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
                            <Network size={15} className="text-white" />
                        </div>
                        <span className="text-white font-semibold text-sm tracking-tight">IPAM</span>
                    </div>
                    <div className="flex items-center">
                        <button onClick={() => setShowImportExportMenu(!showImportExportMenu)} className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors" title={t('import_export')} aria-label={t('import_export')}>
                            <FileSpreadsheet size={15} />
                        </button>
                        <button onClick={() => setShowSettingsModal(true)} className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors" title={t('settings')} aria-label={t('settings')}>
                            <Settings size={15} />
                        </button>
                        <button onClick={toggleTheme} className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors" aria-label={theme === 'light' ? t('switch_to_dark', 'Switch to dark mode') : t('switch_to_light', 'Switch to light mode')}>
                            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
                        </button>
                    </div>
                </div>

                {/* Import/Export dropdown */}
                {showImportExportMenu && (
                    <div className="absolute left-3 top-[52px] mt-1 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
                        <button onClick={handleExport} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-colors">
                            <Download size={14} /> {t('export_csv')}
                        </button>
                        <button onClick={handleImportClick} disabled={importLoading} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <Upload size={14} /> {importLoading ? t('importing') : t('import_csv')}
                        </button>
                    </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />

                {/* Subnets section */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('subnets')}</span>
                    <button
                        onClick={() => { setNewSubnet({ name: '', cidr: '', description: '', parent_id: null }); setShowSubnetModal(true); }}
                        className="p-1 rounded hover:bg-slate-800 text-slate-600 hover:text-slate-300 transition-colors"
                        title={t('new_root_subnet')}
                        aria-label={t('new_root_subnet')}
                    ><Plus size={14} /></button>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2">
                    <ul>{organizeSubnets.map(s => renderSubnetTree(s))}</ul>
                </div>

                {/* User bar */}
                <div className="px-3 py-3 border-t border-slate-800 flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{user?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-slate-300 text-xs font-medium truncate">{user}</p>
                        <p className="text-slate-600 text-[10px]">Administrator</p>
                    </div>
                    <button onClick={logout} className="p-1.5 rounded hover:bg-slate-800 text-slate-600 hover:text-red-400 transition-colors" title={t('logout')} aria-label={t('logout')}>
                        <LogOut size={14} />
                    </button>
                </div>

                {/* Resizer */}
                <div
                    className="absolute top-0 right-0 w-0.5 h-full cursor-col-resize hover:bg-blue-500 active:bg-blue-600 transition-colors z-10"
                    onMouseDown={startResizing}
                />
            </div>

            {/* ── Main content ─────────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
                {selectedSubnet ? (
                    <>
                        {/* Header bar */}
                        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
                            <div>
                                {/* Breadcrumb */}
                                <div className="flex items-center gap-1 text-sm">
                                    {subnetPath.map((s, i) => (
                                        <React.Fragment key={s.id}>
                                            {i > 0 && <ChevronRight size={13} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />}
                                            <button
                                                onClick={() => setSelectedSubnet(s)}
                                                className={`font-medium transition-colors truncate max-w-[180px] ${
                                                    i === subnetPath.length - 1
                                                        ? 'text-slate-900 dark:text-white'
                                                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                                }`}
                                            >{s.name}</button>
                                        </React.Fragment>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2.5 mt-1">
                                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                        {selectedSubnet.cidr}
                                    </span>
                                    {selectedSubnet.description && (
                                        <span className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs">{selectedSubnet.description}</span>
                                    )}
                                    <span className="text-xs text-slate-400 dark:text-slate-500">
                                        {filteredIps.length} IP{filteredIps.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowIpModal(true)}
                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm flex-shrink-0"
                            >
                                <Plus size={15} />
                                {t('add_ip_address')}
                            </button>
                        </div>

                        {/* Search */}
                        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex-shrink-0">
                            <div className="relative max-w-xs">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder={t('search_placeholder')}
                                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white placeholder-slate-400 transition-shadow"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                                        {[t('table_ip'), t('subnets'), t('table_dns'), t('table_arch'), t('table_func'), t('table_actions')].map(h => (
                                            <th key={h} className="text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-5 py-3">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredIps.map(ip => (
                                        <tr key={ip.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                            <td className="px-5 py-3 font-mono text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                                                {ip.ip_address}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{ip.subnet_name}</div>
                                                <div className="text-xs font-mono text-slate-400 dark:text-slate-500">{ip.subnet_cidr}</div>
                                            </td>
                                            <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-300">
                                                {ip.dns_name || <span className="text-slate-300 dark:text-slate-600">—</span>}
                                            </td>
                                            <td className="px-5 py-3">
                                                {ip.architecture ? (
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ARCH_BADGE[ip.architecture] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                        {ip.architecture}
                                                    </span>
                                                ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                            </td>
                                            <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-300">
                                                {ip.function || <span className="text-slate-300 dark:text-slate-600">—</span>}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => setEditingIp(ip)}
                                                        className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                                    >{t('edit')}</button>
                                                    <button
                                                        onClick={(e) => handleDeleteIp(e, ip.id, ip.ip_address)}
                                                        className="text-xs font-medium text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                    >{t('delete')}</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredIps.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-5 py-20 text-center bg-white dark:bg-slate-900">
                                                <div className="flex flex-col items-center gap-3 text-slate-300 dark:text-slate-700">
                                                    <Search size={28} strokeWidth={1.5} />
                                                    <p className="text-sm text-slate-400 dark:text-slate-500">
                                                        {searchTerm ? t('no_results') : t('no_ips_in_subnet')}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3">
                        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                            <Network size={28} className="text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                        </div>
                        <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">{t('select_subnet_prompt')}</p>
                    </div>
                )}
            </div>

            {/* ── Subnet Modal ─────────────────────────────────────────────────── */}
            {(showSubnetModal || editingSubnet) && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                {editingSubnet ? t('edit_subnet') : t('add_subnet')}
                            </h3>
                            <button onClick={() => { setShowSubnetModal(false); setEditingSubnet(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={editingSubnet ? handleUpdateSubnet : handleCreateSubnet} className="px-6 py-5 space-y-4">
                            <div>
                                <label className={MODAL_LABEL}>Name</label>
                                <input
                                    className={MODAL_INPUT}
                                    placeholder={t('subnet_name_placeholder')}
                                    value={editingSubnet ? editingSubnet.name : newSubnet.name}
                                    onChange={e => editingSubnet ? setEditingSubnet({ ...editingSubnet, name: e.target.value }) : setNewSubnet({ ...newSubnet, name: e.target.value })}
                                    required
                                />
                            </div>
                            {!editingSubnet && (
                                <div>
                                    <label className={MODAL_LABEL}>CIDR</label>
                                    <input
                                        className={`${MODAL_INPUT} font-mono`}
                                        placeholder={t('cidr_placeholder')}
                                        value={newSubnet.cidr}
                                        onChange={e => setNewSubnet({ ...newSubnet, cidr: e.target.value })}
                                        required
                                    />
                                </div>
                            )}
                            <div>
                                <label className={MODAL_LABEL}>{t('description_placeholder')}</label>
                                <input
                                    className={MODAL_INPUT}
                                    placeholder={t('description_placeholder')}
                                    value={editingSubnet ? editingSubnet.description : newSubnet.description}
                                    onChange={e => editingSubnet ? setEditingSubnet({ ...editingSubnet, description: e.target.value }) : setNewSubnet({ ...newSubnet, description: e.target.value })}
                                />
                            </div>
                            {newSubnet.parent_id && !editingSubnet && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-lg">
                                    {t('child_subnet_of', { name: subnets.find(s => s.id === newSubnet.parent_id)?.name })}
                                </p>
                            )}
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                <button type="button" onClick={() => { setShowSubnetModal(false); setEditingSubnet(null); }} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    {t('cancel')}
                                </button>
                                <button type="submit" disabled={subnetFormLoading} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg transition-colors">
                                    {subnetFormLoading ? '…' : (editingSubnet ? t('update') : t('add'))}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── IP Modal ─────────────────────────────────────────────────────── */}
            {(showIpModal || editingIp) && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                {editingIp ? t('edit_ip_address') : t('add_ip_address')}
                            </h3>
                            <button onClick={() => { setShowIpModal(false); setEditingIp(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={editingIp ? handleUpdateIp : handleAddIp} className="px-6 py-5 space-y-4">
                            {!editingIp && (
                                <div>
                                    <label className={MODAL_LABEL}>{t('table_ip')}</label>
                                    <input
                                        className={`${MODAL_INPUT} font-mono`}
                                        placeholder={t('ip_address_placeholder')}
                                        value={newIp.ip_address}
                                        onChange={e => setNewIp({ ...newIp, ip_address: e.target.value })}
                                        required
                                    />
                                </div>
                            )}
                            <div>
                                <label className={MODAL_LABEL}>{t('table_dns')}</label>
                                <input
                                    className={MODAL_INPUT}
                                    placeholder={t('dns_name_placeholder')}
                                    value={editingIp ? editingIp.dns_name : newIp.dns_name}
                                    onChange={e => editingIp ? setEditingIp({ ...editingIp, dns_name: e.target.value }) : setNewIp({ ...newIp, dns_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={MODAL_LABEL}>{t('table_arch')}</label>
                                <select
                                    className={MODAL_INPUT}
                                    value={editingIp ? editingIp.architecture : newIp.architecture}
                                    onChange={e => editingIp ? setEditingIp({ ...editingIp, architecture: e.target.value }) : setNewIp({ ...newIp, architecture: e.target.value })}
                                >
                                    {['VM', 'Virtual', 'Bare Metal', 'Kubernetes', 'LXC', 'Docker', 'Container', 'Gateway', 'Switch', 'Router', 'Firewall', 'Load Balancer', 'Wifi', 'NFS', 'Printer', 'IoT Device', 'Server', 'Storage'].map(arch => (
                                        <option key={arch} value={arch}>
                                            {t(`arch_${arch.toLowerCase().replace(/ /g, '_').replace(/-/g, '_')}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={MODAL_LABEL}>{t('table_func')}</label>
                                <input
                                    className={MODAL_INPUT}
                                    placeholder={t('function_placeholder')}
                                    value={editingIp ? editingIp.function : newIp.function}
                                    onChange={e => editingIp ? setEditingIp({ ...editingIp, function: e.target.value }) : setNewIp({ ...newIp, function: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                <button type="button" onClick={() => { setShowIpModal(false); setEditingIp(null); }} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    {t('cancel')}
                                </button>
                                <button type="submit" disabled={ipFormLoading} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg transition-colors">
                                    {ipFormLoading ? '…' : (editingIp ? t('update') : t('add'))}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ───────────────────────────────────────────── */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm">
                        <div className="px-6 py-5">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{t('confirmation')}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {deleteConfirm.type === 'ip'
                                    ? t('delete_ip_confirm', { name: deleteConfirm.name })
                                    : t('delete_subnet_confirm', { name: deleteConfirm.name })}
                            </p>
                        </div>
                        <div className="flex justify-end gap-2 px-6 pb-5">
                            <button onClick={cancelDelete} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                {t('cancel')}
                            </button>
                            <button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                                {t('delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Context Menu ──────────────────────────────────────────────────── */}
            {contextMenu.show && (
                <div
                    className="fixed bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-50 min-w-[160px] text-sm"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors" onClick={(e) => { e.stopPropagation(); setSelectedSubnet(contextMenu.subnet); setContextMenu({ ...contextMenu, show: false }); }}>
                        {t('view')}
                    </button>
                    <button className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors" onClick={(e) => { e.stopPropagation(); setEditingSubnet(contextMenu.subnet); setContextMenu({ ...contextMenu, show: false }); }}>
                        {t('edit')}
                    </button>
                    <button className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors" onClick={(e) => { e.stopPropagation(); setNewSubnet({ ...newSubnet, parent_id: contextMenu.subnet.id }); setShowSubnetModal(true); setContextMenu({ ...contextMenu, show: false }); }}>
                        {t('add_child_subnet')}
                    </button>
                    <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                    <button className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors" onClick={(e) => { e.stopPropagation(); handleDeleteSubnet(e, contextMenu.subnet.id, contextMenu.subnet.name); setContextMenu({ ...contextMenu, show: false }); }}>
                        {t('delete')}
                    </button>
                </div>
            )}

            <SettingsModal show={showSettingsModal} onClose={() => setShowSettingsModal(false)} />

            {/* ── Toast Notifications ───────────────────────────────────────────── */}
            <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-[100]" aria-live="polite" aria-label="Notifications">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm transition-all ${
                            toast.type === 'success' ? 'bg-green-600 text-white' :
                            toast.type === 'error'   ? 'bg-red-600 text-white' :
                                                       'bg-slate-800 text-white'
                        }`}
                    >
                        {toast.type === 'success' && <CheckCircle2 size={16} className="flex-shrink-0" />}
                        {toast.type === 'error'   && <AlertCircle  size={16} className="flex-shrink-0" />}
                        {toast.type === 'info'    && <Info         size={16} className="flex-shrink-0" />}
                        <span>{toast.message}</span>
                        <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="ml-auto opacity-70 hover:opacity-100 transition-opacity" aria-label="Dismiss notification">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
