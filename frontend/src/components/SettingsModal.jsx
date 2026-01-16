import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save } from 'lucide-react';
import api from '../api';

const SettingsModal = ({ show, onClose }) => {
    const { t, i18n } = useTranslation();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Preferences
    const [defaultCidr, setDefaultCidr] = useState(localStorage.getItem('defaultCidr') || '');

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
            setPasswordError(t('passwords_do_not_match', 'Passwörter stimmen nicht überein'));
            return;
        }

        try {
            await api.post('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword
            });
            setPasswordSuccess(t('password_changed_success', 'Passwort erfolgreich geändert'));
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPasswordError(err.response?.data?.msg || t('password_change_failed', 'Fehler beim Ändern des Passworts'));
        }
    };

    const handleSavePreferences = () => {
        localStorage.setItem('defaultCidr', defaultCidr);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-[500px] max-w-full">
                <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2">
                    <h2 className="text-xl font-bold dark:text-white">{t('settings')}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Language Settings */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 dark:text-gray-200">{t('language')}</h3>
                        <select
                            value={i18n.language}
                            onChange={handleLanguageChange}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                        <h3 className="text-lg font-semibold mb-2 dark:text-gray-200">{t('preferences')}</h3>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-600 dark:text-gray-400">{t('default_cidr')}</label>
                            <input
                                type="text"
                                value={defaultCidr}
                                onChange={(e) => setDefaultCidr(e.target.value)}
                                placeholder="e.g., 24"
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Password Change */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 dark:text-gray-200">{t('change_password')}</h3>
                        <form onSubmit={handlePasswordChange} className="space-y-3">
                            <input
                                type="password"
                                placeholder={t('current_password')}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                            <input
                                type="password"
                                placeholder={t('new_password')}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                            <input
                                type="password"
                                placeholder={t('confirm_password')}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                            {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                            {passwordSuccess && <p className="text-green-500 text-sm">{passwordSuccess}</p>}
                            <button
                                type="submit"
                                className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors"
                            >
                                {t('update_password')}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSavePreferences}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
                    >
                        <Save size={18} />
                        {t('save_preferences')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
