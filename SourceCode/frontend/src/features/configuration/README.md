# Configuration Feature

Complete system configuration module for the GIA Reconciliation System.

## Overview

The Configuration feature provides a comprehensive UI for managing all system settings including:
- Email (IMAP/SMTP) configuration
- WhatsApp messaging integration
- AI Agent behavior and preferences
- Notification settings and recipients
- System preferences (timezone, date format, currency, theme)

## Architecture

### Directory Structure

```
features/configuration/
├── components/
│   ├── EmailSettings.tsx         # Email IMAP/SMTP configuration
│   ├── WhatsAppSettings.tsx      # WhatsApp integration settings
│   ├── AgentSettings.tsx         # AI agent behavior configuration
│   ├── NotificationSettings.tsx  # Notification preferences
│   ├── SystemPreferences.tsx     # Regional and display settings
│   └── index.ts                  # Component exports
├── store/
│   └── configStore.ts            # Zustand state management
└── README.md                     # This file
```

### Type Definitions

Located in `/types/system.types.ts`:
- `EmailConfig` - IMAP/SMTP server configuration
- `WhatsAppConfig` - WhatsApp Bridge integration
- `AgentConfig` - AI agent settings (model, temperature, automation)
- `NotificationConfig` - Notification channels and recipients
- `SystemPreferences` - Regional settings and theme
- `SystemConfig` - Complete system configuration object

### Mock Data

Located in `/mocks/data/systemConfig.ts`:
- Default configuration with Samsung/Benow settings
- Email defaults for gia@benow.in
- Agent defaults (GPT-4, temperature 0.3, require approval)
- Pre-configured recipients

## Components

### EmailSettings

Email monitoring and sending configuration.

**Features:**
- Enable/disable email monitoring
- IMAP configuration (server, port, username, password)
- SMTP configuration (server, port, username, password)
- TLS/SSL encryption toggle
- Email check interval (1-60 minutes)
- Password visibility toggles
- Test connection functionality
- Individual save with validation

**Props:** None (uses global store)

**Usage:**
```tsx
import { EmailSettings } from '@/features/configuration/components';

<EmailSettings />
```

### WhatsAppSettings

WhatsApp messaging integration configuration.

**Features:**
- Enable/disable WhatsApp integration
- Phone number configuration
- WhatsApp Bridge API URL
- Webhook URL (optional)
- Session timeout settings
- Setup instructions panel
- Test connection functionality
- Individual save with validation

**Props:** None (uses global store)

**Usage:**
```tsx
import { WhatsAppSettings } from '@/features/configuration/components';

<WhatsAppSettings />
```

### AgentSettings

AI agent behavior and automation configuration.

**Features:**
- Enable/disable agent
- AI model selection (GPT-4, GPT-3.5 Turbo, Claude-3)
- Temperature slider (0-1) with visual labels
- Max tokens configuration
- Auto-reconcile toggle
- Auto-notify toggle
- Require approval toggle
- Warning when auto-reconcile without approval
- Individual save with validation

**Props:** None (uses global store)

**Usage:**
```tsx
import { AgentSettings } from '@/features/configuration/components';

<AgentSettings />
```

### NotificationSettings

Notification channels and recipient management.

**Features:**
- Email notifications toggle
- WhatsApp notifications toggle (disabled if WhatsApp not enabled)
- Event-based notifications:
  - Success (reconciliation completes successfully)
  - Warning (discrepancies found)
  - Error (reconciliation fails)
- Recipient management:
  - Add recipients with email validation
  - Remove recipients (chip/tag interface)
  - Visual recipient list
- Warning when no channels enabled
- Individual save with validation

**Props:** None (uses global store)

**Usage:**
```tsx
import { NotificationSettings } from '@/features/configuration/components';

<NotificationSettings />
```

### SystemPreferences

Regional and display settings.

**Features:**
- Timezone selection (9 major timezones)
- Language selection (5 languages - currently English only)
- Date format selection (5 formats with preview)
- Currency format selection (7 currencies with symbol preview)
- Theme selection:
  - Light mode
  - Dark mode (future implementation)
  - Auto mode (matches system preferences)
- Live preview panel showing formatted date, amount, and time
- Individual save

**Props:** None (uses global store)

**Usage:**
```tsx
import { SystemPreferences } from '@/features/configuration/components';

<SystemPreferences />
```

## State Management

### ConfigStore (Zustand)

The configuration store manages all system settings state.

**State:**
```typescript
{
  config: SystemConfig              // Current configuration
  originalConfig: SystemConfig      // Last saved configuration
  isLoading: boolean                // Loading state
  isSaving: boolean                 // Save in progress
  error: string | null              // Error message
  hasUnsavedChanges: boolean        // Unsaved changes flag
  lastSaved: Date | null            // Last save timestamp
}
```

**Actions:**

- `loadConfig()` - Load configuration from API (simulated)
- `saveConfig(section, data)` - Save individual section
- `saveAllConfig()` - Save all sections
- `resetSection(section)` - Reset section to last saved
- `resetAllSections()` - Reset all sections
- `testConnection(type)` - Test email/WhatsApp connection
- `updateSection(section, data)` - Update section (marks as unsaved)

**Validation:**

Each section has validation before save:
- Email: Required fields, valid ports, valid interval
- WhatsApp: Required fields, valid timeout
- Agent: Temperature 0-1, valid max tokens
- Notifications: At least one channel, valid email recipients

**Example Usage:**
```typescript
import { useConfigStore } from '@/features/configuration/store/configStore';

function MyComponent() {
  const {
    config,
    updateSection,
    saveConfig,
    hasUnsavedChanges
  } = useConfigStore();

  const handleChange = (field: string, value: any) => {
    updateSection('email', { [field]: value });
  };

  const handleSave = async () => {
    try {
      await saveConfig('email', config.email);
      // Success!
    } catch (error) {
      // Handle error
    }
  };

  return (
    // Your UI
  );
}
```

## Page Integration

The main Configuration page (`/app/pages/Configuration.tsx`) provides:

**Features:**
- Tabbed/sectioned navigation
- Sidebar navigation (desktop) with sticky positioning
- Mobile-responsive layout
- Unsaved changes warning banner
- Save All / Reset All buttons
- Section switching with unsaved changes confirmation
- Loading state
- Success/error toast notifications
- Last saved timestamp display

**Routes:**
- `/config` - Configuration page

## Styling

All components use:
- Benow brand colors (`benow-blue-600`, etc.)
- Tailwind CSS for styling
- Framer Motion for animations
- Lucide React for icons
- Consistent Card and Button components

## API Integration

Currently using mock data with simulated delays. To integrate with real API:

1. Update `configStore.ts` actions to call real API endpoints:
```typescript
// In loadConfig()
const response = await fetch('/api/system/config');
const config = await response.json();

// In saveConfig()
await fetch(`/api/system/config/${section}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

2. Update `testConnection()` to call real connection test endpoints:
```typescript
const response = await fetch(`/api/system/test-connection/${type}`);
return response.ok;
```

## Security Considerations

- Passwords are displayed with show/hide toggles
- In production, passwords should be encrypted before sending to API
- Sensitive fields should never be logged
- API endpoints should require authentication
- HTTPS required for all API calls
- Consider implementing OAuth for email if supported

## Future Enhancements

1. **Advanced Email Filters** - Configure which emails to process
2. **WhatsApp QR Code Display** - Show QR code for initial pairing
3. **Agent Prompt Customization** - Allow custom prompts for agent
4. **Notification Templates** - Customizable email/WhatsApp templates
5. **Multi-language Support** - Full i18n implementation
6. **Dark Mode** - Complete dark theme implementation
7. **Audit Log** - Track all configuration changes
8. **Import/Export** - Backup and restore configurations
9. **Configuration Profiles** - Multiple saved configurations
10. **Field Encryption** - Client-side encryption for sensitive fields

## Testing

To test the configuration feature:

1. Navigate to `/config` in the application
2. Try each section:
   - Email: Fill in IMAP/SMTP details, test connection
   - WhatsApp: Configure phone and API URL
   - Agent: Adjust temperature slider, toggle automation
   - Notifications: Add/remove recipients, toggle events
   - Preferences: Change timezone, date format, theme
3. Test unsaved changes warning when switching sections
4. Test Save All functionality
5. Test Reset All functionality
6. Verify validation errors for invalid input

## Troubleshooting

**Unsaved changes warning won't dismiss:**
- Save or reset changes explicitly
- Check that save operation completed successfully

**Test connection always fails:**
- Mock implementation has 80% success rate
- In production, verify actual server connectivity

**Recipients can't be added:**
- Verify email format is valid
- Check that recipient isn't already in list

**Configuration not persisting:**
- Check browser console for API errors
- Verify save operation completes successfully
- In mock mode, changes only persist in memory (not localStorage)

## Development Notes

- All forms use controlled inputs
- State updates are debounced where appropriate
- Validation happens before save, not on input
- Individual section saves are independent
- Save All validates all sections before saving
- Connection tests are async and show loading state
- All animations use framer-motion
- Responsive design: mobile-first approach
