import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { Switch } from '~/components/ui/Switch';
import { isMac } from '~/utils/os';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '~/i18n';
import { useLocation } from '@remix-run/react';

// Helper to get modifier key symbols/text
const getModifierSymbol = (modifier: string): string => {
  switch (modifier) {
    case 'meta':
      return isMac ? '⌘' : 'Win';
    case 'alt':
      return isMac ? '⌥' : 'Alt';
    case 'shift':
      return '⇧';
    default:
      return modifier;
  }
};

// Define a simpler type with only the fields we need
type UserSettings = {
  notifications: boolean;
  timezone: string;
};

export default function SettingsTab() {
  const { t } = useTranslation();
  const location = useLocation();
  const [currentTimezone, setCurrentTimezone] = useState('');
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('bolt_user_profile');

      if (saved) {
        const parsedSettings = JSON.parse(saved);

        return {
          notifications: parsedSettings.notifications ?? true,
          timezone: parsedSettings.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      }
    } catch (error) {
      console.error('Error parsing user profile:', error);
    }

    // Default settings if parsing fails or no saved settings
    return {
      notifications: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  });

  // Determine current language from URL
  const currentLanguage = location.pathname.startsWith('/cn') ? 'zh' : 'en';

  useEffect(() => {
    setCurrentTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  // Save settings automatically when they change, excluding language
  useEffect(() => {
    try {
      // Get existing profile data, with error handling
      let existingProfile = {};

      try {
        const savedProfile = localStorage.getItem('bolt_user_profile');

        if (savedProfile) {
          existingProfile = JSON.parse(savedProfile);
        }
      } catch (parseError) {
        console.error('Error parsing existing profile, using empty object:', parseError);
      }

      // Merge with new settings (excluding language)
      const updatedProfile = {
        ...existingProfile,
        notifications: settings.notifications,
        timezone: settings.timezone,
      };

      localStorage.setItem('bolt_user_profile', JSON.stringify(updatedProfile));
      toast.success(t('settings.settingsUpdated'));
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t('settings.failedToUpdate'));
    }
  }, [settings, t]);

  // Handle language change - only changes URL
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    changeLanguage(newLanguage);
  };

  return (
    <div className="space-y-4">
      {/* Language & Notifications */}
      <motion.div
        className="bg-white dark:bg-[#0A0A0A] rounded-lg shadow-sm dark:shadow-none p-4 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="i-ph:palette-fill w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-bolt-elements-textPrimary">{t('settings.preferences')}</span>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="i-ph:translate-fill w-4 h-4 text-bolt-elements-textSecondary" />
            <label className="block text-sm text-bolt-elements-textSecondary">{t('settings.language')}</label>
          </div>
          <select
            value={currentLanguage}
            onChange={handleLanguageChange}
            className={classNames(
              'w-full px-3 py-2 rounded-lg text-sm',
              'bg-[#FAFAFA] dark:bg-[#0A0A0A]',
              'border border-[#E5E5E5] dark:border-[#1A1A1A]',
              'text-bolt-elements-textPrimary',
              'focus:outline-none focus:ring-2 focus:ring-purple-500/30',
              'transition-all duration-200',
            )}
          >
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="i-ph:bell-fill w-4 h-4 text-bolt-elements-textSecondary" />
            <label className="block text-sm text-bolt-elements-textSecondary">
              {t('settings.notifications.title')}
            </label>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-bolt-elements-textSecondary">
              {settings.notifications ? t('settings.notifications.enabled') : t('settings.notifications.disabled')}
            </span>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) => {
                // Update local state
                setSettings((prev) => ({ ...prev, notifications: checked }));

                // Update localStorage immediately with error handling
                try {
                  let existingProfile = {};

                  try {
                    const savedProfile = localStorage.getItem('bolt_user_profile');

                    if (savedProfile) {
                      existingProfile = JSON.parse(savedProfile);
                    }
                  } catch (parseError) {
                    console.error('Error parsing existing profile for notification update:', parseError);
                  }

                  const updatedProfile = {
                    ...existingProfile,
                    notifications: checked,
                  };

                  localStorage.setItem('bolt_user_profile', JSON.stringify(updatedProfile));

                  // Dispatch storage event for other components
                  window.dispatchEvent(
                    new StorageEvent('storage', {
                      key: 'bolt_user_profile',
                      newValue: JSON.stringify(updatedProfile),
                    }),
                  );

                  toast.success(
                    checked ? t('settings.notifications.toast.enabled') : t('settings.notifications.toast.disabled'),
                  );
                } catch (error) {
                  console.error('Error updating notifications setting:', error);
                  toast.error(t('settings.failedToUpdate'));
                }
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Timezone */}
      <motion.div
        className="bg-white dark:bg-[#0A0A0A] rounded-lg shadow-sm dark:shadow-none p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="i-ph:clock-fill w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-bolt-elements-textPrimary">{t('settings.timeSettings')}</span>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="i-ph:globe-fill w-4 h-4 text-bolt-elements-textSecondary" />
            <label className="block text-sm text-bolt-elements-textSecondary">{t('settings.timezone')}</label>
          </div>
          <select
            value={settings.timezone}
            onChange={(e) => setSettings((prev) => ({ ...prev, timezone: e.target.value }))}
            className={classNames(
              'w-full px-3 py-2 rounded-lg text-sm',
              'bg-[#FAFAFA] dark:bg-[#0A0A0A]',
              'border border-[#E5E5E5] dark:border-[#1A1A1A]',
              'text-bolt-elements-textPrimary',
              'focus:outline-none focus:ring-2 focus:ring-purple-500/30',
              'transition-all duration-200',
            )}
          >
            <option value={currentTimezone}>{currentTimezone}</option>
          </select>
        </div>
      </motion.div>

      {/* Simplified Keyboard Shortcuts */}
      <motion.div
        className="bg-white dark:bg-[#0A0A0A] rounded-lg shadow-sm dark:shadow-none p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="i-ph:keyboard-fill w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-bolt-elements-textPrimary">{t('settings.keyboardShortcuts')}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAFAFA] dark:bg-[#1A1A1A]">
            <div className="flex flex-col">
              <span className="text-sm text-bolt-elements-textPrimary">{t('settings.toggleTheme')}</span>
              <span className="text-xs text-bolt-elements-textSecondary">{t('settings.toggleThemeDescription')}</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 text-xs font-semibold text-bolt-elements-textSecondary bg-white dark:bg-[#0A0A0A] border border-[#E5E5E5] dark:border-[#1A1A1A] rounded shadow-sm">
                {getModifierSymbol('meta')}
              </kbd>
              <kbd className="px-2 py-1 text-xs font-semibold text-bolt-elements-textSecondary bg-white dark:bg-[#0A0A0A] border border-[#E5E5E5] dark:border-[#1A1A1A] rounded shadow-sm">
                {getModifierSymbol('alt')}
              </kbd>
              <kbd className="px-2 py-1 text-xs font-semibold text-bolt-elements-textSecondary bg-white dark:bg-[#0A0A0A] border border-[#E5E5E5] dark:border-[#1A1A1A] rounded shadow-sm">
                {getModifierSymbol('shift')}
              </kbd>
              <kbd className="px-2 py-1 text-xs font-semibold text-bolt-elements-textSecondary bg-white dark:bg-[#0A0A0A] border border-[#E5E5E5] dark:border-[#1A1A1A] rounded shadow-sm">
                D
              </kbd>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
