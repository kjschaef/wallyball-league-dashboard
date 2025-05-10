import React from 'react';
import { render, screen } from '@testing-library/react';

const SimpleComponent = () => {
  return <div>Hello World</div>;
};

describe('SimpleComponent', () => {
  test('renders correctly', () => {
    render(<SimpleComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
