import {
  checkParentExists,
  createProcessingResult,
  findStudentByNameAndEmail,
  generateSummaryStats,
  Parent,
  parseCSV,
  ProcessingResult,
  Student,
  validateContactInfo,
} from '../csvParentImportUtils';

describe('csvParentImportUtils', () => {
  const mockStudents: Student[] = [
    {
      id: 'student-1',
      name: 'John Doe',
      email: 'john.doe@school.edu',
    },
    {
      id: 'student-2',
      name: 'Jane Smith',
      email: 'jane.smith@school.edu',
    },
    {
      id: 'student-3',
      name: 'Bob Wilson Jr',
      email: 'bob.wilson@school.edu',
    },
    {
      id: 'student-4',
      name: 'Mary Johnson-Brown',
      email: 'mary.johnson@school.edu',
    },
  ];

  const mockParents: Parent[] = [
    {
      id: 'parent-1',
      name: 'Mary Doe',
      email: 'mary.doe@email.com',
      children: [{ id: 'student-1', name: 'John Doe' }],
    },
    {
      id: 'parent-2',
      name: 'Sarah Smith',
      email: 'sarah.smith@email.com',
      children: [{ id: 'student-2', name: 'Jane Smith' }],
    },
  ];

  describe('parseCSV', () => {
    it('should parse valid CSV with headers', () => {
      const csvText = `Last_Name,First_Name,Contact 1,Email,Contact 2,Email
Doe,John,Mary Doe,mary.doe@email.com,John Sr,john.sr@email.com
Smith,Jane,Sarah Smith,sarah.smith@email.com,,`;

      const result = parseCSV(csvText);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        Last_Name: 'Doe',
        First_Name: 'John',
        'Contact 1': 'Mary Doe',
        'Contact 1 Email': 'mary.doe@email.com',
        'Contact 2': 'John Sr',
        'Contact 2 Email': 'john.sr@email.com',
      });
      expect(result[1]).toEqual({
        Last_Name: 'Smith',
        First_Name: 'Jane',
        'Contact 1': 'Sarah Smith',
        'Contact 1 Email': 'sarah.smith@email.com',
        'Contact 2': '',
        'Contact 2 Email': '',
      });
    });

    it('should handle CSV with quotes', () => {
      const csvText = `Last_Name,First_Name,Contact 1,Email,Contact 2,Email
"Doe","John","Mary Doe","mary.doe@email.com","John Sr","john.sr@email.com"`;

      const result = parseCSV(csvText);

      expect(result).toHaveLength(1);
      expect(result[0].Last_Name).toBe('Doe');
      expect(result[0].First_Name).toBe('John');
    });

    it('should handle CSV with commas inside quoted fields', () => {
      const csvText = `Last_Name,First_Name,Contact 1,Email,Contact 2,Email
student1,test,"Shatney, Kate L",kshatney89@gmail.com,"Abbott, Jd",wryderwaylon@gmail.com`;

      const result = parseCSV(csvText);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        Last_Name: 'student1',
        First_Name: 'test',
        'Contact 1': 'Shatney, Kate L',
        'Contact 1 Email': 'kshatney89@gmail.com',
        'Contact 2': 'Abbott, Jd',
        'Contact 2 Email': 'wryderwaylon@gmail.com',
      });
    });

    it('should handle CSV with spaces after commas in emails', () => {
      const csvText = `Last_Name,First_Name,Contact 1,Email,Contact 2,Email
student3,test,"testmom",test@test2.com,"testmom2", test@test2.com`;

      const result = parseCSV(csvText);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        Last_Name: 'student3',
        First_Name: 'test',
        'Contact 1': 'testmom',
        'Contact 1 Email': 'test@test2.com',
        'Contact 2': 'testmom2',
        'Contact 2 Email': 'test@test2.com',
      });
    });

    it('should handle empty CSV', () => {
      const csvText = `Last_Name,First_Name,Contact 1,Email,Contact 2,Email`;

      const result = parseCSV(csvText);

      expect(result).toHaveLength(0);
    });

    it('should handle completely empty input', () => {
      const csvText = '';

      const result = parseCSV(csvText);

      expect(result).toHaveLength(0);
    });

    it('should handle CSV with missing values', () => {
      const csvText = `Last_Name,First_Name,Contact 1,Email,Contact 2,Email
Doe,John,Mary Doe,,John Sr,`;

      const result = parseCSV(csvText);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        Last_Name: 'Doe',
        First_Name: 'John',
        'Contact 1': 'Mary Doe',
        'Contact 1 Email': '',
        'Contact 2': 'John Sr',
        'Contact 2 Email': '',
      });
    });
  });

  describe('findStudentByNameAndEmail', () => {
    it('should find student by exact name match', () => {
      const result = findStudentByNameAndEmail('John', 'Doe', mockStudents);

      expect(result).toEqual(mockStudents[0]);
    });

    it('should find student by reverse name match', () => {
      const result = findStudentByNameAndEmail('Doe', 'John', mockStudents);

      expect(result).toEqual(mockStudents[0]);
    });

    it('should find student by partial name match', () => {
      const result = findStudentByNameAndEmail('Bob', 'Wilson', mockStudents);

      expect(result).toEqual(mockStudents[2]);
    });

    it('should find student by hyphenated name', () => {
      const result = findStudentByNameAndEmail('Mary', 'Johnson', mockStudents);

      expect(result).toEqual(mockStudents[3]);
    });

    it('should handle case insensitive matching', () => {
      const result = findStudentByNameAndEmail('JOHN', 'doe', mockStudents);

      expect(result).toEqual(mockStudents[0]);
    });

    it('should find student by name and email match', () => {
      const result = findStudentByNameAndEmail(
        'John',
        'Doe',
        mockStudents,
        'john.doe@school.edu',
      );

      expect(result).toEqual(mockStudents[0]);
    });

    it('should not find student with correct name but wrong email', () => {
      const result = findStudentByNameAndEmail(
        'John',
        'Doe',
        mockStudents,
        'wrong.email@school.edu',
      );

      expect(result).toBeNull();
    });

    it('should handle whitespace in names', () => {
      const result = findStudentByNameAndEmail(
        '  John  ',
        '  Doe  ',
        mockStudents,
      );

      expect(result).toEqual(mockStudents[0]);
    });

    it('should return null for non-existent student', () => {
      const result = findStudentByNameAndEmail(
        'Unknown',
        'Student',
        mockStudents,
      );

      expect(result).toBeNull();
    });

    it('should handle empty student array', () => {
      const result = findStudentByNameAndEmail('John', 'Doe', []);

      expect(result).toBeNull();
    });

    it('should handle null/undefined student array', () => {
      const result = findStudentByNameAndEmail('John', 'Doe', null as any);

      expect(result).toBeNull();
    });

    it('should match individual name parts (like "test student1" vs "student1 test")', () => {
      const studentsWithDifferentFormat = [
        {
          id: 'student-1',
          name: 'test student1',
          email: 'test.student1@school.edu',
        },
      ];

      const result = findStudentByNameAndEmail(
        'student1',
        'test',
        studentsWithDifferentFormat,
      );

      expect(result).toEqual(studentsWithDifferentFormat[0]);
    });

    it('should match when database has "first last" format and CSV has "last first"', () => {
      const studentsWithFirstLast = [
        {
          id: 'student-1',
          name: 'test student4',
          email: 'teststudent4@ncsuvt.org',
        },
      ];

      const result = findStudentByNameAndEmail(
        'test',
        'student4',
        studentsWithFirstLast,
      );

      expect(result).toEqual(studentsWithFirstLast[0]);
    });

    it('should match by email pattern (first.last@domain)', () => {
      const studentsWithEmails = [
        {
          id: 'student-1',
          name: 'John Smith',
          email: 'john.smith@ncsuvt.org',
        },
        {
          id: 'student-2',
          name: 'Jane Mary Doe',
          email: 'jane.doe@ncsuvt.org',
        },
      ];

      // Should match by email even if CSV has different name format
      const result1 = findStudentByNameAndEmail(
        'Smith',
        'John',
        studentsWithEmails,
      );
      expect(result1).toEqual(studentsWithEmails[0]);

      // Should match by email with middle name ignored
      const result2 = findStudentByNameAndEmail(
        'Doe',
        'Jane',
        studentsWithEmails,
      );
      expect(result2).toEqual(studentsWithEmails[1]);
    });

    it('should match students with middle names', () => {
      const studentsWithMiddleNames = [
        {
          id: 'student-1',
          name: 'John Michael Smith',
          email: 'john.smith@school.edu',
        },
        {
          id: 'student-2',
          name: 'Mary Jane Watson Parker',
          email: 'mary.parker@school.edu',
        },
      ];

      // Should match first and last name, ignoring middle
      const result1 = findStudentByNameAndEmail(
        'John',
        'Smith',
        studentsWithMiddleNames,
      );
      expect(result1).toEqual(studentsWithMiddleNames[0]);

      // Should match first and last name with multiple middle names
      const result2 = findStudentByNameAndEmail(
        'Mary',
        'Parker',
        studentsWithMiddleNames,
      );
      expect(result2).toEqual(studentsWithMiddleNames[1]);
    });

    it('should match by email patterns with various formats', () => {
      const studentsWithVariousEmails = [
        {
          id: 'student-1',
          name: 'John Smith',
          email: 'johnsmith@ncsuvt.org', // no dot
        },
        {
          id: 'student-2',
          name: 'Jane Doe',
          email: 'doe.jane@ncsuvt.org', // reversed
        },
        {
          id: 'student-3',
          name: 'Bob Wilson',
          email: 'bob@ncsuvt.org', // first name only
        },
      ];

      const result1 = findStudentByNameAndEmail(
        'John',
        'Smith',
        studentsWithVariousEmails,
      );
      expect(result1).toEqual(studentsWithVariousEmails[0]);

      const result2 = findStudentByNameAndEmail(
        'Jane',
        'Doe',
        studentsWithVariousEmails,
      );
      expect(result2).toEqual(studentsWithVariousEmails[1]);

      const result3 = findStudentByNameAndEmail(
        'Bob',
        'Wilson',
        studentsWithVariousEmails,
      );
      expect(result3).toEqual(studentsWithVariousEmails[2]);
    });

    it('should handle partial name matches for nicknames', () => {
      const studentsWithNicknames = [
        {
          id: 'student-1',
          name: 'Robert Johnson',
          email: 'robert.johnson@school.edu',
        },
        {
          id: 'student-2',
          name: 'Elizabeth Smith',
          email: 'elizabeth.smith@school.edu',
        },
      ];

      // Should match "Bob" to "Robert"
      const result1 = findStudentByNameAndEmail(
        'Bob',
        'Johnson',
        studentsWithNicknames,
      );
      expect(result1).toEqual(studentsWithNicknames[0]);

      // Should match "Liz" to "Elizabeth"
      const result2 = findStudentByNameAndEmail(
        'Liz',
        'Smith',
        studentsWithNicknames,
      );
      expect(result2).toEqual(studentsWithNicknames[1]);
    });

    it('should prioritize email matches over name matches', () => {
      const students = [
        {
          id: 'student-1',
          name: 'Wrong Name Person',
          email: 'john.smith@ncsuvt.org',
        },
        {
          id: 'student-2',
          name: 'John Smith',
          email: 'different.email@ncsuvt.org',
        },
      ];

      // Should match the first student by email even though name is wrong
      const result = findStudentByNameAndEmail('John', 'Smith', students);
      expect(result).toEqual(students[0]);
    });

    it('should handle complex real-world scenarios', () => {
      const realWorldStudents = [
        {
          id: 'student-1',
          name: 'testStudent1',
          email: 'teststudent1@test.com',
        },
        {
          id: 'student-2',
          name: 'test student4',
          email: 'teststudent4@ncsuvt.org',
        },
        {
          id: 'student-3',
          name: 'Test Student3',
          email: 'teststudent3@ncsuvt.org',
        },
      ];

      // Should match various name formats
      const result1 = findStudentByNameAndEmail(
        'student1',
        'test',
        realWorldStudents,
      );
      expect(result1).toEqual(realWorldStudents[0]);

      const result2 = findStudentByNameAndEmail(
        'test',
        'student4',
        realWorldStudents,
      );
      expect(result2).toEqual(realWorldStudents[1]);

      const result3 = findStudentByNameAndEmail(
        'test',
        'student3',
        realWorldStudents,
      );
      expect(result3).toEqual(realWorldStudents[2]);
    });
  });

  describe('checkParentExists', () => {
    it('should find existing parent with correct email and student relationship', () => {
      const result = checkParentExists(
        'mary.doe@email.com',
        'student-1',
        mockParents,
      );

      expect(result).toEqual(mockParents[0]);
    });

    it('should not find parent with correct email but no student relationship', () => {
      const result = checkParentExists(
        'mary.doe@email.com',
        'student-2',
        mockParents,
      );

      expect(result).toBeNull();
    });

    it('should handle case insensitive email matching', () => {
      const result = checkParentExists(
        'MARY.DOE@EMAIL.COM',
        'student-1',
        mockParents,
      );

      expect(result).toEqual(mockParents[0]);
    });

    it('should handle whitespace in email', () => {
      const result = checkParentExists(
        '  mary.doe@email.com  ',
        'student-1',
        mockParents,
      );

      expect(result).toEqual(mockParents[0]);
    });

    it('should return null for non-existent parent', () => {
      const result = checkParentExists(
        'unknown@email.com',
        'student-1',
        mockParents,
      );

      expect(result).toBeNull();
    });

    it('should handle empty parents array', () => {
      const result = checkParentExists('mary.doe@email.com', 'student-1', []);

      expect(result).toBeNull();
    });

    it('should handle null/undefined parents array', () => {
      const result = checkParentExists(
        'mary.doe@email.com',
        'student-1',
        null as any,
      );

      expect(result).toBeNull();
    });

    it('should handle empty email', () => {
      const result = checkParentExists('', 'student-1', mockParents);

      expect(result).toBeNull();
    });

    it('should handle whitespace-only email', () => {
      const result = checkParentExists('   ', 'student-1', mockParents);

      expect(result).toBeNull();
    });
  });

  describe('validateContactInfo', () => {
    it('should return true for valid name and email', () => {
      const result = validateContactInfo('John Doe', 'john@email.com');

      expect(result).toBe(true);
    });

    it('should return false for empty name', () => {
      const result = validateContactInfo('', 'john@email.com');

      expect(result).toBe(false);
    });

    it('should return false for empty email', () => {
      const result = validateContactInfo('John Doe', '');

      expect(result).toBe(false);
    });

    it('should return false for whitespace-only name', () => {
      const result = validateContactInfo('   ', 'john@email.com');

      expect(result).toBe(false);
    });

    it('should return false for whitespace-only email', () => {
      const result = validateContactInfo('John Doe', '   ');

      expect(result).toBe(false);
    });

    it('should return false for null/undefined values', () => {
      expect(validateContactInfo(null as any, 'john@email.com')).toBe(false);
      expect(validateContactInfo('John Doe', null as any)).toBe(false);
      expect(validateContactInfo(undefined as any, undefined as any)).toBe(
        false,
      );
    });
  });

  describe('createProcessingResult', () => {
    it('should create result for found student', () => {
      const student = mockStudents[0];
      const result = createProcessingResult('John', 'Doe', student);

      expect(result).toEqual({
        studentName: 'John Doe',
        studentEmail: 'john.doe@school.edu',
        studentFound: true,
        contact1Created: false,
        contact1Existed: false,
        contact1Updated: false,
        contact2Created: false,
        contact2Existed: false,
        contact2Updated: false,
        errors: [],
      });
    });

    it('should create result for student not found', () => {
      const result = createProcessingResult('Unknown', 'Student', null);

      expect(result).toEqual({
        studentName: 'Unknown Student',
        studentEmail: '',
        studentFound: false,
        contact1Created: false,
        contact1Existed: false,
        contact1Updated: false,
        contact2Created: false,
        contact2Existed: false,
        contact2Updated: false,
        errors: ['Student not found'],
      });
    });
  });

  describe('generateSummaryStats', () => {
    it('should generate correct summary statistics', () => {
      const results: ProcessingResult[] = [
        {
          studentName: 'John Doe',
          studentEmail: 'john@school.edu',
          studentFound: true,
          contact1Created: true,
          contact1Existed: false,
          contact2Created: false,
          contact2Existed: true,
          errors: [],
        },
        {
          studentName: 'Jane Smith',
          studentEmail: 'jane@school.edu',
          studentFound: true,
          contact1Created: false,
          contact1Existed: true,
          contact2Created: true,
          contact2Existed: false,
          errors: [],
        },
        {
          studentName: 'Unknown Student',
          studentEmail: '',
          studentFound: false,
          contact1Created: false,
          contact1Existed: false,
          contact2Created: false,
          contact2Existed: false,
          errors: ['Student not found', 'Another error'],
        },
      ];

      const stats = generateSummaryStats(results);

      expect(stats).toEqual({
        totalProcessed: 3,
        studentsFound: 2,
        studentsNotFound: 1,
        parentsCreated: 2,
        parentsExisted: 2,
        parentsUpdated: 0,
        totalErrors: 2,
      });
    });

    it('should handle empty results array', () => {
      const stats = generateSummaryStats([]);

      expect(stats).toEqual({
        totalProcessed: 0,
        studentsFound: 0,
        studentsNotFound: 0,
        parentsCreated: 0,
        parentsExisted: 0,
        parentsUpdated: 0,
        totalErrors: 0,
      });
    });

    it('should handle results with no parents created or existing', () => {
      const results: ProcessingResult[] = [
        {
          studentName: 'John Doe',
          studentEmail: 'john@school.edu',
          studentFound: true,
          contact1Created: false,
          contact1Existed: false,
          contact2Created: false,
          contact2Existed: false,
          errors: [],
        },
      ];

      const stats = generateSummaryStats(results);

      expect(stats.parentsCreated).toBe(0);
      expect(stats.parentsExisted).toBe(0);
    });
  });
});
