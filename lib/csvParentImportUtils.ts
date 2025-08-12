export interface CSVRow {
  Last_Name: string;
  First_Name: string;
  'Contact 1': string;
  'Contact 1 Email': string;
  'Contact 2': string;
  'Contact 2 Email': string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  children: { id: string; name: string }[];
}

export interface ProcessingResult {
  studentName: string;
  studentEmail: string;
  studentFound: boolean;
  contact1Created: boolean;
  contact1Existed: boolean;
  contact1Updated?: boolean;
  contact1Name?: string;
  contact1Email?: string;
  contact2Created: boolean;
  contact2Existed: boolean;
  contact2Updated?: boolean;
  contact2Name?: string;
  contact2Email?: string;
  errors: string[];
}

export const parseCSV = (csvText: string): CSVRow[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) {
    return [];
  }

  // More sophisticated CSV parsing to handle quotes and commas within fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (!inQuotes) {
          // Starting quote
          inQuotes = true;
        } else if (i + 1 < line.length && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Ending quote
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headerLine = parseCSVLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);

    // Handle the specific CSV format with duplicate "Email" columns
    const row: any = {
      Last_Name: values[0] || '',
      First_Name: values[1] || '',
      'Contact 1': values[2] || '',
      'Contact 1 Email': values[3] || '',
      'Contact 2': values[4] || '',
      'Contact 2 Email': values[5] || '',
    };

    return row as CSVRow;
  });
};

export const findStudentByNameAndEmail = (
  firstName: string,
  lastName: string,
  students: Student[],
  email?: string,
): Student | null => {
  if (!students || students.length === 0) {
    return null;
  }

  const cleanFirstName = firstName.toLowerCase().trim();
  const cleanLastName = lastName.toLowerCase().trim();
  const fullName = `${cleanFirstName} ${cleanLastName}`;
  const reverseName = `${cleanLastName} ${cleanFirstName}`;

  // Support common nickname <-> formal name equivalence
  const nicknameMap: Record<string, string[]> = {
    robert: ['bob', 'rob', 'bobby', 'robbie'],
    elizabeth: ['liz', 'beth', 'eliza', 'lizzie', 'betty', 'liza'],
  };

  const expandNameVariants = (name: string): string[] => {
    const variants = new Set<string>([name]);
    // If name is a formal first name, add nicknames
    if (nicknameMap[name]) {
      nicknameMap[name].forEach((n) => variants.add(n));
    }
    // If name matches any nickname, add the corresponding formal name
    for (const [formal, nicknames] of Object.entries(nicknameMap)) {
      if (nicknames.includes(name)) {
        variants.add(formal);
      }
    }
    return Array.from(variants);
  };

  const firstNameVariants = expandNameVariants(cleanFirstName);

  // Create possible email patterns for email-based matching
  const possibleEmailPrefixes = [
    ...firstNameVariants.map((fn) => `${fn}.${cleanLastName}`),
    ...firstNameVariants.map((fn) => `${fn}${cleanLastName}`),
    `${cleanLastName}.${cleanFirstName}`,
    `${cleanLastName}${cleanFirstName}`,
    ...firstNameVariants,
    cleanLastName,
  ];

  return (
    students.find((student: Student) => {
      const studentName = student.name.toLowerCase().trim();
      const studentEmail = student.email.toLowerCase().trim();
      const studentNameParts = studentName.split(/\s+/);

      // EMAIL-BASED MATCHING (High Priority)
      // Check if student email starts with any of the possible name combinations
      const emailMatch = possibleEmailPrefixes.some((prefix) =>
        studentEmail.startsWith(`${prefix}@`),
      );

      // NAME-BASED MATCHING with enhanced logic
      const nameMatch =
        // Exact matches (both orders)
        studentName === fullName ||
        studentName === reverseName ||
        // Contains matches (both orders)
        studentName.includes(fullName) ||
        studentName.includes(reverseName) ||
        fullName.includes(studentName) ||
        reverseName.includes(studentName) ||
        // Individual name part matches (for cases like "test student1" vs "student1 test")
        (firstNameVariants.some((v) => studentName.includes(v)) &&
          studentName.includes(cleanLastName)) ||
        // Enhanced name matching for middle names and variations
        checkNameVariations(
          firstNameVariants,
          cleanLastName,
          studentNameParts,
        ) ||
        // Partial matches for similar names
        checkPartialNameMatches(
          firstNameVariants,
          cleanLastName,
          studentNameParts,
        );

      // If specific email provided, require email match
      if (email && email.trim() !== '') {
        return nameMatch && studentEmail === email.toLowerCase().trim();
      }

      // Prioritize email matches, then name matches
      return emailMatch || nameMatch;
    }) || null
  );
};

// Helper function to check name variations including middle names
const checkNameVariations = (
  csvFirstVariants: string[],
  csvLast: string,
  studentNameParts: string[],
): boolean => {
  if (studentNameParts.length < 2) return false;

  const studentFirst = studentNameParts[0];
  const studentLast = studentNameParts[studentNameParts.length - 1];

  // Check if first and last names match (ignoring middle names)
  const firstLastMatch =
    (csvFirstVariants.some((v) => v === studentFirst) &&
      studentLast === csvLast) ||
    (studentFirst === csvLast &&
      csvFirstVariants.some((v) => v === studentLast));

  // Check if CSV names appear anywhere in the student name parts
  const csvFirstInParts = studentNameParts.some((p) =>
    csvFirstVariants.includes(p),
  );
  const csvLastInParts = studentNameParts.includes(csvLast);

  return firstLastMatch || (csvFirstInParts && csvLastInParts);
};

// Helper function for partial name matching (handles typos and variations)
const checkPartialNameMatches = (
  csvFirstVariants: string[],
  csvLast: string,
  studentNameParts: string[],
): boolean => {
  if (studentNameParts.length === 0) return false;

  // Check if any student name part starts with CSV names (for nicknames/short forms)
  const firstPartialMatch = studentNameParts.some((part) =>
    csvFirstVariants.some((v) => part.startsWith(v) || v.startsWith(part)),
  );

  const lastPartialMatch = studentNameParts.some(
    (part) => part.startsWith(csvLast) || csvLast.startsWith(part),
  );

  // Require both first and last to have some match
  return firstPartialMatch && lastPartialMatch;
};

export const checkParentExists = (
  email: string,
  studentId: string,
  parents: Parent[],
): Parent | null => {
  if (!parents || parents.length === 0 || !email.trim()) {
    return null;
  }

  return (
    parents.find((parent: Parent) => {
      const emailMatch =
        parent.email.toLowerCase().trim() === email.toLowerCase().trim();
      const hasStudent = parent.children.some(
        (child) => child.id === studentId,
      );
      return emailMatch && hasStudent;
    }) || null
  );
};

export const validateContactInfo = (name: string, email: string): boolean => {
  return !!(name && name.trim() && email && email.trim());
};

export const createProcessingResult = (
  firstName: string,
  lastName: string,
  student: Student | null,
): ProcessingResult => {
  return {
    studentName: `${firstName} ${lastName}`,
    studentEmail: student?.email || '',
    studentFound: !!student,
    contact1Created: false,
    contact1Existed: false,
    contact1Updated: false,
    contact2Created: false,
    contact2Existed: false,
    contact2Updated: false,
    errors: student ? [] : ['Student not found'],
  };
};

export const generateSummaryStats = (results: ProcessingResult[]) => {
  const stats = {
    totalProcessed: results.length,
    studentsFound: results.filter((r) => r.studentFound).length,
    studentsNotFound: results.filter((r) => !r.studentFound).length,
    parentsCreated: results.reduce(
      (sum, r) =>
        sum + (r.contact1Created ? 1 : 0) + (r.contact2Created ? 1 : 0),
      0,
    ),
    parentsExisted: results.reduce(
      (sum, r) =>
        sum + (r.contact1Existed ? 1 : 0) + (r.contact2Existed ? 1 : 0),
      0,
    ),
    parentsUpdated: results.reduce(
      (sum, r) =>
        sum + (r.contact1Updated ? 1 : 0) + (r.contact2Updated ? 1 : 0),
      0,
    ),
    totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
  };

  return stats;
};
