import { describe, expect, it } from "vitest";
import { fetchAllRows } from "@/lib/paginated-query";

describe("fetchAllRows", () => {
  it("loads every page until the final partial page", async () => {
    const rows = Array.from({ length: 7 }, (_, id) => ({ id }));
    const ranges: Array<[number, number]> = [];

    const result = await fetchAllRows(async (from, to) => {
      ranges.push([from, to]);
      return { data: rows.slice(from, to + 1), error: null };
    }, 3);

    expect(result).toEqual(rows);
    expect(ranges).toEqual([[0, 2], [3, 5], [6, 8]]);
  });

  it("makes a final empty request when the result is an exact page multiple", async () => {
    const rows = [1, 2, 3, 4];
    const ranges: Array<[number, number]> = [];

    const result = await fetchAllRows(async (from, to) => {
      ranges.push([from, to]);
      return { data: rows.slice(from, to + 1), error: null };
    }, 2);

    expect(result).toEqual(rows);
    expect(ranges).toEqual([[0, 1], [2, 3], [4, 5]]);
  });

  it("surfaces query errors instead of silently returning partial data", async () => {
    await expect(
      fetchAllRows(async () => ({
        data: null,
        error: { message: "database unavailable" },
      })),
    ).rejects.toThrow("database unavailable");
  });

  it("rejects invalid page sizes", async () => {
    await expect(fetchAllRows(async () => ({ data: [], error: null }), 0))
      .rejects.toThrow("inteiro positivo");
  });
});
