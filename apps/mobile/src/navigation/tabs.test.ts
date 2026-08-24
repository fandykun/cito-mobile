import { tabs } from '@/src/navigation/tabs';

describe('mobile navigation', () => {
  it('keeps the five prototype module boundaries visible', () => {
    expect(tabs.map((tab) => tab.name)).toEqual([
      'index',
      'inventory',
      'records',
      'pos',
      'finance',
    ]);
  });

  it('has unique route names and labels', () => {
    expect(new Set(tabs.map((tab) => tab.name)).size).toBe(tabs.length);
    expect(new Set(tabs.map((tab) => tab.title)).size).toBe(tabs.length);
  });
});
