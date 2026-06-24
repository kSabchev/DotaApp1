// Hero interaction data + helpers now live in the shared core so the
// backend backtest reuses the exact same scoring inputs. Re-exported here
// for existing frontend imports (`../data/interactions`).
export * from '../../../shared/interactions';
