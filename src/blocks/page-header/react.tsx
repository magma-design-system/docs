// Page header, in React with @maggioli-design-system/magma-react: the same
// block as the plain HTML version, as a component that takes its parts. Every
// part but the title is optional; the actions are its children, the main one
// last.
import type { ComponentProps, ReactNode, Ref } from 'react';
import { MdsBadge, MdsButton, MdsText } from '@maggioli-design-system/magma-react';

export interface PageHeaderProps {
  /** The name of the page: the only h1 of the page. */
  title: string;
  /** What the page holds, or the facts of the record: one sentence. */
  description?: string;
  /** Above the title: the number or the kind of the record. */
  overline?: string;
  /** Next to the title: the status of the record. */
  status?: { label: string; variant: ComponentProps<typeof MdsBadge>['variant'] };
  /** The page it goes back to, named as its own title names it. */
  back?: { href: string; label: string };
  /** The title, to move the focus to it after an action whose button is gone. */
  titleRef?: Ref<HTMLMdsTextElement>;
  /** The actions, the main one last. */
  children?: ReactNode;
}

export function PageHeader({
  title,
  description,
  overline,
  status,
  back,
  titleRef,
  children,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-400">
      {back && (
        <MdsButton
          className="self-start"
          href={back.href}
          icon="mi/baseline/arrow-back"
          label={back.label}
          variant="dark"
          tone="text"
          size="sm"
        />
      )}
      <div className="flex flex-col gap-400 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-200">
          {overline && (
            <MdsText typography="caption" tag="p" className="text-fg-muted">
              {overline}
            </MdsText>
          )}
          <div className="flex flex-wrap items-center gap-300">
            <MdsText ref={titleRef} typography="h3" tag="h1" tabIndex={-1} className="outline-none">
              {title}
            </MdsText>
            {status && <MdsBadge label={status.label} variant={status.variant} />}
          </div>
          {description && (
            <MdsText typography="detail" tag="p" className="text-fg-muted">
              {description}
            </MdsText>
          )}
        </div>
        {children && <div className="flex flex-wrap gap-200">{children}</div>}
      </div>
    </header>
  );
}

/** The two headers of the plain HTML version: a record and a list. */
export function PageHeaderExample() {
  return (
    <div className="flex flex-col gap-1200">
      <PageHeader
        back={{ href: '/requests', label: 'Requests' }}
        overline="REQ-2026-0512"
        title="Change of residence"
        status={{ label: 'In progress', variant: 'violet' }}
        description="Registry office, received on 14 October 2026"
      >
        <MdsButton type="button" label="Request documents" tone="weak" />
        <MdsButton type="button" label="Close the request" tone="strong" />
      </PageHeader>

      <PageHeader
        title="Users"
        description="The people who can sign in to the back office of the municipality."
      >
        <MdsButton type="button" label="Add user" icon="mi/baseline/person-add" />
      </PageHeader>
    </div>
  );
}
