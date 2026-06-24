// Domain types live in the framework-free shared core so the backend
// (backtest, future analysis) can reuse them. This file re-exports them
// so existing frontend imports (`../types`) keep working unchanged.
export * from '../../../shared/types';
