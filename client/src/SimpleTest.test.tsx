import { render, screen } from '@testing-library/react';
import React from 'react';

// A simple component for testing
const SimpleComponent: React.FC<{ text: string }> = ({ text }) => {
  return <div data-testid="simple-component">{text}</div>;
};

describe('Simple React Component Test', () => {
  it('renders simple component with text', () => {
    render(<SimpleComponent text="Hello, World!" />);
    
    // Simple assertion
    const element = screen.getByTestId('simple-component');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Hello, World!');
  });
});