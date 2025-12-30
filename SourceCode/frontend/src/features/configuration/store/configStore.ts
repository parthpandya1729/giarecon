import { create } from 'zustand'
import type { SystemConfig } from '@/types/system.types'
import { defaultSystemConfig } from '@/mocks/data/systemConfig'

interface ConfigState {
  config: SystemConfig;
  originalConfig: SystemConfig;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;

  // Actions
  loadConfig: () => Promise<void>;
  saveConfig: <K extends keyof SystemConfig>(
    section: K,
    data: SystemConfig[K]
  ) => Promise<void>;
  saveAllConfig: () => Promise<void>;
  resetSection: <K extends keyof SystemConfig>(section: K) => void;
  resetAllSections: () => void;
  testConnection: (type: 'email') => Promise<boolean>;
  updateSection: <K extends keyof SystemConfig>(
    section: K,
    data: Partial<SystemConfig[K]>
  ) => void;
}

const validateEmailConfig = (config: SystemConfig['email']): string | null => {
  if (!config.enabled) return null;

  if (!config.imapServer || !config.smtpServer) {
    return 'IMAP and SMTP servers are required';
  }

  if (!config.imapUsername || !config.smtpUsername) {
    return 'Username is required for both IMAP and SMTP';
  }

  if (config.imapPort < 1 || config.imapPort > 65535) {
    return 'Invalid IMAP port number';
  }

  if (config.smtpPort < 1 || config.smtpPort > 65535) {
    return 'Invalid SMTP port number';
  }

  if (config.checkIntervalMinutes < 1) {
    return 'Check interval must be at least 1 minute';
  }

  return null;
};

const validateAgentConfig = (config: SystemConfig['agent']): string | null => {
  if (!config.enabled) return null;

  if (config.temperature < 0 || config.temperature > 1) {
    return 'Temperature must be between 0 and 1';
  }

  if (config.maxTokens < 100 || config.maxTokens > 32000) {
    return 'Max tokens must be between 100 and 32000';
  }

  return null;
};

const validateNotificationConfig = (config: SystemConfig['notifications']): string | null => {
  if (!config.emailNotifications) {
    return 'Email notifications must be enabled';
  }

  if (config.recipients.length === 0) {
    return 'At least one recipient is required';
  }

  // Validate email format for recipients
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const recipient of config.recipients) {
    if (!emailRegex.test(recipient)) {
      return `Invalid email format: ${recipient}`;
    }
  }

  return null;
};

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: defaultSystemConfig,
  originalConfig: defaultSystemConfig,
  isLoading: false,
  isSaving: false,
  error: null,
  hasUnsavedChanges: false,
  lastSaved: null,

  loadConfig: async () => {
    set({ isLoading: true, error: null });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // In real implementation, fetch from API
      // const response = await fetch('/api/system/config');
      // const config = await response.json();

      const config = defaultSystemConfig;

      set({
        config,
        originalConfig: JSON.parse(JSON.stringify(config)),
        isLoading: false,
        hasUnsavedChanges: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load configuration',
        isLoading: false,
      });
    }
  },

  saveConfig: async (section, data) => {
    set({ isSaving: true, error: null });

    try {
      // Validate the section data
      let validationError: string | null = null;

      if (section === 'email') {
        validationError = validateEmailConfig(data as SystemConfig['email']);
      } else if (section === 'agent') {
        validationError = validateAgentConfig(data as SystemConfig['agent']);
      } else if (section === 'notifications') {
        validationError = validateNotificationConfig(data as SystemConfig['notifications']);
      }

      if (validationError) {
        throw new Error(validationError);
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In real implementation, save to API
      // await fetch('/api/system/config/' + section, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });

      const currentConfig = get().config;
      const newConfig = { ...currentConfig, [section]: data };

      set({
        config: newConfig,
        originalConfig: JSON.parse(JSON.stringify(newConfig)),
        isSaving: false,
        hasUnsavedChanges: false,
        lastSaved: new Date(),
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to save configuration',
        isSaving: false,
      });
      throw error;
    }
  },

  saveAllConfig: async () => {
    set({ isSaving: true, error: null });

    try {
      const { config } = get();

      // Validate all sections
      const emailError = validateEmailConfig(config.email);
      if (emailError) throw new Error(`Email: ${emailError}`);

      const agentError = validateAgentConfig(config.agent);
      if (agentError) throw new Error(`Agent: ${agentError}`);

      const notificationError = validateNotificationConfig(config.notifications);
      if (notificationError) throw new Error(`Notifications: ${notificationError}`);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In real implementation, save to API
      // await fetch('/api/system/config', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(config),
      // });

      set({
        originalConfig: JSON.parse(JSON.stringify(config)),
        isSaving: false,
        hasUnsavedChanges: false,
        lastSaved: new Date(),
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to save configuration',
        isSaving: false,
      });
      throw error;
    }
  },

  resetSection: (section) => {
    const { originalConfig } = get();
    set((state) => ({
      config: {
        ...state.config,
        [section]: JSON.parse(JSON.stringify(originalConfig[section])),
      },
      hasUnsavedChanges: false,
    }));
  },

  resetAllSections: () => {
    const { originalConfig } = get();
    set({
      config: JSON.parse(JSON.stringify(originalConfig)),
      hasUnsavedChanges: false,
      error: null,
    });
  },

  testConnection: async (type) => {
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In real implementation, test actual connection
      // const response = await fetch(`/api/system/test-connection/${type}`);
      // return response.ok;

      // Randomly succeed or fail for demo
      return Math.random() > 0.2; // 80% success rate
    } catch (error) {
      console.error(`Failed to test ${type} connection:`, error);
      return false;
    }
  },

  updateSection: (section, data) => {
    set((state) => {
      const newConfig = {
        ...state.config,
        [section]: {
          ...state.config[section],
          ...data,
        },
      };

      const hasChanges = JSON.stringify(newConfig) !== JSON.stringify(state.originalConfig);

      return {
        config: newConfig,
        hasUnsavedChanges: hasChanges,
      };
    });
  },
}));
