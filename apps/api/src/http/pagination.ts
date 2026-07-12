/** Helpers to translate PaginationQuery into Prisma skip/take + response meta. */
import type { PaginationQuery } from '@perfusio/contracts';

export function toPrismaPage(q: PaginationQuery): { skip: number; take: number } {
  return { skip: (q.page - 1) * q.pageSize, take: q.pageSize };
}

export function pageMeta(q: PaginationQuery, total: number) {
  return {
    page: q.page,
    pageSize: q.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
  };
}

export function orderBy(q: PaginationQuery, fallback = 'createdAt') {
  return { [q.sort ?? fallback]: q.order };
}
