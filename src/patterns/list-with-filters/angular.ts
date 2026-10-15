// List with filters, in Angular with @maggioli-design-system/magma-angular:
// the same screen as the plain HTML version. The query lives in the address,
// through the router, so a filtered list can be reloaded, bookmarked and shared.
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, type ParamMap, Router } from '@angular/router';
import type {
  MdsFilterCustomEvent,
  MdsFilterEventDetail,
  MdsInputCustomEvent,
  MdsInputEventDetail,
  MdsInputSelectCustomEvent,
  MdsInputSelectEventDetail,
  MdsPaginatorCustomEvent,
  MdsPaginatorEventDetail,
} from '@maggioli-design-system/magma';
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
} from '@maggioli-design-system/magma-angular';

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
function readQuery(params: ParamMap): Query {
  const status = params.get('status');
  const sort = params.get('sort');
  return {
    q: params.get('q') ?? DEFAULTS.q,
    status: isStatus(status) ? status : DEFAULTS.status,
    office: params.get('office') ?? DEFAULTS.office,
    sort: isSort(sort) ? sort : DEFAULTS.sort,
    page: Math.max(1, Number.parseInt(params.get('page') ?? '', 10) || DEFAULTS.page),
  };
}

@Component({
  selector: 'app-list-with-filters',
  imports: [
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
  ],
  template: `
    <main class="flex min-w-0 flex-col gap-600">
      <header class="flex flex-col gap-200">
        <mds-text typography="h3" tag="h1">Requests</mds-text>
        <mds-text typography="detail" tag="p" class="text-fg-muted">
          The requests citizens send to the offices of the municipality.
        </mds-text>
      </header>

      <form role="search" class="grid gap-400 md:grid-cols-4" (submit)="$event.preventDefault()">
        <mds-input-field label="Search" class="md:col-span-2">
          <mds-input
            type="search"
            name="q"
            placeholder="Number or subject"
            [value]="search()"
            [await]="loading()"
            (mdsInputChange)="onSearch($event)"
          ></mds-input>
        </mds-input-field>
        <mds-input-field label="Office">
          <mds-input-select
            name="office"
            [value]="query().office"
            (mdsInputSelectChange)="onOffice($event)"
          >
            <option value="">All offices</option>
            @for (office of offices; track office.value) {
              <option [value]="office.value">{{ office.label }}</option>
            }
          </mds-input-select>
        </mds-input-field>
        <mds-input-field label="Sort by">
          <mds-input-select
            name="sort"
            [value]="query().sort"
            (mdsInputSelectChange)="onSort($event)"
          >
            @for (sort of sorts; track sort.value) {
              <option [value]="sort.value">{{ sort.label }}</option>
            }
          </mds-input-select>
        </mds-input-field>
      </form>

      <!-- One status at a time; the counts follow the search and the office. -->
      <mds-filter label="Status" (mdsFilterChange)="onStatus($event)">
        <mds-filter-item
          label="All"
          value="all"
          [count]="count('all')"
          [selected]="query().status === 'all'"
        ></mds-filter-item>
        @for (status of statuses; track status.value) {
          <mds-filter-item
            [label]="status.label"
            [value]="status.value"
            [count]="count(status.value)"
            [selected]="query().status === status.value"
          ></mds-filter-item>
        }
      </mds-filter>

      <div class="flex min-h-1000 flex-wrap items-center justify-between gap-400">
        <!-- Read out by screen readers whenever the results change. -->
        <mds-text typography="detail" role="status">{{ summary() }}</mds-text>
        @if (filtered()) {
          <mds-button
            type="button"
            label="Clear filters"
            icon="mi/baseline/filter-alt-off"
            variant="dark"
            tone="text"
            size="sm"
            (click)="clearFilters()"
          ></mds-button>
        }
      </div>

      @if (failed()) {
        <mds-banner
          variant="error"
          icon="mi/baseline/error"
          headline="The requests could not be loaded"
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

      @if (result() && total() === 0) {
        <mds-zero>
          <mds-text typography="h5" tag="h2" slot="content">No requests match</mds-text>
          <mds-text typography="detail" tag="p" slot="content">
            Try other words, or clear the filters to see every request.
          </mds-text>
          <mds-button
            slot="action"
            type="button"
            label="Clear filters"
            (click)="clearFilters()"
          ></mds-button>
        </mds-zero>
      } @else {
        <mds-table
          [interactive]="true"
          [attr.aria-busy]="loading()"
          class="w-full [&_mds-table-cell]:text-nowrap [&_mds-text]:text-nowrap"
        >
          <mds-table-header>
            <mds-table-header-cell label="Number"></mds-table-header-cell>
            <mds-table-header-cell label="Subject"></mds-table-header-cell>
            <mds-table-header-cell label="Office"></mds-table-header-cell>
            <mds-table-header-cell label="Status"></mds-table-header-cell>
            <mds-table-header-cell label="Received"></mds-table-header-cell>
          </mds-table-header>
          <mds-table-body>
            @for (request of result()?.items ?? []; track request.id) {
              <mds-table-row [value]="request.id">
                <mds-table-cell>
                  <mds-button
                    [href]="'/requests/' + request.id"
                    [label]="request.number"
                    variant="primary"
                    tone="text"
                    size="sm"
                  ></mds-button>
                </mds-table-cell>
                <mds-table-cell>
                  <mds-text typography="detail">{{ request.subject }}</mds-text>
                </mds-table-cell>
                <mds-table-cell>
                  <mds-text typography="detail">{{ request.office }}</mds-text>
                </mds-table-cell>
                <mds-table-cell>
                  <mds-badge
                    [label]="statusOf[request.status].label"
                    [variant]="statusOf[request.status].variant"
                  ></mds-badge>
                </mds-table-cell>
                <mds-table-cell>
                  <mds-text typography="detail">{{ received(request) }}</mds-text>
                </mds-table-cell>
              </mds-table-row>
            }
          </mds-table-body>
        </mds-table>
      }

      @if (pages() > 1) {
        <mds-paginator
          class="self-center"
          [pages]="pages()"
          [currentPage]="page()"
          (mdsPaginatorChange)="onPage($event)"
        ></mds-paginator>
      }
    </main>
  `,
})
export class ListWithFiltersComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
  private readonly attempt = signal(0);
  private typing?: ReturnType<typeof setTimeout>;

  readonly offices = Object.entries(OFFICES).map(([value, label]) => ({ value, label }));
  readonly sorts = Object.entries(SORTS).map(([value, label]) => ({ value, label }));
  readonly statuses = (Object.keys(STATUSES) as Status[]).map((value) => ({
    value,
    ...STATUSES[value],
  }));
  readonly statusOf = STATUSES;

  readonly query = signal(readQuery(this.route.snapshot.queryParamMap));
  readonly search = signal(this.query().q);
  readonly result = signal<Result | undefined>(undefined);
  readonly loading = signal(true);
  readonly failed = signal(false);

  readonly total = computed(() => this.result()?.total ?? 0);
  readonly page = computed(() => this.result()?.page ?? this.query().page);
  readonly pages = computed(() => Math.ceil(this.total() / PAGE_SIZE));
  readonly filtered = computed(() => {
    const { q, status, office } = this.query();
    return q !== DEFAULTS.q || status !== DEFAULTS.status || office !== DEFAULTS.office;
  });
  readonly summary = computed(() => {
    if (!this.result()) return '';
    const total = this.total();
    if (total === 0) return 'No requests match.';
    const first = (this.page() - 1) * PAGE_SIZE + 1;
    const last = Math.min(this.page() * PAGE_SIZE, total);
    return `${first}\u2013${last} of ${total} ${total === 1 ? 'request' : 'requests'}`;
  });

  constructor() {
    effect((onCleanup) => {
      const query = this.query();
      this.attempt();
      const request = new AbortController();
      // Only the answer to the last query counts.
      onCleanup(() => request.abort());
      this.loading.set(true);
      fetchRequests({ ...query, size: PAGE_SIZE }, request.signal).then(
        (next) => {
          this.result.set(next);
          this.failed.set(false);
          this.loading.set(false);
          this.writeQuery({ ...query, page: next.page });
        },
        (reason: unknown) => {
          if (request.signal.aborted) return;
          console.error(reason);
          this.failed.set(true);
          this.loading.set(false);
        },
      );
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.typing));
  }

  /** The query into the address, without the values that are the defaults. */
  private writeQuery(query: Query) {
    const queryParams = Object.fromEntries(
      Object.entries(query).filter(([key, value]) => value !== DEFAULTS[key as keyof Query]),
    );
    this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
  }

  /** A new query: the filters changed, so back to the first page. */
  private update(change: Partial<Query>) {
    this.query.update((current) => ({ ...current, page: 1, ...change }));
  }

  count(status: Status | 'all') {
    const result = this.result();
    if (!result) return undefined;
    return String(status === 'all' ? result.all : result.counts[status]);
  }

  received(request: RequestRecord) {
    return this.dateFormat.format(new Date(request.received));
  }

  onSearch(event: MdsInputCustomEvent<MdsInputEventDetail>) {
    const q = String(event.detail.value ?? '');
    this.search.set(q);
    clearTimeout(this.typing);
    // A query when the typing pauses, not one per key.
    if (q !== this.query().q) this.typing = setTimeout(() => this.update({ q }), 300);
  }

  onOffice(event: MdsInputSelectCustomEvent<MdsInputSelectEventDetail>) {
    const office = String(event.detail.value ?? '');
    if (office !== this.query().office) this.update({ office });
  }

  onSort(event: MdsInputSelectCustomEvent<MdsInputSelectEventDetail>) {
    const sort = String(event.detail.value);
    if (isSort(sort) && sort !== this.query().sort) this.update({ sort });
  }

  onStatus(event: MdsFilterCustomEvent<MdsFilterEventDetail>) {
    const value = event.detail.value;
    if (isStatus(value)) return this.update({ status: value });
    // Picking the selected status again leaves none selected: that is All,
    // selected here too, since its binding may not change.
    event.target.querySelector('mds-filter-item[value="all"]')?.setAttribute('selected', '');
    this.update({ status: 'all' });
  }

  onPage(event: MdsPaginatorCustomEvent<MdsPaginatorEventDetail>) {
    // It also reports the page it is given.
    if (event.detail.page !== this.page()) this.update({ page: event.detail.page });
  }

  retry() {
    this.attempt.update((count) => count + 1);
  }

  clearFilters() {
    clearTimeout(this.typing);
    this.search.set(DEFAULTS.q);
    this.update({ q: DEFAULTS.q, status: DEFAULTS.status, office: DEFAULTS.office });
  }
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
