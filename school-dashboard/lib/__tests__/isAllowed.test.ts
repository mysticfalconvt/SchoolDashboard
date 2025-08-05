import isAllowed from '../isAllowed';
import type { User } from '../../components/User';

// Mock the useUser hook to get the return type
jest.mock('../../components/User', () => ({
  useUser: jest.fn(),
}));

describe('isAllowed', () => {
  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    isStaff: false,
    isParent: false,
    isStudent: false,
    isSuperAdmin: false,
    canManagePbis: false,
    canViewCallbacks: false,
    canManageCallbacks: false,
    canViewDiscipline: false,
    canManageDiscipline: false,
    canManageCalendar: false,
    canSeeAllLinks: false,
    canViewUsers: false,
    canEditUsers: false,
    hasTA: false,
  } as User;

  describe('permission checking', () => {
    it('returns true when user has the requested permission', () => {
      const userWithStaffPermission = { ...mockUser, isStaff: true };
      
      const result = isAllowed(userWithStaffPermission, 'isStaff');
      
      expect(result).toBe(true);
    });

    it('returns false when user does not have the requested permission', () => {
      const userWithoutStaffPermission = { ...mockUser, isStaff: false };
      
      const result = isAllowed(userWithoutStaffPermission, 'isStaff');
      
      expect(result).toBe(false);
    });

    it('returns false when user is null', () => {
      const result = isAllowed(null, 'isStaff');
      
      expect(result).toBe(false);
    });

    it('returns false when user is undefined', () => {
      const result = isAllowed(undefined, 'isStaff');
      
      expect(result).toBe(false);
    });
  });

  describe('boolean permission properties', () => {
    it('handles isStaff permission', () => {
      const staffUser = { ...mockUser, isStaff: true };
      const nonStaffUser = { ...mockUser, isStaff: false };
      
      expect(isAllowed(staffUser, 'isStaff')).toBe(true);
      expect(isAllowed(nonStaffUser, 'isStaff')).toBe(false);
    });

    it('handles isParent permission', () => {
      const parentUser = { ...mockUser, isParent: true };
      const nonParentUser = { ...mockUser, isParent: false };
      
      expect(isAllowed(parentUser, 'isParent')).toBe(true);
      expect(isAllowed(nonParentUser, 'isParent')).toBe(false);
    });

    it('handles isStudent permission', () => {
      const studentUser = { ...mockUser, isStudent: true };
      const nonStudentUser = { ...mockUser, isStudent: false };
      
      expect(isAllowed(studentUser, 'isStudent')).toBe(true);
      expect(isAllowed(nonStudentUser, 'isStudent')).toBe(false);
    });

    it('handles isSuperAdmin permission', () => {
      const adminUser = { ...mockUser, isSuperAdmin: true };
      const nonAdminUser = { ...mockUser, isSuperAdmin: false };
      
      expect(isAllowed(adminUser, 'isSuperAdmin')).toBe(true);
      expect(isAllowed(nonAdminUser, 'isSuperAdmin')).toBe(false);
    });
  });

  describe('specific functionality permissions', () => {
    it('handles canManagePbis permission', () => {
      const pbisManager = { ...mockUser, canManagePbis: true };
      const nonPbisManager = { ...mockUser, canManagePbis: false };
      
      expect(isAllowed(pbisManager, 'canManagePbis')).toBe(true);
      expect(isAllowed(nonPbisManager, 'canManagePbis')).toBe(false);
    });

    it('handles canViewCallbacks permission', () => {
      const callbackViewer = { ...mockUser, canViewCallbacks: true };
      const nonCallbackViewer = { ...mockUser, canViewCallbacks: false };
      
      expect(isAllowed(callbackViewer, 'canViewCallbacks')).toBe(true);
      expect(isAllowed(nonCallbackViewer, 'canViewCallbacks')).toBe(false);
    });

    it('handles canManageCallbacks permission', () => {
      const callbackManager = { ...mockUser, canManageCallbacks: true };
      const nonCallbackManager = { ...mockUser, canManageCallbacks: false };
      
      expect(isAllowed(callbackManager, 'canManageCallbacks')).toBe(true);
      expect(isAllowed(nonCallbackManager, 'canManageCallbacks')).toBe(false);
    });

    it('handles canViewDiscipline permission', () => {
      const disciplineViewer = { ...mockUser, canViewDiscipline: true };
      const nonDisciplineViewer = { ...mockUser, canViewDiscipline: false };
      
      expect(isAllowed(disciplineViewer, 'canViewDiscipline')).toBe(true);
      expect(isAllowed(nonDisciplineViewer, 'canViewDiscipline')).toBe(false);
    });

    it('handles canManageDiscipline permission', () => {
      const disciplineManager = { ...mockUser, canManageDiscipline: true };
      const nonDisciplineManager = { ...mockUser, canManageDiscipline: false };
      
      expect(isAllowed(disciplineManager, 'canManageDiscipline')).toBe(true);
      expect(isAllowed(nonDisciplineManager, 'canManageDiscipline')).toBe(false);
    });

    it('handles canManageCalendar permission', () => {
      const calendarManager = { ...mockUser, canManageCalendar: true };
      const nonCalendarManager = { ...mockUser, canManageCalendar: false };
      
      expect(isAllowed(calendarManager, 'canManageCalendar')).toBe(true);
      expect(isAllowed(nonCalendarManager, 'canManageCalendar')).toBe(false);
    });

    it('handles canSeeAllLinks permission', () => {
      const linkViewer = { ...mockUser, canSeeAllLinks: true };
      const nonLinkViewer = { ...mockUser, canSeeAllLinks: false };
      
      expect(isAllowed(linkViewer, 'canSeeAllLinks')).toBe(true);
      expect(isAllowed(nonLinkViewer, 'canSeeAllLinks')).toBe(false);
    });

    it('handles canViewUsers permission', () => {
      const userViewer = { ...mockUser, canViewUsers: true };
      const nonUserViewer = { ...mockUser, canViewUsers: false };
      
      expect(isAllowed(userViewer, 'canViewUsers')).toBe(true);
      expect(isAllowed(nonUserViewer, 'canViewUsers')).toBe(false);
    });

    it('handles canEditUsers permission', () => {
      const userEditor = { ...mockUser, canEditUsers: true };
      const nonUserEditor = { ...mockUser, canEditUsers: false };
      
      expect(isAllowed(userEditor, 'canEditUsers')).toBe(true);
      expect(isAllowed(nonUserEditor, 'canEditUsers')).toBe(false);
    });

    it('handles hasTA permission', () => {
      const taUser = { ...mockUser, hasTA: true };
      const nonTaUser = { ...mockUser, hasTA: false };
      
      expect(isAllowed(taUser, 'hasTA')).toBe(true);
      expect(isAllowed(nonTaUser, 'hasTA')).toBe(false);
    });
  });

  describe('string and object properties', () => {
    it('handles string properties that are truthy', () => {
      const userWithName = { ...mockUser, name: 'John Doe' };
      const userWithoutName = { ...mockUser, name: '' };
      
      expect(isAllowed(userWithName, 'name')).toBe(true);
      expect(isAllowed(userWithoutName, 'name')).toBe(false);
    });

    it('handles string properties that are falsy', () => {
      const userWithEmptyEmail = { ...mockUser, email: '' };
      const userWithNullEmail = { ...mockUser, email: null as any };
      
      expect(isAllowed(userWithEmptyEmail, 'email')).toBe(false);
      expect(isAllowed(userWithNullEmail, 'email')).toBe(false);
    });

    it('handles id property', () => {
      const userWithId = { ...mockUser, id: '123' };
      const userWithoutId = { ...mockUser, id: '' };
      
      expect(isAllowed(userWithId, 'id')).toBe(true);
      expect(isAllowed(userWithoutId, 'id')).toBe(false);
    });
  });

  describe('falsy value handling', () => {
    it('converts falsy values to false using double negation', () => {
      // Test various falsy values
      const userWithFalsyValues = {
        ...mockUser,
        falsyString: '',
        falsyNumber: 0,
        falsyNull: null,
        falsyUndefined: undefined,
        falsyFalse: false,
      } as any;

      expect(isAllowed(userWithFalsyValues, 'falsyString')).toBe(false);
      expect(isAllowed(userWithFalsyValues, 'falsyNumber')).toBe(false);
      expect(isAllowed(userWithFalsyValues, 'falsyNull')).toBe(false);
      expect(isAllowed(userWithFalsyValues, 'falsyUndefined')).toBe(false);
      expect(isAllowed(userWithFalsyValues, 'falsyFalse')).toBe(false);
    });

    it('converts truthy values to true using double negation', () => {
      const userWithTruthyValues = {
        ...mockUser,
        truthyString: 'hello',
        truthyNumber: 1,
        truthyArray: [1, 2, 3],
        truthyObject: { key: 'value' },
        truthyTrue: true,
      } as any;

      expect(isAllowed(userWithTruthyValues, 'truthyString')).toBe(true);
      expect(isAllowed(userWithTruthyValues, 'truthyNumber')).toBe(true);
      expect(isAllowed(userWithTruthyValues, 'truthyArray')).toBe(true);
      expect(isAllowed(userWithTruthyValues, 'truthyObject')).toBe(true);
      expect(isAllowed(userWithTruthyValues, 'truthyTrue')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles nonexistent properties', () => {
      const result = isAllowed(mockUser, 'nonExistentProperty' as any);
      
      expect(result).toBe(false);
    });

    it('handles user with minimal properties', () => {
      const minimalUser = { id: '1' } as any;
      
      expect(isAllowed(minimalUser, 'id')).toBe(true);
      expect(isAllowed(minimalUser, 'isStaff')).toBe(false);
    });

    it('returns consistent results for the same inputs', () => {
      const userWithPermission = { ...mockUser, canManagePbis: true };
      
      const result1 = isAllowed(userWithPermission, 'canManagePbis');
      const result2 = isAllowed(userWithPermission, 'canManagePbis');
      
      expect(result1).toBe(result2);
      expect(result1).toBe(true);
    });
  });

  describe('real-world usage scenarios', () => {
    it('checks admin permissions correctly', () => {
      const adminUser = { 
        ...mockUser, 
        isSuperAdmin: true,
        canManagePbis: true,
        canManageCallbacks: true,
        canManageDiscipline: true 
      };
      
      expect(isAllowed(adminUser, 'isSuperAdmin')).toBe(true);
      expect(isAllowed(adminUser, 'canManagePbis')).toBe(true);
      expect(isAllowed(adminUser, 'canManageCallbacks')).toBe(true);
      expect(isAllowed(adminUser, 'canManageDiscipline')).toBe(true);
    });

    it('checks teacher permissions correctly', () => {
      const teacherUser = { 
        ...mockUser, 
        isStaff: true,
        canViewCallbacks: true,
        hasTA: true 
      };
      
      expect(isAllowed(teacherUser, 'isStaff')).toBe(true);
      expect(isAllowed(teacherUser, 'canViewCallbacks')).toBe(true);
      expect(isAllowed(teacherUser, 'hasTA')).toBe(true);
      expect(isAllowed(teacherUser, 'canManagePbis')).toBe(false);
    });

    it('checks parent permissions correctly', () => {
      const parentUser = { 
        ...mockUser, 
        isParent: true 
      };
      
      expect(isAllowed(parentUser, 'isParent')).toBe(true);
      expect(isAllowed(parentUser, 'isStaff')).toBe(false);
      expect(isAllowed(parentUser, 'canManagePbis')).toBe(false);
    });

    it('checks student permissions correctly', () => {
      const studentUser = { 
        ...mockUser, 
        isStudent: true 
      };
      
      expect(isAllowed(studentUser, 'isStudent')).toBe(true);
      expect(isAllowed(studentUser, 'isStaff')).toBe(false);
      expect(isAllowed(studentUser, 'canViewCallbacks')).toBe(false);
    });
  });
});