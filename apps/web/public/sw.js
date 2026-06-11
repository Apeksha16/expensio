(() => {
  'use strict';
  let e,
    t,
    a,
    r,
    s,
    n = {
      googleAnalytics: 'googleAnalytics',
      precache: 'precache-v2',
      prefix: 'serwist',
      runtime: 'runtime',
      suffix: 'u' > typeof registration ? registration.scope : '',
    },
    i = (e) => [n.prefix, e, n.suffix].filter((e) => e && e.length > 0).join('-'),
    o = (e) => e || i(n.precache);
  var c = class extends Error {
    details;
    constructor(e, t) {
      (super(
        ((e, ...t) => {
          let a = e;
          return (t.length > 0 && (a += ` :: ${JSON.stringify(t)}`), a);
        })(e, t)
      ),
        (this.name = e),
        (this.details = t));
    }
  };
  function l(e) {
    return new Promise((t) => setTimeout(t, e));
  }
  let h = new Set();
  function u(e, t) {
    let a = new URL(e);
    for (let e of t) a.searchParams.delete(e);
    return a.href;
  }
  async function d(e, t, a, r) {
    let s = u(t.url, a);
    if (t.url === s) return e.match(t, r);
    let n = { ...r, ignoreSearch: !0 };
    for (let i of await e.keys(t, n)) if (s === u(i.url, a)) return e.match(i, r);
  }
  var f = class {
    promise;
    resolve;
    reject;
    constructor() {
      this.promise = new Promise((e, t) => {
        ((this.resolve = e), (this.reject = t));
      });
    }
  };
  let y = async () => {
      for (let e of h) await e();
    },
    w = '-precache-',
    p = async (e, t = w) => {
      let a = (await self.caches.keys()).filter(
        (a) => a.includes(t) && a.includes(self.registration.scope) && a !== e
      );
      return (await Promise.all(a.map((e) => self.caches.delete(e))), a);
    },
    g = (e, t) => {
      let a = t();
      return (e.waitUntil(a), a);
    },
    m = (e, t) => t.some((t) => e instanceof t),
    _ = new WeakMap(),
    v = new WeakMap(),
    b = new WeakMap(),
    q = {
      get(e, t, a) {
        if (e instanceof IDBTransaction) {
          if ('done' === t) return _.get(e);
          if ('store' === t)
            return a.objectStoreNames[1] ? void 0 : a.objectStore(a.objectStoreNames[0]);
        }
        return R(e[t]);
      },
      set: (e, t, a) => ((e[t] = a), !0),
      has: (e, t) => (e instanceof IDBTransaction && ('done' === t || 'store' === t)) || t in e,
    };
  function R(e) {
    if (e instanceof IDBRequest) {
      let t;
      return (
        (t = new Promise((t, a) => {
          let r = () => {
              (e.removeEventListener('success', s), e.removeEventListener('error', n));
            },
            s = () => {
              (t(R(e.result)), r());
            },
            n = () => {
              (a(e.error), r());
            };
          (e.addEventListener('success', s), e.addEventListener('error', n));
        })),
        b.set(t, e),
        t
      );
    }
    if (v.has(e)) return v.get(e);
    let t = (function (e) {
      if ('function' == typeof e)
        return (
          s ||
          (s = [
            IDBCursor.prototype.advance,
            IDBCursor.prototype.continue,
            IDBCursor.prototype.continuePrimaryKey,
          ])
        ).includes(e)
          ? function (...t) {
              return (e.apply(E(this), t), R(this.request));
            }
          : function (...t) {
              return R(e.apply(E(this), t));
            };
      return (e instanceof IDBTransaction &&
        (function (e) {
          if (_.has(e)) return;
          let t = new Promise((t, a) => {
            let r = () => {
                (e.removeEventListener('complete', s),
                  e.removeEventListener('error', n),
                  e.removeEventListener('abort', n));
              },
              s = () => {
                (t(), r());
              },
              n = () => {
                (a(e.error || new DOMException('AbortError', 'AbortError')), r());
              };
            (e.addEventListener('complete', s),
              e.addEventListener('error', n),
              e.addEventListener('abort', n));
          });
          _.set(e, t);
        })(e),
      m(e, r || (r = [IDBDatabase, IDBObjectStore, IDBIndex, IDBCursor, IDBTransaction])))
        ? new Proxy(e, q)
        : e;
    })(e);
    return (t !== e && (v.set(e, t), b.set(t, e)), t);
  }
  let E = (e) => b.get(e),
    S = ['get', 'getKey', 'getAll', 'getAllKeys', 'count'],
    D = ['put', 'add', 'delete', 'clear'],
    P = new Map();
  function C(e, t) {
    if (!(e instanceof IDBDatabase && !(t in e) && 'string' == typeof t)) return;
    if (P.get(t)) return P.get(t);
    let a = t.replace(/FromIndex$/, ''),
      r = t !== a,
      s = D.includes(a);
    if (!(a in (r ? IDBIndex : IDBObjectStore).prototype) || !(s || S.includes(a))) return;
    let n = async function (e, ...t) {
      let n = this.transaction(e, s ? 'readwrite' : 'readonly'),
        i = n.store;
      return (r && (i = i.index(t.shift())), (await Promise.all([i[a](...t), s && n.done]))[0]);
    };
    return (P.set(t, n), n);
  }
  q = {
    ...(e = q),
    get: (t, a, r) => C(t, a) || e.get(t, a, r),
    has: (t, a) => !!C(t, a) || e.has(t, a),
  };
  let k = ['continue', 'continuePrimaryKey', 'advance'],
    T = {},
    I = new WeakMap(),
    U = new WeakMap(),
    L = {
      get(e, t) {
        if (!k.includes(t)) return e[t];
        let a = T[t];
        return (
          a ||
            (a = T[t] =
              function (...e) {
                I.set(this, U.get(this)[t](...e));
              }),
          a
        );
      },
    };
  async function* N(...e) {
    let t = this;
    if ((t instanceof IDBCursor || (t = await t.openCursor(...e)), !t)) return;
    let a = new Proxy(t, L);
    for (U.set(a, t), b.set(a, E(t)); t; )
      (yield a, (t = await (I.get(a) || t.continue())), I.delete(a));
  }
  function x(e, t) {
    return (
      (t === Symbol.asyncIterator && m(e, [IDBIndex, IDBObjectStore, IDBCursor])) ||
      ('iterate' === t && m(e, [IDBIndex, IDBObjectStore]))
    );
  }
  q = {
    ...(t = q),
    get: (e, a, r) => (x(e, a) ? N : t.get(e, a, r)),
    has: (e, a) => x(e, a) || t.has(e, a),
  };
  let K = async (e, t) => {
      let r = null;
      if ((e.url && (r = new URL(e.url).origin), r !== self.location.origin))
        throw new c('cross-origin-copy-response', { origin: r });
      let s = e.clone(),
        n = { headers: new Headers(s.headers), status: s.status, statusText: s.statusText },
        i = t ? t(n) : n,
        o = !(function () {
          if (void 0 === a) {
            let e = new Response('');
            if ('body' in e)
              try {
                (new Response(e.body), (a = !0));
              } catch {
                a = !1;
              }
            a = !1;
          }
          return a;
        })()
          ? await s.blob()
          : s.body;
      return new Response(o, i);
    },
    O = 'requests',
    B = 'queueName';
  var M = class {
      _db = null;
      async addEntry(e) {
        let t = (await this.getDb()).transaction(O, 'readwrite', { durability: 'relaxed' });
        (await t.store.add(e), await t.done);
      }
      async getFirstEntryId() {
        return (await (await this.getDb()).transaction(O).store.openCursor())?.value.id;
      }
      async getAllEntriesByQueueName(e) {
        return (await (await this.getDb()).getAllFromIndex(O, B, IDBKeyRange.only(e))) || [];
      }
      async getEntryCountByQueueName(e) {
        return (await this.getDb()).countFromIndex(O, B, IDBKeyRange.only(e));
      }
      async deleteEntry(e) {
        await (await this.getDb()).delete(O, e);
      }
      async getFirstEntryByQueueName(e) {
        return await this.getEndEntryFromIndex(IDBKeyRange.only(e), 'next');
      }
      async getLastEntryByQueueName(e) {
        return await this.getEndEntryFromIndex(IDBKeyRange.only(e), 'prev');
      }
      async getEndEntryFromIndex(e, t) {
        return (await (await this.getDb()).transaction(O).store.index(B).openCursor(e, t))?.value;
      }
      async getDb() {
        return (
          this._db ||
            (this._db = await (function (
              e,
              { blocked: t, upgrade: a, blocking: r, terminated: s } = {}
            ) {
              let n = indexedDB.open(e, 3),
                i = R(n);
              return (
                a &&
                  n.addEventListener('upgradeneeded', (e) => {
                    a(R(n.result), e.oldVersion, e.newVersion, R(n.transaction), e);
                  }),
                t && n.addEventListener('blocked', (e) => t(e.oldVersion, e.newVersion, e)),
                i
                  .then((e) => {
                    (s && e.addEventListener('close', () => s()),
                      r &&
                        e.addEventListener('versionchange', (e) =>
                          r(e.oldVersion, e.newVersion, e)
                        ));
                  })
                  .catch(() => {}),
                i
              );
            })('serwist-background-sync', { upgrade: this._upgradeDb })),
          this._db
        );
      }
      _upgradeDb(e, t) {
        (t > 0 && t < 3 && e.objectStoreNames.contains(O) && e.deleteObjectStore(O),
          e
            .createObjectStore(O, { autoIncrement: !0, keyPath: 'id' })
            .createIndex(B, B, { unique: !1 }));
      }
    },
    F = class {
      _queueName;
      _queueDb;
      constructor(e) {
        ((this._queueName = e), (this._queueDb = new M()));
      }
      async pushEntry(e) {
        (delete e.id, (e.queueName = this._queueName), await this._queueDb.addEntry(e));
      }
      async unshiftEntry(e) {
        let t = await this._queueDb.getFirstEntryId();
        (t ? (e.id = t - 1) : delete e.id,
          (e.queueName = this._queueName),
          await this._queueDb.addEntry(e));
      }
      async popEntry() {
        return this._removeEntry(await this._queueDb.getLastEntryByQueueName(this._queueName));
      }
      async shiftEntry() {
        return this._removeEntry(await this._queueDb.getFirstEntryByQueueName(this._queueName));
      }
      async getAll() {
        return await this._queueDb.getAllEntriesByQueueName(this._queueName);
      }
      async size() {
        return await this._queueDb.getEntryCountByQueueName(this._queueName);
      }
      async deleteEntry(e) {
        await this._queueDb.deleteEntry(e);
      }
      async _removeEntry(e) {
        return (e && (await this.deleteEntry(e.id)), e);
      }
    };
  let A = [
    'method',
    'referrer',
    'referrerPolicy',
    'mode',
    'credentials',
    'cache',
    'redirect',
    'integrity',
    'keepalive',
  ];
  var W = class e {
    _requestData;
    static async fromRequest(t) {
      let a = { url: t.url, headers: {} };
      for (let e of ('GET' !== t.method && (a.body = await t.clone().arrayBuffer()),
      t.headers.forEach((e, t) => {
        a.headers[t] = e;
      }),
      A))
        void 0 !== t[e] && (a[e] = t[e]);
      return new e(a);
    }
    constructor(e) {
      ('navigate' === e.mode && (e.mode = 'same-origin'), (this._requestData = e));
    }
    toObject() {
      let e = Object.assign({}, this._requestData);
      return (
        (e.headers = Object.assign({}, this._requestData.headers)),
        e.body && (e.body = e.body.slice(0)),
        e
      );
    }
    toRequest() {
      return new Request(this._requestData.url, this._requestData);
    }
    clone() {
      return new e(this.toObject());
    }
  };
  let j = 'serwist-background-sync',
    H = new Set(),
    $ = (e) => {
      let t = { request: new W(e.requestData).toRequest(), timestamp: e.timestamp };
      return (e.metadata && (t.metadata = e.metadata), t);
    };
  var G = class {
      _name;
      _onSync;
      _maxRetentionTime;
      _queueStore;
      _forceSyncFallback;
      _syncInProgress = !1;
      _requestsAddedDuringSync = !1;
      constructor(e, { forceSyncFallback: t, onSync: a, maxRetentionTime: r } = {}) {
        if (H.has(e)) throw new c('duplicate-queue-name', { name: e });
        (H.add(e),
          (this._name = e),
          (this._onSync = a || this.replayRequests),
          (this._maxRetentionTime = r || 10080),
          (this._forceSyncFallback = !!t),
          (this._queueStore = new F(this._name)),
          this._addSyncListener());
      }
      get name() {
        return this._name;
      }
      async pushRequest(e) {
        await this._addRequest(e, 'push');
      }
      async unshiftRequest(e) {
        await this._addRequest(e, 'unshift');
      }
      async popRequest() {
        return this._removeRequest('pop');
      }
      async shiftRequest() {
        return this._removeRequest('shift');
      }
      async getAll() {
        let e = await this._queueStore.getAll(),
          t = Date.now(),
          a = [];
        for (let r of e) {
          let e = 60 * this._maxRetentionTime * 1e3;
          t - r.timestamp > e ? await this._queueStore.deleteEntry(r.id) : a.push($(r));
        }
        return a;
      }
      async size() {
        return await this._queueStore.size();
      }
      async _addRequest({ request: e, metadata: t, timestamp: a = Date.now() }, r) {
        let s = { requestData: (await W.fromRequest(e.clone())).toObject(), timestamp: a };
        switch ((t && (s.metadata = t), r)) {
          case 'push':
            await this._queueStore.pushEntry(s);
            break;
          case 'unshift':
            await this._queueStore.unshiftEntry(s);
        }
        this._syncInProgress ? (this._requestsAddedDuringSync = !0) : await this.registerSync();
      }
      async _removeRequest(e) {
        let t,
          a = Date.now();
        switch (e) {
          case 'pop':
            t = await this._queueStore.popEntry();
            break;
          case 'shift':
            t = await this._queueStore.shiftEntry();
        }
        if (t) {
          let r = 60 * this._maxRetentionTime * 1e3;
          return a - t.timestamp > r ? this._removeRequest(e) : $(t);
        }
      }
      async replayRequests() {
        let e;
        for (; (e = await this.shiftRequest()); )
          try {
            await fetch(e.request.clone());
          } catch {
            throw (
              await this.unshiftRequest(e),
              new c('queue-replay-failed', { name: this._name })
            );
          }
      }
      async registerSync() {
        if ('sync' in self.registration && !this._forceSyncFallback)
          try {
            await self.registration.sync.register(`${j}:${this._name}`);
          } catch (e) {}
      }
      _addSyncListener() {
        'sync' in self.registration && !this._forceSyncFallback
          ? self.addEventListener('sync', (e) => {
              if (e.tag === `${j}:${this._name}`) {
                let t = async () => {
                  let t;
                  this._syncInProgress = !0;
                  try {
                    await this._onSync({ queue: this });
                  } catch (e) {
                    if (e instanceof Error) throw e;
                  } finally {
                    (this._requestsAddedDuringSync &&
                      !(t && !e.lastChance) &&
                      (await this.registerSync()),
                      (this._syncInProgress = !1),
                      (this._requestsAddedDuringSync = !1));
                  }
                };
                e.waitUntil(t());
              }
            })
          : this._onSync({ queue: this });
      }
      static get _queueNames() {
        return H;
      }
    },
    Q = class {
      _queue;
      constructor(e, t) {
        this._queue = new G(e, t);
      }
      async fetchDidFail({ request: e }) {
        await this._queue.pushRequest({ request: e });
      }
    };
  let V = {
    cacheWillUpdate: async ({ response: e }) => (200 === e.status || 0 === e.status ? e : null),
  };
  function z(e) {
    return 'string' == typeof e ? new Request(e) : e;
  }
  var J = class {
      event;
      request;
      url;
      params;
      _cacheKeys = {};
      _strategy;
      _handlerDeferred;
      _extendLifetimePromises;
      _plugins;
      _pluginStateMap;
      constructor(e, t) {
        for (const a of ((this.event = t.event),
        (this.request = t.request),
        t.url && ((this.url = t.url), (this.params = t.params)),
        (this._strategy = e),
        (this._handlerDeferred = new f()),
        (this._extendLifetimePromises = []),
        (this._plugins = [...e.plugins]),
        (this._pluginStateMap = new Map()),
        this._plugins))
          this._pluginStateMap.set(a, {});
        this.event.waitUntil(this._handlerDeferred.promise);
      }
      async fetch(e) {
        let { event: t } = this,
          a = z(e),
          r = await this.getPreloadResponse();
        if (r) return r;
        let s = this.hasCallback('fetchDidFail') ? a.clone() : null;
        try {
          for (let e of this.iterateCallbacks('requestWillFetch'))
            a = await e({ request: a.clone(), event: t });
        } catch (e) {
          if (e instanceof Error)
            throw new c('plugin-error-request-will-fetch', { thrownErrorMessage: e.message });
        }
        let n = a.clone();
        try {
          let e;
          for (let r of ((e = await fetch(
            a,
            'navigate' === a.mode ? void 0 : this._strategy.fetchOptions
          )),
          this.iterateCallbacks('fetchDidSucceed')))
            e = await r({ event: t, request: n, response: e });
          return e;
        } catch (e) {
          throw (
            s &&
              (await this.runCallbacks('fetchDidFail', {
                error: e,
                event: t,
                originalRequest: s.clone(),
                request: n.clone(),
              })),
            e
          );
        }
      }
      async fetchAndCachePut(e) {
        let t = await this.fetch(e),
          a = t.clone();
        return (this.waitUntil(this.cachePut(e, a)), t);
      }
      async cacheMatch(e) {
        let t,
          a = z(e),
          { cacheName: r, matchOptions: s } = this._strategy,
          n = await this.getCacheKey(a, 'read'),
          i = { ...s, cacheName: r };
        for (let e of ((t = await caches.match(n, i)),
        this.iterateCallbacks('cachedResponseWillBeUsed')))
          t =
            (await e({
              cacheName: r,
              matchOptions: s,
              cachedResponse: t,
              request: n,
              event: this.event,
            })) || void 0;
        return t;
      }
      async cachePut(e, t) {
        let a = z(e);
        await l(0);
        let r = await this.getCacheKey(a, 'write');
        if (!t)
          throw new c('cache-put-with-no-response', {
            url: new URL(String(r.url), location.href).href.replace(
              RegExp(`^${location.origin}`),
              ''
            ),
          });
        let s = await this._ensureResponseSafeToCache(t);
        if (!s) return !1;
        let { cacheName: n, matchOptions: i } = this._strategy,
          o = await self.caches.open(n),
          h = this.hasCallback('cacheDidUpdate'),
          u = h ? await d(o, r.clone(), ['__WB_REVISION__'], i) : null;
        try {
          await o.put(r, h ? s.clone() : s);
        } catch (e) {
          if (e instanceof Error) throw ('QuotaExceededError' === e.name && (await y()), e);
        }
        for (let e of this.iterateCallbacks('cacheDidUpdate'))
          await e({
            cacheName: n,
            oldResponse: u,
            newResponse: s.clone(),
            request: r,
            event: this.event,
          });
        return !0;
      }
      async getCacheKey(e, t) {
        let a = `${e.url} | ${t}`;
        if (!this._cacheKeys[a]) {
          let r = e;
          for (let e of this.iterateCallbacks('cacheKeyWillBeUsed'))
            r = z(await e({ mode: t, request: r, event: this.event, params: this.params }));
          this._cacheKeys[a] = r;
        }
        return this._cacheKeys[a];
      }
      hasCallback(e) {
        for (let t of this._strategy.plugins) if (e in t) return !0;
        return !1;
      }
      async runCallbacks(e, t) {
        for (let a of this.iterateCallbacks(e)) await a(t);
      }
      *iterateCallbacks(e) {
        for (let t of this._strategy.plugins)
          if ('function' == typeof t[e]) {
            let a = this._pluginStateMap.get(t),
              r = (r) => {
                let s = { ...r, state: a };
                return t[e](s);
              };
            yield r;
          }
      }
      waitUntil(e) {
        return (this._extendLifetimePromises.push(e), e);
      }
      async doneWaiting() {
        let e;
        for (; (e = this._extendLifetimePromises.shift()); ) await e;
      }
      destroy() {
        this._handlerDeferred.resolve(null);
      }
      async getPreloadResponse() {
        if (
          this.event instanceof FetchEvent &&
          'navigate' === this.event.request.mode &&
          'preloadResponse' in this.event
        )
          try {
            let e = await this.event.preloadResponse;
            if (e) return e;
          } catch (e) {
            return;
          }
      }
      async _ensureResponseSafeToCache(e) {
        let t = e,
          a = !1;
        for (let e of this.iterateCallbacks('cacheWillUpdate'))
          if (
            ((t = (await e({ request: this.request, response: t, event: this.event })) || void 0),
            (a = !0),
            !t)
          )
            break;
        return (!a && t && 200 !== t.status && (t = void 0), t);
      }
    },
    Y = class {
      cacheName;
      plugins;
      fetchOptions;
      matchOptions;
      constructor(e = {}) {
        ((this.cacheName = ((e) => e || i(n.runtime))(e.cacheName)),
          (this.plugins = e.plugins || []),
          (this.fetchOptions = e.fetchOptions),
          (this.matchOptions = e.matchOptions));
      }
      handle(e) {
        let [t] = this.handleAll(e);
        return t;
      }
      handleAll(e) {
        e instanceof FetchEvent && (e = { event: e, request: e.request });
        let t = e.event,
          a = 'string' == typeof e.request ? new Request(e.request) : e.request,
          r = new J(
            this,
            e.url
              ? { event: t, request: a, url: e.url, params: e.params }
              : { event: t, request: a }
          ),
          s = this._getResponse(r, a, t);
        return [s, this._awaitComplete(s, r, a, t)];
      }
      async _getResponse(e, t, a) {
        let r;
        await e.runCallbacks('handlerWillStart', { event: a, request: t });
        try {
          if (((r = await this._handle(t, e)), void 0 === r || 'error' === r.type))
            throw new c('no-response', { url: t.url });
        } catch (s) {
          if (s instanceof Error) {
            for (let n of e.iterateCallbacks('handlerDidError'))
              if (void 0 !== (r = await n({ error: s, event: a, request: t }))) break;
          }
          if (!r) throw s;
        }
        for (let s of e.iterateCallbacks('handlerWillRespond'))
          r = await s({ event: a, request: t, response: r });
        return r;
      }
      async _awaitComplete(e, t, a, r) {
        let s, n;
        try {
          s = await e;
        } catch {}
        try {
          (await t.runCallbacks('handlerDidRespond', { event: r, request: a, response: s }),
            await t.doneWaiting());
        } catch (e) {
          e instanceof Error && (n = e);
        }
        if (
          (await t.runCallbacks('handlerDidComplete', {
            event: r,
            request: a,
            response: s,
            error: n,
          }),
          t.destroy(),
          n)
        )
          throw n;
      }
    },
    X = class extends Y {
      _networkTimeoutSeconds;
      constructor(e = {}) {
        (super(e),
          this.plugins.some((e) => 'cacheWillUpdate' in e) || this.plugins.unshift(V),
          (this._networkTimeoutSeconds = e.networkTimeoutSeconds || 0));
      }
      async _handle(e, t) {
        let a,
          r = [],
          s = [];
        if (this._networkTimeoutSeconds) {
          let { id: n, promise: i } = this._getTimeoutPromise({ request: e, logs: r, handler: t });
          ((a = n), s.push(i));
        }
        let n = this._getNetworkPromise({ timeoutId: a, request: e, logs: r, handler: t });
        s.push(n);
        let i = await t.waitUntil(
          (async () => (await t.waitUntil(Promise.race(s))) || (await n))()
        );
        if (!i) throw new c('no-response', { url: e.url });
        return i;
      }
      _getTimeoutPromise({ request: e, logs: t, handler: a }) {
        let r;
        return {
          promise: new Promise((t) => {
            r = setTimeout(async () => {
              t(await a.cacheMatch(e));
            }, 1e3 * this._networkTimeoutSeconds);
          }),
          id: r,
        };
      }
      async _getNetworkPromise({ timeoutId: e, request: t, logs: a, handler: r }) {
        let s, n;
        try {
          n = await r.fetchAndCachePut(t);
        } catch (e) {
          e instanceof Error && (s = e);
        }
        return (e && clearTimeout(e), (s || !n) && (n = await r.cacheMatch(t)), n);
      }
    },
    Z = class extends Y {
      _networkTimeoutSeconds;
      constructor(e = {}) {
        (super(e), (this._networkTimeoutSeconds = e.networkTimeoutSeconds || 0));
      }
      async _handle(e, t) {
        let a, r;
        try {
          let a = [t.fetch(e)];
          if (this._networkTimeoutSeconds) {
            let e = l(1e3 * this._networkTimeoutSeconds);
            a.push(e);
          }
          if (!(r = await Promise.race(a)))
            throw Error(
              `Timed out the network response after ${this._networkTimeoutSeconds} seconds.`
            );
        } catch (e) {
          e instanceof Error && (a = e);
        }
        if (!r) throw new c('no-response', { url: e.url, error: a });
        return r;
      }
    };
  let ee = (e) => (e && 'object' == typeof e ? e : { handle: e });
  var et = class {
      handler;
      match;
      method;
      catchHandler;
      constructor(e, t, a = 'GET') {
        ((this.handler = ee(t)), (this.match = e), (this.method = a));
      }
      setCatchHandler(e) {
        this.catchHandler = ee(e);
      }
    },
    ea = class e extends Y {
      _fallbackToNetwork;
      static defaultPrecacheCacheabilityPlugin = {
        cacheWillUpdate: async ({ response: e }) => (!e || e.status >= 400 ? null : e),
      };
      static copyRedirectedCacheableResponsesPlugin = {
        cacheWillUpdate: async ({ response: e }) => (e.redirected ? await K(e) : e),
      };
      constructor(t = {}) {
        ((t.cacheName = o(t.cacheName)),
          super(t),
          (this._fallbackToNetwork = !1 !== t.fallbackToNetwork),
          this.plugins.push(e.copyRedirectedCacheableResponsesPlugin));
      }
      async _handle(e, t) {
        let a = await t.getPreloadResponse();
        if (a) return a;
        let r = await t.cacheMatch(e);
        return (
          r ||
          (t.event && 'install' === t.event.type
            ? await this._handleInstall(e, t)
            : await this._handleFetch(e, t))
        );
      }
      async _handleFetch(e, t) {
        let a,
          r = t.params || {};
        if (this._fallbackToNetwork) {
          let s = r.integrity,
            n = e.integrity,
            i = !n || n === s;
          ((a = await t.fetch(
            new Request(e, { integrity: 'no-cors' !== e.mode ? n || s : void 0 })
          )),
            s &&
              i &&
              'no-cors' !== e.mode &&
              (this._useDefaultCacheabilityPluginIfNeeded(), await t.cachePut(e, a.clone())));
        } else throw new c('missing-precache-entry', { cacheName: this.cacheName, url: e.url });
        return a;
      }
      async _handleInstall(e, t) {
        this._useDefaultCacheabilityPluginIfNeeded();
        let a = await t.fetch(e);
        if (!(await t.cachePut(e, a.clone())))
          throw new c('bad-precaching-response', { url: e.url, status: a.status });
        return a;
      }
      _useDefaultCacheabilityPluginIfNeeded() {
        let t = null,
          a = 0;
        for (let [r, s] of this.plugins.entries())
          s !== e.copyRedirectedCacheableResponsesPlugin &&
            (s === e.defaultPrecacheCacheabilityPlugin && (t = r), s.cacheWillUpdate && a++);
        0 === a
          ? this.plugins.push(e.defaultPrecacheCacheabilityPlugin)
          : a > 1 && null !== t && this.plugins.splice(t, 1);
      }
    },
    er = class extends et {
      _allowlist;
      _denylist;
      constructor(e, { allowlist: t = [/./], denylist: a = [] } = {}) {
        (super((e) => this._match(e), e), (this._allowlist = t), (this._denylist = a));
      }
      _match({ url: e, request: t }) {
        if (t && 'navigate' !== t.mode) return !1;
        let a = e.pathname + e.search;
        for (let e of this._denylist) if (e.test(a)) return !1;
        return !!this._allowlist.some((e) => e.test(a));
      }
    },
    es = class extends et {
      constructor(e, t, a) {
        super(
          ({ url: t }) => {
            let a = e.exec(t.href);
            if (a) return t.origin !== location.origin && 0 !== a.index ? void 0 : a.slice(1);
          },
          t,
          a
        );
      }
    };
  let en = (e) => {
    if (!e) throw new c('add-to-cache-list-unexpected-type', { entry: e });
    if ('string' == typeof e) {
      let t = new URL(e, location.href);
      return { cacheKey: t.href, url: t.href };
    }
    let { revision: t, url: a } = e;
    if (!a) throw new c('add-to-cache-list-unexpected-type', { entry: e });
    if (!t) {
      let e = new URL(a, location.href);
      return { cacheKey: e.href, url: e.href };
    }
    let r = new URL(a, location.href),
      s = new URL(a, location.href);
    return (r.searchParams.set('__WB_REVISION__', t), { cacheKey: r.href, url: s.href });
  };
  var ei = class {
    updatedURLs = [];
    notUpdatedURLs = [];
    handlerWillStart = async ({ request: e, state: t }) => {
      t && (t.originalRequest = e);
    };
    cachedResponseWillBeUsed = async ({ event: e, state: t, cachedResponse: a }) => {
      if ('install' === e.type && t?.originalRequest && t.originalRequest instanceof Request) {
        let e = t.originalRequest.url;
        a ? this.notUpdatedURLs.push(e) : this.updatedURLs.push(e);
      }
      return a;
    };
  };
  let eo = async (e, t, a) => {
    let r = t.map((e, t) => ({ index: t, item: e })),
      s = async (e) => {
        let t = [];
        for (;;) {
          let s = r.pop();
          if (!s) return e(t);
          let n = await a(s.item);
          t.push({ result: n, index: s.index });
        }
      },
      n = Array.from({ length: e }, () => new Promise(s));
    return (await Promise.all(n))
      .flat()
      .sort((e, t) => (e.index < t.index ? -1 : 1))
      .map((e) => e.result);
  };
  'u' > typeof navigator && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  let ec = /^\/(\w+\/)?collect/,
    el = ({ serwist: e, cacheName: t, ...a }) => {
      let r,
        s,
        o = t || i(n.googleAnalytics),
        c = new Q('serwist-google-analytics', {
          maxRetentionTime: 2880,
          onSync: async ({ queue: e }) => {
            let t;
            for (; (t = await e.shiftRequest()); ) {
              let { request: r, timestamp: s } = t,
                n = new URL(r.url);
              try {
                let e =
                    'POST' === r.method
                      ? new URLSearchParams(await r.clone().text())
                      : n.searchParams,
                  t = s - (Number(e.get('qt')) || 0),
                  i = Date.now() - t;
                if ((e.set('qt', String(i)), a.parameterOverrides))
                  for (let t of Object.keys(a.parameterOverrides)) {
                    let r = a.parameterOverrides[t];
                    e.set(t, r);
                  }
                ('function' == typeof a.hitFilter && a.hitFilter.call(null, e),
                  await fetch(
                    new Request(n.origin + n.pathname, {
                      body: e.toString(),
                      method: 'POST',
                      mode: 'cors',
                      credentials: 'omit',
                      headers: { 'Content-Type': 'text/plain' },
                    })
                  ));
              } catch (a) {
                throw (await e.unshiftRequest(t), a);
              }
            }
          },
        });
      for (let t of [
        new et(
          ({ url: e }) => 'www.googletagmanager.com' === e.hostname && '/gtm.js' === e.pathname,
          new X({ cacheName: o }),
          'GET'
        ),
        new et(
          ({ url: e }) =>
            'www.google-analytics.com' === e.hostname && '/analytics.js' === e.pathname,
          new X({ cacheName: o }),
          'GET'
        ),
        new et(
          ({ url: e }) => 'www.googletagmanager.com' === e.hostname && '/gtag/js' === e.pathname,
          new X({ cacheName: o }),
          'GET'
        ),
        new et(
          (r = ({ url: e }) => 'www.google-analytics.com' === e.hostname && ec.test(e.pathname)),
          (s = new Z({ plugins: [c] })),
          'GET'
        ),
        new et(r, s, 'POST'),
      ])
        e.registerRoute(t);
    };
  var eh = class {
      _fallbackUrls;
      _serwist;
      constructor({ fallbackUrls: e, serwist: t }) {
        ((this._fallbackUrls = e), (this._serwist = t));
      }
      async handlerDidError(e) {
        for (let t of this._fallbackUrls)
          if ('string' == typeof t) {
            let e = await this._serwist.matchPrecache(t);
            if (void 0 !== e) return e;
          } else if (t.matcher(e)) {
            let e = await this._serwist.matchPrecache(t.url);
            if (void 0 !== e) return e;
          }
      }
    },
    eu = class extends Y {
      async _handle(e, t) {
        let a,
          r = await t.cacheMatch(e);
        if (r);
        else
          try {
            r = await t.fetchAndCachePut(e);
          } catch (e) {
            e instanceof Error && (a = e);
          }
        if (!r) throw new c('no-response', { url: e.url, error: a });
        return r;
      }
    },
    ed = class extends Y {
      constructor(e = {}) {
        (super(e), this.plugins.some((e) => 'cacheWillUpdate' in e) || this.plugins.unshift(V));
      }
      async _handle(e, t) {
        let a,
          r = t.fetchAndCachePut(e).catch(() => {});
        t.waitUntil(r);
        let s = await t.cacheMatch(e);
        if (s);
        else
          try {
            s = await r;
          } catch (e) {
            e instanceof Error && (a = e);
          }
        if (!s) throw new c('no-response', { url: e.url, error: a });
        return s;
      }
    },
    ef = class extends et {
      constructor(e, t) {
        super(({ request: a }) => {
          let r = e.getUrlsToPrecacheKeys();
          for (let s of (function* (
            e,
            {
              directoryIndex: t = 'index.html',
              ignoreURLParametersMatching: a = [/^utm_/, /^fbclid$/],
              cleanURLs: r = !0,
              urlManipulation: s,
            } = {}
          ) {
            let n = new URL(e, location.href);
            ((n.hash = ''), yield n.href);
            let i = ((e, t = []) => {
              for (let a of [...e.searchParams.keys()])
                t.some((e) => e.test(a)) && e.searchParams.delete(a);
              return e;
            })(n, a);
            if ((yield i.href, t && i.pathname.endsWith('/'))) {
              let e = new URL(i.href);
              ((e.pathname += t), yield e.href);
            }
            if (r) {
              let e = new URL(i.href);
              ((e.pathname += '.html'), yield e.href);
            }
            if (s) for (let e of s({ url: n })) yield e.href;
          })(a.url, t)) {
            let t = r.get(s);
            if (t) return { cacheKey: t, integrity: e.getIntegrityForPrecacheKey(t) };
          }
        }, e.precacheStrategy);
      }
    },
    ey = class {
      _precacheController;
      constructor({ precacheController: e }) {
        this._precacheController = e;
      }
      cacheKeyWillBeUsed = async ({ request: e, params: t }) => {
        let a = t?.cacheKey || this._precacheController.getPrecacheKeyForUrl(e.url);
        return a ? new Request(a, { headers: e.headers }) : e;
      };
    };
  (new (class {
    _urlsToCacheKeys = new Map();
    _urlsToCacheModes = new Map();
    _cacheKeysToIntegrities = new Map();
    _concurrentPrecaching;
    _precacheStrategy;
    _routes;
    _defaultHandlerMap;
    _catchHandler;
    _requestRules;
    constructor({
      precacheEntries: e,
      precacheOptions: t,
      skipWaiting: a = !1,
      importScripts: r,
      navigationPreload: s = !1,
      cacheId: i,
      clientsClaim: c = !1,
      runtimeCaching: l,
      offlineAnalyticsConfig: h,
      disableDevLogs: u = !1,
      fallbacks: d,
      requestRules: f,
    } = {}) {
      const {
        precacheStrategyOptions: y,
        precacheRouteOptions: w,
        precacheMiscOptions: g,
      } = ((e, t = {}) => {
        let {
          cacheName: a,
          plugins: r = [],
          fetchOptions: s,
          matchOptions: n,
          fallbackToNetwork: i,
          directoryIndex: c,
          ignoreURLParametersMatching: l,
          cleanURLs: h,
          urlManipulation: u,
          cleanupOutdatedCaches: d,
          concurrency: f = 10,
          navigateFallback: y,
          navigateFallbackAllowlist: w,
          navigateFallbackDenylist: p,
        } = t ?? {};
        return {
          precacheStrategyOptions: {
            cacheName: o(a),
            plugins: [...r, new ey({ precacheController: e })],
            fetchOptions: s,
            matchOptions: n,
            fallbackToNetwork: i,
          },
          precacheRouteOptions: {
            directoryIndex: c,
            ignoreURLParametersMatching: l,
            cleanURLs: h,
            urlManipulation: u,
          },
          precacheMiscOptions: {
            cleanupOutdatedCaches: d,
            concurrency: f,
            navigateFallback: y,
            navigateFallbackAllowlist: w,
            navigateFallbackDenylist: p,
          },
        };
      })(this, t);
      if (
        ((this._concurrentPrecaching = g.concurrency),
        (this._precacheStrategy = new ea(y)),
        (this._routes = new Map()),
        (this._defaultHandlerMap = new Map()),
        (this._requestRules = f),
        (this.handleInstall = this.handleInstall.bind(this)),
        (this.handleActivate = this.handleActivate.bind(this)),
        (this.handleFetch = this.handleFetch.bind(this)),
        (this.handleCache = this.handleCache.bind(this)),
        r && r.length > 0 && self.importScripts(...r),
        s &&
          self.registration?.navigationPreload &&
          self.addEventListener('activate', (e) => {
            e.waitUntil(self.registration.navigationPreload.enable().then(() => {}));
          }),
        void 0 !== i &&
          ((e) => {
            var t = e;
            for (let e of Object.keys(n))
              ((e) => {
                let a = t[e];
                'string' == typeof a && (n[e] = a);
              })(e);
          })({ prefix: i }),
        a
          ? self.skipWaiting()
          : self.addEventListener('message', (e) => {
              e.data && 'SKIP_WAITING' === e.data.type && self.skipWaiting();
            }),
        c && self.addEventListener('activate', () => self.clients.claim()),
        e && e.length > 0 && this.addToPrecacheList(e),
        g.cleanupOutdatedCaches &&
          ((e) => {
            self.addEventListener('activate', (t) => {
              t.waitUntil(p(o(e)).then((e) => {}));
            });
          })(y.cacheName),
        this.registerRoute(new ef(this, w)),
        g.navigateFallback &&
          this.registerRoute(
            new er(this.createHandlerBoundToUrl(g.navigateFallback), {
              allowlist: g.navigateFallbackAllowlist,
              denylist: g.navigateFallbackDenylist,
            })
          ),
        void 0 !== h &&
          ('boolean' == typeof h ? h && el({ serwist: this }) : el({ ...h, serwist: this })),
        void 0 !== l)
      ) {
        if (void 0 !== d) {
          const e = new eh({ fallbackUrls: d.entries, serwist: this });
          l.forEach((t) => {
            t.handler instanceof Y &&
              !t.handler.plugins.some((e) => 'handlerDidError' in e) &&
              t.handler.plugins.push(e);
          });
        }
        for (const e of l) this.registerCapture(e.matcher, e.handler, e.method);
      }
      u && (self.__WB_DISABLE_DEV_LOGS = !0);
    }
    get precacheStrategy() {
      return this._precacheStrategy;
    }
    get routes() {
      return this._routes;
    }
    addEventListeners() {
      (self.addEventListener('install', this.handleInstall),
        self.addEventListener('activate', this.handleActivate),
        self.addEventListener('fetch', this.handleFetch),
        self.addEventListener('message', this.handleCache));
    }
    addToPrecacheList(e) {
      let t = [];
      for (let a of e) {
        'string' == typeof a
          ? t.push(a)
          : a && !a.integrity && void 0 === a.revision && t.push(a.url);
        let { cacheKey: e, url: r } = en(a),
          s = 'string' != typeof a && a.revision ? 'reload' : 'default';
        if (this._urlsToCacheKeys.has(r) && this._urlsToCacheKeys.get(r) !== e)
          throw new c('add-to-cache-list-conflicting-entries', {
            firstEntry: this._urlsToCacheKeys.get(r),
            secondEntry: e,
          });
        if ('string' != typeof a && a.integrity) {
          if (
            this._cacheKeysToIntegrities.has(e) &&
            this._cacheKeysToIntegrities.get(e) !== a.integrity
          )
            throw new c('add-to-cache-list-conflicting-integrities', { url: r });
          this._cacheKeysToIntegrities.set(e, a.integrity);
        }
        (this._urlsToCacheKeys.set(r, e), this._urlsToCacheModes.set(r, s));
      }
      t.length > 0 &&
        console.warn(`Serwist is precaching URLs without revision info: ${t.join(', ')}
This is generally NOT safe. Learn more at https://bit.ly/wb-precache`);
    }
    handleInstall(e) {
      return (
        this.registerRequestRules(e),
        g(e, async () => {
          let t = new ei();
          (this.precacheStrategy.plugins.push(t),
            await eo(
              this._concurrentPrecaching,
              Array.from(this._urlsToCacheKeys.entries()),
              async ([t, a]) => {
                let r = this._cacheKeysToIntegrities.get(a),
                  s = this._urlsToCacheModes.get(t),
                  n = new Request(t, { integrity: r, cache: s, credentials: 'same-origin' });
                await Promise.all(
                  this.precacheStrategy.handleAll({
                    event: e,
                    request: n,
                    url: new URL(n.url),
                    params: { cacheKey: a },
                  })
                );
              }
            ));
          let { updatedURLs: a, notUpdatedURLs: r } = t;
          return { updatedURLs: a, notUpdatedURLs: r };
        })
      );
    }
    async registerRequestRules(e) {
      if (this._requestRules && e?.addRoutes)
        try {
          (await e.addRoutes(this._requestRules), (this._requestRules = void 0));
        } catch (e) {
          throw e;
        }
    }
    handleActivate(e) {
      return g(e, async () => {
        let e = await self.caches.open(this.precacheStrategy.cacheName),
          t = await e.keys(),
          a = new Set(this._urlsToCacheKeys.values()),
          r = [];
        for (let s of t) a.has(s.url) || (await e.delete(s), r.push(s.url));
        return { deletedCacheRequests: r };
      });
    }
    handleFetch(e) {
      let { request: t } = e,
        a = this.handleRequest({ request: t, event: e });
      a && e.respondWith(a);
    }
    handleCache(e) {
      if (e.data && 'CACHE_URLS' === e.data.type) {
        let { payload: t } = e.data,
          a = Promise.all(
            t.urlsToCache.map((t) => {
              let a;
              return (
                (a = 'string' == typeof t ? new Request(t) : new Request(...t)),
                this.handleRequest({ request: a, event: e })
              );
            })
          );
        (e.waitUntil(a), e.ports?.[0] && a.then(() => e.ports[0].postMessage(!0)));
      }
    }
    setDefaultHandler(e, t = 'GET') {
      this._defaultHandlerMap.set(t, ee(e));
    }
    setCatchHandler(e) {
      this._catchHandler = ee(e);
    }
    registerCapture(e, t, a) {
      let r = ((e, t, a) => {
        if ('string' == typeof e) {
          let r = new URL(e, location.href);
          return new et(({ url: e }) => e.href === r.href, t, a);
        }
        if (e instanceof RegExp) return new es(e, t, a);
        if ('function' == typeof e) return new et(e, t, a);
        if (e instanceof et) return e;
        throw new c('unsupported-route-type', {
          moduleName: 'serwist',
          funcName: 'parseRoute',
          paramName: 'capture',
        });
      })(e, t, a);
      return (this.registerRoute(r), r);
    }
    registerRoute(e) {
      (this._routes.has(e.method) || this._routes.set(e.method, []),
        this._routes.get(e.method).push(e));
    }
    unregisterRoute(e) {
      if (!this._routes.has(e.method))
        throw new c('unregister-route-but-not-found-with-method', { method: e.method });
      let t = this._routes.get(e.method).indexOf(e);
      if (t > -1) this._routes.get(e.method).splice(t, 1);
      else throw new c('unregister-route-route-not-registered');
    }
    getUrlsToPrecacheKeys() {
      return this._urlsToCacheKeys;
    }
    getPrecachedUrls() {
      return [...this._urlsToCacheKeys.keys()];
    }
    getPrecacheKeyForUrl(e) {
      let t = new URL(e, location.href);
      return this._urlsToCacheKeys.get(t.href);
    }
    getIntegrityForPrecacheKey(e) {
      return this._cacheKeysToIntegrities.get(e);
    }
    async matchPrecache(e) {
      let t = e instanceof Request ? e.url : e,
        a = this.getPrecacheKeyForUrl(t);
      if (a) return (await self.caches.open(this.precacheStrategy.cacheName)).match(a);
    }
    createHandlerBoundToUrl(e) {
      let t = this.getPrecacheKeyForUrl(e);
      if (!t) throw new c('non-precached-url', { url: e });
      return (a) => (
        (a.request = new Request(e)),
        (a.params = { cacheKey: t, ...a.params }),
        this.precacheStrategy.handle(a)
      );
    }
    handleRequest({ request: e, event: t }) {
      let a,
        r = new URL(e.url, location.href);
      if (!r.protocol.startsWith('http')) return;
      let s = r.origin === location.origin,
        { params: n, route: i } = this.findMatchingRoute({
          event: t,
          request: e,
          sameOrigin: s,
          url: r,
        }),
        o = i?.handler,
        c = e.method;
      if ((!o && this._defaultHandlerMap.has(c) && (o = this._defaultHandlerMap.get(c)), !o))
        return;
      try {
        a = o.handle({ url: r, request: e, event: t, params: n });
      } catch (e) {
        a = Promise.reject(e);
      }
      let l = i?.catchHandler;
      return (
        a instanceof Promise &&
          (this._catchHandler || l) &&
          (a = a.catch(async (a) => {
            if (l)
              try {
                return await l.handle({ url: r, request: e, event: t, params: n });
              } catch (e) {
                e instanceof Error && (a = e);
              }
            if (this._catchHandler)
              return this._catchHandler.handle({ url: r, request: e, event: t });
            throw a;
          })),
        a
      );
    }
    findMatchingRoute({ url: e, sameOrigin: t, request: a, event: r }) {
      for (let s of this._routes.get(a.method) || []) {
        let n,
          i = s.match({ url: e, sameOrigin: t, request: a, event: r });
        if (i)
          return (
            (Array.isArray((n = i)) && 0 === n.length) ||
            (i.constructor === Object && 0 === Object.keys(i).length)
              ? (n = void 0)
              : 'boolean' == typeof i && (n = void 0),
            { route: s, params: n }
          );
      }
      return {};
    }
  })({
    precacheEntries: [
      {
        revision: 'ab473d5bcd6fc76bafc925ce42c5dbfb',
        url: '/_next/static/_7JmL9MX9ylApg2MdDnRB/_buildManifest.js',
      },
      {
        revision: 'b6652df95db52feb4daf4eca35380933',
        url: '/_next/static/_7JmL9MX9ylApg2MdDnRB/_ssgManifest.js',
      },
      { revision: null, url: '/_next/static/chunks/1446.2a26417c759e67b8.js' },
      { revision: null, url: '/_next/static/chunks/1904-e4afd61536e6704d.js' },
      { revision: null, url: '/_next/static/chunks/2530-ef9383b79d57617a.js' },
      { revision: null, url: '/_next/static/chunks/2787-29e224f837a58003.js' },
      { revision: null, url: '/_next/static/chunks/4216-06db333d3bb251a9.js' },
      { revision: null, url: '/_next/static/chunks/4669-280098109ec40323.js' },
      { revision: null, url: '/_next/static/chunks/5239-cf170481a015bf21.js' },
      { revision: null, url: '/_next/static/chunks/5909-a8aadd718ab55b84.js' },
      { revision: null, url: '/_next/static/chunks/6387.9a7bf416cbcd193d.js' },
      { revision: null, url: '/_next/static/chunks/6857-67618d87d8052b13.js' },
      { revision: null, url: '/_next/static/chunks/7046-62f712c210c5d948.js' },
      { revision: null, url: '/_next/static/chunks/7539-7f367ef858c3a7e4.js' },
      { revision: null, url: '/_next/static/chunks/75504863-fa3f8db03227748e.js' },
      { revision: null, url: '/_next/static/chunks/8660-b8a93ce559b5cfbd.js' },
      { revision: null, url: '/_next/static/chunks/8675-8cd5a2f9a0a5b48b.js' },
      { revision: null, url: '/_next/static/chunks/87c73c54-6dc57a387011e0eb.js' },
      { revision: null, url: '/_next/static/chunks/9303-ab8d4f95a7fc342f.js' },
      { revision: null, url: '/_next/static/chunks/9341-1d658efad031c330.js' },
      { revision: null, url: '/_next/static/chunks/9603-07873efb77b9c0b5.js' },
      {
        revision: null,
        url: '/_next/static/chunks/app/(auth)/forgot-password/page-1b4152eed2173ca4.js',
      },
      { revision: null, url: '/_next/static/chunks/app/(auth)/login/page-0a72213be7ad5022.js' },
      { revision: null, url: '/_next/static/chunks/app/(auth)/register/page-6ebef1cee0c49eac.js' },
      {
        revision: null,
        url: '/_next/static/chunks/app/(auth)/reset-password/page-4374fcced43bbe28.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/analytics/page-bec60f484f92b272.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/budgets/page-e114bc29ce4a44a6.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/dashboard/page-b0b8c67584c7d4a9.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/expenses/page-9fa1ad3ee761ba40.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/friends/page-8c43bb7db618109a.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/groups/page-fe1e7f6ff700ceea.js',
      },
      { revision: null, url: '/_next/static/chunks/app/(dashboard)/layout-12a7e644f61c7a70.js' },
      { revision: null, url: '/_next/static/chunks/app/(dashboard)/page-cfc3002f7da43120.js' },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/subscriptions/page-5297a181feafd87b.js',
      },
      { revision: null, url: '/_next/static/chunks/app/_global-error/page-f5fd378c559a4139.js' },
      { revision: null, url: '/_next/static/chunks/app/_not-found/page-6d57028e5204e365.js' },
      { revision: null, url: '/_next/static/chunks/app/auth/callback/page-844e9d6ffa91ae1c.js' },
      { revision: null, url: '/_next/static/chunks/app/layout-7b126f1274e53917.js' },
      {
        revision: null,
        url: '/_next/static/chunks/app/manifest.webmanifest/route-f5fd378c559a4139.js',
      },
      { revision: null, url: '/_next/static/chunks/app/offline/page-13bf75d1cc3e8a75.js' },
      { revision: null, url: '/_next/static/chunks/app/onboarding/page-2f1fc8b587de0db5.js' },
      { revision: null, url: '/_next/static/chunks/app/settings/page-458ebc7b341a8ae2.js' },
      { revision: null, url: '/_next/static/chunks/framework-7bb6ccfe56e756bc.js' },
      { revision: null, url: '/_next/static/chunks/main-30b4b1417db77204.js' },
      { revision: null, url: '/_next/static/chunks/main-app-bd599680c3c83da0.js' },
      {
        revision: null,
        url: '/_next/static/chunks/next/dist/client/components/builtin/app-error-f5fd378c559a4139.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/next/dist/client/components/builtin/forbidden-f5fd378c559a4139.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/next/dist/client/components/builtin/global-error-7b2fd0a755e5d72b.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/next/dist/client/components/builtin/not-found-f5fd378c559a4139.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/next/dist/client/components/builtin/unauthorized-f5fd378c559a4139.js',
      },
      {
        revision: '846118c33b2c0e922d7b3a7676f81f6f',
        url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
      },
      { revision: null, url: '/_next/static/chunks/webpack-3683af9c0e0b1237.js' },
      { revision: null, url: '/_next/static/css/8a7a9c5f458446c1.css' },
      { revision: null, url: '/_next/static/css/c0dcd5e08f68f963.css' },
      {
        revision: '52d04440a9faae0db9adc6cdc844099b',
        url: '/_next/static/media/636a5ac981f94f8b-s.p.woff2',
      },
      {
        revision: '2591db816b61d44b6e87ba79d13622b2',
        url: '/_next/static/media/6fe53d21e6e7ebd8-s.woff2',
      },
      {
        revision: '196acbb650c75807ea2f0ef36edbd186',
        url: '/_next/static/media/8ebc6e9dde468c4a-s.woff2',
      },
      {
        revision: '5ffe46eeb00dd9fa8a70cb10ccc3817e',
        url: '/_next/static/media/9e7b0a821b9dfcb4-s.woff2',
      },
      { revision: 'd09f95206c3fa0bb9bd9fefabfd0ea71', url: '/file.svg' },
      { revision: '2aaafa6a49b6563925fe440891e32717', url: '/globe.svg' },
      { revision: '18c8fa4b0d09cb455fabb930c43e85a0', url: '/icons\\icon-192.png' },
      { revision: '18c8fa4b0d09cb455fabb930c43e85a0', url: '/icons\\icon-512.png' },
      { revision: '8e061864f388b47f33a1c3780831193e', url: '/next.svg' },
      { revision: 'c0af2f507b369b085b35ef4bbe3bcf1e', url: '/vercel.svg' },
      { revision: 'a2760511c65806022ad20adf74370ff3', url: '/window.svg' },
    ],
    precacheOptions: { cleanupOutdatedCaches: !0 },
    runtimeCaching: [
      {
        matcher: ({ request: e }) =>
          'style' === e.destination ||
          'script' === e.destination ||
          'font' === e.destination ||
          e.url.endsWith('.svg') ||
          e.url.endsWith('.png') ||
          e.url.endsWith('.ico'),
        handler: new ed({ cacheName: 'static-assets' }),
      },
      {
        matcher: ({ request: e }) => 'image' === e.destination,
        handler: new eu({ cacheName: 'images' }),
      },
      {
        matcher: ({ request: e, url: t }) => t.pathname.startsWith('/api/') && 'GET' === e.method,
        handler: new X({ cacheName: 'api-get-cache' }),
      },
      {
        matcher: ({ request: e }) => 'navigate' === e.mode,
        handler: new X({ cacheName: 'pages' }),
      },
    ],
    fallbacks: {
      entries: [{ url: '/offline', matcher: ({ request: e }) => 'navigate' === e.mode }],
    },
  }).addEventListeners(),
    self.addEventListener('push', (e) => {
      let t;
      if (!e.data) return;
      try {
        t = e.data.json();
      } catch (e) {
        (console.error('Failed to parse push event data as JSON:', e),
          (t = {
            title: 'New Notification',
            body: 'You have a new update in Expensio.',
            url: '/',
          }));
      }
      let a = {
        body: t.body || 'You have a new update.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        data: { url: t.url || '/' },
      };
      e.waitUntil(self.registration.showNotification(t.title || 'Expensio', a));
    }),
    self.addEventListener('notificationclick', (e) => {
      e.notification.close();
      let t = new URL(e.notification.data.url, self.location.origin).href;
      e.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: !0 }).then((e) => {
          for (let a = 0; a < e.length; a++) {
            let r = e[a];
            if (r.url === t && 'focus' in r) return r.focus();
          }
          if (self.clients.openWindow) return self.clients.openWindow(t);
        })
      );
    }));
})();
