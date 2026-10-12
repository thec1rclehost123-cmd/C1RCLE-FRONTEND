import { describe, expect, it } from 'vitest';

import {
  findDepartmentByName,
  parseDepartmentFromSubject,
  SUPPORT_DEPARTMENTS,
} from './support-departments';

describe('support departments configuration', () => {
  it('defines all 9 departments required by ANIL_SUPPORT_TAB.md', () => {
    const departmentNames = SUPPORT_DEPARTMENTS.map((dept) => dept.name);
    expect(departmentNames).toEqual([
      'Account',
      'Event Management',
      'Ticketing',
      'Payments & Finance',
      'Door Management',
      'Partners',
      'Marketing',
      'Analytics',
      'Technical',
    ]);
  });

  it('maps each department to a valid gateway contract category', () => {
    const validCategories = new Set(['account', 'billing', 'order', 'event', 'technical', 'other']);
    for (const dept of SUPPORT_DEPARTMENTS) {
      expect(validCategories.has(dept.gatewayCategory)).toBe(true);
      expect(dept.subcategories.length).toBeGreaterThan(0);
    }
  });

  it('finds department by name case-insensitively', () => {
    const found = findDepartmentByName('payments & finance');
    expect(found).toBeDefined();
    expect(found?.gatewayCategory).toBe('billing');
    expect(found?.subcategories).toContain('Payout Delay');
  });

  it('parses department, subcategory, and clean subject correctly', () => {
    const parsed = parseDepartmentFromSubject(
      '[Payments & Finance · Payout Delay] Event settlement delay',
    );
    expect(parsed.department).toBe('Payments & Finance');
    expect(parsed.subcategory).toBe('Payout Delay');
    expect(parsed.cleanSubject).toBe('Event settlement delay');
  });

  it('handles subject without bracket prefix gracefully', () => {
    const parsed = parseDepartmentFromSubject('Direct subject without department tag');
    expect(parsed.department).toBeNull();
    expect(parsed.subcategory).toBeNull();
    expect(parsed.cleanSubject).toBe('Direct subject without department tag');
  });
});
