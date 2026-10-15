// Record detail, in Angular with @maggioli-design-system/magma-angular: the
// same screen as the plain HTML version. The record comes from the route
// (/requests/:id) and the open tab lives in the address, through the router.
import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import type {
  MdsFileCustomEvent,
  MdsFileEventDetail,
  MdsInputCustomEvent,
  MdsInputEventDetail,
  MdsTabCustomEvent,
  MdsTabEventDetail,
} from '@maggioli-design-system/magma';
import {
  MdsAuthor,
  MdsAvatar,
  MdsBadge,
  MdsBanner,
  MdsButton,
  MdsFile,
  MdsInput,
  MdsInputField,
  MdsModal,
  MdsSpinner,
  MdsTab,
  MdsTabItem,
  MdsText,
  MdsToast,
  MdsZero,
} from '@maggioli-design-system/magma-angular';

/** The address of the list with filters. */
const LIST_PATH = '/requests';

const TABS = ['details', 'documents', 'history'] as const;
type Tab = (typeof TABS)[number];

type Status = 'new' | 'in-progress' | 'waiting' | 'closed';
type ActionId = 'take' | 'documents' | 'close' | 'received' | 'reopen';

const STATUSES: Record<
  Status,
  { label: string; variant: 'info' | 'violet' | 'warning' | 'success' }
> = {
  new: { label: 'New', variant: 'info' },
  'in-progress': { label: 'In progress', variant: 'violet' },
  waiting: { label: 'Waiting for documents', variant: 'warning' },
  closed: { label: 'Closed', variant: 'success' },
};

interface Action {
  id: ActionId;
  label: string;
  done: string;
  /** Asks for a note before the action runs. */
  dialog?: { title: string; text: string; field: string; error: string; confirm: string };
}

/** What each status allows, the main action last. */
const ACTIONS: Record<Status, Action[]> = {
  new: [{ id: 'take', label: 'Take charge', done: 'You took charge of the request.' }],
  'in-progress': [
    {
      id: 'documents',
      label: 'Request documents',
      done: 'The documents were requested.',
      dialog: {
        title: 'Request documents',
        text: 'The applicant receives this message by email, and the request waits for the documents.',
        field: 'What is missing',
        error: 'Write what the applicant has to send.',
        confirm: 'Send the request',
      },
    },
    {
      id: 'close',
      label: 'Close request',
      done: 'The request was closed.',
      dialog: {
        title: 'Close the request',
        text: 'The applicant receives the outcome by email. A closed request can be reopened.',
        field: 'Outcome',
        error: 'Write the outcome of the request.',
        confirm: 'Close the request',
      },
    },
  ],
  waiting: [
    { id: 'received', label: 'Documents received', done: 'The documents were marked as received.' },
  ],
  closed: [{ id: 'reopen', label: 'Reopen', done: 'The request was reopened.' }],
};

const isTab = (value: string | null | undefined): value is Tab => TABS.includes(value as Tab);

interface Toast {
  key: number;
  message: string;
  variant: 'success' | 'error' | 'info';
}

@Component({
  selector: 'app-record-detail',
  imports: [
    MdsAuthor,
    MdsAvatar,
    MdsBadge,
    MdsBanner,
    MdsButton,
    MdsFile,
    MdsInput,
    MdsInputField,
    MdsModal,
    MdsSpinner,
    MdsTab,
    MdsTabItem,
    MdsText,
    MdsToast,
    MdsZero,
  ],
  template: `
    <main class="flex min-w-0 flex-col gap-600">
      <mds-button
        class="self-start"
        [href]="listPath"
        icon="mi/baseline/arrow-back"
        label="Requests"
        variant="dark"
        tone="text"
        size="sm"
        (click)="backToList($event)"
      ></mds-button>

      @if (record() === undefined && !failed()) {
        <mds-spinner class="self-center" [running]="true"></mds-spinner>
      }

      @if (failed()) {
        <mds-banner
          variant="error"
          icon="mi/baseline/error"
          headline="The request could not be loaded"
        >
          <mds-text typography="detail">Check the connection, then try again.</mds-text>
          <mds-button
            slot="action"
            type="button"
            label="Try again"
            variant="error"
            (click)="retry()"
          ></mds-button>
        </mds-banner>
      }

      @if (record() === null) {
        <mds-zero>
          <mds-text typography="h5" tag="h1" slot="content">This request does not exist</mds-text>
          <mds-text typography="detail" tag="p" slot="content">
            It may have been deleted, or the address may be wrong.
          </mds-text>
          <mds-button slot="action" [href]="listPath" label="See all requests"></mds-button>
        </mds-zero>
      }

      @if (record(); as record) {
        <article class="flex flex-col gap-600" aria-labelledby="title">
          <header class="flex flex-col gap-400 lg:flex-row lg:items-start lg:justify-between">
            <div class="flex min-w-0 flex-col gap-200">
              <mds-text typography="caption" tag="p" class="text-fg-muted">{{
                record.number
              }}</mds-text>
              <div class="flex flex-wrap items-center gap-300">
                <mds-text
                  #title
                  id="title"
                  typography="h3"
                  tag="h1"
                  tabindex="-1"
                  class="outline-none"
                  >{{ record.subject }}</mds-text
                >
                <mds-badge
                  [label]="statuses[record.status].label"
                  [variant]="statuses[record.status].variant"
                ></mds-badge>
              </div>
              <mds-text typography="detail" tag="p" class="text-fg-muted">
                {{ record.office }}, received on {{ formatDate(record.received) }}
              </mds-text>
            </div>
            <!-- The actions the status allows, the main one last. -->
            <div class="flex flex-wrap gap-200">
              @for (action of actions(); track action.id; let last = $last) {
                <mds-button
                  type="button"
                  [label]="action.label"
                  [tone]="last ? 'strong' : 'weak'"
                  [await]="running() === action.id && !action.dialog"
                  (click)="action.dialog ? openDialog(action) : run(action)"
                ></mds-button>
              }
            </div>
          </header>

          <mds-tab (mdsTabChange)="onTab($event)">
            <mds-tab-item
              label="Details"
              value="details"
              [selected]="tab() === 'details'"
            ></mds-tab-item>
            <mds-tab-item
              label="Documents"
              value="documents"
              [selected]="tab() === 'documents'"
            ></mds-tab-item>
            <mds-tab-item
              label="History"
              value="history"
              [selected]="tab() === 'history'"
            ></mds-tab-item>
            <section slot="content" class="pt-600">
              <!-- Magma has no description list: native dl, dt and dd. -->
              <dl class="m-0 grid gap-x-800 gap-y-500 md:grid-cols-2">
                @for (fact of facts(); track fact.term) {
                  <div class="flex flex-col gap-100">
                    <dt>
                      <mds-text typography="caption" class="text-fg-muted">{{
                        fact.term
                      }}</mds-text>
                    </dt>
                    <dd class="m-0">
                      <mds-text typography="detail">{{ fact.value }}</mds-text>
                    </dd>
                  </div>
                }
              </dl>
            </section>
            <section slot="content" class="pt-600">
              <div class="grid gap-400 md:grid-cols-2">
                @for (filename of record.documents; track filename) {
                  <!--
                    mds-file emits mdsFileDownload on a click only, and has no role: a role
                    and the keyboard of a button, until Magma gives them
                    (https://github.com/magma-design-system/magma/issues/820).
                  -->
                  <mds-file
                    [filename]="filename"
                    role="button"
                    (keydown)="onFileKey($event)"
                    (mdsFileDownload)="download($event)"
                  ></mds-file>
                }
              </div>
            </section>
            <section slot="content" class="pt-600">
              <ol class="m-0 flex list-none flex-col gap-500 p-0">
                <!-- The newest event first. -->
                @for (event of history(); track $index) {
                  <li>
                    <mds-author>
                      <mds-avatar slot="avatar" [initials]="initials(event.who)"></mds-avatar>
                      <mds-text typography="detail">{{ event.who }} {{ event.what }}</mds-text>
                      <mds-text typography="caption" class="text-fg-muted">
                        {{ formatDate(event.when) }}
                      </mds-text>
                      @if (event.note) {
                        <mds-text typography="detail">{{ event.note }}</mds-text>
                      }
                    </mds-author>
                  </li>
                }
              </ol>
            </section>
          </mds-tab>
        </article>
      }

      <mds-modal
        [opened]="dialogOpen()"
        [accessibleName]="dialogAction()?.dialog?.title"
        (mdsModalClose)="dialogOpen.set(false)"
        (mdsModalHide)="onDialogHidden()"
      >
        @if (dialogAction()?.dialog; as dialog) {
          <form class="flex flex-col gap-500 p-600" novalidate (submit)="submit($event)">
            <mds-text typography="h5" tag="h2">{{ dialog.title }}</mds-text>
            <mds-text typography="detail" tag="p">{{ dialog.text }}</mds-text>
            <mds-input-field
              [label]="dialog.field"
              [variant]="noteError() ? 'error' : undefined"
              [message]="noteError() ? dialog.error : undefined"
            >
              <mds-input
                #noteInput
                type="textarea"
                name="note"
                [required]="true"
                [value]="note()"
                (mdsInputChange)="onNote($event)"
              ></mds-input>
            </mds-input-field>
            <div class="flex flex-wrap justify-end gap-200">
              <mds-button
                type="button"
                label="Cancel"
                variant="dark"
                tone="weak"
                (click)="dialogOpen.set(false)"
              ></mds-button>
              <mds-button
                type="submit"
                [label]="dialog.confirm"
                [await]="running() === dialogAction()?.id"
              ></mds-button>
            </div>
          </form>
        }
      </mds-modal>

      @for (toast of toasts(); track toast.key) {
        <mds-toast [variant]="toast.variant" [visible]="true" (mdsToastClose)="dismiss(toast.key)">
          {{ toast.message }}
        </mds-toast>
      }
      <!-- Read out by screen readers after an action: mds-toast is not, yet. -->
      <mds-text role="status" class="sr-only">{{ announcement() }}</mds-text>
    </main>
  `,
})
export class RecordDetailComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly injector = inject(Injector);
  private readonly dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
  private readonly title = viewChild<ElementRef<HTMLMdsTextElement>>('title');
  private readonly input = viewChild<ElementRef<HTMLMdsInputElement>>('noteInput');
  private readonly attempt = signal(0);
  private nextToast = 0;
  /** Focus the title once the dialog has closed. */
  private focusAfterDialog = false;

  readonly listPath = LIST_PATH;
  readonly statuses = STATUSES;
  readonly id = Number(this.route.snapshot.paramMap.get('id'));

  /** `undefined` while it loads, `null` when there is no such record. */
  readonly record = signal<RequestRecord | null | undefined>(undefined);
  readonly failed = signal(false);
  readonly tab = signal<Tab>(this.readTab());
  readonly running = signal<ActionId | undefined>(undefined);
  readonly dialogOpen = signal(false);
  readonly dialogAction = signal<Action | undefined>(undefined);
  readonly note = signal('');
  readonly noteError = signal(false);
  readonly toasts = signal<Toast[]>([]);
  readonly announcement = signal('');

  readonly actions = computed(() => {
    const record = this.record();
    return record ? ACTIONS[record.status] : [];
  });
  readonly facts = computed(() => {
    const record = this.record();
    if (!record) return [];
    return [
      { term: 'Applicant', value: record.applicant },
      { term: 'Email', value: record.email },
      { term: 'Office', value: record.office },
      { term: 'Assigned to', value: record.assignee ?? 'Nobody yet' },
      { term: 'Received', value: `${this.formatDate(record.received)} via ${record.channel}` },
      { term: 'Due by', value: this.formatDate(record.due) },
    ];
  });
  readonly history = computed(() => [...(this.record()?.history ?? [])].reverse());

  constructor() {
    effect((onCleanup) => {
      this.attempt();
      let current = true;
      onCleanup(() => (current = false));
      this.failed.set(false);
      this.record.set(undefined);
      fetchRecord(this.id).then(
        (next) => current && this.record.set(next),
        (reason: unknown) => {
          if (!current) return;
          console.error(reason);
          this.failed.set(true);
        },
      );
    });
  }

  private readTab(): Tab {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    return isTab(tab) ? tab : TABS[0];
  }

  formatDate(iso: string) {
    return this.dateFormat.format(new Date(iso));
  }

  initials(name: string) {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2);
  }

  // Back to the list as it was: when the list opened this page, going back in
  // the history keeps its search and filters.
  backToList(event: Event) {
    const previous = this.router.lastSuccessfulNavigation?.previousNavigation?.finalUrl;
    if (previous && this.router.serializeUrl(previous).split('?')[0] === LIST_PATH) {
      event.preventDefault();
      this.location.back();
    }
  }

  onTab(event: MdsTabCustomEvent<MdsTabEventDetail>) {
    const tab = event.detail.value;
    if (!isTab(tab)) return;
    this.tab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onFileKey(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).click();
  }

  download(event: MdsFileCustomEvent<MdsFileEventDetail>) {
    // In an application: the address of the file, opened to download it.
    this.show(`Demo: ${event.detail.filename} is not a real file.`, 'info');
  }

  retry() {
    this.attempt.update((count) => count + 1);
  }

  /** The feedback of an action: on screen, and read out by screen readers. */
  private show(message: string, variant: Toast['variant']) {
    // One toast per message: mds-toast shows a text only when it has one as it loads.
    const key = ++this.nextToast;
    this.toasts.update((toasts) => [...toasts, { key, message, variant }]);
    this.announcement.set(message);
  }

  dismiss(key: number) {
    this.toasts.update((toasts) => toasts.filter((toast) => toast.key !== key));
  }

  /** Runs an action, then shows the record as it is now. True when it ran. */
  async run(action: Action, note?: string) {
    const record = this.record();
    if (!record) return false;
    this.running.set(action.id);
    try {
      this.record.set(await runAction(record.id, action.id, note));
      // The button is gone with the old status: the focus goes to the title,
      // once the dialog, if there is one, has closed.
      if (this.dialogOpen()) this.focusAfterDialog = true;
      else afterNextRender(() => this.title()?.nativeElement.focus(), { injector: this.injector });
      this.show(action.done, 'success');
      return true;
    } catch (reason) {
      console.error(reason);
      this.show('The action could not be completed. Try again.', 'error');
      return false;
    } finally {
      this.running.set(undefined);
    }
  }

  openDialog(action: Action) {
    this.dialogAction.set(action);
    this.note.set('');
    this.noteError.set(false);
    this.dialogOpen.set(true);
  }

  onNote(event: MdsInputCustomEvent<MdsInputEventDetail>) {
    this.note.set(String(event.detail.value ?? ''));
  }

  async submit(event: Event) {
    event.preventDefault();
    const action = this.dialogAction();
    if (!action) return;
    const note = this.note().trim();
    if (!note) {
      this.noteError.set(true);
      this.input()?.nativeElement.setFocus();
      return;
    }
    // On failure the dialog stays open, with what was written.
    if (await this.run(action, note)) this.dialogOpen.set(false);
  }

  onDialogHidden() {
    if (!this.focusAfterDialog) return;
    this.focusAfterDialog = false;
    this.title()?.nativeElement.focus();
  }
}

/*
 * Demo only: stands in for the back end. Replace these functions with the
 * calls to your API: one reads a record, null when there is none; the other
 * runs an action and returns the record as it is after it.
 */

interface HistoryEvent {
  who: string;
  what: string;
  when: string;
  note?: string;
}

interface RequestRecord {
  id: number;
  number: string;
  subject: string;
  office: string;
  status: Status;
  received: string;
  due: string;
  applicant: string;
  email: string;
  channel: string;
  assignee: string | null;
  documents: string[];
  history: HistoryEvent[];
}

const pause = () => new Promise((resolve) => setTimeout(resolve, 300));

async function fetchRecord(id: number): Promise<RequestRecord | null> {
  await pause();
  const request = REQUESTS.find((candidate) => candidate.id === id);
  return request ? structuredClone(request) : null;
}

async function runAction(id: number, action: ActionId, note?: string): Promise<RequestRecord> {
  await pause();
  const request = REQUESTS.find((candidate) => candidate.id === id);
  if (!request) throw new Error(`No request ${id}`);
  const status: Record<ActionId, Status> = {
    take: 'in-progress',
    documents: 'waiting',
    received: 'in-progress',
    close: 'closed',
    reopen: 'in-progress',
  };
  const what: Record<ActionId, string> = {
    take: 'took charge of the request',
    documents: 'requested documents',
    received: 'marked the documents as received',
    close: 'closed the request',
    reopen: 'reopened the request',
  };
  request.status = status[action];
  request.assignee ??= USER;
  request.history.push({ who: USER, what: what[action], when: new Date().toISOString(), note });
  return structuredClone(request);
}

/** Demo only: the user signed in. */
const USER = 'Anna Neri';

/** Demo only: the 46 requests of the list with filters, with their details. */
const REQUESTS: RequestRecord[] = (() => {
  const offices = {
    registry: 'Registry office',
    tax: 'Tax office',
    planning: 'Town planning',
    mobility: 'Mobility',
    education: 'Education',
  };
  const subjects: [string, keyof typeof offices][] = [
    ['Change of residence', 'registry'],
    ['Identity card renewal', 'registry'],
    ['Waste tax refund', 'tax'],
    ['Property tax payment plan', 'tax'],
    ['Building permit', 'planning'],
    ['Scaffolding on public land', 'planning'],
    ['Disabled parking permit', 'mobility'],
    ['Resident parking permit', 'mobility'],
    ['School canteen enrolment', 'education'],
    ['School bus service', 'education'],
  ];
  const applicants = [
    'Mario Rossi',
    'Giulia Bianchi',
    'Luca Ferrari',
    'Sara Esposito',
    'Marco Romano',
  ];
  const channels = ['online form', 'front office', 'certified email'];
  const day = 86_400_000;
  const statuses = Object.keys(STATUSES) as Status[];
  return Array.from({ length: 46 }, (_, index) => {
    const [subject, officeId] = subjects[(index * 7) % subjects.length];
    const number = 512 - index;
    const status = statuses[(index * 3 + Math.floor(index / 4)) % statuses.length];
    const received = Date.UTC(2026, 9, 14) - index * 1.7 * day;
    const applicant = applicants[index % applicants.length];
    const assignee = status === 'new' ? null : ['Anna Neri', 'Paolo Gallo'][index % 2];
    const at = (days: number) => new Date(received + days * day).toISOString();
    const history: HistoryEvent[] = [{ who: applicant, what: 'sent the request', when: at(0) }];
    if (assignee) history.push({ who: assignee, what: 'took charge of the request', when: at(1) });
    if (assignee && status === 'waiting') {
      history.push({
        who: assignee,
        what: 'requested documents',
        when: at(2),
        note: 'A copy of the identity document of the applicant.',
      });
    }
    if (assignee && status === 'closed') {
      history.push({ who: assignee, what: 'closed the request', when: at(3), note: 'Approved.' });
    }
    return {
      id: number,
      number: `REQ-2026-${String(number).padStart(4, '0')}`,
      subject,
      office: offices[officeId],
      status,
      received: at(0),
      due: at(30),
      applicant,
      email: `${applicant.toLowerCase().replace(' ', '.')}@example.com`,
      channel: channels[index % channels.length],
      assignee,
      documents: [`request-${number}.pdf`, 'identity-document.jpg'],
      history,
    };
  });
})();
