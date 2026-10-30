// Page header, in Angular with @maggioli-design-system/magma-angular: the same
// block as the plain HTML version, as a component that takes its parts. Every
// part but the title is optional; the actions are its content, the main one
// last.
import { Component, ElementRef, input, viewChild } from '@angular/core';
import { MdsBadge, MdsButton, MdsSeparator, MdsText } from '@maggioli-design-system/magma-angular';

type BadgeVariant = HTMLMdsBadgeElement['variant'];

@Component({
  selector: 'app-page-header',
  imports: [MdsBadge, MdsButton, MdsText],
  template: `
    <header class="flex flex-col gap-400">
      @if (back(); as back) {
        <mds-button
          class="self-start"
          [href]="back.href"
          icon="mi/baseline/arrow-back"
          [label]="back.label"
          variant="dark"
          tone="text"
          size="sm"
        />
      }
      <div class="flex flex-col gap-400 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex min-w-0 flex-col gap-200">
          @if (overline(); as overline) {
            <mds-text typography="caption" tag="p" class="text-fg-muted">{{ overline }}</mds-text>
          }
          <div class="flex flex-wrap items-center gap-300">
            <mds-text #heading typography="h3" tag="h1" tabindex="-1" class="outline-none">
              {{ title() }}
            </mds-text>
            @if (status(); as status) {
              <mds-badge [label]="status.label" [variant]="status.variant" />
            }
          </div>
          @if (description(); as description) {
            <mds-text typography="detail" tag="p" class="text-fg-muted">{{ description }}</mds-text>
          }
        </div>
        <!-- The actions, the main one last. -->
        <div class="flex flex-wrap gap-200 empty:hidden">
          <ng-content />
        </div>
      </div>
    </header>
  `,
})
export class PageHeaderComponent {
  /** The name of the page: the only h1 of the page. */
  readonly title = input.required<string>();
  /** What the page holds, or the facts of the record: one sentence. */
  readonly description = input<string>();
  /** Above the title: the number or the kind of the record. */
  readonly overline = input<string>();
  /** Next to the title: the status of the record. */
  readonly status = input<{ label: string; variant: BadgeVariant }>();
  /** The page it goes back to, named as its own title names it. */
  readonly back = input<{ href: string; label: string }>();

  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  /** After an action whose button is gone, the focus goes to the title. */
  focusTitle() {
    this.heading().nativeElement.focus();
  }
}

/** The two headers of the plain HTML version: a record and a list. */
@Component({
  selector: 'app-page-header-example',
  imports: [MdsButton, MdsSeparator, PageHeaderComponent],
  template: `
    <div class="flex flex-col gap-1200">
      <app-page-header
        [back]="{ href: '/requests', label: 'Requests' }"
        overline="REQ-2026-0512"
        title="Change of residence"
        [status]="{ label: 'In progress', variant: 'violet' }"
        description="Registry office, received on 14 October 2026"
      >
        <mds-button type="button" label="Request documents" tone="weak" />
        <mds-button type="button" label="Close the request" tone="strong" />
      </app-page-header>

      <mds-separator />

      <app-page-header
        title="Users"
        description="The people who can sign in to the back office of the municipality."
      >
        <mds-button type="button" label="Add user" icon="mi/baseline/person-add" />
      </app-page-header>
    </div>
  `,
})
export class PageHeaderExampleComponent {}
