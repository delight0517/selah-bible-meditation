export const YOUTUBE_QUOTA_LIMITS = { search: { interactive: 70, scheduled: 30 }, coverage: { interactive: 150, scheduled: 30 } };
export const MAX_SCHEDULED_COVERAGE_CANDIDATES = YOUTUBE_QUOTA_LIMITS.coverage.scheduled;
export const SCHEDULED_CATALOG_CRONS = ['20 0 * * *', '20 8 * * *', '20 16 * * *'];
export const MAX_SCHEDULED_COVERAGE_CANDIDATES_PER_RUN = Math.floor(MAX_SCHEDULED_COVERAGE_CANDIDATES / SCHEDULED_CATALOG_CRONS.length);
export const SCHEDULED_CATALOG_LOCALES_PER_RUN = 4;
// Claim with prior catalog, two quota+YouTube searches, one batched save and commit; each coverage scan uses two Durable Object requests.
export const MAX_SCHEDULED_CATALOG_SUBREQUESTS_PER_RUN = SCHEDULED_CATALOG_LOCALES_PER_RUN * 7 + MAX_SCHEDULED_COVERAGE_CANDIDATES_PER_RUN * 2;
