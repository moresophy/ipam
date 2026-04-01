import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import api from '../api';

const FIELD = 'w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow';
const LABEL = 'block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5';

const SettingsModal = ({ show, onClose }) => {
    const { t, i18n } = useTranslation();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [defaultCidr, setDefaultCidr] = useState(() => localStorage.getItem('defaultCidr') || '');

    if (!show) return null;

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        i18n.changeLanguage(newLang);
        localStorage.setItem('i18nextLng', newLang);
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
        if (newPassword !== confirmPassword) {
            setPasswordError(t('passwords_do_not_match', 'Passwords do not match'));
            return;
        }
        try {
            await api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword });
            setPasswordSuccess(t('password_changed_success', 'Password changed successfully'));
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPasswordError(err.response?.data?.msg || t('password_change_failed', 'Failed to change password'));
        }
    };

    const handleSave = () => {
        localStorage.setItem('defaultCidr', defaultCidr);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t('settings')}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-6 overflow-y-auto max-h-[calc(100vh-180px)]">
                    {/* Language */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">{t('language')}</h3>
                        <select
                            value={i18n.resolvedLanguage || i18n.language}
                            onChange={handleLanguageChange}
                            className={FIELD}
                        >
                            <option value="en">English</option>
                            <option value="de">Deutsch</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="zh">中文</option>
                            <option value="ja">日本語</option>
                            <option value="ru">Русский</option>
                            <option value="pt">Português</option>
                        </select>
                    </div>

                    {/* Preferences */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">{t('preferences')}</h3>
                        <div>
                            <label className={LABEL}>{t('default_cidr')}</label>
                            <input
                                type="text"
                                value={defaultCidr}
                                onChange={(e) => setDefaultCidr(e.target.value)}
                                placeholder="e.g. 24"
                                className={FIELD}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">{t('change_password')}</h3>
                        <form onSubmit={handlePasswordChange} className="space-y-3">
                            <div>
                                <label className={LABEL}>{t('current_password')}</label>
                                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={FIELD} required />
                            </div>
                            <div>
                                <label className={LABEL}>{t('new_password')}</label>
                                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={FIELD} required />
                            </div>
                            <div>
                                <label className={LABEL}>{t('confirm_password')}</label>
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={FIELD} required />
                            </div>
                            {passwordError && (
                                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{passwordError}</p>
                            )}
                            {passwordSuccess && (
                                <p className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">{passwordSuccess}</p>
                            )}
                            <button type="submit" className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                                {t('update_password')}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        {t('cancel')}
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                        {t('save_preferences')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
