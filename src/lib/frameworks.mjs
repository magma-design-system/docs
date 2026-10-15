// The frameworks the install guides cover, in the order of their tabs
// (src/components/FrameworkTabs.astro). `id` names the slot of each panel and
// is the value kept in localStorage; `icon` is an mds-icon slug, collected by
// iconsauce (iconsauce.config.mjs).
export const FRAMEWORKS = [
  { id: 'vanilla', label: 'Vanilla JS', icon: 'mdi/language-javascript' },
  { id: 'react', label: 'React', icon: 'mdi/react' },
  { id: 'angular', label: 'Angular', icon: 'mdi/angular' },
];

/** localStorage key of the framework picked last. */
export const FRAMEWORK_KEY = 'magma-docs:framework';
