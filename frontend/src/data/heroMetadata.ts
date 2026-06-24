// Hero metadata (utilityTags, roles, etc.) now lives in the shared core so
// the backend backtest builds the exact same hero pool. Re-exported here for
// existing frontend imports (`../data/heroMetadata`).
export * from '../../../shared/heroMetadata';
