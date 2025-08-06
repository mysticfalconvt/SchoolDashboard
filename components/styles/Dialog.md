# Dialog Component

A composable dialog component that provides modal dialogs with consistent styling and behavior. All dialogs now use modal overlays that are centered on the screen for a better user experience.

## Components

### `Dialog`
The main dialog component that can be configured for different use cases.

**Props:**
- `children`: React.ReactNode - Content to render inside the dialog
- `isOpen`: boolean - Controls dialog visibility
- `onClose`: () => void - Function called when dialog should close
- `title?`: string - Optional title for the dialog header
- `variant?`: 'inline' | 'modal' - Dialog display type (default: 'modal')
- `size?`: 'sm' | 'md' | 'lg' | 'xl' - Dialog size (default: 'md')
- `className?`: string - Additional CSS classes
- `showCloseButton?`: boolean - Whether to show close button (default: true)
- `closeOnBackdropClick?`: boolean - Whether clicking backdrop closes dialog (default: true)

### `FormDialog`
Convenience component for modal dialogs with forms. Automatically includes `DialogContent` wrapper.

**Props:** Same as `Dialog` except `variant` is fixed to 'modal'

### `InlineFormDialog`
Convenience component for inline forms. No title or size props. (Legacy - use `FormDialog` for new components)

**Props:** Same as `Dialog` except `variant` is fixed to 'inline' and `title`/`size` are not available

### `DialogHeader`
Header component for dialogs with title and close button.

**Props:**
- `children`: React.ReactNode - Title content
- `onClose?`: () => void - Close function
- `showCloseButton?`: boolean - Whether to show close button (default: true)
- `className?`: string - Additional CSS classes

### `DialogContent`
Content wrapper with padding and scroll handling.

**Props:**
- `children`: React.ReactNode - Content to render
- `className?`: string - Additional CSS classes
- `maxHeight?`: string - Maximum height (default: 'max-h-[80vh]')

### `DialogBackdrop`
Backdrop overlay for modal dialogs.

**Props:**
- `onClick?`: () => void - Click handler
- `className?`: string - Additional CSS classes

## Usage Examples

### Modal Dialog with Form (Recommended)
```tsx
import { FormDialog } from '@/components/styles/Dialog';
import Form from '@/components/styles/Form';

function MyComponent() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <div>
      <button onClick={() => setShowDialog(true)}>Open Dialog</button>
      
      <FormDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title="Add New Item"
        size="lg"
      >
        <Form onSubmit={handleSubmit}>
          {/* Form fields */}
        </Form>
      </FormDialog>
    </div>
  );
}
```

### Custom Dialog with Header
```tsx
import { Dialog, DialogHeader, DialogContent } from '@/components/styles/Dialog';

function MyComponent() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <Dialog
      isOpen={showDialog}
      onClose={() => setShowDialog(false)}
      size="xl"
    >
      <DialogHeader onClose={() => setShowDialog(false)}>
        Custom Dialog Title
      </DialogHeader>
      <DialogContent>
        <p>Custom dialog content here...</p>
      </DialogContent>
    </Dialog>
  );
}
```

## Size Variants

- `sm`: max-w-md (448px)
- `md`: max-w-lg (512px) 
- `lg`: max-w-2xl (672px)
- `xl`: max-w-4xl (896px)

## Styling

The dialog components use the existing design system with:
- Gradient backgrounds (`from-[var(--red)] to-[var(--blue)]`)
- Consistent border styling
- White text for contrast
- Rounded corners and shadows
- Responsive sizing
- Centered modal overlays with backdrop

## Migration from Old Components

### From FormContainer (Inline Forms)
Replace:
```tsx
<FormContainer visible={showForm}>
  <div className="bg-gradient-to-tl from-[var(--red)] to-[var(--blue)] border-[5px] border-[var(--tableAccentColor)] rounded-xl shadow-2xl p-6 relative w-full max-w-md mx-auto">
    {/* content */}
  </div>
</FormContainer>
```

With:
```tsx
<FormDialog
  isOpen={showForm}
  onClose={() => setShowForm(false)}
  title="Dialog Title"
  size="md"
>
  {/* content */}
</FormDialog>
```

### From Custom Modal
Replace:
```tsx
{showForm && (
  <>
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowForm(false)} />
    <div className="fixed z-50 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-md h-auto rounded-3xl bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] overflow-hidden border-2 border-[var(--blue)] shadow-2xl">
      <div className="flex justify-between items-center p-4 border-b border-[var(--blue)]">
        <h4 className="text-white text-xl font-semibold">Title</h4>
        <button onClick={() => setShowForm(false)}>×</button>
      </div>
      <div className="p-6">
        {/* content */}
      </div>
    </div>
  </>
)}
```

With:
```tsx
<FormDialog
  isOpen={showForm}
  onClose={() => setShowForm(false)}
  title="Title"
  size="md"
>
  {/* content */}
</FormDialog>
```

## Benefits of Modal Overlays

1. **Better UX**: Dialogs are clearly separated from the main content
2. **Consistency**: All dialogs behave the same way
3. **Accessibility**: Proper focus management and backdrop handling
4. **Mobile Friendly**: Better touch targets and responsive behavior
5. **Visual Hierarchy**: Clear distinction between dialog and page content 
