import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FigurePortrait } from '../FigurePortrait';

describe('FigurePortrait', () => {
  it('renders with image when imageUrl is provided', () => {
    render(
      <FigurePortrait
        name="St. Augustine"
        imageUrl="https://example.com/augustine.jpg"
        orthodoxyStatus="canonized"
        size="medium"
      />
    );

    const img = screen.getByAltText('St. Augustine');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('augustine.jpg'));
  });

  it('applies correct CSS class for canonized saints', () => {
    const { container } = render(
      <FigurePortrait
        name="St. Augustine"
        imageUrl="https://example.com/augustine.jpg"
        orthodoxyStatus="canonized"
        size="medium"
      />
    );

    const portrait = container.firstChild as HTMLElement;
    expect(portrait).toHaveClass('portrait-frame');
    expect(portrait).toHaveClass('portrait-frame--saint');
  });

  it('applies correct CSS class for blessed', () => {
    const { container } = render(
      <FigurePortrait
        name="Bl. John Paul II"
        imageUrl="https://example.com/jpii.jpg"
        orthodoxyStatus="blessed"
        size="medium"
      />
    );

    const portrait = container.firstChild as HTMLElement;
    expect(portrait).toHaveClass('portrait-frame--blessed');
  });

  it('applies correct CSS class for orthodox', () => {
    const { container } = render(
      <FigurePortrait
        name="Eusebius"
        imageUrl="https://example.com/eusebius.jpg"
        orthodoxyStatus="orthodox"
        size="medium"
      />
    );

    const portrait = container.firstChild as HTMLElement;
    expect(portrait).toHaveClass('portrait-frame--orthodox');
  });

  it('applies correct CSS class for schismatic', () => {
    const { container } = render(
      <FigurePortrait
        name="Nestorius"
        imageUrl="https://example.com/nestorius.jpg"
        orthodoxyStatus="schismatic"
        size="medium"
      />
    );

    const portrait = container.firstChild as HTMLElement;
    expect(portrait).toHaveClass('portrait-frame--schismatic');
  });

  it('applies correct CSS class for heresiarch', () => {
    const { container } = render(
      <FigurePortrait
        name="Arius"
        imageUrl="https://example.com/arius.jpg"
        orthodoxyStatus="heresiarch"
        size="medium"
      />
    );

    const portrait = container.firstChild as HTMLElement;
    expect(portrait).toHaveClass('portrait-frame--heresiarch');
  });

  it('applies correct CSS class for secular', () => {
    const { container } = render(
      <FigurePortrait
        name="Constantine"
        imageUrl="https://example.com/constantine.jpg"
        orthodoxyStatus="secular"
        size="medium"
      />
    );

    const portrait = container.firstChild as HTMLElement;
    expect(portrait).toHaveClass('portrait-frame--secular');
  });

  it('applies martyr class when isMartyr is true for canonized saints', () => {
    const { container } = render(
      <FigurePortrait
        name="St. Lawrence"
        imageUrl="https://example.com/lawrence.jpg"
        orthodoxyStatus="canonized"
        isMartyr={true}
        size="medium"
      />
    );

    const portrait = container.firstChild as HTMLElement;
    expect(portrait).toHaveClass('portrait-frame--martyr');
  });

  it('applies martyr class when isMartyr is true for blessed', () => {
    const { container } = render(
      <FigurePortrait
        name="Bl. Martyr"
        imageUrl="https://example.com/martyr.jpg"
        orthodoxyStatus="blessed"
        isMartyr={true}
        size="medium"
      />
    );

    const portrait = container.firstChild as HTMLElement;
    expect(portrait).toHaveClass('portrait-frame--martyr');
  });

  it('does not apply martyr class for non-canonized/blessed', () => {
    const { container } = render(
      <FigurePortrait
        name="Orthodox Martyr"
        imageUrl="https://example.com/martyr.jpg"
        orthodoxyStatus="orthodox"
        isMartyr={true}
        size="medium"
      />
    );

    const portrait = container.firstChild as HTMLElement;
    expect(portrait).not.toHaveClass('portrait-frame--martyr');
    expect(portrait).toHaveClass('portrait-frame--orthodox');
  });

  it('applies correct size class', () => {
    const { container, rerender } = render(
      <FigurePortrait
        name="St. Test"
        imageUrl="https://example.com/test.jpg"
        orthodoxyStatus="canonized"
        size="small"
      />
    );

    expect(container.firstChild).toHaveClass('portrait-frame--small');

    rerender(
      <FigurePortrait
        name="St. Test"
        imageUrl="https://example.com/test.jpg"
        orthodoxyStatus="canonized"
        size="large"
      />
    );

    expect(container.firstChild).toHaveClass('portrait-frame--large');
  });

  it('uses medium size by default', () => {
    const { container } = render(
      <FigurePortrait
        name="St. Test"
        imageUrl="https://example.com/test.jpg"
        orthodoxyStatus="canonized"
      />
    );

    expect(container.firstChild).toHaveClass('portrait-frame--medium');
  });

  it('has correct tooltip for canonized saint', () => {
    const { container } = render(
      <FigurePortrait
        name="St. Augustine"
        imageUrl="https://example.com/augustine.jpg"
        orthodoxyStatus="canonized"
      />
    );

    const portrait = container.firstChild as HTMLElement;
    expect(portrait).toHaveAttribute(
      'title',
      'Canonized saint in communion with the Catholic Church'
    );
  });

  it('has correct tooltip for martyr', () => {
    const { container } = render(
      <FigurePortrait
        name="St. Lawrence"
        imageUrl="https://example.com/lawrence.jpg"
        orthodoxyStatus="canonized"
        isMartyr={true}
      />
    );

    const portrait = container.firstChild as HTMLElement;
    expect(portrait).toHaveAttribute('title', 'Canonized martyr');
  });

  it('has correct tooltip for blessed', () => {
    const { container } = render(
      <FigurePortrait
        name="Bl. Test"
        imageUrl="https://example.com/test.jpg"
        orthodoxyStatus="blessed"
      />
    );

    const portrait = container.firstChild as HTMLElement;
    expect(portrait).toHaveAttribute('title', 'Beatified (Blessed)');
  });

  it('has correct tooltip for orthodox', () => {
    const { container } = render(
      <FigurePortrait
        name="Test"
        imageUrl="https://example.com/test.jpg"
        orthodoxyStatus="orthodox"
      />
    );

    const portrait = container.firstChild as HTMLElement;
    expect(portrait).toHaveAttribute(
      'title',
      'Important historical figure supportive of the Church'
    );
  });

  it('has correct tooltip for schismatic', () => {
    const { container } = render(
      <FigurePortrait
        name="Test"
        imageUrl="https://example.com/test.jpg"
        orthodoxyStatus="schismatic"
      />
    );

    const portrait = container.firstChild as HTMLElement;
    expect(portrait).toHaveAttribute(
      'title',
      'Figure associated with a schism (rupture of communion)'
    );
  });

  it('has correct tooltip for heresiarch', () => {
    const { container } = render(
      <FigurePortrait
        name="Test"
        imageUrl="https://example.com/test.jpg"
        orthodoxyStatus="heresiarch"
      />
    );

    const portrait = container.firstChild as HTMLElement;
    expect(portrait).toHaveAttribute('title', 'Teacher whose doctrines were condemned as heresy');
  });

  it('has correct tooltip for secular', () => {
    const { container } = render(
      <FigurePortrait
        name="Test"
        imageUrl="https://example.com/test.jpg"
        orthodoxyStatus="secular"
      />
    );

    const portrait = container.firstChild as HTMLElement;
    expect(portrait).toHaveAttribute('title', 'Secular historical figure');
  });

  it('sets aria-label matching the tooltip', () => {
    const { container } = render(
      <FigurePortrait
        name="St. Augustine"
        imageUrl="https://example.com/augustine.jpg"
        orthodoxyStatus="canonized"
      />
    );

    const portrait = container.firstChild as HTMLElement;
    expect(portrait).toHaveAttribute(
      'aria-label',
      'Canonized saint in communion with the Catholic Church'
    );
  });
});
