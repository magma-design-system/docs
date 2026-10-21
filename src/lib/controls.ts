// The controls of a component's preview (src/components/Playground.astro): one
// per prop whose value can be typed or picked, chosen from the values
// documentation.json lists for it. Functions, arrays and objects get none.
import { unquote } from './types';

/** A prop as documentation.json describes it, as far as the controls go. */
interface DocumentedProp {
  name: string;
  values?: { type: string; value?: string }[];
  docs?: string;
  docsTags?: { name: string; text?: string }[];
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

/** A date or time format written out in a description: `YYYY-MM-DD`, `HH:mm`. */
const FORMAT = /\b(?:YYYY|YY|MM|DD|HH|hh|mm|ss)(?:[-/.:T](?:YYYY|YY|MM|DD|HH|hh|mm|ss))+\b/;
/**
 * The date a format is filled with, part by part: a day past 12, so that it
 * cannot be taken for the month.
 */
const SAMPLE: Record<string, string> = {
  YYYY: '2025',
  YY: '25',
  MM: '12',
  DD: '31',
  HH: '18',
  hh: '06',
  mm: '30',
  ss: '00',
};

/**
 * A value the prop takes, for the placeholder of its field: its `@example`
 * (`'2023-10-01'`), or else a date in the format its description writes
 * (`YYYY-MM-DD` gives `2025-12-31`). Most props have neither.
 */
export function propExample(prop: DocumentedProp): string | undefined {
  const tags = prop.docsTags ?? [];
  const example = tags.find((tag) => tag.name === 'example')?.text?.trim();
  // A one-line value, not a snippet of markup.
  if (example && !example.includes('\n')) return unquote(example);
  const descriptions = tags.filter((tag) => tag.name === 'description').map((tag) => tag.text);
  const format = [prop.docs, ...descriptions].join(' ').match(FORMAT)?.[0];
  return format?.replace(/YYYY|YY|MM|DD|HH|hh|mm|ss/g, (part) => SAMPLE[part]);
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

/** A method as documentation.json describes it, as far as the preview goes. */
interface DocumentedMethod {
  name: string;
  signature: string;
  docs?: string;
  parameters: { name: string; type: string; docs?: string }[];
}

/** A parameter of a method the preview calls, with the control that gives its value. */
export interface CallParameter {
  name: string;
  docs: string;
  control: Control;
  /** A value it takes, for the placeholder of its field. */
  example?: string;
}

/** A method the preview can call, and its parameters in order. */
export interface MethodCall {
  name: string;
  docs: string;
  parameters: CallParameter[];
}

/**
 * The members of a type as written in a signature (`string | number | null`,
 * `"open" | "closed"`), in the shape of the values of a prop. Optional when the
 * signature says so (`duration?: number`).
 */
const typeValues = (type: string, optional: boolean) =>
  type
    .split('|')
    .map((member) => member.trim())
    .map((member) =>
      /^(["']).*\1$/.test(member) ? { type: 'string', value: unquote(member) } : { type: member },
    )
    .concat(optional ? [{ type: 'undefined' }] : []);

/** What a method acts on, to sort `startThinking` next to `stopThinking`. */
const subject = (name: string) => name.replace(/^(start|stop)(?=[A-Z])/, '').toLowerCase();

/**
 * The methods the preview calls (Playground.astro): those whose parameters
 * all take a value to type or pick, with the controls of the props. A method
 * that takes a function or an object (a validator, an event) is left to the
 * API page. Sorted by what they act on, a `start` before its `stop`.
 */
export function methodCalls(methods: DocumentedMethod[]): MethodCall[] {
  return methods
    .flatMap((method) => {
      const parameters = method.parameters.map((parameter) => {
        const optional = new RegExp(`\\b${parameter.name}\\?:`).test(method.signature);
        const control = propControl({
          name: parameter.name,
          values: typeValues(parameter.type, optional),
        });
        return (
          control && {
            name: parameter.name,
            docs: plainText(parameter.docs),
            control,
            example: propExample({ name: parameter.name, docs: parameter.docs }),
          }
        );
      });
      if (parameters.some((parameter) => parameter === undefined)) return [];
      return [
        {
          name: method.name,
          docs: plainText(method.docs),
          parameters: parameters as CallParameter[],
        },
      ];
    })
    .sort((a, b) => subject(a.name).localeCompare(subject(b.name)) || a.name.localeCompare(b.name));
}
