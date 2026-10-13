// The controls of a component's preview (src/components/Playground.astro): one
// per prop whose value can be typed or picked, chosen from the values
// documentation.json lists for it. Functions, arrays and objects get none.

/** A prop as documentation.json describes it, as far as the controls go. */
interface DocumentedProp {
  name: string;
  values?: { type: string; value?: string }[];
}

/**
 * What a control edits, which is also its color in the table
 * (TypeValue.astro): a switch for booleans, a select for a set of strings,
 * a text field for strings (numbers too, when a prop takes both) and a number
 * field for numbers. `optional`: the prop can be left without a value, which
 * is what an empty field or the select's placeholder gives it.
 */
export interface Control {
  kind: 'boolean' | 'enum' | 'string' | 'number';
  optional: boolean;
  /** The strings of an enum. */
  options?: string[];
}

const EMPTY = new Set(['undefined', 'null']);

export function propControl(prop: DocumentedProp): Control | undefined {
  const values = prop.values ?? [];
  const literals = values.flatMap((v) => (v.value === undefined ? [] : [v]));
  const types = new Set(
    values.filter((v) => v.value === undefined && !EMPTY.has(v.type)).map((v) => v.type),
  );
  const optional = values.some((v) => v.value === undefined && EMPTY.has(v.type));

  if (literals.length > 0 && types.size === 0 && literals.every((v) => v.type === 'string')) {
    return { kind: 'enum', optional, options: literals.map((v) => v.value!) };
  }
  if (types.size === 1 && types.has('boolean')) return { kind: 'boolean', optional };
  if (types.size === 1 && types.has('number')) return { kind: 'number', optional };
  if (types.size > 0 && [...types].every((type) => type === 'string' || type === 'number')) {
    return { kind: 'string', optional };
  }
  return undefined;
}

/**
 * A prop description as plain text, for mds-help, which takes text only:
 * the Markdown of documentation.json without its marks (code, bold, links).
 */
export function plainText(markdown: string | undefined): string {
  return (markdown ?? '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`|\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
