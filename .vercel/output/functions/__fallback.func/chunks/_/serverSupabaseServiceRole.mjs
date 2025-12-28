import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { s as setCookie, u as useRuntimeConfig, h as getHeader } from '../nitro/nitro.mjs';
import * as functionsJs from '@supabase/functions-js';
import * as postgrestJs from '@supabase/postgrest-js';
import * as realtimeJs from '@supabase/realtime-js';
import * as storageJs from '@supabase/storage-js';
import * as authJs from '@supabase/auth-js';

async function fetchWithRetry(req, init) {
  const retries = 3;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetch(req, init);
    } catch (error) {
      if (init?.signal?.aborted) {
        throw error;
      }
      if (attempt === retries) {
        console.error(`Error fetching request ${req}`, error, init);
        throw error;
      }
      console.warn(`Retrying fetch attempt ${attempt + 1} for request: ${req}`);
      await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
    }
  }
  throw new Error("Unreachable code");
}

function setCookies(event, cookies) {
  const response = event.node.res;
  const headersWritable = () => !response.headersSent && !response.writableEnded;
  if (!headersWritable()) {
    return;
  }
  for (const { name, value, options } of cookies) {
    if (!headersWritable()) {
      break;
    }
    setCookie(event, name, value, options);
  }
}

const serverSupabaseClient = async (event) => {
  if (!event.context._supabaseClient) {
    const { url, key, cookiePrefix, cookieOptions, clientOptions: { auth = {}, global = {} } } = useRuntimeConfig(event).public.supabase;
    event.context._supabaseClient = createServerClient(url, key, {
      auth,
      cookies: {
        getAll: () => parseCookieHeader(getHeader(event, "Cookie") ?? ""),
        setAll: (cookies) => setCookies(event, cookies)
      },
      cookieOptions: {
        ...cookieOptions,
        name: cookiePrefix
      },
      global: {
        fetch: fetchWithRetry,
        ...global
      }
    });
  }
  return event.context._supabaseClient;
};

function getDefaultExportFromNamespaceIfNotNamed (n) {
	return n && Object.prototype.hasOwnProperty.call(n, 'default') && Object.keys(n).length === 1 ? n['default'] : n;
}

var main = {};

var SupabaseClient$1 = {};

const require$$3$1 = /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(functionsJs);

const require$$2 = /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(postgrestJs);

const require$$4 = /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(realtimeJs);

const require$$3 = /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(storageJs);

var constants = {};

var version = {};

Object.defineProperty(version, "__esModule", { value: true });
version.version = void 0;
// Generated automatically during releases by scripts/update-version-files.ts
// This file provides runtime access to the package version for:
// - HTTP request headers (e.g., X-Client-Info header for API requests)
// - Debugging and support (identifying which version is running)
// - Telemetry and logging (version reporting in errors/analytics)
// - Ensuring build artifacts match the published package version
version.version = '2.86.0';

(function (exports$1) {
	Object.defineProperty(exports$1, "__esModule", { value: true });
	exports$1.DEFAULT_REALTIME_OPTIONS = exports$1.DEFAULT_AUTH_OPTIONS = exports$1.DEFAULT_DB_OPTIONS = exports$1.DEFAULT_GLOBAL_OPTIONS = exports$1.DEFAULT_HEADERS = void 0;
	const version_1 = version;
	let JS_ENV = '';
	// @ts-ignore
	if (typeof Deno !== 'undefined') {
	    JS_ENV = 'deno';
	}
	else if (typeof document !== 'undefined') {
	    JS_ENV = 'web';
	}
	else if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
	    JS_ENV = 'react-native';
	}
	else {
	    JS_ENV = 'node';
	}
	exports$1.DEFAULT_HEADERS = { 'X-Client-Info': `supabase-js-${JS_ENV}/${version_1.version}` };
	exports$1.DEFAULT_GLOBAL_OPTIONS = {
	    headers: exports$1.DEFAULT_HEADERS,
	};
	exports$1.DEFAULT_DB_OPTIONS = {
	    schema: 'public',
	};
	exports$1.DEFAULT_AUTH_OPTIONS = {
	    autoRefreshToken: true,
	    persistSession: true,
	    detectSessionInUrl: true,
	    flowType: 'implicit',
	};
	exports$1.DEFAULT_REALTIME_OPTIONS = {};
	
} (constants));

var fetch$1 = {};

(function (exports$1) {
	Object.defineProperty(exports$1, "__esModule", { value: true });
	exports$1.fetchWithAuth = exports$1.resolveHeadersConstructor = exports$1.resolveFetch = void 0;
	const resolveFetch = (customFetch) => {
	    if (customFetch) {
	        return (...args) => customFetch(...args);
	    }
	    return (...args) => fetch(...args);
	};
	exports$1.resolveFetch = resolveFetch;
	const resolveHeadersConstructor = () => {
	    return Headers;
	};
	exports$1.resolveHeadersConstructor = resolveHeadersConstructor;
	const fetchWithAuth = (supabaseKey, getAccessToken, customFetch) => {
	    const fetch = (0, exports$1.resolveFetch)(customFetch);
	    const HeadersConstructor = (0, exports$1.resolveHeadersConstructor)();
	    return async (input, init) => {
	        var _a;
	        const accessToken = (_a = (await getAccessToken())) !== null && _a !== void 0 ? _a : supabaseKey;
	        let headers = new HeadersConstructor(init === null || init === void 0 ? void 0 : init.headers);
	        if (!headers.has('apikey')) {
	            headers.set('apikey', supabaseKey);
	        }
	        if (!headers.has('Authorization')) {
	            headers.set('Authorization', `Bearer ${accessToken}`);
	        }
	        return fetch(input, Object.assign(Object.assign({}, init), { headers }));
	    };
	};
	exports$1.fetchWithAuth = fetchWithAuth;
	
} (fetch$1));

var helpers = {};

Object.defineProperty(helpers, "__esModule", { value: true });
helpers.isBrowser = void 0;
helpers.uuid = uuid;
helpers.ensureTrailingSlash = ensureTrailingSlash;
helpers.applySettingDefaults = applySettingDefaults;
helpers.validateSupabaseUrl = validateSupabaseUrl;
function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0, v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
function ensureTrailingSlash(url) {
    return url.endsWith('/') ? url : url + '/';
}
const isBrowser = () => "undefined" !== 'undefined';
helpers.isBrowser = isBrowser;
function applySettingDefaults(options, defaults) {
    var _a, _b;
    const { db: dbOptions, auth: authOptions, realtime: realtimeOptions, global: globalOptions, } = options;
    const { db: DEFAULT_DB_OPTIONS, auth: DEFAULT_AUTH_OPTIONS, realtime: DEFAULT_REALTIME_OPTIONS, global: DEFAULT_GLOBAL_OPTIONS, } = defaults;
    const result = {
        db: Object.assign(Object.assign({}, DEFAULT_DB_OPTIONS), dbOptions),
        auth: Object.assign(Object.assign({}, DEFAULT_AUTH_OPTIONS), authOptions),
        realtime: Object.assign(Object.assign({}, DEFAULT_REALTIME_OPTIONS), realtimeOptions),
        storage: {},
        global: Object.assign(Object.assign(Object.assign({}, DEFAULT_GLOBAL_OPTIONS), globalOptions), { headers: Object.assign(Object.assign({}, ((_a = DEFAULT_GLOBAL_OPTIONS === null || DEFAULT_GLOBAL_OPTIONS === void 0 ? void 0 : DEFAULT_GLOBAL_OPTIONS.headers) !== null && _a !== void 0 ? _a : {})), ((_b = globalOptions === null || globalOptions === void 0 ? void 0 : globalOptions.headers) !== null && _b !== void 0 ? _b : {})) }),
        accessToken: async () => '',
    };
    if (options.accessToken) {
        result.accessToken = options.accessToken;
    }
    else {
        // hack around Required<>
        delete result.accessToken;
    }
    return result;
}
/**
 * Validates a Supabase client URL
 *
 * @param {string} supabaseUrl - The Supabase client URL string.
 * @returns {URL} - The validated base URL.
 * @throws {Error}
 */
function validateSupabaseUrl(supabaseUrl) {
    const trimmedUrl = supabaseUrl === null || supabaseUrl === void 0 ? void 0 : supabaseUrl.trim();
    if (!trimmedUrl) {
        throw new Error('supabaseUrl is required.');
    }
    if (!trimmedUrl.match(/^https?:\/\//i)) {
        throw new Error('Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.');
    }
    try {
        return new URL(ensureTrailingSlash(trimmedUrl));
    }
    catch (_a) {
        throw Error('Invalid supabaseUrl: Provided URL is malformed.');
    }
}

var SupabaseAuthClient$1 = {};

const require$$1 = /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(authJs);

Object.defineProperty(SupabaseAuthClient$1, "__esModule", { value: true });
SupabaseAuthClient$1.SupabaseAuthClient = void 0;
const auth_js_1 = require$$1;
class SupabaseAuthClient extends auth_js_1.AuthClient {
    constructor(options) {
        super(options);
    }
}
SupabaseAuthClient$1.SupabaseAuthClient = SupabaseAuthClient;

Object.defineProperty(SupabaseClient$1, "__esModule", { value: true });
const functions_js_1 = require$$3$1;
const postgrest_js_1 = require$$2;
const realtime_js_1 = require$$4;
const storage_js_1 = require$$3;
const constants_1 = constants;
const fetch_1 = fetch$1;
const helpers_1 = helpers;
const SupabaseAuthClient_1 = SupabaseAuthClient$1;
/**
 * Supabase Client.
 *
 * An isomorphic Javascript client for interacting with Postgres.
 */
class SupabaseClient {
    /**
     * Create a new client for use in the browser.
     * @param supabaseUrl The unique Supabase URL which is supplied when you create a new project in your project dashboard.
     * @param supabaseKey The unique Supabase Key which is supplied when you create a new project in your project dashboard.
     * @param options.db.schema You can switch in between schemas. The schema needs to be on the list of exposed schemas inside Supabase.
     * @param options.auth.autoRefreshToken Set to "true" if you want to automatically refresh the token before expiring.
     * @param options.auth.persistSession Set to "true" if you want to automatically save the user session into local storage.
     * @param options.auth.detectSessionInUrl Set to "true" if you want to automatically detects OAuth grants in the URL and signs in the user.
     * @param options.realtime Options passed along to realtime-js constructor.
     * @param options.storage Options passed along to the storage-js constructor.
     * @param options.global.fetch A custom fetch implementation.
     * @param options.global.headers Any additional headers to send with each network request.
     * @example
     * ```ts
     * import { createClient } from '@supabase/supabase-js'
     *
     * const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key')
     * const { data } = await supabase.from('profiles').select('*')
     * ```
     */
    constructor(supabaseUrl, supabaseKey, options) {
        var _a, _b, _c;
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        const baseUrl = (0, helpers_1.validateSupabaseUrl)(supabaseUrl);
        if (!supabaseKey)
            throw new Error('supabaseKey is required.');
        this.realtimeUrl = new URL('realtime/v1', baseUrl);
        this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace('http', 'ws');
        this.authUrl = new URL('auth/v1', baseUrl);
        this.storageUrl = new URL('storage/v1', baseUrl);
        this.functionsUrl = new URL('functions/v1', baseUrl);
        // default storage key uses the supabase project ref as a namespace
        const defaultStorageKey = `sb-${baseUrl.hostname.split('.')[0]}-auth-token`;
        const DEFAULTS = {
            db: constants_1.DEFAULT_DB_OPTIONS,
            realtime: constants_1.DEFAULT_REALTIME_OPTIONS,
            auth: Object.assign(Object.assign({}, constants_1.DEFAULT_AUTH_OPTIONS), { storageKey: defaultStorageKey }),
            global: constants_1.DEFAULT_GLOBAL_OPTIONS,
        };
        const settings = (0, helpers_1.applySettingDefaults)(options !== null && options !== void 0 ? options : {}, DEFAULTS);
        this.storageKey = (_a = settings.auth.storageKey) !== null && _a !== void 0 ? _a : '';
        this.headers = (_b = settings.global.headers) !== null && _b !== void 0 ? _b : {};
        if (!settings.accessToken) {
            this.auth = this._initSupabaseAuthClient((_c = settings.auth) !== null && _c !== void 0 ? _c : {}, this.headers, settings.global.fetch);
        }
        else {
            this.accessToken = settings.accessToken;
            this.auth = new Proxy({}, {
                get: (_, prop) => {
                    throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(prop)} is not possible`);
                },
            });
        }
        this.fetch = (0, fetch_1.fetchWithAuth)(supabaseKey, this._getAccessToken.bind(this), settings.global.fetch);
        this.realtime = this._initRealtimeClient(Object.assign({ headers: this.headers, accessToken: this._getAccessToken.bind(this) }, settings.realtime));
        if (this.accessToken) {
            // Start auth immediately to avoid race condition with channel subscriptions
            this.accessToken()
                .then((token) => this.realtime.setAuth(token))
                .catch((e) => console.warn('Failed to set initial Realtime auth token:', e));
        }
        this.rest = new postgrest_js_1.PostgrestClient(new URL('rest/v1', baseUrl).href, {
            headers: this.headers,
            schema: settings.db.schema,
            fetch: this.fetch,
        });
        this.storage = new storage_js_1.StorageClient(this.storageUrl.href, this.headers, this.fetch, options === null || options === void 0 ? void 0 : options.storage);
        if (!settings.accessToken) {
            this._listenForAuthEvents();
        }
    }
    /**
     * Supabase Functions allows you to deploy and invoke edge functions.
     */
    get functions() {
        return new functions_js_1.FunctionsClient(this.functionsUrl.href, {
            headers: this.headers,
            customFetch: this.fetch,
        });
    }
    /**
     * Perform a query on a table or a view.
     *
     * @param relation - The table or view name to query
     */
    from(relation) {
        return this.rest.from(relation);
    }
    // NOTE: signatures must be kept in sync with PostgrestClient.schema
    /**
     * Select a schema to query or perform an function (rpc) call.
     *
     * The schema needs to be on the list of exposed schemas inside Supabase.
     *
     * @param schema - The schema to query
     */
    schema(schema) {
        return this.rest.schema(schema);
    }
    // NOTE: signatures must be kept in sync with PostgrestClient.rpc
    /**
     * Perform a function call.
     *
     * @param fn - The function name to call
     * @param args - The arguments to pass to the function call
     * @param options - Named parameters
     * @param options.head - When set to `true`, `data` will not be returned.
     * Useful if you only need the count.
     * @param options.get - When set to `true`, the function will be called with
     * read-only access mode.
     * @param options.count - Count algorithm to use to count rows returned by the
     * function. Only applicable for [set-returning
     * functions](https://www.postgresql.org/docs/current/functions-srf.html).
     *
     * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
     * hood.
     *
     * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
     * statistics under the hood.
     *
     * `"estimated"`: Uses exact count for low numbers and planned count for high
     * numbers.
     */
    rpc(fn, args = {}, options = {
        head: false,
        get: false,
        count: undefined,
    }) {
        return this.rest.rpc(fn, args, options);
    }
    /**
     * Creates a Realtime channel with Broadcast, Presence, and Postgres Changes.
     *
     * @param {string} name - The name of the Realtime channel.
     * @param {Object} opts - The options to pass to the Realtime channel.
     *
     */
    channel(name, opts = { config: {} }) {
        return this.realtime.channel(name, opts);
    }
    /**
     * Returns all Realtime channels.
     */
    getChannels() {
        return this.realtime.getChannels();
    }
    /**
     * Unsubscribes and removes Realtime channel from Realtime client.
     *
     * @param {RealtimeChannel} channel - The name of the Realtime channel.
     *
     */
    removeChannel(channel) {
        return this.realtime.removeChannel(channel);
    }
    /**
     * Unsubscribes and removes all Realtime channels from Realtime client.
     */
    removeAllChannels() {
        return this.realtime.removeAllChannels();
    }
    async _getAccessToken() {
        var _a, _b;
        if (this.accessToken) {
            return await this.accessToken();
        }
        const { data } = await this.auth.getSession();
        return (_b = (_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token) !== null && _b !== void 0 ? _b : this.supabaseKey;
    }
    _initSupabaseAuthClient({ autoRefreshToken, persistSession, detectSessionInUrl, storage, userStorage, storageKey, flowType, lock, debug, throwOnError, }, headers, fetch) {
        const authHeaders = {
            Authorization: `Bearer ${this.supabaseKey}`,
            apikey: `${this.supabaseKey}`,
        };
        return new SupabaseAuthClient_1.SupabaseAuthClient({
            url: this.authUrl.href,
            headers: Object.assign(Object.assign({}, authHeaders), headers),
            storageKey: storageKey,
            autoRefreshToken,
            persistSession,
            detectSessionInUrl,
            storage,
            userStorage,
            flowType,
            lock,
            debug,
            throwOnError,
            fetch,
            // auth checks if there is a custom authorizaiton header using this flag
            // so it knows whether to return an error when getUser is called with no session
            hasCustomAuthorizationHeader: Object.keys(this.headers).some((key) => key.toLowerCase() === 'authorization'),
        });
    }
    _initRealtimeClient(options) {
        return new realtime_js_1.RealtimeClient(this.realtimeUrl.href, Object.assign(Object.assign({}, options), { params: Object.assign({ apikey: this.supabaseKey }, options === null || options === void 0 ? void 0 : options.params) }));
    }
    _listenForAuthEvents() {
        const data = this.auth.onAuthStateChange((event, session) => {
            this._handleTokenChanged(event, 'CLIENT', session === null || session === void 0 ? void 0 : session.access_token);
        });
        return data;
    }
    _handleTokenChanged(event, source, token) {
        if ((event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') &&
            this.changedAccessToken !== token) {
            this.changedAccessToken = token;
            this.realtime.setAuth(token);
        }
        else if (event === 'SIGNED_OUT') {
            this.realtime.setAuth();
            if (source == 'STORAGE')
                this.auth.signOut();
            this.changedAccessToken = undefined;
        }
    }
}
SupabaseClient$1.default = SupabaseClient;

(function (exports$1) {
	var __createBinding = (main && main.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __exportStar = (main && main.__exportStar) || function(m, exports$1) {
	    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$1, p)) __createBinding(exports$1, m, p);
	};
	var __importDefault = (main && main.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(exports$1, "__esModule", { value: true });
	exports$1.createClient = exports$1.SupabaseClient = exports$1.FunctionRegion = exports$1.FunctionsError = exports$1.FunctionsRelayError = exports$1.FunctionsFetchError = exports$1.FunctionsHttpError = exports$1.PostgrestError = void 0;
	const SupabaseClient_1 = __importDefault(SupabaseClient$1);
	__exportStar(require$$1, exports$1);
	var postgrest_js_1 = require$$2;
	Object.defineProperty(exports$1, "PostgrestError", { enumerable: true, get: function () { return postgrest_js_1.PostgrestError; } });
	var functions_js_1 = require$$3$1;
	Object.defineProperty(exports$1, "FunctionsHttpError", { enumerable: true, get: function () { return functions_js_1.FunctionsHttpError; } });
	Object.defineProperty(exports$1, "FunctionsFetchError", { enumerable: true, get: function () { return functions_js_1.FunctionsFetchError; } });
	Object.defineProperty(exports$1, "FunctionsRelayError", { enumerable: true, get: function () { return functions_js_1.FunctionsRelayError; } });
	Object.defineProperty(exports$1, "FunctionsError", { enumerable: true, get: function () { return functions_js_1.FunctionsError; } });
	Object.defineProperty(exports$1, "FunctionRegion", { enumerable: true, get: function () { return functions_js_1.FunctionRegion; } });
	__exportStar(require$$4, exports$1);
	var SupabaseClient_2 = SupabaseClient$1;
	Object.defineProperty(exports$1, "SupabaseClient", { enumerable: true, get: function () { return __importDefault(SupabaseClient_2).default; } });
	/**
	 * Creates a new Supabase Client.
	 *
	 * @example
	 * ```ts
	 * import { createClient } from '@supabase/supabase-js'
	 *
	 * const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key')
	 * const { data, error } = await supabase.from('profiles').select('*')
	 * ```
	 */
	const createClient = (supabaseUrl, supabaseKey, options) => {
	    return new SupabaseClient_1.default(supabaseUrl, supabaseKey, options);
	};
	exports$1.createClient = createClient;
	// Check for Node.js <= 18 deprecation
	function shouldShowDeprecationWarning() {
	    // Skip if process is not available (e.g., Edge Runtime)
	    if (typeof process === 'undefined') {
	        return false;
	    }
	    // Use dynamic property access to avoid Next.js Edge Runtime static analysis warnings
	    const processVersion = process['version'];
	    if (processVersion === undefined || processVersion === null) {
	        return false;
	    }
	    const versionMatch = processVersion.match(/^v(\d+)\./);
	    if (!versionMatch) {
	        return false;
	    }
	    const majorVersion = parseInt(versionMatch[1], 10);
	    return majorVersion <= 18;
	}
	if (shouldShowDeprecationWarning()) {
	    console.warn(`⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. ` +
	        `Please upgrade to Node.js 20 or later. ` +
	        `For more information, visit: https://github.com/orgs/supabase/discussions/37217`);
	}
	
} (main));

const serverSupabaseServiceRole = (event) => {
  const config = useRuntimeConfig(event);
  const secretKey = config.supabase.secretKey;
  const serviceKey = config.supabase.serviceKey;
  const url = config.public.supabase.url;
  const serverKey = secretKey || serviceKey;
  if (!serverKey) {
    throw new Error("Missing server key. Set either `SUPABASE_SECRET_KEY` (recommended) or `SUPABASE_SERVICE_KEY` (deprecated) in your environment variables.");
  }
  if (!event.context._supabaseServiceRole) {
    event.context._supabaseServiceRole = main.createClient(url, serverKey, {
      auth: {
        detectSessionInUrl: false,
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        fetch: fetchWithRetry
      }
    });
  }
  return event.context._supabaseServiceRole;
};

export { serverSupabaseClient as a, serverSupabaseServiceRole as s };
//# sourceMappingURL=serverSupabaseServiceRole.mjs.map
