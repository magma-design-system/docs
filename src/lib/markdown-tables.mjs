// Markdown tables as Magma tables: a plugin for Astro's Markdown processor
// (Satteri), added by the Magma integration (src/integrations/magma.mjs), so
// it runs on the pages and on the Magma docs of the components loader.
// <table> becomes mds-table, header cells mds-table-header-cell (their text as
// `label`), rows mds-table-row and cells mds-table-cell, kept on one line
// (whitespace-nowrap): mds-table scrolls sideways when the table is wider
// than the page, instead of squeezing its columns.

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

/** @param {any} table */
function magmaTable(table) {
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
            element('mds-table-cell', ['whitespace-nowrap', alignClass(cell)], cell.children),
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
      /** @param {any} table */
      visit: (table) => magmaTable(table),
    },
  };
}
