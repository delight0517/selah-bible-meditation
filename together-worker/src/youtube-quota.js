export const YOUTUBE_QUOTA_LIMITS = { search: { interactive: 82, scheduled: 18 }, coverage: { interactive: 138, scheduled: 42 } };
export const MAX_SCHEDULED_COVERAGE_CANDIDATES = YOUTUBE_QUOTA_LIMITS.coverage.scheduled;
// Preserve this account's three active schedules and fit every run under 50 subrequests.
export const SCHEDULED_CATALOG_CRONS = ['20 8 * * *', '20 16 * * *', '20 0 * * *'];
export const MAX_SCHEDULED_COVERAGE_CANDIDATES_PER_RUN = Math.floor(MAX_SCHEDULED_COVERAGE_CANDIDATES / SCHEDULED_CATALOG_CRONS.length);
export const SCHEDULED_CATALOG_LOCALES_PER_RUN = 3;
// Claim with prior catalog, two quota+YouTube searches, one batched save and commit; each coverage scan uses two Durable Object requests.
export const MAX_SCHEDULED_CATALOG_SUBREQUESTS_PER_RUN = SCHEDULED_CATALOG_LOCALES_PER_RUN * 7 + MAX_SCHEDULED_COVERAGE_CANDIDATES_PER_RUN * 2;
