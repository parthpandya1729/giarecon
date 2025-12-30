import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, AlertTriangle, Save, RotateCcw } from 'lucide-react'
import { EmailSettings } from '@/features/configuration/components/EmailSettings'
import { AgentSettings } from '@/features/configuration/components/AgentSettings'
import { NotificationSettings } from '@/features/configuration/components/NotificationSettings'
import { SystemPreferences } from '@/features/configuration/components/SystemPreferences'
import Button from '@/shared/components/Button'
import { useConfigStore } from '@/features/configuration/store/configStore'

type ConfigSection = 'email' | 'agent' | 'notifications' | 'preferences';

const SECTIONS: { id: ConfigSection; label: string; icon: string }[] = [
  { id: 'email', label: 'Email', icon: '📧' },
  { id: 'agent', label: 'Agent', icon: '🤖' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'preferences', label: 'Preferences', icon: '🌐' },
];

export default function Configuration() {
  const { loadConfig, saveAllConfig, resetAllSections, hasUnsavedChanges, isSaving, isLoading, lastSaved } = useConfigStore();
  const [activeSection, setActiveSection] = useState<ConfigSection>('email');
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [saveAllSuccess, setSaveAllSuccess] = useState(false);
  const [saveAllError, setSaveAllError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      setShowUnsavedWarning(false);
    }
  }, [hasUnsavedChanges]);

  const handleSaveAll = async () => {
    setSaveAllSuccess(false);
    setSaveAllError(null);

    try {
      await saveAllConfig();
      setSaveAllSuccess(true);
      setTimeout(() => setSaveAllSuccess(false), 3000);
    } catch (error) {
      setSaveAllError(error instanceof Error ? error.message : 'Failed to save all configurations');
      setTimeout(() => setSaveAllError(null), 5000);
    }
  };

  const handleResetAll = () => {
    if (window.confirm('Are you sure you want to reset all changes? This will discard all unsaved modifications.')) {
      resetAllSections();
    }
  };

  const handleSectionChange = (section: ConfigSection) => {
    if (hasUnsavedChanges) {
      if (
        window.confirm(
          'You have unsaved changes. Are you sure you want to switch sections? Your changes will be lost if you do not save them first.'
        )
      ) {
        setActiveSection(section);
      }
    } else {
      setActiveSection(section);
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'email':
        return <EmailSettings />;
      case 'agent':
        return <AgentSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'preferences':
        return <SystemPreferences />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-benow-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-benow-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-benow-blue-600 to-purple-600 bg-clip-text text-transparent">
                System Configuration
              </h1>
              <p className="text-gray-600 mt-1">
                Configure email, agent behavior, and system preferences
              </p>
            </div>
          </div>

          {/* Last Saved */}
          {lastSaved && !hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-gray-500 mt-2"
            >
              Last saved: {lastSaved.toLocaleString()}
            </motion.div>
          )}
        </motion.div>

        {/* Unsaved Changes Warning */}
        {showUnsavedWarning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-warning-50 border border-warning-200 rounded-lg p-4 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-warning-900">Unsaved Changes</h3>
              <p className="text-sm text-warning-800 mt-1">
                You have unsaved changes. Please save your changes before leaving this page or switching sections.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleResetAll}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveAll} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                Save All
              </Button>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sticky top-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 px-2">Settings</h3>
              <nav className="space-y-1">
                {SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                      activeSection === section.id
                        ? 'bg-benow-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{section.icon}</span>
                    <span className="font-medium">{section.label}</span>
                  </button>
                ))}
              </nav>

              {/* Save All Button (in sidebar for desktop) */}
              <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleSaveAll}
                  disabled={!hasUnsavedChanges || isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save All
                    </>
                  )}
                </Button>

                {hasUnsavedChanges && (
                  <Button variant="secondary" className="w-full" onClick={handleResetAll}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset All
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Content Area */}
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3"
          >
            {renderActiveSection()}
          </motion.div>
        </div>

        {/* Mobile Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:hidden mt-6 flex gap-3"
        >
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSaveAll}
            disabled={!hasUnsavedChanges || isSaving}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save All Changes
              </>
            )}
          </Button>

          {hasUnsavedChanges && (
            <Button variant="secondary" onClick={handleResetAll}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </motion.div>

        {/* Success/Error Messages */}
        {saveAllSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-6 right-6 bg-success-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            All configurations saved successfully
          </motion.div>
        )}

        {saveAllError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-6 right-6 bg-error-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <AlertTriangle className="w-5 h-5" />
            {saveAllError}
          </motion.div>
        )}
      </div>
    </div>
  );
}
