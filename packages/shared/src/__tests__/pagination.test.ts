import { buildPaginationMeta, parsePagination, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../utils/pagination";

const params = (query: string) => new URLSearchParams(query);

describe("parsePagination", () => {
  it("falls back to defaults when params are absent", () => {
    expect(parsePagination(params(""))).toEqual({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      skip: 0,
      take: DEFAULT_PAGE_SIZE
    });
  });

  it("derives skip/take from valid page and pageSize", () => {
    expect(parsePagination(params("page=3&pageSize=10"))).toEqual({
      page: 3,
      pageSize: 10,
      skip: 20,
      take: 10
    });
  });

  it("clamps pageSize to the maximum", () => {
    const result = parsePagination(params(`pageSize=${MAX_PAGE_SIZE + 500}`));
    expect(result.pageSize).toBe(MAX_PAGE_SIZE);
    expect(result.take).toBe(MAX_PAGE_SIZE);
  });

  it("ignores invalid or non-positive values", () => {
    expect(parsePagination(params("page=0&pageSize=-5")).page).toBe(1);
    expect(parsePagination(params("page=abc&pageSize=xyz"))).toMatchObject({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE
    });
  });

  it("honors a custom default page size", () => {
    expect(parsePagination(params(""), { defaultPageSize: 5 }).pageSize).toBe(5);
  });
});

describe("buildPaginationMeta", () => {
  it("computes totalPages by rounding up", () => {
    expect(buildPaginationMeta({ page: 1, pageSize: 20 }, 41)).toEqual({
      page: 1,
      pageSize: 20,
      total: 41,
      totalPages: 3
    });
  });

  it("reports zero total pages for an empty result", () => {
    expect(buildPaginationMeta({ page: 1, pageSize: 20 }, 0).totalPages).toBe(0);
  });
});
