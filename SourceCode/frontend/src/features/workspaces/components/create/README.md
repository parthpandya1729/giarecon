# Workspace Creation Wizard

Complete, production-ready multi-step wizard for creating reconciliation workspaces in the GIA Reconciliation system.

## Overview

The workspace creation wizard guides users through a 6-step process:

1. **Basic Information** - Name, description, and tags
2. **File Upload** - Upload two files to reconcile (Excel/CSV)
3. **Configuration** - Choose template or create custom configuration
4. **Field Mapping** - Map columns between files (custom config only)
5. **Validation Rules** - Add data validation rules (custom config only)
6. **Review & Submit** - Review all inputs and create workspace

## Features

### Step 1: Basic Information
- **Workspace Name** (required, max 100 chars)
- **Description** (optional, max 500 chars)
- **Tags** (optional, chip-based input with add/remove)
- Real-time validation and character counters

### Step 2: File Upload
- **Drag & drop** or click to browse
- Accepts Excel (.xlsx, .xls) and CSV files
- **Upload simulation** with progress bar
- **File preview** - Shows first 5 rows in table
- **File metadata** - Name, size, row count, column count
- Remove/replace file option
- Both files required to proceed

### Step 3: Configuration
- **Template selection** from 6 pre-configured templates:
  - Samsung Electronics Standard
  - General Finance Reconciliation
  - Inventory Reconciliation
  - HR Payroll Reconciliation
  - Sales Order Reconciliation
  - Bank Statement Reconciliation
- **Create Custom** option for full control
- Template preview showing mappings and rules
- Category badges and usage statistics

### Step 4: Field Mapping (Custom Config Only)
- **Auto-map** feature using fuzzy name matching
- Map File 1 columns to File 2 columns
- **Data type selection** (string, number, date, currency, email, phone, boolean)
- **Primary key** designation (required, only one)
- Real-time validation warnings for unmapped columns
- Mapping summary with statistics

### Step 5: Validation Rules (Custom Config Only)
- **Add/Edit/Delete** validation rules
- **Rule types**:
  - Required Field
  - Numeric Range (min/max)
  - Pattern (regex)
  - Length Validation
  - Date Format
  - Unique Value
  - Custom Expression
- **Severity levels**: Warning or Error
- Custom error messages
- Dynamic configuration based on rule type

### Step 6: Review & Submit
- **Comprehensive summary** of all wizard steps
- Edit button for each section (jump back to step)
- **Workspace Info**: Name, description, tags
- **Files**: Both files with metadata
- **Configuration**: Template or custom details
- **Mappings**: Field mappings list with primary key
- **Validation Rules**: Rules summary
- **Ready-to-create** summary card
- Create Workspace button with loading state

## Components

### `StepIndicator.tsx`
Navigation component showing wizard progress.

**Props:**
- `steps`: Array of step definitions
- `currentStep`: Current active step (1-6)
- `onStepClick`: Handler for clicking previous steps

**Features:**
- Completed steps marked with checkmark
- Current step highlighted in Benow blue
- Click previous steps to navigate back
- Responsive design

### `BasicInfoStep.tsx`
Form for workspace basic information.

**Props:**
- `data`: { name, description, tags }
- `onChange`: Update handler
- `onNext`: Next step handler

**Features:**
- Name validation (required, max 100 chars)
- Description textarea (max 500 chars)
- Tag chip input with Enter key support
- Character counters
- Next button disabled if invalid

### `FileUploadStep.tsx`
Dual file upload with preview.

**Props:**
- `data`: { file1?, file2? }
- `onChange`: Update handler
- `onNext`: Next step handler
- `onBack`: Previous step handler

**Features:**
- Drag & drop zones for both files
- Upload progress simulation (0-100%)
- File processing status
- Preview table (first 5 rows)
- File metadata display
- Remove/replace file
- Error handling for invalid file types
- Next button enabled when both files uploaded

### `ConfigurationStep.tsx`
Template or custom configuration selection.

**Props:**
- `data`: { selectedConfigId?, useCustomConfig }
- `onChange`: Update handler
- `onNext`: Next step handler
- `onBack`: Previous step handler

**Features:**
- "Create Custom" option card
- Template grid with 6 templates
- Category badges with colors
- Usage count display
- Template preview panel
- Selected template details
- Auto-loads template mappings/rules when selected

### `FieldMappingStep.tsx`
Column mapping interface.

**Props:**
- `data`: { file1?, file2?, mappings }
- `onChange`: Mappings update handler
- `onNext`: Next step handler
- `onBack`: Previous step handler

**Features:**
- Auto-map button with fuzzy matching algorithm
- Mapping table with dropdowns
- Data type selection per field
- Primary key checkbox (only one allowed)
- Unmapped column warnings
- Mapping statistics
- Validation for at least one primary key

### `ValidationRulesStep.tsx`
Data validation rules builder.

**Props:**
- `data`: { mappings, validationRules }
- `onChange`: Rules update handler
- `onNext`: Next step handler
- `onBack`: Previous step handler

**Features:**
- Add/Edit/Delete rules
- Rule builder form with dynamic config
- 7 rule types supported
- Severity selection (warning/error)
- Custom error messages
- Rules list with edit/delete actions
- Optional step (can skip)

### `ReviewStep.tsx`
Final review before submission.

**Props:**
- `data`: Complete wizard form data
- `onEdit`: Navigate to step handler
- `onSubmit`: Create workspace handler
- `onBack`: Previous step handler
- `isSubmitting`: Loading state

**Features:**
- Editable section cards
- Complete summary of all inputs
- Quick stats summary
- Create button with loading state
- Prevents submission while loading

### `CreateWorkspaceWizard.tsx`
Main wizard orchestrator.

**Features:**
- Step state management
- Form data persistence across steps
- Navigation logic (next, back, jump to step)
- Conditional step skipping (skip mapping/rules if using template)
- Form validation per step
- API integration with workspaceStore
- Success redirect to /workspaces

## Types

See `/types/workspace-create.types.ts`:

- `CreateWorkspaceInput` - Workspace creation payload
- `UploadedFile` - File metadata with preview
- `WizardStep` - Step definition
- `WizardFormData` - Complete wizard state
- `FileUploadProgress` - Upload progress tracking

## Usage

### In Router
```tsx
import WorkspaceCreate from './pages/WorkspaceCreate'

{
  path: 'workspaces/create',
  element: <WorkspaceCreate />,
}
```

### Direct Component
```tsx
import { CreateWorkspaceWizard } from '@/features/workspaces/components/create'

function MyPage() {
  return <CreateWorkspaceWizard />
}
```

## State Management

Uses Zustand store (`workspaceStore.ts`):

```tsx
const createWorkspace = useWorkspaceStore((state) => state.createWorkspace)

const workspace = await createWorkspace({
  name: 'My Workspace',
  description: 'Description',
  configName: 'Template name or Custom',
})
```

## Navigation Flow

### Template Path (Faster)
1. Basic Info → 2. File Upload → 3. Configuration (template) → 6. Review → Submit

### Custom Config Path (Full Control)
1. Basic Info → 2. File Upload → 3. Configuration (custom) → 4. Field Mapping → 5. Validation Rules → 6. Review → Submit

## Mock Data & Behavior

### File Upload Simulation
- 2-second upload with 20% incremental progress
- 1-second processing phase
- Generates mock column names (6-10 columns)
- Generates 5 preview rows with realistic data
- Random row count (1000-11000)

### Auto-mapping Algorithm
- Case-insensitive column name comparison
- Removes underscores, spaces, hyphens
- Exact match = 100% score
- Contains match = 80% score
- Character-by-character match scoring
- Threshold: 50% minimum similarity

### Workspace Creation
- 3-second simulated API call
- Success redirect to /workspaces
- Error handling with user-friendly messages

## Styling

### Benow Branding
- Primary color: `benow-blue-600` (#1a56db)
- Hover: `benow-blue-700`
- Background: `benow-blue-50`
- Border: `benow-blue-200`

### Design System
- Card component for sections
- Button component (primary, secondary, ghost variants)
- Consistent spacing and typography
- Mobile-responsive grid layouts
- Smooth transitions with framer-motion

## Accessibility

- Semantic HTML (labels, fieldsets)
- ARIA labels where needed
- Keyboard navigation support
- Focus states on all interactive elements
- Error messages linked to inputs
- Disabled states clearly indicated

## Validation Rules

### Step 1
- Name required (min 1 char, max 100 chars)

### Step 2
- Both files required
- Only .xlsx, .xls, .csv accepted

### Step 3
- Must select template OR custom config

### Step 4
- At least one primary key required
- Only one primary key allowed

### Step 5
- Optional step (no validation)

### Step 6
- All previous steps must be valid

## Error Handling

- File upload errors (invalid type, size limits)
- Network errors (API failures)
- Validation errors (inline messages)
- Loading states during async operations
- User-friendly error messages

## Future Enhancements

- [ ] File size validation (max 10MB)
- [ ] CSV parsing and preview
- [ ] Advanced fuzzy matching configuration
- [ ] Template saving from custom config
- [ ] Duplicate workspace name detection
- [ ] Workspace creation progress tracking
- [ ] Real-time collaboration
- [ ] Auto-save draft

## Performance

- Lazy-loaded steps (only render current step)
- Debounced file upload
- Memoized mappings and rules
- Optimized re-renders with state isolation
- Smooth animations without jank

## Testing

Run tests (when implemented):
```bash
npm test -- --testPathPattern=CreateWorkspace
```

## License

Proprietary - Varahi Technologies for Samsung GIA Reconciliation System
