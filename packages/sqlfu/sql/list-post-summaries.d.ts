import type { Client, Transaction } from '@libsql/client';
export type ListPostSummariesResult = {
    id: number;
    slug: string;
    title: string;
    published_at: string;
    excerpt: string;
};
export declare function listPostSummaries(client: Client | Transaction): Promise<ListPostSummariesResult[]>;
//# sourceMappingURL=list-post-summaries.d.ts.map