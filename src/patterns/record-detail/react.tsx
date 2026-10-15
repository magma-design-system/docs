// Record detail, in React with @maggioli-design-system/magma-react: the same
// screen as the plain HTML version. The open tab lives in the address; the
// record comes from the route, as `id` (with a router, read and write them
// through the router instead of `history`).
import { type FormEvent, type MouseEvent, useEffect, useRef, useState } from 'react';
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
} from '@maggioli-design-system/magma-react';

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

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const formatDate = (iso: string) => dateFormat.format(new Date(iso));

const initials = (name: string) =>
  name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2);

const isTab = (value: string | null | undefined): value is Tab => TABS.includes(value as Tab);

/** The tab from the address, else the first one. */
function readTab(): Tab {
  const tab = new URLSearchParams(location.search).get('tab');
  return isTab(tab) ? tab : TABS[0];
}

function writeTab(tab: Tab) {
  const url = new URL(location.href);
  url.searchParams.set('tab', tab);
  history.replaceState(null, '', url);
}

interface Toast {
  key: number;
  message: string;
  variant: 'success' | 'error' | 'info';
}

export function RecordDetail({ id }: { id: number }) {
  /** `undefined` while it loads, `null` when there is no such record. */
  const [record, setRecord] = useState<RequestRecord | null>();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [tab, setTab] = useState(readTab);
  const [running, setRunning] = useState<ActionId>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<Action>();
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [focusRequest, setFocusRequest] = useState(0);
  const nextToast = useRef(0);
  const title = useRef<HTMLMdsTextElement>(null);
  const input = useRef<HTMLMdsInputElement>(null);
  /** Focus the title once the dialog has closed. */
  const focusAfterDialog = useRef(false);

  useEffect(() => {
    let current = true;
    setFailed(false);
    setRecord(undefined);
    fetchRecord(id).then(
      (next) => current && setRecord(next),
      (reason: unknown) => {
        if (!current) return;
        console.error(reason);
        setFailed(true);
      },
    );
    return () => {
      current = false;
    };
  }, [id, attempt]);

  useEffect(() => {
    if (record) document.title = `${record.number} - ${record.subject}`;
  }, [record]);

  // The button that ran an action is gone with the old status: the focus
  // goes to the title.
  useEffect(() => {
    if (focusRequest) title.current?.focus();
  }, [focusRequest]);

  /** The feedback of an action: on screen, and read out by screen readers. */
  const show = (message: string, variant: Toast['variant']) => {
    // One toast per message: mds-toast shows a text only when it has one as it loads.
    const key = ++nextToast.current;
    setToasts((current) => [...current, { key, message, variant }]);
    setAnnouncement(message);
  };

  /** Runs an action, then shows the record as it is now. True when it ran. */
  const run = async (action: Action, text?: string) => {
    if (!record) return false;
    setRunning(action.id);
    try {
      setRecord(await runAction(record.id, action.id, text));
      if (dialogOpen) focusAfterDialog.current = true;
      else setFocusRequest((count) => count + 1);
      show(action.done, 'success');
      return true;
    } catch (reason) {
      console.error(reason);
      show('The action could not be completed. Try again.', 'error');
      return false;
    } finally {
      setRunning(undefined);
    }
  };

  const openDialog = (action: Action) => {
    setDialogAction(action);
    setNote('');
    setNoteError(false);
    setDialogOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!dialogAction) return;
    if (!note.trim()) {
      setNoteError(true);
      input.current?.setFocus();
      return;
    }
    // On failure the dialog stays open, with what was written.
    if (await run(dialogAction, note.trim())) setDialogOpen(false);
  };

  // Back to the list as it was: when the list opened this page, going back in
  // the history keeps its search and filters.
  const backToList = (event: MouseEvent) => {
    if (document.referrer && new URL(document.referrer).pathname === LIST_PATH) {
      event.preventDefault();
      history.back();
    }
  };

  const actions = record ? ACTIONS[record.status] : [];

  return (
    <main className="flex min-w-0 flex-col gap-600">
      <MdsButton
        className="self-start"
        href={LIST_PATH}
        icon="mi/baseline/arrow-back"
        label="Requests"
        variant="dark"
        tone="text"
        size="sm"
        onClick={backToList}
      />

      {record === undefined && !failed && <MdsSpinner className="self-center" running />}

      {failed && (
        <MdsBanner
          variant="error"
          icon="mi/baseline/error"
          headline="The request could not be loaded"
        >
          <MdsText typography="detail">Check the connection, then try again.</MdsText>
          <MdsButton
            slot="action"
            type="button"
            label="Try again"
            variant="error"
            onClick={() => setAttempt((count) => count + 1)}
          />
        </MdsBanner>
      )}

      {record === null && (
        <MdsZero>
          <MdsText typography="h5" tag="h1" slot="content">
            This request does not exist
          </MdsText>
          <MdsText typography="detail" tag="p" slot="content">
            It may have been deleted, or the address may be wrong.
          </MdsText>
          <MdsButton slot="action" href={LIST_PATH} label="See all requests" />
        </MdsZero>
      )}

      {record && (
        <article className="flex flex-col gap-600" aria-labelledby="title">
          <header className="flex flex-col gap-400 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-col gap-200">
              <MdsText typography="caption" tag="p" className="text-fg-muted">
                {record.number}
              </MdsText>
              <div className="flex flex-wrap items-center gap-300">
                <MdsText
                  ref={title}
                  id="title"
                  typography="h3"
                  tag="h1"
                  tabIndex={-1}
                  className="outline-none"
                >
                  {record.subject}
                </MdsText>
                <MdsBadge
                  label={STATUSES[record.status].label}
                  variant={STATUSES[record.status].variant}
                />
              </div>
              <MdsText typography="detail" tag="p" className="text-fg-muted">
                {`${record.office}, received on ${formatDate(record.received)}`}
              </MdsText>
            </div>
            {/* The actions the status allows, the main one last. */}
            <div className="flex flex-wrap gap-200">
              {actions.map((action, index) => (
                <MdsButton
                  key={action.id}
                  type="button"
                  label={action.label}
                  tone={index === actions.length - 1 ? 'strong' : 'weak'}
                  await={running === action.id && !action.dialog}
                  onClick={() => (action.dialog ? openDialog(action) : run(action))}
                />
              ))}
            </div>
          </header>

          <MdsTab
            onMdsTabChange={(event) => {
              const next = event.detail.value;
              if (!isTab(next)) return;
              setTab(next);
              writeTab(next);
            }}
          >
            <MdsTabItem label="Details" value="details" selected={tab === 'details'} />
            <MdsTabItem label="Documents" value="documents" selected={tab === 'documents'} />
            <MdsTabItem label="History" value="history" selected={tab === 'history'} />
            <section slot="content" className="pt-600">
              {/* Magma has no description list: native dl, dt and dd. */}
              <dl className="m-0 grid gap-x-800 gap-y-500 md:grid-cols-2">
                {(
                  [
                    ['Applicant', record.applicant],
                    ['Email', record.email],
                    ['Office', record.office],
                    ['Assigned to', record.assignee ?? 'Nobody yet'],
                    ['Received', `${formatDate(record.received)} via ${record.channel}`],
                    ['Due by', formatDate(record.due)],
                  ] as const
                ).map(([term, value]) => (
                  <div key={term} className="flex flex-col gap-100">
                    <dt>
                      <MdsText typography="caption" className="text-fg-muted">
                        {term}
                      </MdsText>
                    </dt>
                    <dd className="m-0">
                      <MdsText typography="detail">{value}</MdsText>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
            <section slot="content" className="pt-600">
              <div className="grid gap-400 md:grid-cols-2">
                {record.documents.map((filename) => (
                  // mds-file emits mdsFileDownload on a click only, and has no
                  // role: a role and the keyboard of a button, until Magma
                  // gives them (https://github.com/magma-design-system/magma/issues/820).
                  <MdsFile
                    key={filename}
                    filename={filename}
                    role="button"
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return;
                      event.preventDefault();
                      event.currentTarget.click();
                    }}
                    onMdsFileDownload={(event) =>
                      // In an application: the address of the file, opened to download it.
                      show(`Demo: ${event.detail.filename} is not a real file.`, 'info')
                    }
                  />
                ))}
              </div>
            </section>
            <section slot="content" className="pt-600">
              <ol className="m-0 flex list-none flex-col gap-500 p-0">
                {/* The newest event first. */}
                {[...record.history].reverse().map((event) => (
                  <li key={`${event.when}-${event.what}`}>
                    <MdsAuthor>
                      <MdsAvatar slot="avatar" initials={initials(event.who)} />
                      <MdsText typography="detail">{`${event.who} ${event.what}`}</MdsText>
                      <MdsText typography="caption" className="text-fg-muted">
                        {formatDate(event.when)}
                      </MdsText>
                      {event.note && <MdsText typography="detail">{event.note}</MdsText>}
                    </MdsAuthor>
                  </li>
                ))}
              </ol>
            </section>
          </MdsTab>
        </article>
      )}

      <MdsModal
        opened={dialogOpen}
        accessibleName={dialogAction?.dialog?.title}
        onMdsModalClose={() => setDialogOpen(false)}
        onMdsModalHide={() => {
          if (!focusAfterDialog.current) return;
          focusAfterDialog.current = false;
          title.current?.focus();
        }}
      >
        {dialogAction?.dialog && (
          <form className="flex flex-col gap-500 p-600" noValidate onSubmit={submit}>
            <MdsText typography="h5" tag="h2">
              {dialogAction.dialog.title}
            </MdsText>
            <MdsText typography="detail" tag="p">
              {dialogAction.dialog.text}
            </MdsText>
            <MdsInputField
              label={dialogAction.dialog.field}
              variant={noteError ? 'error' : undefined}
              message={noteError ? dialogAction.dialog.error : undefined}
            >
              <MdsInput
                ref={input}
                type="textarea"
                name="note"
                required
                value={note}
                onMdsInputChange={(event) => setNote(String(event.detail.value ?? ''))}
              />
            </MdsInputField>
            <div className="flex flex-wrap justify-end gap-200">
              <MdsButton
                type="button"
                label="Cancel"
                variant="dark"
                tone="weak"
                onClick={() => setDialogOpen(false)}
              />
              <MdsButton
                type="submit"
                label={dialogAction.dialog.confirm}
                await={running === dialogAction.id}
              />
            </div>
          </form>
        )}
      </MdsModal>

      {toasts.map((toast) => (
        <MdsToast
          key={toast.key}
          variant={toast.variant}
          visible
          onMdsToastClose={() =>
            setToasts((current) => current.filter((other) => other.key !== toast.key))
          }
        >
          {toast.message}
        </MdsToast>
      ))}
      {/* Read out by screen readers after an action: mds-toast is not, yet. */}
      <MdsText role="status" className="sr-only">
        {announcement}
      </MdsText>
    </main>
  );
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
