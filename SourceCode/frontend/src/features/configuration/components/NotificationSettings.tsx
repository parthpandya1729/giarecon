import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, X, Plus, Loader2 } from 'lucide-react'
import Card from '@/shared/components/Card'
import Button from '@/shared/components/Button'
import { useConfigStore } from '../store/configStore'

export const NotificationSettings: React.FC = () => {
  const { config, updateSection, saveConfig, isSaving, hasUnsavedChanges } = useConfigStore();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newRecipient, setNewRecipient] = useState('');
  const [recipientError, setRecipientError] = useState<string | null>(null);

  const notificationConfig = config.notifications;

  const handleChange = (field: string, value: boolean | string[]) => {
    updateSection('notifications', { [field]: value });
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddRecipient = () => {
    setRecipientError(null);

    if (!newRecipient.trim()) {
      setRecipientError('Email address is required');
      return;
    }

    if (!validateEmail(newRecipient.trim())) {
      setRecipientError('Invalid email format');
      return;
    }

    if (notificationConfig.recipients.includes(newRecipient.trim())) {
      setRecipientError('This email is already added');
      return;
    }

    handleChange('recipients', [...notificationConfig.recipients, newRecipient.trim()]);
    setNewRecipient('');
  };

  const handleRemoveRecipient = (email: string) => {
    handleChange(
      'recipients',
      notificationConfig.recipients.filter((r) => r !== email)
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddRecipient();
    }
  };

  const handleSave = async () => {
    setSaveSuccess(false);
    setSaveError(null);

    try {
      await saveConfig('notifications', notificationConfig);
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
        <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
          <Bell className="w-5 h-5 text-warning-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
          <p className="text-sm text-gray-500">Configure how and when you receive notifications</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Notification Channels */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Notification Channels</h4>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="emailNotifications"
                  type="checkbox"
                  checked={notificationConfig.emailNotifications}
                  onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                  className="w-4 h-4 text-benow-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-benow-blue-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
                  Email Notifications
                </label>
                <p className="text-xs text-gray-500">
                  Receive notifications via email to configured recipients
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Notification Events */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Notify On</h4>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="notifyOnSuccess"
                  type="checkbox"
                  checked={notificationConfig.notifyOnSuccess}
                  onChange={(e) => handleChange('notifyOnSuccess', e.target.checked)}
                  className="w-4 h-4 text-success-600 bg-gray-100 border-gray-300 rounded focus:ring-success-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="notifyOnSuccess" className="text-sm font-medium text-gray-700">
                  Successful Reconciliation
                </label>
                <p className="text-xs text-gray-500">
                  Notify when reconciliation completes successfully with no issues
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="notifyOnWarning"
                  type="checkbox"
                  checked={notificationConfig.notifyOnWarning}
                  onChange={(e) => handleChange('notifyOnWarning', e.target.checked)}
                  className="w-4 h-4 text-warning-600 bg-gray-100 border-gray-300 rounded focus:ring-warning-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="notifyOnWarning" className="text-sm font-medium text-gray-700">
                  Warnings or Discrepancies
                </label>
                <p className="text-xs text-gray-500">
                  Notify when reconciliation finds warnings or minor discrepancies
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="notifyOnError"
                  type="checkbox"
                  checked={notificationConfig.notifyOnError}
                  onChange={(e) => handleChange('notifyOnError', e.target.checked)}
                  className="w-4 h-4 text-error-600 bg-gray-100 border-gray-300 rounded focus:ring-error-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="notifyOnError" className="text-sm font-medium text-gray-700">
                  Errors or Failures
                </label>
                <p className="text-xs text-gray-500">
                  Notify when reconciliation fails or encounters critical errors
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recipients */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Recipients</h4>

          {/* Add Recipient */}
          <div className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="email"
                  value={newRecipient}
                  onChange={(e) => {
                    setNewRecipient(e.target.value);
                    setRecipientError(null);
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-benow-blue-500 focus:border-benow-blue-500"
                />
                {recipientError && (
                  <p className="mt-1 text-xs text-error-600">{recipientError}</p>
                )}
              </div>
              <Button variant="secondary" onClick={handleAddRecipient}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Recipients List */}
          {notificationConfig.recipients.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {notificationConfig.recipients.map((recipient) => (
                <motion.div
                  key={recipient}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-benow-blue-100 text-benow-blue-700 rounded-full text-sm"
                >
                  <span>{recipient}</span>
                  <button
                    onClick={() => handleRemoveRecipient(recipient)}
                    className="hover:bg-benow-blue-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              No recipients added. Add at least one email address to receive notifications.
            </div>
          )}
        </div>

        {/* Warning if email notifications disabled */}
        {!notificationConfig.emailNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-error-50 border border-error-200 rounded-lg p-4"
          >
            <h5 className="text-sm font-semibold text-error-900 mb-1">Email Notifications Disabled</h5>
            <p className="text-sm text-error-800">
              Enable email notifications to receive alerts.
            </p>
          </motion.div>
        )}

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
