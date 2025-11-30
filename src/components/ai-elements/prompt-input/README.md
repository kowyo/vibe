# PromptInput Component Refactoring

This directory contains the refactored version of the massive prompt-input.tsx component (1300+ lines) that has been broken down into smaller, more manageable components.

## File Structure

```
prompt-input/
├── index.tsx           # Main component and core logic
├── context.tsx         # Context providers and hooks
├── attachments.tsx     # Attachment handling components
├── input.tsx           # Input components (textarea, buttons, etc.)
└── types.ts           # Shared TypeScript types
```

## Component Breakdown

### 1. Context and Hooks (`context.tsx`)
- **PromptInputProvider**: Global state provider for lifting state outside of PromptInput
- **usePromptInputController**: Hook for accessing the main controller
- **usePromptInputAttachments**: Hook for accessing attachments (dual-mode: provider or local)
- **useProviderAttachments**: Hook specifically for provider-based attachments

### 2. Attachment Handling (`attachments.tsx`)
- **PromptInputAttachment**: Individual attachment display component with hover preview
- **PromptInputAttachments**: Container for multiple attachments
- **PromptInputActionAddAttachments**: Menu item for adding attachments

### 3. Input Components (`input.tsx`)
- **PromptInputTextarea**: Main text input with keyboard shortcuts and paste handling
- **PromptInputSubmit**: Submit button with status indicators
- **PromptInputSpeechButton**: Speech-to-text button with Web Speech API
- **PromptInputButton**: Base button component
- **Layout Components**: Body, Header, Footer, Tools containers
- **Action Menu Components**: Dropdown menu components
- **Select Components**: Dropdown select components
- **Hover Card Components**: Tooltip-style components
- **Command Components**: Search/command palette components
- **Tab Components**: Tab interface components

### 4. Main Component (`index.tsx`)
- **PromptInput**: Core component with form handling, file uploads, drag & drop
- **LocalAttachmentsContext**: Local context for when provider is not used
- All the main logic for file handling, form submission, and state management

### 5. Types (`types.ts`)
- All TypeScript interfaces and types
- Speech recognition types
- Context types
- Component prop types

## Key Features Maintained

✅ **All existing functionality preserved**
✅ **Same component interface** - drop-in replacement
✅ **TypeScript support** - full type safety
✅ **Provider pattern** - can lift state or keep self-managed
✅ **File attachments** - with drag & drop, paste, and file dialog
✅ **Speech recognition** - Web Speech API integration
✅ **Keyboard shortcuts** - Enter to submit, Shift+Enter for new line
✅ **Accessibility** - proper ARIA labels and semantic HTML
✅ **Error handling** - file size, type, and count validation

## Usage

The refactored component maintains the same API as the original:

```tsx
import { PromptInput, PromptInputTextarea, PromptInputSubmit } from '@/components/ai-elements/prompt-input'

function MyComponent() {
  return (
    <PromptInput onSubmit={handleSubmit}>
      <PromptInputTextarea placeholder="Enter your message..." />
      <PromptInputSubmit />
    </PromptInput>
  )
}
```

## Benefits of Refactoring

1. **Better maintainability** - Each file focuses on a specific concern
2. **Easier testing** - Components can be tested in isolation
3. **Improved readability** - Smaller, focused components
4. **Better tree-shaking** - Unused components won't be included
5. **Easier debugging** - Issues are easier to locate in smaller files
6. **Better collaboration** - Multiple developers can work on different parts

## Migration Notes

- This is a **drop-in replacement** - no changes needed in consuming code
- All exports are preserved for backward compatibility
- The component maintains the same behavior and API
- TypeScript types are fully preserved