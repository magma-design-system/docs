// Markdown tables as Magma tables: a plugin for Astro's Markdown processor
// (Satteri), added by the Magma integration (src/integrations/magma.mjs), so
// it runs on the pages and on the Magma docs of the components loader.
// <table> becomes mds-table, header cells mds-table-header-cell (their text as
// `label`), rows mds-table-row and cells mds-table-cell, kept on one line
// (whitespace-nowrap): mds-table scrolls sideways when the table is wider
// than the page, instead of squeezing its columns. In a text whose tables hold
// prose (PROSE_CELLS_FIELD) a long cell wraps instead.

/**
 * The frontmatter field of a Markdown text whose tables hold prose, the domains
 * of the design language (src/loaders/domains.ts): there a cell longer than the
 * measure of a title wraps at it, `min-w-title` (30ch), and the others stay on
 * one line. The measure of a title, not of a phrase (50ch, the descriptions of
 * the API tables of a component): a domain has tables of two to six columns of
 * prose, and at 50ch every table of Rhythm scrolled sideways in the content
 * column (688px at a window of 1440px); at 30ch the tables of two and three
 * columns fit, and those of five and six scroll as the API tables do.
 */
export const PROSE_CELLS_FIELD = 'magmaProseCells';
/** The characters of `--spacing-title` (30ch), Magma's measure of a title. */
const TITLE = 30;

/** Column alignment set by the Markdown table (`:--`, `:-:`, `--:`). */
const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' };

/**
 * @param {any} node
 * @returns {string}
 */
const textOf = (node) =>
  node.type === 'text' ? node.value : (node.children ?? []).map(textOf).join('');

/** @param {any} node */
const elements = (node) => (node.children ?? []).filter((child) => child.type === 'element');

/**
 * @param {string} tagName
 * @param {(string | undefined)[]} classes
 * @param {any[]} children
 */
const element = (tagName, classes, children, properties = {}) => {
  const className = classes.filter(Boolean).join(' ');
  return {
    type: 'element',
    tagName,
    properties: className ? { ...properties, class: className } : properties,
    children,
  };
};

/**
 * Satteri writes the alignment as `style="text-align: center"`.
 * @param {any} cell
 */
const alignClass = (cell) =>
  ALIGN[String(cell.properties?.style ?? '').match(/text-align:\s*(\w+)/)?.[1] ?? ''];

/**
 * @param {any} table
 * @param {boolean} prose
 */
function magmaTable(table, prose) {
  const parts = elements(table).map((part) => {
    const rows = elements(part).filter((row) => row.tagName === 'tr');
    if (part.tagName === 'thead') {
      // mds-table-header is itself the row: the header cells go straight in.
      return element(
        'mds-table-header',
        [],
        rows.flatMap(elements).map((cell) =>
          element('mds-table-header-cell', [alignClass(cell)], [], {
            label: textOf(cell).trim(),
          }),
        ),
      );
    }
    return element(
      'mds-table-body',
      [],
      rows.map((row) =>
        element(
          'mds-table-row',
          [],
          elements(row).map((cell) =>
            element(
              'mds-table-cell',
              [
                prose && textOf(cell).trim().length > TITLE ? 'min-w-title' : 'whitespace-nowrap',
                alignClass(cell),
              ],
              cell.children,
            ),
          ),
        ),
      ),
    );
  });
  return element('mds-table', [], parts);
}

export function magmaTables() {
  return {
    name: 'magma-tables',
    element: {
      filter: ['table'],
      /**
       * @param {any} table
       * @param {any} ctx
       */
      visit: (table, ctx) =>
        magmaTable(table, ctx?.data?.astro?.frontmatter?.[PROSE_CELLS_FIELD] === true),
    },
  };
}
