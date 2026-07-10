export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginationParams = {
  page: number;
  pageSize: number;
  /** Prisma `skip` derived from page/pageSize. */
  skip: number;
  /** Prisma `take` (equals pageSize). */
  take: number;
};

/** A repository list result: the page of items plus the unfiltered total. */
export type Paginated<TItem> = {
  items: TItem[];
  total: number;
};

type ParseOptions = {
  defaultPageSize?: number;
  maxPageSize?: number;
};

const toPositiveInt = (value: string | null, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
};

/**
 * Parses `page` and `pageSize` query params into safe pagination bounds.
 * Invalid/absent values fall back to defaults; `pageSize` is clamped to
 * `maxPageSize` so a client cannot request an unbounded page.
 */
export const parsePagination = (
  searchParams: URLSearchParams,
  options: ParseOptions = {}
): PaginationParams => {
  const defaultPageSize = options.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  const maxPageSize = options.maxPageSize ?? MAX_PAGE_SIZE;

  const page = toPositiveInt(searchParams.get("page"), DEFAULT_PAGE);
  const pageSize = Math.min(toPositiveInt(searchParams.get("pageSize"), defaultPageSize), maxPageSize);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize
  };
};

/** Builds the response `meta` block from the requested params and total count. */
export const buildPaginationMeta = (
  params: Pick<PaginationParams, "page" | "pageSize">,
  total: number
): PaginationMeta => ({
  page: params.page,
  pageSize: params.pageSize,
  total,
  totalPages: params.pageSize > 0 ? Math.ceil(total / params.pageSize) : 0
});
