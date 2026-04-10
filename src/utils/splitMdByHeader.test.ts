import { describe, it, expect } from 'vitest';
import { splitMdByHeader } from './splitMdByHeader';

describe('splitMdByHeader', () => {
  it('should split markdown by headers', () => {
    const text = `
# Title 1
Content 1
## Title 2
Content 2
Line 2
# Title 3
Content 3
`.trim();

    const sections = splitMdByHeader(text);
    expect(sections).toHaveLength(3);
    expect(sections[0].title).toBe('Title 1');
    expect(sections[0].content).toBe('Content 1');
    expect(sections[1].title).toBe('Title 2');
    expect(sections[1].content).toBe('Content 2\nLine 2');
    expect(sections[2].title).toBe('Title 3');
    expect(sections[2].content).toBe('Content 3');
  });

  it('should handle text without headers', () => {
    const text = 'Just some content without header';
    const sections = splitMdByHeader(text, 'Default Title');
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe('Default Title');
    expect(sections[0].content).toBe(text);
  });

  it('should handle text starting without header and then having headers', () => {
    const text = `
Intro text
# Header 1
Content 1
`.trim();
    const sections = splitMdByHeader(text, 'Intro');
    expect(sections).toHaveLength(2);
    expect(sections[0].title).toBe('Intro');
    expect(sections[0].content).toBe('Intro text');
    expect(sections[1].title).toBe('Header 1');
    expect(sections[1].content).toBe('Content 1');
  });

  it('should handle empty text', () => {
    const sections = splitMdByHeader('');
    expect(sections).toHaveLength(0);
  });
});
