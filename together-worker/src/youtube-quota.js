export const YOUTUBE_QUOTA_LIMITS = { search: { interactive: 52, scheduled: 48 }, coverage: { interactive: 120, scheduled: 60 } };
export const MAX_SCHEDULED_COVERAGE_CANDIDATES = YOUTUBE_QUOTA_LIMITS.coverage.scheduled;
// Six runs automate twice the prior scan budget while keeping ten scans per invocation.
export const SCHEDULED_CATALOG_CRONS = ['20 8 * * *', '20 12 * * *', '20 16 * * *', '20 20 * * *', '20 0 * * *', '20 4 * * *'];
export const MAX_SCHEDULED_COVERAGE_CANDIDATES_PER_RUN = Math.floor(MAX_SCHEDULED_COVERAGE_CANDIDATES / SCHEDULED_CATALOG_CRONS.length);
export const SCHEDULED_CATALOG_LOCALES_PER_RUN = 4;
// Claim with prior catalog, two quota+YouTube searches, one batched save and commit; each coverage scan uses two Durable Object requests.
export const MAX_SCHEDULED_CATALOG_SUBREQUESTS_PER_RUN = SCHEDULED_CATALOG_LOCALES_PER_RUN * 7 + MAX_SCHEDULED_COVERAGE_CANDIDATES_PER_RUN * 2;
