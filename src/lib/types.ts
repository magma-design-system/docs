// TypeScript types of the component props, as documentation.json writes them
// (`"left" | "right" | undefined`), split into their members so the props
// table can show each one on its own (src/components/TypeLabels.astro).

/**
 * What a member of a union is, which sets its color: `enum` is one of a set
 * of strings (`"left"`), `empty` a missing value.
 */
export type TypeKind = 'string' | 'enum' | 'number' | 'boolean' | 'empty' | 'other';

const OPEN = '([{<';
const CLOSE = ')]}>';
const QUOTED = /^(["'])(.*)\1$/s;

/**
 * The members of a union, split on the `|` at its top level: the ones inside
 * quotes, brackets, parentheses or generics stay where they are.
 */
export function unionMembers(type: string): string[] {
  const members: string[] = [];
  let depth = 0;
  let quote = '';
  let member = '';
  for (let i = 0; i < type.length; i++) {
    const char = type[i];
    if (quote) {
      if (char === quote && type[i - 1] !== '\\') quote = '';
    } else if (char === '"' || char === "'" || char === '`') {
      quote = char;
    } else if (OPEN.includes(char)) {
      depth++;
    } else if (CLOSE.includes(char) && !(char === '>' && type[i - 1] === '=')) {
      // `=>` of a function type closes nothing.
      depth--;
    } else if (char === '|' && depth === 0) {
      members.push(member.trim());
      member = '';
      continue;
    }
    member += char;
  }
  members.push(member.trim());
  return members.filter(Boolean);
}

/** The kind of one member: a type name or a literal value. */
export function typeKind(member: string): TypeKind {
  if (member === 'undefined' || member === 'null' || member === 'void') return 'empty';
  if (QUOTED.test(member)) return 'enum';
  if (member === 'string' || member.startsWith('`')) return 'string';
  if (member === 'boolean' || member === 'true' || member === 'false') return 'boolean';
  if (member === 'number' || /^-?\d/.test(member)) return 'number';
  return 'other';
}

/** A string literal without its quotes: `"left"` -> `left`. */
export function unquote(member: string): string {
  return member.match(QUOTED)?.[2] ?? member;
}

/**
 * What the props table sorts a type by: the kind of its first member that is
 * not `undefined`, then its members as shown, so sorting groups the types by
 * color (booleans, enums, numbers, other types, strings).
 */
export function typeSortValue(type: string): string {
  const members = unionMembers(type);
  const kind = members.map(typeKind).find((k) => k !== 'empty') ?? 'empty';
  return [kind, ...members.map(unquote)].join(' ');
}
