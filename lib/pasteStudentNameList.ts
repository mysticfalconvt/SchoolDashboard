// Utilities for taking a pasted list of student names (one per line, in
// "Last First" order the way our student exports print them) and matching each
// line up to a real student in the database.

export interface NameListStudent {
  id: string;
  name: string;
  preferredName?: string | null;
}

export interface MatchedName {
  line: string;
  student: NameListStudent;
}

export interface AmbiguousName {
  line: string;
  candidates: NameListStudent[];
}

export interface MatchNameListResult {
  matched: MatchedName[];
  // Lines that matched a student who was already matched by an earlier line.
  duplicates: MatchedName[];
  // Lines that matched more than one student, so we refuse to guess.
  ambiguous: AmbiguousName[];
  // Lines we could not match at all.
  unmatched: string[];
}

// Header rows that show up when a list is pasted straight out of a spreadsheet.
const HEADER_LINES = new Set([
  'lastfirst',
  'firstlast',
  'lastnamefirstname',
  'firstnamelastname',
  'name',
  'studentname',
  'student',
  'students',
]);

// Lowercase, strip accents, and drop anything that is not a letter so that
// "O'Brien", "Obrien", and "o'brién" all compare equal.
export const normalizeNamePart = (part: string): string =>
  (part || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

const normalizeTokens = (tokens: string[]): string[] =>
  tokens.map(normalizeNamePart).filter(Boolean);

export interface SplitName {
  last: string;
  first: string;
  // Every token in the line, normalized, in the order they were pasted.
  tokens: string[];
}

// Turn a single pasted line into its last name and first name. Lines are
// expected in "Last First [Middle...]" order, but "Last, First" also works.
export const splitPastedName = (line: string): SplitName | null => {
  const trimmed = (line || '').trim();
  if (!trimmed) return null;

  if (trimmed.includes(',')) {
    const [lastPart, ...restParts] = trimmed.split(',');
    const last = normalizeTokens(lastPart.split(/\s+/));
    const first = normalizeTokens(restParts.join(' ').split(/\s+/));
    if (!last.length || !first.length) return null;
    return {
      last: last.join(''),
      first: first[0],
      tokens: [...last, ...first],
    };
  }

  const tokens = normalizeTokens(trimmed.split(/\s+/));
  if (tokens.length < 2) return null;
  const [last, first] = tokens;
  return { last, first, tokens };
};

// Split a stored student name ("First [Middle...] Last") into the same shape.
const splitStoredName = (name: string): SplitName | null => {
  const tokens = normalizeTokens((name || '').trim().split(/\s+/));
  if (tokens.length < 2) return null;
  return {
    last: tokens[tokens.length - 1],
    first: tokens[0],
    tokens,
  };
};

const exactKey = (split: SplitName) => `${split.last}|${split.first}`;
const looseKey = (split: SplitName) => `${split.last}|${split.first.charAt(0)}`;
const tokenKey = (split: SplitName) => [...split.tokens].sort().join('|');

const addToIndex = (
  index: Map<string, NameListStudent[]>,
  key: string,
  student: NameListStudent,
) => {
  const existing = index.get(key);
  if (!existing) {
    index.set(key, [student]);
  } else if (!existing.some((s) => s.id === student.id)) {
    existing.push(student);
  }
};

interface StudentIndex {
  exact: Map<string, NameListStudent[]>;
  tokens: Map<string, NameListStudent[]>;
  loose: Map<string, NameListStudent[]>;
}

// Index every student under a few keys so we can fall back from strict to
// fuzzy matching without ever scanning the whole list per line.
export const buildStudentIndex = (
  students: NameListStudent[],
): StudentIndex => {
  const index: StudentIndex = {
    exact: new Map(),
    tokens: new Map(),
    loose: new Map(),
  };

  (students || []).forEach((student) => {
    const split = splitStoredName(student.name);
    if (!split) return;
    addToIndex(index.exact, exactKey(split), student);
    addToIndex(index.tokens, tokenKey(split), student);
    addToIndex(index.loose, looseKey(split), student);

    // Kids often show up on a list under the name they actually go by, so
    // index "PreferredName LastName" too.
    const preferred = normalizeNamePart(student.preferredName || '');
    if (preferred && preferred !== split.first) {
      const preferredSplit: SplitName = {
        last: split.last,
        first: preferred,
        tokens: [preferred, split.last],
      };
      addToIndex(index.exact, exactKey(preferredSplit), student);
      addToIndex(index.tokens, tokenKey(preferredSplit), student);
      addToIndex(index.loose, looseKey(preferredSplit), student);
    }
  });

  return index;
};

export const isHeaderLine = (line: string): boolean =>
  HEADER_LINES.has(normalizeNamePart(line));

// Match a pasted block of names against the student list. Lines are matched
// strictly first (last + first name), then by the same set of name parts in
// any order, and finally by last name + first initial.
export const matchPastedNameList = (
  text: string,
  students: NameListStudent[],
): MatchNameListResult => {
  const result: MatchNameListResult = {
    matched: [],
    duplicates: [],
    ambiguous: [],
    unmatched: [],
  };

  const index = buildStudentIndex(students);
  const alreadyMatched = new Set<string>();

  (text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !isHeaderLine(line))
    .forEach((line) => {
      const split = splitPastedName(line);
      if (!split) {
        result.unmatched.push(line);
        return;
      }

      const candidates =
        index.exact.get(exactKey(split)) ||
        index.tokens.get(tokenKey(split)) ||
        index.loose.get(looseKey(split));

      if (!candidates || candidates.length === 0) {
        result.unmatched.push(line);
        return;
      }

      if (candidates.length > 1) {
        result.ambiguous.push({ line, candidates });
        return;
      }

      const [student] = candidates;
      if (alreadyMatched.has(student.id)) {
        result.duplicates.push({ line, student });
        return;
      }
      alreadyMatched.add(student.id);
      result.matched.push({ line, student });
    });

  return result;
};
