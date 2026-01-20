import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Edit2, Plus, Trash2, Sun, Moon, LogOut, Search, Settings, FileSpreadsheet, Download, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SettingsModal from './SettingsModal';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

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

    // Form states
    const [newSubnet, setNewSubnet] = useState({ name: '', cidr: '', description: '', parent_id: null });
    const [newIp, setNewIp] = useState({ ip_address: '', dns_name: '', architecture: 'VM', function: '' });

    useEffect(() => {
        fetchSubnets();
    }, []);

    // Resize handlers
    const startResizing = React.useCallback((mouseDownEvent) => {
        setIsResizing(true);
    }, []);

    const stopResizing = React.useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = React.useCallback((mouseMoveEvent) => {
        if (isResizing) {
            const newWidth = mouseMoveEvent.clientX - sidebarRef.current.getBoundingClientRect().left;
            if (newWidth > 160 && newWidth < 600) {
                setSidebarWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    useEffect(() => {
        const handleClick = () => {
            if (contextMenu.show) setContextMenu({ ...contextMenu, show: false });
        };
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [contextMenu]);

    useEffect(() => {
        if (selectedSubnet) {
            fetchIps(selectedSubnet.id);
        } else {
            setIps([]);
        }
    }, [selectedSubnet]);

    const fetchSubnets = async () => {
        try {
            const res = await api.get('/subnets');
            setSubnets(res.data);
        } catch (err) {
            console.error("Failed to fetch subnets", err);
        }
    };

    const fetchIps = async (subnetId) => {
        try {
            const res = await api.get(`/subnets/${subnetId}/ips`);
            setIps(res.data);
        } catch (err) {
            console.error("Failed to fetch IPs", err);
        }
    };

    const handleCreateSubnet = async (e) => {
        e.preventDefault();
        try {
            await api.post('/subnets', newSubnet);
            setShowSubnetModal(false);
            setNewSubnet({ name: '', cidr: '', description: '', parent_id: null });
            fetchSubnets();
        } catch (err) {
            alert(err.response?.data?.msg || "Fehler beim Erstellen des Subnetzes");
        }
    };

    const handleUpdateSubnet = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/subnets/${editingSubnet.id}`, editingSubnet);
            setEditingSubnet(null);
            fetchSubnets();
            if (selectedSubnet?.id === editingSubnet.id) {
                setSelectedSubnet({ ...selectedSubnet, ...editingSubnet });
            }
        } catch (err) {
            alert(err.response?.data?.msg || "Fehler beim Aktualisieren des Subnetzes");
        }
    };

    const handleAddIp = async (e) => {
        e.preventDefault();
        try {
            await api.post('/ips', { ...newIp, subnet_id: selectedSubnet.id });
            setShowIpModal(false);
            setNewIp({ ip_address: '', dns_name: '', architecture: 'VM', function: '' });
            fetchIps(selectedSubnet.id);
        } catch (err) {
            alert(err.response?.data?.msg || "Fehler beim Hinzufügen der IP");
        }
    };

    const handleUpdateIp = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/ips/${editingIp.id}`, editingIp);
            setEditingIp(null);
            fetchIps(selectedSubnet.id);
        } catch (err) {
            alert(err.response?.data?.msg || "Fehler beim Aktualisieren der IP");
        }
    };

    const handleDeleteIp = (e, id, ipAddress) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteConfirm({ show: true, type: 'ip', id, name: ipAddress });
    };

    const handleDeleteSubnet = (e, id, name) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteConfirm({ show: true, type: 'subnet', id, name });
    };

    const confirmDelete = async () => {
        const { type, id } = deleteConfirm;
        setDeleteConfirm({ show: false, type: null, id: null, name: '' });

        try {
            if (type === 'ip') {
                await api.delete(`/ips/${id}`);
                fetchIps(selectedSubnet.id);
            } else if (type === 'subnet') {
                await api.delete(`/subnets/${id}`);
                if (selectedSubnet?.id === id) setSelectedSubnet(null);
                fetchSubnets();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirm({ show: false, type: null, id: null, name: '' });
    };

    const handleContextMenu = (e, subnet) => {
        e.preventDefault();
        setContextMenu({ show: true, x: e.pageX, y: e.pageY, subnet });
    };

    const toggleCollapse = (e, id) => {
        e.stopPropagation();
        setCollapsedSubnets(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const organizeSubnets = () => {
        const topLevel = subnets.filter(s => !s.parent_id);
        const withChildren = topLevel.map(parent => ({
            ...parent,
            children: subnets.filter(s => s.parent_id === parent.id)
        }));
        return withChildren;
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
            console.error("Export failed", error);
            alert(t('export_failed', 'Export Failed'));
        }
    };

    const handleImportClick = () => {
        fileInputRef.current.click();
        setShowImportExportMenu(false);
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setImportLoading(true);
        try {
            const res = await api.post('/import/ips', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert(`${t('import_success')}\nSuccess: ${res.data.success_count}\nErrors: ${res.data.errors.length}`);
            if (selectedSubnet) fetchIps(selectedSubnet.id);
        } catch (error) {
            console.error("Import failed", error);
            alert(error.response?.data?.msg || t('import_failed'));
        } finally {
            setImportLoading(false);
            event.target.value = null; // Reset input
        }
    };

    const filteredIps = ips.filter(ip =>
        ip.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ip.dns_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ip.architecture?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ip.function?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ip.subnet_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ip.subnet_cidr?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderSubnetTree = (subnet, level = 0) => {
        const hasChildren = subnet.children && subnet.children.length > 0;
        const isCollapsed = collapsedSubnets.has(subnet.id);

        return (
            <React.Fragment key={subnet.id}>
                <li
                    className={`py-1.5 px-2 cursor-pointer rounded-md mb-0.5 flex items-center group transition-colors duration-150 ${selectedSubnet?.id === subnet.id ? 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 dark:text-gray-300'}`}
                    style={{ paddingLeft: `${level * 12 + 8}px` }}
                    onClick={() => setSelectedSubnet(subnet)}
                    onContextMenu={(e) => handleContextMenu(e, subnet)}
                >
                    <div className="flex items-center flex-1 overflow-hidden">
                        {hasChildren ? (
                            <span
                                onClick={(e) => toggleCollapse(e, subnet.id)}
                                className="mr-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            >
                                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                            </span>
                        ) : <span className="w-[14px] mr-1.5"></span>}
                        <span className="truncate flex-1">
                            <span className="font-medium text-base">{subnet.name}</span> <span className="text-xs text-gray-500 dark:text-gray-500 ml-1 font-mono hidden group-hover:inline opacity-70">({subnet.cidr})</span>
                        </span>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => { e.stopPropagation(); setEditingSubnet(subnet); }}
                            className="p-1 text-gray-400 hover:text-blue-500 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title={t('edit')}
                        >
                            <Edit2 size={12} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setNewSubnet({ ...newSubnet, parent_id: subnet.id });
                                setShowSubnetModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-green-500 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title={t('add_child_subnet')}
                        >
                            <Plus size={12} />
                        </button>
                        <button
                            onClick={(e) => handleDeleteSubnet(e, subnet.id, subnet.name)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title={t('delete')}
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </li>
                {hasChildren && !isCollapsed && subnet.children.map(child => renderSubnetTree(child, level + 1))}
            </React.Fragment>
        );
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            {/* Sidebar */}
            <div
                ref={sidebarRef}
                className="bg-white dark:bg-gray-800 shadow-md flex flex-col transition-colors duration-200 relative"
                style={{ width: sidebarWidth }}
            >
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center h-16">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        IPAM
                    </h1>
                    <div className="flex items-center gap-2">
                        <div className="relative flex items-center">
                            <button onClick={() => setShowImportExportMenu(!showImportExportMenu)} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors" title={t('import_export')}>
                                <FileSpreadsheet size={20} />
                            </button>
                            {showImportExportMenu && (
                                <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border dark:border-gray-700">
                                    <button
                                        onClick={handleExport}
                                        className="w-full text-left px-4 py-2 text-base text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                        <Download size={16} /> {t('export_csv')}
                                    </button>
                                    <button
                                        onClick={handleImportClick}
                                        className="w-full text-left px-4 py-2 text-base text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                        <Upload size={16} /> {t('import_csv')}
                                    </button>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".csv"
                            />
                        </div>
                        <button onClick={() => setShowSettingsModal(true)} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors" title={t('settings')}>
                            <Settings size={20} />
                        </button>
                        <button onClick={toggleTheme} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <button onClick={logout} className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors" title={t('logout')}>
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
                <div className="p-3 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <div className="flex justify-between items-center mb-2 px-2">
                        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('subnets')}</h2>
                        <button
                            onClick={() => { setNewSubnet({ name: '', cidr: '', description: '', parent_id: null }); setShowSubnetModal(true); }}
                            className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-500 rounded transition-colors"
                            title={t('new_root_subnet')}
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                    <ul>
                        {organizeSubnets().map(subnet => renderSubnetTree(subnet))}
                    </ul>
                </div>
                <div className="p-4 border-t dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        {t('signed_in_as', { name: user })}
                    </div>
                </div>

                {/* Resizer Handle */}
                <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-10"
                    onMouseDown={startResizing}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                {selectedSubnet ? (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedSubnet.name}</h2>
                                <p className="text-base text-gray-600 dark:text-gray-300">{selectedSubnet.cidr} - {selectedSubnet.description}</p>
                            </div>
                            <button
                                onClick={() => setShowIpModal(true)}
                                className="bg-indigo-600 text-white px-4 py-2 text-base rounded-md hover:bg-indigo-700 shadow-sm transition-colors dark:bg-indigo-500 dark:hover:bg-indigo-600"
                            >
                                <Plus size={20} className="inline mr-1" />
                                {t('add_ip_address')}
                            </button>
                        </div>

                        {/* Search */}
                        <div className="mb-4 relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search size={18} className="text-gray-400" />
                            </span>
                            <input
                                type="text"
                                placeholder={t('search_placeholder')}
                                className="w-full pl-10 p-2 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-shadow"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="bg-white rounded shadow overflow-hidden">
                            <table className="min-w-full leading-normal">
                                <thead>
                                    <tr>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-left text-sm font-bold text-gray-600 dark:text-white uppercase tracking-wider">{t('table_ip')}</th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-left text-sm font-bold text-gray-600 dark:text-white uppercase tracking-wider">{t('subnets')}</th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-left text-sm font-bold text-gray-600 dark:text-white uppercase tracking-wider">{t('table_dns')}</th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-left text-sm font-bold text-gray-600 dark:text-white uppercase tracking-wider">{t('table_arch')}</th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-left text-sm font-bold text-gray-600 dark:text-white uppercase tracking-wider">{t('table_func')}</th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-left text-sm font-bold text-gray-600 dark:text-white uppercase tracking-wider">{t('table_actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredIps.map(ip => (
                                        <tr key={ip.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                            <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-base font-mono dark:text-white">{ip.ip_address}</td>
                                            <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-medium text-gray-900 dark:text-white">
                                                        {ip.subnet_name}
                                                    </span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {ip.subnet_cidr}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-base dark:text-white">{ip.dns_name}</td>
                                            <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-base">
                                                <span className="relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
                                                    <span aria-hidden className="absolute inset-0 bg-green-200 opacity-50 rounded-full"></span>
                                                    <span className="relative">{ip.architecture}</span>
                                                </span>
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-base dark:text-white">{ip.function}</td>
                                            <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-base">
                                                <button
                                                    onClick={() => setEditingIp(ip)}
                                                    className="text-blue-600 hover:text-blue-900 mr-3 dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    Bearbeiten
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteIp(e, ip.id, ip.ip_address)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                >
                                                    Löschen
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredIps.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-base text-center text-gray-500 dark:text-gray-400">
                                                {searchTerm ? 'Keine Ergebnisse gefunden.' : 'Keine IP-Adressen in diesem Subnetz zugewiesen.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-lg">
                        Wählen Sie ein Subnetz aus, um Details anzuzeigen
                    </div>
                )}
            </div>

            {/* Subnet Modal (Create/Edit) */}
            {(showSubnetModal || editingSubnet) && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96">
                        <h3 className="text-xl font-bold mb-4 dark:text-white">
                            {editingSubnet ? 'Subnetz bearbeiten' : 'Subnetz hinzufügen'}
                        </h3>
                        <form onSubmit={editingSubnet ? handleUpdateSubnet : handleCreateSubnet}>
                            <input
                                className="w-full mb-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Name (z.B. Produktion)"
                                value={editingSubnet ? editingSubnet.name : newSubnet.name}
                                onChange={e => editingSubnet ? setEditingSubnet({ ...editingSubnet, name: e.target.value }) : setNewSubnet({ ...newSubnet, name: e.target.value })}
                                required
                            />
                            {!editingSubnet && (
                                <input
                                    className="w-full mb-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="CIDR (z.B. 192.168.1.0/24)"
                                    value={newSubnet.cidr}
                                    onChange={e => setNewSubnet({ ...newSubnet, cidr: e.target.value })}
                                    required
                                />
                            )}
                            <input
                                className="w-full mb-4 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Beschreibung"
                                value={editingSubnet ? editingSubnet.description : newSubnet.description}
                                onChange={e => editingSubnet ? setEditingSubnet({ ...editingSubnet, description: e.target.value }) : setNewSubnet({ ...newSubnet, description: e.target.value })}
                            />
                            {newSubnet.parent_id && !editingSubnet && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    Untersubnetz von: {subnets.find(s => s.id === newSubnet.parent_id)?.name}
                                </p>
                            )}
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowSubnetModal(false); setEditingSubnet(null); }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    {editingSubnet ? 'Aktualisieren' : 'Erstellen'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* IP Modal (Create/Edit) */}
            {(showIpModal || editingIp) && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96">
                        <h3 className="text-xl font-bold mb-4 dark:text-white">
                            {editingIp ? 'IP-Adresse bearbeiten' : 'IP-Adresse hinzufügen'}
                        </h3>
                        <form onSubmit={editingIp ? handleUpdateIp : handleAddIp}>
                            {!editingIp && (
                                <input
                                    className="w-full mb-3 p-2 text-base border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="IP-Adresse"
                                    value={newIp.ip_address}
                                    onChange={e => setNewIp({ ...newIp, ip_address: e.target.value })}
                                    required
                                />
                            )}
                            <input
                                className="w-full mb-3 p-2 text-base border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="DNS-Name"
                                value={editingIp ? editingIp.dns_name : newIp.dns_name}
                                onChange={e => editingIp ? setEditingIp({ ...editingIp, dns_name: e.target.value }) : setNewIp({ ...newIp, dns_name: e.target.value })}
                            />
                            <select
                                className="w-full mb-3 p-2 text-base border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={editingIp ? editingIp.architecture : newIp.architecture}
                                onChange={e => editingIp ? setEditingIp({ ...editingIp, architecture: e.target.value }) : setNewIp({ ...newIp, architecture: e.target.value })}
                            >
                                {['VM', 'Virtual', 'Bare Metal', 'Kubernetes', 'LXC', 'Docker', 'Container', 'Gateway', 'Switch', 'Router', 'Firewall', 'Load Balancer', 'Wifi', 'NFS', 'Printer', 'IoT Device', 'Server', 'Storage'].map(arch => (
                                    <option key={arch} value={arch}>
                                        {t(`arch_${arch.toLowerCase().replace(/ /g, '_')}`)}
                                    </option>
                                ))}
                            </select>
                            <input
                                className="w-full mb-5 p-2 text-base border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Funktion (z.B. Webserver)"
                                value={editingIp ? editingIp.function : newIp.function}
                                onChange={e => editingIp ? setEditingIp({ ...editingIp, function: e.target.value }) : setNewIp({ ...newIp, function: e.target.value })}
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowIpModal(false); setEditingIp(null); }}
                                    className="px-4 py-2 text-base text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-base bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
                                >
                                    {editingIp ? 'Aktualisieren' : 'Hinzufügen'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">Bestätigung</h3>
                        <p className="mb-6 dark:text-gray-300">
                            {deleteConfirm.type === 'ip'
                                ? `Möchten Sie die IP-Adresse "${deleteConfirm.name}" wirklich löschen?`
                                : `Möchten Sie das Subnetz "${deleteConfirm.name}" und alle zugehörigen IP-Adressen wirklich löschen?`
                            }
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Löschen
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Context Menu */}
            {contextMenu.show && (
                <div
                    className="fixed bg-white shadow-lg rounded border py-1 z-50 text-sm min-w-[150px]"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 block"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubnet(contextMenu.subnet);
                            setContextMenu({ ...contextMenu, show: false });
                        }}
                    >
                        Anzeigen
                    </button>
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 block"
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingSubnet(contextMenu.subnet);
                            setContextMenu({ ...contextMenu, show: false });
                        }}
                    >
                        Bearbeiten
                    </button>
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 block"
                        onClick={(e) => {
                            e.stopPropagation();
                            setNewSubnet({ ...newSubnet, parent_id: contextMenu.subnet.id });
                            setShowSubnetModal(true);
                            setContextMenu({ ...contextMenu, show: false });
                        }}
                    >
                        Add Untersubnetz
                    </button>
                    <div className="border-t my-1"></div>
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 block"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubnet(e, contextMenu.subnet.id, contextMenu.subnet.name);
                            setContextMenu({ ...contextMenu, show: false });
                        }}
                    >
                        Löschen
                    </button>
                </div>
            )}

            {/* Modals */}
            <SettingsModal show={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
        </div>
    );
};

export default Dashboard;
