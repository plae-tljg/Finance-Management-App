/**
 * Service factories under `services/business` are named `use*Service` but they
 * are NOT React hooks: they simply build a repository and return an object of
 * methods.
 *
 * That distinction matters. Because every call returned a brand-new object
 * literal, any `useEffect` / `useCallback` that listed the service in its
 * dependency array saw a new value on every render. Effects that then called
 * `setState` with a fresh array (e.g. `setAccountList(accounts)`) re-triggered
 * a render, which produced another new service object, which re-ran the
 * effect again — an unbounded render + SQL query loop that kept the JS thread
 * saturated and made text input feel unresponsive.
 *
 * `createServiceCache` keeps one instance per database connection so the
 * identity stays stable across renders, WITHOUT turning the factories into
 * real hooks. That matters because many call sites invoke them conditionally
 * (e.g. `databaseService ? useBudgetService(databaseService) : null`), which
 * would break the rules of hooks if these became genuine hooks.
 */
export function createServiceCache<TService>() {
  const cache = new WeakMap<object, TService>();

  return function getService(
    key: object,
    factory: () => TService,
  ): TService {
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }
    const created = factory();
    cache.set(key, created);
    return created;
  };
}
