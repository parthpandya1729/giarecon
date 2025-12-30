import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe, Loader2 } from 'lucide-react'
import Card from '@/shared/components/Card'
import Button from '@/shared/components/Button'
import { useConfigStore } from '../store/configStore'

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'America/New_York', label: 'America/New York (EST)' },
  { value: 'America/Los_Angeles', label: 'America/Los Angeles (PST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Asia/Seoul', label: 'Asia/Seoul (KST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
];

const DATE_FORMATS = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-01-15)', example: '2025-01-15' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (15/01/2025)', example: '15/01/2025' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (01/15/2025)', example: '01/15/2025' },
  { value: 'DD-MMM-YYYY', label: 'DD-MMM-YYYY (15-Jan-2025)', example: '15-Jan-2025' },
  { value: 'MMMM DD, YYYY', label: 'MMMM DD, YYYY (January 15, 2025)', example: 'January 15, 2025' },
];

const CURRENCY_FORMATS = [
  { value: 'INR', label: 'INR - Indian Rupee (₹)', symbol: '₹' },
  { value: 'USD', label: 'USD - US Dollar ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound (£)', symbol: '£' },
  { value: 'JPY', label: 'JPY - Japanese Yen (¥)', symbol: '¥' },
  { value: 'KRW', label: 'KRW - South Korean Won (₩)', symbol: '₩' },
  { value: 'AUD', label: 'AUD - Australian Dollar (A$)', symbol: 'A$' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ko', label: '한국어 (Korean)' },
  { value: 'ja', label: '日本語 (Japanese)' },
  { value: 'zh', label: '中文 (Chinese)' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
];

export const SystemPreferences: React.FC = () => {
  const { config, updateSection, saveConfig, isSaving, hasUnsavedChanges } = useConfigStore();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const preferences = config.preferences;

  const handleChange = (field: string, value: string) => {
    updateSection('preferences', { [field]: value });
  };

  const handleSave = async () => {
    setSaveSuccess(false);
    setSaveError(null);

    try {
      await saveConfig('preferences', preferences);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save');
      setTimeout(() => setSaveError(null), 5000);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Globe className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">System Preferences</h3>
          <p className="text-sm text-gray-500">Customize regional and display settings</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Regional Settings */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Regional Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={preferences.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                All timestamps will be displayed in this timezone
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={preferences.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Interface language (currently English only)
              </p>
            </div>
          </div>
        </div>

        {/* Format Settings */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Format Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Format
              </label>
              <select
                value={preferences.dateFormat}
                onChange={(e) => handleChange('dateFormat', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {DATE_FORMATS.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Preview: {DATE_FORMATS.find((f) => f.value === preferences.dateFormat)?.example}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={preferences.currencyFormat}
                onChange={(e) => handleChange('currencyFormat', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {CURRENCY_FORMATS.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Preview: {CURRENCY_FORMATS.find((c) => c.value === preferences.currencyFormat)?.symbol}
                1,234.56
              </p>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Appearance</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={preferences.theme === 'light'}
                  onChange={(e) => handleChange('theme', e.target.value)}
                  className="sr-only peer"
                />
                <div className="border-2 border-gray-300 rounded-lg p-4 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 hover:border-gray-400 transition-colors">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-white border-2 border-gray-200 rounded-lg shadow-sm"></div>
                    <span className="text-sm font-medium text-gray-700">Light</span>
                  </div>
                </div>
              </label>

              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={preferences.theme === 'dark'}
                  onChange={(e) => handleChange('theme', e.target.value)}
                  className="sr-only peer"
                />
                <div className="border-2 border-gray-300 rounded-lg p-4 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 hover:border-gray-400 transition-colors">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gray-800 border-2 border-gray-700 rounded-lg shadow-sm"></div>
                    <span className="text-sm font-medium text-gray-700">Dark</span>
                  </div>
                </div>
              </label>

              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value="auto"
                  checked={preferences.theme === 'auto'}
                  onChange={(e) => handleChange('theme', e.target.value)}
                  className="sr-only peer"
                />
                <div className="border-2 border-gray-300 rounded-lg p-4 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 hover:border-gray-400 transition-colors">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gradient-to-r from-white to-gray-800 border-2 border-gray-300 rounded-lg shadow-sm"></div>
                    <span className="text-sm font-medium text-gray-700">Auto</span>
                  </div>
                </div>
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Auto mode will match your system preferences
            </p>
          </div>
        </div>

        {/* Preview Box */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4">
          <h5 className="text-sm font-semibold text-indigo-900 mb-3">Preview</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium text-gray-900">
                {DATE_FORMATS.find((f) => f.value === preferences.dateFormat)?.example}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium text-gray-900">
                {CURRENCY_FORMATS.find((c) => c.value === preferences.currencyFormat)?.symbol}
                1,234.56
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time:</span>
              <span className="font-medium text-gray-900">
                {new Date().toLocaleTimeString('en-US', {
                  timeZone: preferences.timezone,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-success-600 text-sm font-medium"
            >
              Saved successfully
            </motion.div>
          )}

          {saveError && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-error-600 text-sm font-medium"
            >
              {saveError}
            </motion.div>
          )}

          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
