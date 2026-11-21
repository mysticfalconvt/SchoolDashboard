import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toggle from '../Toggle';

describe('Toggle', () => {
  it('passes the native change event, so form handlers can read name and checked', async () => {
    const seen: Array<{ name: string; checked: boolean }> = [];
    function Form() {
      const [on, setOn] = useState(false);
      return (
        <Toggle
          name="onHomePage"
          checked={on}
          onChange={(e) => {
            seen.push({ name: e.target.name, checked: e.target.checked });
            setOn(e.target.checked);
          }}
        />
      );
    }
    render(<Form />);
    const box = screen.getByRole('checkbox');

    await userEvent.click(box);
    expect(box).toBeChecked();
    await userEvent.click(box);
    expect(box).not.toBeChecked();
    expect(seen).toEqual([
      { name: 'onHomePage', checked: true },
      { name: 'onHomePage', checked: false },
    ]);
  });

  it('works from the keyboard and honours role and label', async () => {
    const onChange = jest.fn();
    render(<Toggle role="switch" aria-label="Pool type" checked={false} onChange={onChange} />);
    const toggle = screen.getByRole('switch', { name: 'Pool type' });
    toggle.focus();
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('does nothing when disabled', async () => {
    const onChange = jest.fn();
    render(<Toggle checked={false} disabled onChange={onChange} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
