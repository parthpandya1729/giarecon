import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import Card from '@/shared/components/Card'
import Button from '@/shared/components/Button'
import { useConfigStore } from '../store/configStore'

export const EmailSettings: React.FC = () => {
  const { config, updateSection, saveConfig, isSaving, hasUnsavedChanges } = useConfigStore();
  const [showImapPassword, setShowImapPassword] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<'success' | 'error' | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const emailConfig = config.email;

  const handleChange = (field: string, value: string | number | boolean) => {
    updateSection('email', { [field]: value });
    setConnectionResult(null);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);

    try {
      const { testConnection } = useConfigStore.getState();
      const success = await testConnection('email');
      setConnectionResult(success ? 'success' : 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = async () => {
    setSaveSuccess(false);
    setSaveError(null);

    try {
      await saveConfig('email', emailConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save');
      setTimeout(() => setSaveError(null), 5000);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-benow-blue-100 rounded-lg flex items-center justify-center">
            <Mail className="w-5 h-5 text-benow-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Email Configuration</h3>
            <p className="text-sm text-gray-500">Configure email monitoring and sending</p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={emailConfig.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-benow-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-benow-blue-600"></div>
          <span className="ml-3 text-sm font-medium text-gray-700">
            {emailConfig.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      {emailConfig.enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* IMAP Configuration */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">IMAP Configuration (Incoming Mail)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IMAP Server
                </label>
                <input
                  type="text"
                  value={emailConfig.imapServer}
                  onChange={(e) => handleChange('imapServer', e.target.value)}
                  placeholder="imap.gmail.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-benow-blue-500 focus:border-benow-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IMAP Port
                </label>
                <input
                  type="number"
                  value={emailConfig.imapPort}
                  onChange={(e) => handleChange('imapPort', parseInt(e.target.value))}
                  placeholder="993"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-benow-blue-500 focus:border-benow-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IMAP Username
                </label>
                <input
                  type="text"
                  value={emailConfig.imapUsername}
                  onChange={(e) => handleChange('imapUsername', e.target.value)}
                  placeholder="gia@benow.in"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-benow-blue-500 focus:border-benow-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IMAP Password
                </label>
                <div className="relative">
                  <input
                    type={showImapPassword ? 'text' : 'password'}
                    value={emailConfig.imapPassword}
                    onChange={(e) => handleChange('imapPassword', e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-benow-blue-500 focus:border-benow-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowImapPassword(!showImapPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showImapPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SMTP Configuration */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">SMTP Configuration (Outgoing Mail)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Server
                </label>
                <input
                  type="text"
                  value={emailConfig.smtpServer}
                  onChange={(e) => handleChange('smtpServer', e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-benow-blue-500 focus:border-benow-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={emailConfig.smtpPort}
                  onChange={(e) => handleChange('smtpPort', parseInt(e.target.value))}
                  placeholder="587"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-benow-blue-500 focus:border-benow-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Username
                </label>
                <input
                  type="text"
                  value={emailConfig.smtpUsername}
                  onChange={(e) => handleChange('smtpUsername', e.target.value)}
                  placeholder="gia@benow.in"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-benow-blue-500 focus:border-benow-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Password
                </label>
                <div className="relative">
                  <input
                    type={showSmtpPassword ? 'text' : 'password'}
                    value={emailConfig.smtpPassword}
                    onChange={(e) => handleChange('smtpPassword', e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-benow-blue-500 focus:border-benow-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Additional Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useTLS"
                  checked={emailConfig.useTLS}
                  onChange={(e) => handleChange('useTLS', e.target.checked)}
                  className="w-4 h-4 text-benow-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-benow-blue-500"
                />
                <label htmlFor="useTLS" className="ml-2 text-sm font-medium text-gray-700">
                  Use TLS/SSL encryption
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check Interval (minutes)
                </label>
                <input
                  type="number"
                  value={emailConfig.checkIntervalMinutes}
                  onChange={(e) => handleChange('checkIntervalMinutes', parseInt(e.target.value))}
                  min="1"
                  max="60"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-benow-blue-500 focus:border-benow-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  How often to check for new emails (1-60 minutes)
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={handleTestConnection}
                disabled={testingConnection}
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>

              {connectionResult === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 text-success-600"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Connection successful</span>
                </motion.div>
              )}

              {connectionResult === 'error' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 text-error-600"
                >
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Connection failed</span>
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-3">
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
        </motion.div>
      )}
    </Card>
  );
};
