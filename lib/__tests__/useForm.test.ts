import { renderHook, act } from '@testing-library/react';
import useForm from '../useForm';

describe('useForm Hook', () => {
  const initialInputs = {
    name: '',
    email: '',
    age: 0,
    isActive: false,
    date: '',
  };

  it('initializes with provided initial values', () => {
    const { result } = renderHook(() => useForm(initialInputs));

    expect(result.current.inputs).toEqual(initialInputs);
  });

  it('updates text input values', () => {
    const { result } = renderHook(() => useForm(initialInputs));

    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John Doe', type: 'text' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.inputs.name).toBe('John Doe');
  });

  it('updates email input values', () => {
    const { result } = renderHook(() => useForm(initialInputs));

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'john@example.com', type: 'email' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.inputs.email).toBe('john@example.com');
  });

  it('updates number input values', () => {
    const { result } = renderHook(() => useForm(initialInputs));

    act(() => {
      result.current.handleChange({
        target: { name: 'age', value: '25', type: 'number' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.inputs.age).toBe(25);
  });

  it('handles invalid number input', () => {
    const { result } = renderHook(() => useForm(initialInputs));

    act(() => {
      result.current.handleChange({
        target: { name: 'age', value: 'invalid', type: 'number' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.inputs.age).toBe('');
  });

  it('updates checkbox input values', () => {
    const { result } = renderHook(() => useForm(initialInputs));

    act(() => {
      result.current.handleChange({
        target: { name: 'isActive', checked: true, type: 'checkbox' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.inputs.isActive).toBe(true);
  });

  it('updates date input values', () => {
    const { result } = renderHook(() => useForm(initialInputs));

    act(() => {
      result.current.handleChange({
        target: { name: 'date', value: '2024-01-15', type: 'date' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.inputs.date).toBe('2024-01-15');
  });

  it('handles invalid date input', () => {
    const { result } = renderHook(() => useForm(initialInputs));

    act(() => {
      result.current.handleChange({
        target: { name: 'date', value: 'invalid-date', type: 'date' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.inputs.date).toBe('');
  });

  it('handles empty date input', () => {
    const { result } = renderHook(() => useForm(initialInputs));

    act(() => {
      result.current.handleChange({
        target: { name: 'date', value: '', type: 'date' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.inputs.date).toBe('');
  });

  it('clears all form values', () => {
    const { result } = renderHook(() => useForm(initialInputs));

    // Set some values first
    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John Doe', type: 'text' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'age', value: '25', type: 'number' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.inputs.name).toBe('John Doe');
    expect(result.current.inputs.age).toBe(25);

    // Clear the form
    act(() => {
      result.current.clearForm();
    });

    expect(result.current.inputs).toEqual({
      name: '',
      email: '',
      age: '',
      isActive: '',
      date: '',
    });
  });

  it('resets form to initial values', () => {
    const { result } = renderHook(() => useForm(initialInputs));

    // Set some values first
    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John Doe', type: 'text' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'age', value: '25', type: 'number' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.inputs.name).toBe('John Doe');
    expect(result.current.inputs.age).toBe(25);

    // Reset the form
    act(() => {
      result.current.resetForm();
    });

    expect(result.current.inputs).toEqual(initialInputs);
  });

  it('handles select element changes', () => {
    interface SelectInputs {
      category: string;
    }

    const selectInitial: SelectInputs = { category: '' };
    const { result } = renderHook(() => useForm(selectInitial));

    act(() => {
      result.current.handleChange({
        target: { name: 'category', value: 'electronics', type: 'select-one' }
      } as React.ChangeEvent<HTMLSelectElement>);
    });

    expect(result.current.inputs.category).toBe('electronics');
  });

  it('handles textarea element changes', () => {
    interface TextareaInputs {
      description: string;
    }

    const textareaInitial: TextareaInputs = { description: '' };
    const { result } = renderHook(() => useForm(textareaInitial));

    act(() => {
      result.current.handleChange({
        target: { name: 'description', value: 'This is a long description', type: 'textarea' }
      } as React.ChangeEvent<HTMLTextAreaElement>);
    });

    expect(result.current.inputs.description).toBe('This is a long description');
  });

  it('maintains other field values when updating one field', () => {
    const { result } = renderHook(() => useForm(initialInputs));

    // Set multiple values
    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John Doe', type: 'text' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'john@example.com', type: 'email' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Update one field
    act(() => {
      result.current.handleChange({
        target: { name: 'age', value: '25', type: 'number' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Other fields should remain unchanged
    expect(result.current.inputs.name).toBe('John Doe');
    expect(result.current.inputs.email).toBe('john@example.com');
    expect(result.current.inputs.age).toBe(25);
  });

  it('handles non-existent field names gracefully', () => {
    const { result } = renderHook(() => useForm(initialInputs));

    act(() => {
      result.current.handleChange({
        target: { name: 'nonExistentField', value: 'test', type: 'text' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Should not crash and should add the new field
    expect((result.current.inputs as any).nonExistentField).toBe('test');
  });
});