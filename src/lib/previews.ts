// The live preview of each component (src/pages/example/[tag].astro, on the
// stage of Playground.astro). It runs the first example of the component's
// Examples usage file, the canonical form Magma writes for it, unless
// src/previews/<tag>.html gives the component a demo of its own: a richer one,
// written for this site, to try what the component does (branches to open, a
// toast to dismiss, a code that unlocks). The Examples usage page keeps Magma's
// examples. A demo is plain HTML and a script, in Italian as Magma's examples;
// the controls of the preview set the first element of the component in it.
// Its images are the site's own, in public/previews/, by a path relative to
// the page of the preview (`../../previews/<file>`).
// A component can also start on a stage of its own: another surface, a size.

const demos = import.meta.glob<string>('../previews/*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** Magma's surface levels, as the picker of the stage lists them (PreviewStage.astro). */
export type Surface = 'sunken' | 'muted' | 'default' | 'raised' | 'overlay';

export interface Preview {
  /** The markup the preview runs; empty: the component has no preview. */
  example: string;
  /** The example is a demo of the site, not Magma's. */
  demo: boolean;
  /** The surface the example starts on, and gets back on Reset. */
  surface: Surface;
  /**
   * The size of the frame at the start and on Reset, in px. `undefined`: the
   * whole stage wide, as tall as the example.
   */
  width?: number;
  height?: number;
  /**
   * From one edge of the page to the other, with no room around it: its
   * content slides under the edges of the frame.
   */
  edgeToEdge: boolean;
}

/**
 * The components that do not start as the others do: on surface-raised, the
 * whole stage wide, as tall as their example, with room around it.
 */
const STAGES: Record<string, Partial<Omit<Preview, 'example'>>> = {
  // Drawn on a ground of their own, a card or a bar: on surface-default, a
  // step below it, it stands out as on a page.
  'mds-calendar': { surface: 'default' },
  'mds-card': { surface: 'default' },
  'mds-entity': { surface: 'default' },
  'mds-file': { surface: 'default' },
  'mds-file-preview': { surface: 'default' },
  'mds-header': { surface: 'default', height: 480 },
  'mds-status-bar': { surface: 'default' },
  // A strip of cards that scrolls sideways.
  'mds-horizontal-scroll': { surface: 'default', edgeToEdge: true },
  // What opens over the page has room to open in: the menu of mds-header
  // (above), a dialog, a column of toasts.
  'mds-modal': { height: 480 },
  'mds-toast-region': { height: 400 },
  // A site in a frame, as a phone shows it: the handle widens it.
  'mds-url-view': { width: 360, height: 640 },
};

/** The preview of a component, from the first example of its Examples usage file. */
export function previewOf(tag: string, patternExample: string): Preview {
  const demo = demos[`../previews/${tag}.html`];
  return {
    example: demo?.trim() ?? patternExample,
    demo: demo !== undefined,
    surface: 'raised',
    edgeToEdge: false,
    ...STAGES[tag],
  };
}
