// List with filters, in React with @maggioli-design-system/magma-react: the
// same screen as the plain HTML version. The query lives in the address, so a
// filtered list can be reloaded, bookmarked and shared (with a router, read
// and write it through the router instead of `history`).
import { useEffect, useState } from 'react';
import {
  MdsBadge,
  MdsBanner,
  MdsButton,
  MdsFilter,
  MdsFilterItem,
  MdsInput,
  MdsInputField,
  MdsInputSelect,
  MdsPaginator,
  MdsTable,
  MdsTableBody,
  MdsTableCell,
  MdsTableHeader,
  MdsTableHeaderCell,
  MdsTableRow,
  MdsText,
  MdsZero,
} from '@maggioli-design-system/magma-react';

const PAGE_SIZE = 10;

type Status = 'new' | 'in-progress' | 'waiting' | 'closed';

interface Query {
  q: string;
  status: Status | 'all';
  office: string;
  sort: 'newest' | 'oldest' | 'number';
  page: number;
}

const DEFAULTS: Query = { q: '', status: 'all', office: '', sort: 'newest', page: 1 };

const STATUSES: Record<
  Status,
  { label: string; variant: 'info' | 'violet' | 'warning' | 'success' }
> = {
  new: { label: 'New', variant: 'info' },
  'in-progress': { label: 'In progress', variant: 'violet' },
  waiting: { label: 'Waiting for documents', variant: 'warning' },
  closed: { label: 'Closed', variant: 'success' },
};

const OFFICES = {
  registry: 'Registry office',
  tax: 'Tax office',
  planning: 'Town planning',
  mobility: 'Mobility',
  education: 'Education',
};

const SORTS = { newest: 'Newest first', oldest: 'Oldest first', number: 'Number' };

const isStatus = (value: string | null): value is Status => value !== null && value in STATUSES;
const isSort = (value: string | null): value is Query['sort'] => value !== null && value in SORTS;

/** The query from the address, else the defaults. */
function readQuery(): Query {
  const params = new URLSearchParams(location.search);
  return {
    q: params.get('q') ?? DEFAULTS.q,
    status: isStatus(params.get('status')) ? (params.get('status') as Status) : DEFAULTS.status,
    office: params.get('office') ?? DEFAULTS.office,
    sort: isSort(params.get('sort')) ? (params.get('sort') as Query['sort']) : DEFAULTS.sort,
    page: Math.max(1, Number.parseInt(params.get('page') ?? '', 10) || DEFAULTS.page),
  };
}

/** The query into the address, without the values that are the defaults. */
function writeQuery(query: Query) {
  const params = new URLSearchParams();
  for (const key of Object.keys(query) as (keyof Query)[]) {
    if (query[key] !== DEFAULTS[key]) params.set(key, String(query[key]));
  }
  history.replaceState(null, '', params.size ? `?${params}` : location.pathname);
}

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

export function ListWithFilters() {
  const [query, setQuery] = useState(readQuery);
  const [search, setSearch] = useState(query.q);
  const [result, setResult] = useState<Result>();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  /** A new query: the filters changed, so back to the first page. */
  const update = (change: Partial<Query>) =>
    setQuery((current) => ({ ...current, page: 1, ...change }));

  // A query when the typing pauses, not one per key.
  useEffect(() => {
    if (search === query.q) return;
    const timer = setTimeout(() => update({ q: search }), 300);
    return () => clearTimeout(timer);
  }, [search, query.q]);

  useEffect(() => {
    const request = new AbortController();
    setLoading(true);
    fetchRequests({ ...query, size: PAGE_SIZE }, request.signal)
      .then((next) => {
        setResult(next);
        setFailed(false);
        writeQuery({ ...query, page: next.page });
      })
      .catch((reason: unknown) => {
        if (request.signal.aborted) return;
        console.error(reason);
        setFailed(true);
      })
      .finally(() => {
        if (!request.signal.aborted) setLoading(false);
      });
    // Only the answer to the last query counts.
    return () => request.abort();
  }, [query, attempt]);

  const clearFilters = () => {
    setSearch(DEFAULTS.q);
    update({ q: DEFAULTS.q, status: DEFAULTS.status, office: DEFAULTS.office });
  };

  const filtered =
    query.q !== DEFAULTS.q || query.status !== DEFAULTS.status || query.office !== DEFAULTS.office;
  const total = result?.total ?? 0;
  const page = result?.page ?? query.page;
  const pages = Math.ceil(total / PAGE_SIZE);
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);

  return (
    <main className="flex min-w-0 flex-col gap-600">
      <header className="flex flex-col gap-200">
        <MdsText typography="h3" tag="h1">
          Requests
        </MdsText>
        <MdsText typography="detail" tag="p" className="text-fg-muted">
          The requests citizens send to the offices of the municipality.
        </MdsText>
      </header>

      <form
        role="search"
        className="grid gap-400 md:grid-cols-4"
        onSubmit={(event) => event.preventDefault()}
      >
        <MdsInputField label="Search" className="md:col-span-2">
          <MdsInput
            type="search"
            name="q"
            placeholder="Number or subject"
            value={search}
            await={loading}
            onMdsInputChange={(event) => setSearch(String(event.detail.value ?? ''))}
          />
        </MdsInputField>
        <MdsInputField label="Office">
          <MdsInputSelect
            name="office"
            value={query.office}
            onMdsInputSelectChange={(event) => {
              const office = String(event.detail.value ?? '');
              if (office !== query.office) update({ office });
            }}
          >
            <option value="">All offices</option>
            {Object.entries(OFFICES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </MdsInputSelect>
        </MdsInputField>
        <MdsInputField label="Sort by">
          <MdsInputSelect
            name="sort"
            value={query.sort}
            onMdsInputSelectChange={(event) => {
              const sort = String(event.detail.value);
              if (isSort(sort) && sort !== query.sort) update({ sort });
            }}
          >
            {Object.entries(SORTS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </MdsInputSelect>
        </MdsInputField>
      </form>

      {/* One status at a time; the counts follow the search and the office. */}
      <MdsFilter
        label="Status"
        onMdsFilterChange={(event) => {
          const value = event.detail.value;
          if (isStatus(value)) return update({ status: value });
          // Picking the selected status again leaves none selected: that is
          // All, selected here too, since its prop may not change.
          event.target.querySelector('mds-filter-item[value="all"]')?.setAttribute('selected', '');
          update({ status: 'all' });
        }}
      >
        <MdsFilterItem
          label="All"
          value="all"
          count={result && String(result.all)}
          selected={query.status === 'all'}
        />
        {(Object.keys(STATUSES) as Status[]).map((status) => (
          <MdsFilterItem
            key={status}
            label={STATUSES[status].label}
            value={status}
            count={result && String(result.counts[status])}
            selected={query.status === status}
          />
        ))}
      </MdsFilter>

      <div className="flex min-h-1000 flex-wrap items-center justify-between gap-400">
        {/* Read out by screen readers whenever the results change. */}
        <MdsText typography="detail" role="status">
          {result &&
            (total === 0
              ? 'No requests match.'
              : `${first}\u2013${last} of ${total} ${total === 1 ? 'request' : 'requests'}`)}
        </MdsText>
        {filtered && (
          <MdsButton
            type="button"
            label="Clear filters"
            icon="mi/baseline/filter-alt-off"
            variant="dark"
            tone="text"
            size="sm"
            onClick={clearFilters}
          />
        )}
      </div>

      {failed && (
        <MdsBanner
          variant="error"
          icon="mi/baseline/error"
          headline="The requests could not be loaded"
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

      {result && total === 0 ? (
        <MdsZero>
          <MdsText typography="h5" tag="h2" slot="content">
            No requests match
          </MdsText>
          <MdsText typography="detail" tag="p" slot="content">
            Try other words, or clear the filters to see every request.
          </MdsText>
          <MdsButton slot="action" type="button" label="Clear filters" onClick={clearFilters} />
        </MdsZero>
      ) : (
        <MdsTable
          interactive
          aria-busy={loading}
          className="w-full [&_mds-table-cell]:text-nowrap [&_mds-text]:text-nowrap"
        >
          <MdsTableHeader>
            <MdsTableHeaderCell label="Number" />
            <MdsTableHeaderCell label="Subject" />
            <MdsTableHeaderCell label="Office" />
            <MdsTableHeaderCell label="Status" />
            <MdsTableHeaderCell label="Received" />
          </MdsTableHeader>
          <MdsTableBody>
            {result?.items.map((request) => (
              <MdsTableRow key={request.id} value={request.id}>
                <MdsTableCell>
                  <MdsButton
                    href={`/requests/${request.id}`}
                    label={request.number}
                    variant="primary"
                    tone="text"
                    size="sm"
                  />
                </MdsTableCell>
                <MdsTableCell>
                  <MdsText typography="detail">{request.subject}</MdsText>
                </MdsTableCell>
                <MdsTableCell>
                  <MdsText typography="detail">{request.office}</MdsText>
                </MdsTableCell>
                <MdsTableCell>
                  <MdsBadge
                    label={STATUSES[request.status].label}
                    variant={STATUSES[request.status].variant}
                  />
                </MdsTableCell>
                <MdsTableCell>
                  <MdsText typography="detail">
                    {dateFormat.format(new Date(request.received))}
                  </MdsText>
                </MdsTableCell>
              </MdsTableRow>
            ))}
          </MdsTableBody>
        </MdsTable>
      )}

      {pages > 1 && (
        <MdsPaginator
          className="self-center"
          pages={pages}
          currentPage={page}
          onMdsPaginatorChange={(event) => {
            // It also reports the page it is given.
            if (event.detail.page !== page) update({ page: event.detail.page });
          }}
        />
      )}
    </main>
  );
}

/*
 * Demo only: stands in for the back end. Replace it with the call to your
 * API, which searches, counts, sorts and pages the requests on the server:
 * the list never loads more than one page.
 */

interface RequestRecord {
  id: number;
  number: string;
  subject: string;
  officeId: keyof typeof OFFICES;
  office: string;
  status: Status;
  received: string;
}

interface Result {
  items: RequestRecord[];
  total: number;
  /** The requests of every status, for the search and the office. */
  all: number;
  counts: Record<Status, number>;
  page: number;
}

async function fetchRequests(
  { q, status, office, sort, page, size }: Query & { size: number },
  signal: AbortSignal,
): Promise<Result> {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, 250);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
  const text = q.trim().toLowerCase();
  const matching = REQUESTS.filter(
    (request) =>
      (!text || `${request.number} ${request.subject}`.toLowerCase().includes(text)) &&
      (!office || request.officeId === office),
  );
  const counts = Object.fromEntries(
    (Object.keys(STATUSES) as Status[]).map((id) => [
      id,
      matching.filter((request) => request.status === id).length,
    ]),
  ) as Record<Status, number>;
  const found = status === 'all' ? matching : matching.filter((r) => r.status === status);
  const order = {
    newest: (a: RequestRecord, b: RequestRecord) => b.received.localeCompare(a.received),
    oldest: (a: RequestRecord, b: RequestRecord) => a.received.localeCompare(b.received),
    number: (a: RequestRecord, b: RequestRecord) => a.number.localeCompare(b.number),
  }[sort];
  const last = Math.max(1, Math.ceil(found.length / size));
  const current = Math.min(page, last);
  return {
    items: [...found].sort(order).slice((current - 1) * size, current * size),
    total: found.length,
    all: matching.length,
    counts,
    page: current,
  };
}

/** Demo only: 46 requests, the same on every load. */
const REQUESTS: RequestRecord[] = (() => {
  const subjects: [string, keyof typeof OFFICES][] = [
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
  const statuses = Object.keys(STATUSES) as Status[];
  return Array.from({ length: 46 }, (_, index) => {
    const [subject, officeId] = subjects[(index * 7) % subjects.length];
    const number = 512 - index;
    return {
      id: number,
      number: `REQ-2026-${String(number).padStart(4, '0')}`,
      subject,
      officeId,
      office: OFFICES[officeId],
      status: statuses[(index * 3 + Math.floor(index / 4)) % statuses.length],
      received: new Date(Date.UTC(2026, 9, 14) - index * 1.7 * 86_400_000)
        .toISOString()
        .slice(0, 10),
    };
  });
})();
