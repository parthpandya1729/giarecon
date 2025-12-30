import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, Loader2 } from 'lucide-react'
import Card from '@/shared/components/Card'
import Button from '@/shared/components/Button'
import { useConfigStore } from '../store/configStore'

export const AgentSettings: React.FC = () => {
  const { config, updateSection, saveConfig, isSaving, hasUnsavedChanges } = useConfigStore();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const agentConfig = config.agent;

  const handleChange = (field: string, value: string | number | boolean) => {
    updateSection('agent', { [field]: value });
  };

  const handleSave = async () => {
    setSaveSuccess(false);
    setSaveError(null);

    try {
      await saveConfig('agent', agentConfig);
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
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">GIA Agent Behavior</h3>
            <p className="text-sm text-gray-500">Configure AI agent settings and automation</p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={agentConfig.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          <span className="ml-3 text-sm font-medium text-gray-700">
            {agentConfig.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      {agentConfig.enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Model Selection */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">AI Model Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Model
                </label>
                <select
                  value={agentConfig.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="gpt-4">GPT-4 (Most Capable)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast)</option>
                  <option value="claude-3">Claude 3 (Balanced)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Select the AI model for reconciliation analysis
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={agentConfig.maxTokens}
                  onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                  min="100"
                  max="32000"
                  step="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum response length (100-32000)
                </p>
              </div>
            </div>
          </div>

          {/* Temperature Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature: {agentConfig.temperature.toFixed(2)}
            </label>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={agentConfig.temperature}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Precise (0.0)</span>
                <span>Balanced (0.5)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Lower values make the agent more focused and deterministic. Higher values increase creativity but may reduce accuracy.
            </p>
          </div>

          {/* Automation Settings */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Automation Preferences</h4>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="autoReconcile"
                    type="checkbox"
                    checked={agentConfig.autoReconcile}
                    onChange={(e) => handleChange('autoReconcile', e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="autoReconcile" className="text-sm font-medium text-gray-700">
                    Automatic Reconciliation
                  </label>
                  <p className="text-xs text-gray-500">
                    Automatically trigger reconciliation when new files are detected in email
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="autoNotify"
                    type="checkbox"
                    checked={agentConfig.autoNotify}
                    onChange={(e) => handleChange('autoNotify', e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="autoNotify" className="text-sm font-medium text-gray-700">
                    Automatic Notifications
                  </label>
                  <p className="text-xs text-gray-500">
                    Send notifications automatically when reconciliation completes
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="requireApproval"
                    type="checkbox"
                    checked={agentConfig.requireApproval}
                    onChange={(e) => handleChange('requireApproval', e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="requireApproval" className="text-sm font-medium text-gray-700">
                    Require Human Approval
                  </label>
                  <p className="text-xs text-gray-500">
                    Require manual approval before sending notifications or taking actions
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Box */}
          {agentConfig.autoReconcile && !agentConfig.requireApproval && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-warning-50 border border-warning-200 rounded-lg p-4"
            >
              <h5 className="text-sm font-semibold text-warning-900 mb-1">Warning</h5>
              <p className="text-sm text-warning-800">
                Automatic reconciliation without approval is enabled. The agent will process files and send notifications without human oversight.
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
        </motion.div>
      )}
    </Card>
  );
};
