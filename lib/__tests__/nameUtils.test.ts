import { UserTypeDisplay, capitalizeFirstLetter } from '../nameUtils';
import type { User } from '../../components/User';

describe('nameUtils', () => {
  describe('UserTypeDisplay', () => {
    const baseUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      isStaff: false,
      isParent: false,
      isStudent: false,
    } as User;

    it('returns teacher emoji for staff users', () => {
      const staffUser = { ...baseUser, isStaff: true };
      const result = UserTypeDisplay(staffUser);
      expect(result).toBe('👨‍🏫 ');
    });

    it('returns parent emoji for parent users', () => {
      const parentUser = { ...baseUser, isParent: true };
      const result = UserTypeDisplay(parentUser);
      expect(result).toBe(' 👨‍👧‍👦 ');
    });

    it('returns student emoji for student users', () => {
      const studentUser = { ...baseUser, isStudent: true };
      const result = UserTypeDisplay(studentUser);
      expect(result).toBe(' 🧑‍🎓 ');
    });

    it('combines multiple role emojis', () => {
      const staffParentUser = { 
        ...baseUser, 
        isStaff: true, 
        isParent: true 
      };
      const result = UserTypeDisplay(staffParentUser);
      expect(result).toBe('👨‍🏫  👨‍👧‍👦 ');
    });

    it('combines all three role emojis', () => {
      const allRolesUser = { 
        ...baseUser, 
        isStaff: true, 
        isParent: true, 
        isStudent: true 
      };
      const result = UserTypeDisplay(allRolesUser);
      expect(result).toBe('👨‍🏫  👨‍👧‍👦  🧑‍🎓 ');
    });

    it('returns "User" for users with no roles', () => {
      const noRoleUser = { ...baseUser };
      const result = UserTypeDisplay(noRoleUser);
      expect(result).toBe('User');
    });

    it('handles parent and student combination', () => {
      const parentStudentUser = { 
        ...baseUser, 
        isParent: true, 
        isStudent: true 
      };
      const result = UserTypeDisplay(parentStudentUser);
      expect(result).toBe(' 👨‍👧‍👦  🧑‍🎓 ');
    });

    it('handles staff and student combination', () => {
      const staffStudentUser = { 
        ...baseUser, 
        isStaff: true, 
        isStudent: true 
      };
      const result = UserTypeDisplay(staffStudentUser);
      expect(result).toBe('👨‍🏫  🧑‍🎓 ');
    });
  });

  describe('capitalizeFirstLetter', () => {
    it('capitalizes single word', () => {
      expect(capitalizeFirstLetter('hello')).toBe('Hello');
    });

    it('capitalizes multiple words', () => {
      expect(capitalizeFirstLetter('hello world')).toBe('Hello World');
    });

    it('handles mixed case words', () => {
      expect(capitalizeFirstLetter('hELLo WoRLD')).toBe('Hello World');
    });

    it('handles already capitalized words', () => {
      expect(capitalizeFirstLetter('Hello World')).toBe('Hello World');
    });

    it('handles single letters', () => {
      expect(capitalizeFirstLetter('a')).toBe('A');
      expect(capitalizeFirstLetter('A')).toBe('A');
    });

    it('handles empty string', () => {
      expect(capitalizeFirstLetter('')).toBe('');
    });

    it('handles undefined input', () => {
      expect(capitalizeFirstLetter(undefined)).toBe('');
    });

    it('handles null input', () => {
      expect(capitalizeFirstLetter(null)).toBe('');
    });

    it('handles strings with numbers', () => {
      expect(capitalizeFirstLetter('hello123 world456')).toBe('Hello123 World456');
    });

    it('handles strings with special characters', () => {
      expect(capitalizeFirstLetter('hello-world test_case')).toBe('Hello-world Test_case');
    });

    it('handles strings with multiple spaces', () => {
      expect(capitalizeFirstLetter('hello   world')).toBe('Hello   World');
    });

    it('handles strings with leading/trailing spaces', () => {
      expect(capitalizeFirstLetter(' hello world ')).toBe(' Hello World ');
    });

    it('handles strings with punctuation', () => {
      expect(capitalizeFirstLetter('hello, world! how are you?')).toBe('Hello, World! How Are You?');
    });

    it('handles very long strings', () => {
      const longString = 'this is a very long string with many words to test the function';
      const expected = 'This Is A Very Long String With Many Words To Test The Function';
      expect(capitalizeFirstLetter(longString)).toBe(expected);
    });

    it('handles strings with only spaces', () => {
      expect(capitalizeFirstLetter('   ')).toBe('   ');
    });

    it('handles strings with tabs and newlines', () => {
      expect(capitalizeFirstLetter('hello\tworld\ntest')).toBe('Hello\tWorld\nTest');
    });

    it('preserves word boundaries correctly', () => {
      expect(capitalizeFirstLetter("can't won't don't")).toBe("Can't Won't Don't");
    });

    it('handles hyphenated words', () => {
      expect(capitalizeFirstLetter('twenty-five fifty-six')).toBe('Twenty-five Fifty-six');
    });

    it('handles abbreviations and acronyms', () => {
      expect(capitalizeFirstLetter('usa fbi cia')).toBe('Usa Fbi Cia');
    });

    it('handles words with apostrophes', () => {
      expect(capitalizeFirstLetter("john's mary's")).toBe("John's Mary's");
    });
  });
});