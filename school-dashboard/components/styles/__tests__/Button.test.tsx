import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../__tests__/utils/test-utils';
import GradientButton, { 
  SmallGradientButton, 
  LeftEdgeButton 
} from '../Button';

describe('Button Components', () => {
  describe('GradientButton', () => {
    it('renders with default props', () => {
      renderWithProviders(<GradientButton>Click me</GradientButton>);

      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Click me');
    });

    it('handles click events', () => {
      const handleClick = jest.fn();
      renderWithProviders(
        <GradientButton onClick={handleClick}>Click me</GradientButton>
      );

      const button = screen.getByRole('button', { name: 'Click me' });
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies custom className', () => {
      renderWithProviders(
        <GradientButton className="custom-class">Test</GradientButton>
      );

      const button = screen.getByRole('button', { name: 'Test' });
      expect(button).toHaveClass('custom-class');
    });

    it('applies custom styles', () => {
      const customStyle = { fontSize: '20px', marginTop: '10px' };
      renderWithProviders(
        <GradientButton style={customStyle}>Test</GradientButton>
      );

      const button = screen.getByRole('button', { name: 'Test' });
      expect(button).toHaveStyle('font-size: 20px');
      expect(button).toHaveStyle('margin-top: 10px');
    });

    it('can be disabled', () => {
      renderWithProviders(
        <GradientButton disabled>Disabled</GradientButton>
      );

      const button = screen.getByRole('button', { name: 'Disabled' });
      expect(button).toBeDisabled();
    });

    it('supports different button types', () => {
      renderWithProviders(
        <GradientButton type="submit">Submit</GradientButton>
      );

      const button = screen.getByRole('button', { name: 'Submit' });
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      renderWithProviders(
        <GradientButton ref={ref}>Test</GradientButton>
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toHaveTextContent('Test');
    });

    it('applies gradient background style', () => {
      renderWithProviders(<GradientButton>Test</GradientButton>);

      const button = screen.getByRole('button', { name: 'Test' });
      expect(button).toHaveStyle('background: linear-gradient(to top left, #760D08, #38B6FF)');
    });

    it('handles complex children', () => {
      renderWithProviders(
        <GradientButton>
          <span>Icon</span>
          <span>Text</span>
        </GradientButton>
      );

      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('SmallGradientButton', () => {
    it('renders with smaller styling', () => {
      renderWithProviders(<SmallGradientButton>Small</SmallGradientButton>);

      const button = screen.getByRole('button', { name: 'Small' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('px-4', 'py-2');
    });

    it('handles click events', () => {
      const handleClick = jest.fn();
      renderWithProviders(
        <SmallGradientButton onClick={handleClick}>Small</SmallGradientButton>
      );

      const button = screen.getByRole('button', { name: 'Small' });
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be disabled', () => {
      renderWithProviders(
        <SmallGradientButton disabled>Disabled Small</SmallGradientButton>
      );

      const button = screen.getByRole('button', { name: 'Disabled Small' });
      expect(button).toBeDisabled();
    });
  });

  describe('LeftEdgeButton', () => {
    it('renders with edge positioning styling', () => {
      renderWithProviders(<LeftEdgeButton>Edge</LeftEdgeButton>);

      const button = screen.getByRole('button', { name: 'Edge' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('absolute', 'left-2');
    });

    it('handles click events', () => {
      const handleClick = jest.fn();
      renderWithProviders(
        <LeftEdgeButton onClick={handleClick}>Edge</LeftEdgeButton>
      );

      const button = screen.getByRole('button', { name: 'Edge' });
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies gradient background style', () => {
      renderWithProviders(<LeftEdgeButton>Edge</LeftEdgeButton>);

      const button = screen.getByRole('button', { name: 'Edge' });
      expect(button).toHaveStyle('background: linear-gradient(to top left, #760D08, #38B6FF)');
    });

    it('has proper positioning classes', () => {
      renderWithProviders(<LeftEdgeButton>Edge</LeftEdgeButton>);

      const button = screen.getByRole('button', { name: 'Edge' });
      expect(button).toHaveClass('absolute', 'left-2', 'rounded-xl');
    });

    it('can be disabled', () => {
      renderWithProviders(
        <LeftEdgeButton disabled>Disabled Edge</LeftEdgeButton>
      );

      const button = screen.getByRole('button', { name: 'Disabled Edge' });
      expect(button).toBeDisabled();
    });
  });

  describe('Button Accessibility', () => {
    it('supports aria-label', () => {
      renderWithProviders(
        <GradientButton aria-label="Custom aria label">Icon Only</GradientButton>
      );

      const button = screen.getByRole('button', { name: 'Custom aria label' });
      expect(button).toBeInTheDocument();
    });

    it('supports aria-describedby', () => {
      renderWithProviders(
        <div>
          <GradientButton aria-describedby="help-text">Button</GradientButton>
          <div id="help-text">Help text</div>
        </div>
      );

      const button = screen.getByRole('button', { name: 'Button' });
      expect(button).toHaveAttribute('aria-describedby', 'help-text');
    });

    it('has proper focus styles', () => {
      renderWithProviders(<GradientButton>Focus Test</GradientButton>);

      const button = screen.getByRole('button', { name: 'Focus Test' });
      button.focus();
      
      expect(button).toHaveFocus();
      expect(button).toHaveClass('outline-none');
    });
  });

  describe('Button States', () => {
    it('shows loading state when disabled', () => {
      renderWithProviders(
        <GradientButton disabled>Loading...</GradientButton>
      );

      const button = screen.getByRole('button', { name: 'Loading...' });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('prevents multiple clicks when disabled', () => {
      const handleClick = jest.fn();
      renderWithProviders(
        <GradientButton onClick={handleClick} disabled>
          Disabled
        </GradientButton>
      );

      const button = screen.getByRole('button', { name: 'Disabled' });
      fireEvent.click(button);
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles rapid clicks', () => {
      const handleClick = jest.fn();
      renderWithProviders(
        <GradientButton onClick={handleClick}>Rapid Click</GradientButton>
      );

      const button = screen.getByRole('button', { name: 'Rapid Click' });
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });
});