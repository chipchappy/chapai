
import {Buffer} from "node:buffer";
globalThis.Buffer = Buffer;

import {AsyncLocalStorage} from "node:async_hooks";
globalThis.AsyncLocalStorage = AsyncLocalStorage;


const defaultDefineProperty = Object.defineProperty;
Object.defineProperty = function(o, p, a) {
  if(p=== '__import_unsupported' && Boolean(globalThis.__import_unsupported)) {
    return;
  }
  return defaultDefineProperty(o, p, a);
};

  
  
  globalThis.openNextDebug = false;globalThis.openNextVersion = "3.9.16";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../../node_modules/@opennextjs/aws/dist/utils/error.js
function isOpenNextError(e) {
  try {
    return "__openNextInternal" in e;
  } catch {
    return false;
  }
}
var init_error = __esm({
  "../../node_modules/@opennextjs/aws/dist/utils/error.js"() {
  }
});

// ../../node_modules/@opennextjs/aws/dist/adapters/logger.js
function debug(...args) {
  if (globalThis.openNextDebug) {
    console.log(...args);
  }
}
function warn(...args) {
  console.warn(...args);
}
function error(...args) {
  if (args.some((arg) => isDownplayedErrorLog(arg))) {
    return debug(...args);
  }
  if (args.some((arg) => isOpenNextError(arg))) {
    const error2 = args.find((arg) => isOpenNextError(arg));
    if (error2.logLevel < getOpenNextErrorLogLevel()) {
      return;
    }
    if (error2.logLevel === 0) {
      return console.log(...args.map((arg) => isOpenNextError(arg) ? `${arg.name}: ${arg.message}` : arg));
    }
    if (error2.logLevel === 1) {
      return warn(...args.map((arg) => isOpenNextError(arg) ? `${arg.name}: ${arg.message}` : arg));
    }
    return console.error(...args);
  }
  console.error(...args);
}
function getOpenNextErrorLogLevel() {
  const strLevel = process.env.OPEN_NEXT_ERROR_LOG_LEVEL ?? "1";
  switch (strLevel.toLowerCase()) {
    case "debug":
    case "0":
      return 0;
    case "error":
    case "2":
      return 2;
    default:
      return 1;
  }
}
var DOWNPLAYED_ERROR_LOGS, isDownplayedErrorLog;
var init_logger = __esm({
  "../../node_modules/@opennextjs/aws/dist/adapters/logger.js"() {
    init_error();
    DOWNPLAYED_ERROR_LOGS = [
      {
        clientName: "S3Client",
        commandName: "GetObjectCommand",
        errorName: "NoSuchKey"
      }
    ];
    isDownplayedErrorLog = (errorLog) => DOWNPLAYED_ERROR_LOGS.some((downplayedInput) => downplayedInput.clientName === errorLog?.clientName && downplayedInput.commandName === errorLog?.commandName && (downplayedInput.errorName === errorLog?.error?.name || downplayedInput.errorName === errorLog?.error?.Code));
  }
});

// ../../node_modules/@opennextjs/aws/node_modules/cookie/dist/index.js
var require_dist = __commonJS({
  "../../node_modules/@opennextjs/aws/node_modules/cookie/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseCookie = parseCookie;
    exports.parse = parseCookie;
    exports.stringifyCookie = stringifyCookie;
    exports.stringifySetCookie = stringifySetCookie;
    exports.serialize = stringifySetCookie;
    exports.parseSetCookie = parseSetCookie;
    exports.stringifySetCookie = stringifySetCookie;
    exports.serialize = stringifySetCookie;
    var cookieNameRegExp = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/;
    var cookieValueRegExp = /^[\u0021-\u003A\u003C-\u007E]*$/;
    var domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
    var pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
    var maxAgeRegExp = /^-?\d+$/;
    var __toString = Object.prototype.toString;
    var NullObject = /* @__PURE__ */ (() => {
      const C = function() {
      };
      C.prototype = /* @__PURE__ */ Object.create(null);
      return C;
    })();
    function parseCookie(str, options) {
      const obj = new NullObject();
      const len = str.length;
      if (len < 2)
        return obj;
      const dec = options?.decode || decode;
      let index = 0;
      do {
        const eqIdx = eqIndex(str, index, len);
        if (eqIdx === -1)
          break;
        const endIdx = endIndex(str, index, len);
        if (eqIdx > endIdx) {
          index = str.lastIndexOf(";", eqIdx - 1) + 1;
          continue;
        }
        const key = valueSlice(str, index, eqIdx);
        if (obj[key] === void 0) {
          obj[key] = dec(valueSlice(str, eqIdx + 1, endIdx));
        }
        index = endIdx + 1;
      } while (index < len);
      return obj;
    }
    function stringifyCookie(cookie, options) {
      const enc = options?.encode || encodeURIComponent;
      const cookieStrings = [];
      for (const name of Object.keys(cookie)) {
        const val = cookie[name];
        if (val === void 0)
          continue;
        if (!cookieNameRegExp.test(name)) {
          throw new TypeError(`cookie name is invalid: ${name}`);
        }
        const value = enc(val);
        if (!cookieValueRegExp.test(value)) {
          throw new TypeError(`cookie val is invalid: ${val}`);
        }
        cookieStrings.push(`${name}=${value}`);
      }
      return cookieStrings.join("; ");
    }
    function stringifySetCookie(_name, _val, _opts) {
      const cookie = typeof _name === "object" ? _name : { ..._opts, name: _name, value: String(_val) };
      const options = typeof _val === "object" ? _val : _opts;
      const enc = options?.encode || encodeURIComponent;
      if (!cookieNameRegExp.test(cookie.name)) {
        throw new TypeError(`argument name is invalid: ${cookie.name}`);
      }
      const value = cookie.value ? enc(cookie.value) : "";
      if (!cookieValueRegExp.test(value)) {
        throw new TypeError(`argument val is invalid: ${cookie.value}`);
      }
      let str = cookie.name + "=" + value;
      if (cookie.maxAge !== void 0) {
        if (!Number.isInteger(cookie.maxAge)) {
          throw new TypeError(`option maxAge is invalid: ${cookie.maxAge}`);
        }
        str += "; Max-Age=" + cookie.maxAge;
      }
      if (cookie.domain) {
        if (!domainValueRegExp.test(cookie.domain)) {
          throw new TypeError(`option domain is invalid: ${cookie.domain}`);
        }
        str += "; Domain=" + cookie.domain;
      }
      if (cookie.path) {
        if (!pathValueRegExp.test(cookie.path)) {
          throw new TypeError(`option path is invalid: ${cookie.path}`);
        }
        str += "; Path=" + cookie.path;
      }
      if (cookie.expires) {
        if (!isDate(cookie.expires) || !Number.isFinite(cookie.expires.valueOf())) {
          throw new TypeError(`option expires is invalid: ${cookie.expires}`);
        }
        str += "; Expires=" + cookie.expires.toUTCString();
      }
      if (cookie.httpOnly) {
        str += "; HttpOnly";
      }
      if (cookie.secure) {
        str += "; Secure";
      }
      if (cookie.partitioned) {
        str += "; Partitioned";
      }
      if (cookie.priority) {
        const priority = typeof cookie.priority === "string" ? cookie.priority.toLowerCase() : void 0;
        switch (priority) {
          case "low":
            str += "; Priority=Low";
            break;
          case "medium":
            str += "; Priority=Medium";
            break;
          case "high":
            str += "; Priority=High";
            break;
          default:
            throw new TypeError(`option priority is invalid: ${cookie.priority}`);
        }
      }
      if (cookie.sameSite) {
        const sameSite = typeof cookie.sameSite === "string" ? cookie.sameSite.toLowerCase() : cookie.sameSite;
        switch (sameSite) {
          case true:
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError(`option sameSite is invalid: ${cookie.sameSite}`);
        }
      }
      return str;
    }
    function parseSetCookie(str, options) {
      const dec = options?.decode || decode;
      const len = str.length;
      const endIdx = endIndex(str, 0, len);
      const eqIdx = eqIndex(str, 0, endIdx);
      const setCookie = eqIdx === -1 ? { name: "", value: dec(valueSlice(str, 0, endIdx)) } : {
        name: valueSlice(str, 0, eqIdx),
        value: dec(valueSlice(str, eqIdx + 1, endIdx))
      };
      let index = endIdx + 1;
      while (index < len) {
        const endIdx2 = endIndex(str, index, len);
        const eqIdx2 = eqIndex(str, index, endIdx2);
        const attr = eqIdx2 === -1 ? valueSlice(str, index, endIdx2) : valueSlice(str, index, eqIdx2);
        const val = eqIdx2 === -1 ? void 0 : valueSlice(str, eqIdx2 + 1, endIdx2);
        switch (attr.toLowerCase()) {
          case "httponly":
            setCookie.httpOnly = true;
            break;
          case "secure":
            setCookie.secure = true;
            break;
          case "partitioned":
            setCookie.partitioned = true;
            break;
          case "domain":
            setCookie.domain = val;
            break;
          case "path":
            setCookie.path = val;
            break;
          case "max-age":
            if (val && maxAgeRegExp.test(val))
              setCookie.maxAge = Number(val);
            break;
          case "expires":
            if (!val)
              break;
            const date = new Date(val);
            if (Number.isFinite(date.valueOf()))
              setCookie.expires = date;
            break;
          case "priority":
            if (!val)
              break;
            const priority = val.toLowerCase();
            if (priority === "low" || priority === "medium" || priority === "high") {
              setCookie.priority = priority;
            }
            break;
          case "samesite":
            if (!val)
              break;
            const sameSite = val.toLowerCase();
            if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") {
              setCookie.sameSite = sameSite;
            }
            break;
        }
        index = endIdx2 + 1;
      }
      return setCookie;
    }
    function endIndex(str, min, len) {
      const index = str.indexOf(";", min);
      return index === -1 ? len : index;
    }
    function eqIndex(str, min, max) {
      const index = str.indexOf("=", min);
      return index < max ? index : -1;
    }
    function valueSlice(str, min, max) {
      let start = min;
      let end = max;
      do {
        const code = str.charCodeAt(start);
        if (code !== 32 && code !== 9)
          break;
      } while (++start < end);
      while (end > start) {
        const code = str.charCodeAt(end - 1);
        if (code !== 32 && code !== 9)
          break;
        end--;
      }
      return str.slice(start, end);
    }
    function decode(str) {
      if (str.indexOf("%") === -1)
        return str;
      try {
        return decodeURIComponent(str);
      } catch (e) {
        return str;
      }
    }
    function isDate(val) {
      return __toString.call(val) === "[object Date]";
    }
  }
});

// ../../node_modules/@opennextjs/aws/dist/http/util.js
function parseSetCookieHeader(cookies) {
  if (!cookies) {
    return [];
  }
  if (typeof cookies === "string") {
    return cookies.split(/(?<!Expires=\w+),/i).map((c) => c.trim());
  }
  return cookies;
}
function getQueryFromIterator(it) {
  const query = {};
  for (const [key, value] of it) {
    if (key in query) {
      if (Array.isArray(query[key])) {
        query[key].push(value);
      } else {
        query[key] = [query[key], value];
      }
    } else {
      query[key] = value;
    }
  }
  return query;
}
var init_util = __esm({
  "../../node_modules/@opennextjs/aws/dist/http/util.js"() {
    init_logger();
  }
});

// ../../node_modules/@opennextjs/aws/dist/overrides/converters/utils.js
function getQueryFromSearchParams(searchParams) {
  return getQueryFromIterator(searchParams.entries());
}
var init_utils = __esm({
  "../../node_modules/@opennextjs/aws/dist/overrides/converters/utils.js"() {
    init_util();
  }
});

// ../../node_modules/@opennextjs/aws/dist/overrides/converters/edge.js
var edge_exports = {};
__export(edge_exports, {
  default: () => edge_default
});
import { Buffer as Buffer2 } from "node:buffer";
var import_cookie, NULL_BODY_STATUSES, converter, edge_default;
var init_edge = __esm({
  "../../node_modules/@opennextjs/aws/dist/overrides/converters/edge.js"() {
    import_cookie = __toESM(require_dist(), 1);
    init_util();
    init_utils();
    NULL_BODY_STATUSES = /* @__PURE__ */ new Set([101, 103, 204, 205, 304]);
    converter = {
      convertFrom: async (event) => {
        const url = new URL(event.url);
        const searchParams = url.searchParams;
        const query = getQueryFromSearchParams(searchParams);
        const headers = {};
        event.headers.forEach((value, key) => {
          headers[key] = value;
        });
        const rawPath = url.pathname;
        const method = event.method;
        const shouldHaveBody = method !== "GET" && method !== "HEAD";
        const body = shouldHaveBody ? Buffer2.from(await event.arrayBuffer()) : void 0;
        const cookieHeader = event.headers.get("cookie");
        const cookies = cookieHeader ? import_cookie.default.parse(cookieHeader) : {};
        return {
          type: "core",
          method,
          rawPath,
          url: event.url,
          body,
          headers,
          remoteAddress: event.headers.get("x-forwarded-for") ?? "::1",
          query,
          cookies
        };
      },
      convertTo: async (result) => {
        if ("internalEvent" in result) {
          const request = new Request(result.internalEvent.url, {
            body: result.internalEvent.body,
            method: result.internalEvent.method,
            headers: {
              ...result.internalEvent.headers,
              "x-forwarded-host": result.internalEvent.headers.host
            }
          });
          if (globalThis.__dangerous_ON_edge_converter_returns_request === true) {
            return request;
          }
          const cfCache = (result.isISR || result.internalEvent.rawPath.startsWith("/_next/image")) && process.env.DISABLE_CACHE !== "true" ? { cacheEverything: true } : {};
          return fetch(request, {
            // This is a hack to make sure that the response is cached by Cloudflare
            // See https://developers.cloudflare.com/workers/examples/cache-using-fetch/#caching-html-resources
            // @ts-expect-error - This is a Cloudflare specific option
            cf: cfCache
          });
        }
        const headers = new Headers();
        for (const [key, value] of Object.entries(result.headers)) {
          if (key === "set-cookie" && typeof value === "string") {
            const cookies = parseSetCookieHeader(value);
            for (const cookie of cookies) {
              headers.append(key, cookie);
            }
            continue;
          }
          if (Array.isArray(value)) {
            for (const v of value) {
              headers.append(key, v);
            }
          } else {
            headers.set(key, value);
          }
        }
        const body = NULL_BODY_STATUSES.has(result.statusCode) ? null : result.body;
        return new Response(body, {
          status: result.statusCode,
          headers
        });
      },
      name: "edge"
    };
    edge_default = converter;
  }
});

// ../../node_modules/@opennextjs/aws/dist/overrides/wrappers/cloudflare-edge.js
var cloudflare_edge_exports = {};
__export(cloudflare_edge_exports, {
  default: () => cloudflare_edge_default
});
var cfPropNameMapping, handler, cloudflare_edge_default;
var init_cloudflare_edge = __esm({
  "../../node_modules/@opennextjs/aws/dist/overrides/wrappers/cloudflare-edge.js"() {
    cfPropNameMapping = {
      // The city name is percent-encoded.
      // See https://github.com/vercel/vercel/blob/4cb6143/packages/functions/src/headers.ts#L94C19-L94C37
      city: [encodeURIComponent, "x-open-next-city"],
      country: "x-open-next-country",
      regionCode: "x-open-next-region",
      latitude: "x-open-next-latitude",
      longitude: "x-open-next-longitude"
    };
    handler = async (handler3, converter2) => async (request, env, ctx) => {
      globalThis.process = process;
      for (const [key, value] of Object.entries(env)) {
        if (typeof value === "string") {
          process.env[key] = value;
        }
      }
      const internalEvent = await converter2.convertFrom(request);
      const cfProperties = request.cf;
      for (const [propName, mapping] of Object.entries(cfPropNameMapping)) {
        const propValue = cfProperties?.[propName];
        if (propValue != null) {
          const [encode, headerName] = Array.isArray(mapping) ? mapping : [null, mapping];
          internalEvent.headers[headerName] = encode ? encode(propValue) : propValue;
        }
      }
      const response = await handler3(internalEvent, {
        waitUntil: ctx.waitUntil.bind(ctx)
      });
      const result = await converter2.convertTo(response);
      return result;
    };
    cloudflare_edge_default = {
      wrapper: handler,
      name: "cloudflare-edge",
      supportStreaming: true,
      edgeRuntime: true
    };
  }
});

// ../../node_modules/@opennextjs/aws/dist/overrides/originResolver/pattern-env.js
var pattern_env_exports = {};
__export(pattern_env_exports, {
  default: () => pattern_env_default
});
function initializeOnce() {
  if (initialized)
    return;
  cachedOrigins = JSON.parse(process.env.OPEN_NEXT_ORIGIN ?? "{}");
  const functions = globalThis.openNextConfig.functions ?? {};
  for (const key in functions) {
    if (key !== "default") {
      const value = functions[key];
      const regexes = [];
      for (const pattern of value.patterns) {
        const regexPattern = `/${pattern.replace(/\*\*/g, "(.*)").replace(/\*/g, "([^/]*)").replace(/\//g, "\\/").replace(/\?/g, ".")}`;
        regexes.push(new RegExp(regexPattern));
      }
      cachedPatterns.push({
        key,
        patterns: value.patterns,
        regexes
      });
    }
  }
  initialized = true;
}
var cachedOrigins, cachedPatterns, initialized, envLoader, pattern_env_default;
var init_pattern_env = __esm({
  "../../node_modules/@opennextjs/aws/dist/overrides/originResolver/pattern-env.js"() {
    init_logger();
    cachedPatterns = [];
    initialized = false;
    envLoader = {
      name: "env",
      resolve: async (_path) => {
        try {
          initializeOnce();
          for (const { key, patterns, regexes } of cachedPatterns) {
            for (const regex of regexes) {
              if (regex.test(_path)) {
                debug("Using origin", key, patterns);
                return cachedOrigins[key];
              }
            }
          }
          if (_path.startsWith("/_next/image") && cachedOrigins.imageOptimizer) {
            debug("Using origin", "imageOptimizer", _path);
            return cachedOrigins.imageOptimizer;
          }
          if (cachedOrigins.default) {
            debug("Using default origin", cachedOrigins.default, _path);
            return cachedOrigins.default;
          }
          return false;
        } catch (e) {
          error("Error while resolving origin", e);
          return false;
        }
      }
    };
    pattern_env_default = envLoader;
  }
});

// ../../node_modules/@opennextjs/aws/dist/overrides/assetResolver/dummy.js
var dummy_exports = {};
__export(dummy_exports, {
  default: () => dummy_default
});
var resolver, dummy_default;
var init_dummy = __esm({
  "../../node_modules/@opennextjs/aws/dist/overrides/assetResolver/dummy.js"() {
    resolver = {
      name: "dummy"
    };
    dummy_default = resolver;
  }
});

// ../../node_modules/@opennextjs/aws/dist/utils/stream.js
import { ReadableStream as ReadableStream2 } from "node:stream/web";
function toReadableStream(value, isBase64) {
  return new ReadableStream2({
    pull(controller) {
      controller.enqueue(Buffer.from(value, isBase64 ? "base64" : "utf8"));
      controller.close();
    }
  }, { highWaterMark: 0 });
}
function emptyReadableStream() {
  if (process.env.OPEN_NEXT_FORCE_NON_EMPTY_RESPONSE === "true") {
    return new ReadableStream2({
      pull(controller) {
        maybeSomethingBuffer ??= Buffer.from("SOMETHING");
        controller.enqueue(maybeSomethingBuffer);
        controller.close();
      }
    }, { highWaterMark: 0 });
  }
  return new ReadableStream2({
    start(controller) {
      controller.close();
    }
  });
}
var maybeSomethingBuffer;
var init_stream = __esm({
  "../../node_modules/@opennextjs/aws/dist/utils/stream.js"() {
  }
});

// ../../node_modules/@opennextjs/aws/dist/overrides/proxyExternalRequest/fetch.js
var fetch_exports = {};
__export(fetch_exports, {
  default: () => fetch_default
});
var fetchProxy, fetch_default;
var init_fetch = __esm({
  "../../node_modules/@opennextjs/aws/dist/overrides/proxyExternalRequest/fetch.js"() {
    init_stream();
    fetchProxy = {
      name: "fetch-proxy",
      // @ts-ignore
      proxy: async (internalEvent) => {
        const { url, headers: eventHeaders, method, body } = internalEvent;
        const headers = Object.fromEntries(Object.entries(eventHeaders).filter(([key]) => key.toLowerCase() !== "cf-connecting-ip"));
        const response = await fetch(url, {
          method,
          headers,
          body
        });
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        return {
          type: "core",
          headers: responseHeaders,
          statusCode: response.status,
          isBase64Encoded: true,
          body: response.body ?? emptyReadableStream()
        };
      }
    };
    fetch_default = fetchProxy;
  }
});

// .next/server/edge-runtime-webpack.js
var require_edge_runtime_webpack = __commonJS({
  ".next/server/edge-runtime-webpack.js"() {
    "use strict";
    !function() {
      try {
        var a = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof globalThis ? globalThis : "undefined" != typeof self ? self : {}, b = new a.Error().stack;
        b && (a._sentryDebugIds = a._sentryDebugIds || {}, a._sentryDebugIds[b] = "5ec42333-77c7-4db0-9621-820f8bbfa967", a._sentryDebugIdIdentifier = "sentry-dbid-5ec42333-77c7-4db0-9621-820f8bbfa967");
      } catch (a2) {
      }
    }(), (() => {
      "use strict";
      var a = {}, b = {};
      function c(d) {
        var e = b[d];
        if (void 0 !== e) return e.exports;
        var f = b[d] = { exports: {} }, g = true;
        try {
          a[d](f, f.exports, c), g = false;
        } finally {
          g && delete b[d];
        }
        return f.exports;
      }
      c.m = a, c.amdO = {}, (() => {
        var a2 = [];
        c.O = (b2, d, e, f) => {
          if (d) {
            f = f || 0;
            for (var g = a2.length; g > 0 && a2[g - 1][2] > f; g--) a2[g] = a2[g - 1];
            a2[g] = [d, e, f];
            return;
          }
          for (var h = 1 / 0, g = 0; g < a2.length; g++) {
            for (var [d, e, f] = a2[g], i = true, j = 0; j < d.length; j++) (false & f || h >= f) && Object.keys(c.O).every((a3) => c.O[a3](d[j])) ? d.splice(j--, 1) : (i = false, f < h && (h = f));
            if (i) {
              a2.splice(g--, 1);
              var k = e();
              void 0 !== k && (b2 = k);
            }
          }
          return b2;
        };
      })(), c.n = (a2) => {
        var b2 = a2 && a2.__esModule ? () => a2.default : () => a2;
        return c.d(b2, { a: b2 }), b2;
      }, c.d = (a2, b2) => {
        for (var d in b2) c.o(b2, d) && !c.o(a2, d) && Object.defineProperty(a2, d, { enumerable: true, get: b2[d] });
      }, c.g = function() {
        if ("object" == typeof globalThis) return globalThis;
        try {
          return this || Function("return this")();
        } catch (a2) {
          if ("object" == typeof window) return window;
        }
      }(), c.o = (a2, b2) => Object.prototype.hasOwnProperty.call(a2, b2), c.r = (a2) => {
        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(a2, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(a2, "__esModule", { value: true });
      }, (() => {
        var a2 = { 149: 0 };
        c.O.j = (b3) => 0 === a2[b3];
        var b2 = (b3, d2) => {
          var e, f, [g, h, i] = d2, j = 0;
          if (g.some((b4) => 0 !== a2[b4])) {
            for (e in h) c.o(h, e) && (c.m[e] = h[e]);
            if (i) var k = i(c);
          }
          for (b3 && b3(d2); j < g.length; j++) f = g[j], c.o(a2, f) && a2[f] && a2[f][0](), a2[f] = 0;
          return c.O(k);
        }, d = self.webpackChunk_N_E = self.webpackChunk_N_E || [];
        d.forEach(b2.bind(null, 0)), d.push = b2.bind(null, d.push.bind(d));
      })();
    })();
  }
});

// node-built-in-modules:node:buffer
var node_buffer_exports = {};
import * as node_buffer_star from "node:buffer";
var init_node_buffer = __esm({
  "node-built-in-modules:node:buffer"() {
    __reExport(node_buffer_exports, node_buffer_star);
  }
});

// node-built-in-modules:node:async_hooks
var node_async_hooks_exports = {};
import * as node_async_hooks_star from "node:async_hooks";
var init_node_async_hooks = __esm({
  "node-built-in-modules:node:async_hooks"() {
    __reExport(node_async_hooks_exports, node_async_hooks_star);
  }
});

// .next/server/src/middleware.js
var require_middleware = __commonJS({
  ".next/server/src/middleware.js"() {
    "use strict";
    !function() {
      try {
        var a = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof globalThis ? globalThis : "undefined" != typeof self ? self : {}, b = new a.Error().stack;
        b && (a._sentryDebugIds = a._sentryDebugIds || {}, a._sentryDebugIds[b] = "0acee5cc-a33b-40e8-93cb-9c5ade963a3c", a._sentryDebugIdIdentifier = "sentry-dbid-0acee5cc-a33b-40e8-93cb-9c5ade963a3c");
      } catch (a2) {
      }
    }(), (self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([[550], { 101: (a, b, c) => {
      "use strict";
      Object.defineProperty(b, "__esModule", { value: true }), !function(a2, b2) {
        for (var c2 in b2) Object.defineProperty(a2, c2, { enumerable: true, get: b2[c2] });
      }(b, { interceptTestApis: function() {
        return f;
      }, wrapRequestHandler: function() {
        return g;
      } });
      let d = c(917), e = c(764);
      function f() {
        return (0, e.interceptFetch)(c.g.fetch);
      }
      function g(a2) {
        return (b2, c2) => (0, d.withRequest)(b2, e.reader, () => a2(b2, c2));
      }
    }, 148: (a, b, c) => {
      var d;
      (() => {
        var e = { 226: function(e2, f2) {
          !function(g2, h) {
            "use strict";
            var i = "function", j = "undefined", k = "object", l = "string", m = "major", n = "model", o = "name", p = "type", q = "vendor", r = "version", s = "architecture", t = "console", u = "mobile", v = "tablet", w = "smarttv", x = "wearable", y = "embedded", z = "Amazon", A = "Apple", B = "ASUS", C = "BlackBerry", D = "Browser", E = "Chrome", F = "Firefox", G = "Google", H = "Huawei", I = "Microsoft", J = "Motorola", K = "Opera", L = "Samsung", M = "Sharp", N = "Sony", O = "Xiaomi", P = "Zebra", Q = "Facebook", R = "Chromium OS", S = "Mac OS", T = function(a2, b2) {
              var c2 = {};
              for (var d2 in a2) b2[d2] && b2[d2].length % 2 == 0 ? c2[d2] = b2[d2].concat(a2[d2]) : c2[d2] = a2[d2];
              return c2;
            }, U = function(a2) {
              for (var b2 = {}, c2 = 0; c2 < a2.length; c2++) b2[a2[c2].toUpperCase()] = a2[c2];
              return b2;
            }, V = function(a2, b2) {
              return typeof a2 === l && -1 !== W(b2).indexOf(W(a2));
            }, W = function(a2) {
              return a2.toLowerCase();
            }, X = function(a2, b2) {
              if (typeof a2 === l) return a2 = a2.replace(/^\s\s*/, ""), typeof b2 === j ? a2 : a2.substring(0, 350);
            }, Y = function(a2, b2) {
              for (var c2, d2, e3, f3, g3, j2, l2 = 0; l2 < b2.length && !g3; ) {
                var m2 = b2[l2], n2 = b2[l2 + 1];
                for (c2 = d2 = 0; c2 < m2.length && !g3 && m2[c2]; ) if (g3 = m2[c2++].exec(a2)) for (e3 = 0; e3 < n2.length; e3++) j2 = g3[++d2], typeof (f3 = n2[e3]) === k && f3.length > 0 ? 2 === f3.length ? typeof f3[1] == i ? this[f3[0]] = f3[1].call(this, j2) : this[f3[0]] = f3[1] : 3 === f3.length ? typeof f3[1] !== i || f3[1].exec && f3[1].test ? this[f3[0]] = j2 ? j2.replace(f3[1], f3[2]) : void 0 : this[f3[0]] = j2 ? f3[1].call(this, j2, f3[2]) : void 0 : 4 === f3.length && (this[f3[0]] = j2 ? f3[3].call(this, j2.replace(f3[1], f3[2])) : h) : this[f3] = j2 || h;
                l2 += 2;
              }
            }, Z = function(a2, b2) {
              for (var c2 in b2) if (typeof b2[c2] === k && b2[c2].length > 0) {
                for (var d2 = 0; d2 < b2[c2].length; d2++) if (V(b2[c2][d2], a2)) return "?" === c2 ? h : c2;
              } else if (V(b2[c2], a2)) return "?" === c2 ? h : c2;
              return a2;
            }, $ = { ME: "4.90", "NT 3.11": "NT3.51", "NT 4.0": "NT4.0", 2e3: "NT 5.0", XP: ["NT 5.1", "NT 5.2"], Vista: "NT 6.0", 7: "NT 6.1", 8: "NT 6.2", 8.1: "NT 6.3", 10: ["NT 6.4", "NT 10.0"], RT: "ARM" }, _ = { browser: [[/\b(?:crmo|crios)\/([\w\.]+)/i], [r, [o, "Chrome"]], [/edg(?:e|ios|a)?\/([\w\.]+)/i], [r, [o, "Edge"]], [/(opera mini)\/([-\w\.]+)/i, /(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i, /(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i], [o, r], [/opios[\/ ]+([\w\.]+)/i], [r, [o, K + " Mini"]], [/\bopr\/([\w\.]+)/i], [r, [o, K]], [/(kindle)\/([\w\.]+)/i, /(lunascape|maxthon|netfront|jasmine|blazer)[\/ ]?([\w\.]*)/i, /(avant |iemobile|slim)(?:browser)?[\/ ]?([\w\.]*)/i, /(ba?idubrowser)[\/ ]?([\w\.]+)/i, /(?:ms|\()(ie) ([\w\.]+)/i, /(flock|rockmelt|midori|epiphany|silk|skyfire|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark|qupzilla|falkon|rekonq|puffin|brave|whale(?!.+naver)|qqbrowserlite|qq|duckduckgo)\/([-\w\.]+)/i, /(heytap|ovi)browser\/([\d\.]+)/i, /(weibo)__([\d\.]+)/i], [o, r], [/(?:\buc? ?browser|(?:juc.+)ucweb)[\/ ]?([\w\.]+)/i], [r, [o, "UC" + D]], [/microm.+\bqbcore\/([\w\.]+)/i, /\bqbcore\/([\w\.]+).+microm/i], [r, [o, "WeChat(Win) Desktop"]], [/micromessenger\/([\w\.]+)/i], [r, [o, "WeChat"]], [/konqueror\/([\w\.]+)/i], [r, [o, "Konqueror"]], [/trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i], [r, [o, "IE"]], [/ya(?:search)?browser\/([\w\.]+)/i], [r, [o, "Yandex"]], [/(avast|avg)\/([\w\.]+)/i], [[o, /(.+)/, "$1 Secure " + D], r], [/\bfocus\/([\w\.]+)/i], [r, [o, F + " Focus"]], [/\bopt\/([\w\.]+)/i], [r, [o, K + " Touch"]], [/coc_coc\w+\/([\w\.]+)/i], [r, [o, "Coc Coc"]], [/dolfin\/([\w\.]+)/i], [r, [o, "Dolphin"]], [/coast\/([\w\.]+)/i], [r, [o, K + " Coast"]], [/miuibrowser\/([\w\.]+)/i], [r, [o, "MIUI " + D]], [/fxios\/([-\w\.]+)/i], [r, [o, F]], [/\bqihu|(qi?ho?o?|360)browser/i], [[o, "360 " + D]], [/(oculus|samsung|sailfish|huawei)browser\/([\w\.]+)/i], [[o, /(.+)/, "$1 " + D], r], [/(comodo_dragon)\/([\w\.]+)/i], [[o, /_/g, " "], r], [/(electron)\/([\w\.]+) safari/i, /(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i, /m?(qqbrowser|baiduboxapp|2345Explorer)[\/ ]?([\w\.]+)/i], [o, r], [/(metasr)[\/ ]?([\w\.]+)/i, /(lbbrowser)/i, /\[(linkedin)app\]/i], [o], [/((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i], [[o, Q], r], [/(kakao(?:talk|story))[\/ ]([\w\.]+)/i, /(naver)\(.*?(\d+\.[\w\.]+).*\)/i, /safari (line)\/([\w\.]+)/i, /\b(line)\/([\w\.]+)\/iab/i, /(chromium|instagram)[\/ ]([-\w\.]+)/i], [o, r], [/\bgsa\/([\w\.]+) .*safari\//i], [r, [o, "GSA"]], [/musical_ly(?:.+app_?version\/|_)([\w\.]+)/i], [r, [o, "TikTok"]], [/headlesschrome(?:\/([\w\.]+)| )/i], [r, [o, E + " Headless"]], [/ wv\).+(chrome)\/([\w\.]+)/i], [[o, E + " WebView"], r], [/droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i], [r, [o, "Android " + D]], [/(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i], [o, r], [/version\/([\w\.\,]+) .*mobile\/\w+ (safari)/i], [r, [o, "Mobile Safari"]], [/version\/([\w(\.|\,)]+) .*(mobile ?safari|safari)/i], [r, o], [/webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i], [o, [r, Z, { "1.0": "/8", 1.2: "/1", 1.3: "/3", "2.0": "/412", "2.0.2": "/416", "2.0.3": "/417", "2.0.4": "/419", "?": "/" }]], [/(webkit|khtml)\/([\w\.]+)/i], [o, r], [/(navigator|netscape\d?)\/([-\w\.]+)/i], [[o, "Netscape"], r], [/mobile vr; rv:([\w\.]+)\).+firefox/i], [r, [o, F + " Reality"]], [/ekiohf.+(flow)\/([\w\.]+)/i, /(swiftfox)/i, /(icedragon|iceweasel|camino|chimera|fennec|maemo browser|minimo|conkeror|klar)[\/ ]?([\w\.\+]+)/i, /(seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([-\w\.]+)$/i, /(firefox)\/([\w\.]+)/i, /(mozilla)\/([\w\.]+) .+rv\:.+gecko\/\d+/i, /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir|obigo|mosaic|(?:go|ice|up)[\. ]?browser)[-\/ ]?v?([\w\.]+)/i, /(links) \(([\w\.]+)/i, /panasonic;(viera)/i], [o, r], [/(cobalt)\/([\w\.]+)/i], [o, [r, /master.|lts./, ""]]], cpu: [[/(?:(amd|x(?:(?:86|64)[-_])?|wow|win)64)[;\)]/i], [[s, "amd64"]], [/(ia32(?=;))/i], [[s, W]], [/((?:i[346]|x)86)[;\)]/i], [[s, "ia32"]], [/\b(aarch64|arm(v?8e?l?|_?64))\b/i], [[s, "arm64"]], [/\b(arm(?:v[67])?ht?n?[fl]p?)\b/i], [[s, "armhf"]], [/windows (ce|mobile); ppc;/i], [[s, "arm"]], [/((?:ppc|powerpc)(?:64)?)(?: mac|;|\))/i], [[s, /ower/, "", W]], [/(sun4\w)[;\)]/i], [[s, "sparc"]], [/((?:avr32|ia64(?=;))|68k(?=\))|\barm(?=v(?:[1-7]|[5-7]1)l?|;|eabi)|(?=atmel )avr|(?:irix|mips|sparc)(?:64)?\b|pa-risc)/i], [[s, W]]], device: [[/\b(sch-i[89]0\d|shw-m380s|sm-[ptx]\w{2,4}|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)/i], [n, [q, L], [p, v]], [/\b((?:s[cgp]h|gt|sm)-\w+|sc[g-]?[\d]+a?|galaxy nexus)/i, /samsung[- ]([-\w]+)/i, /sec-(sgh\w+)/i], [n, [q, L], [p, u]], [/(?:\/|\()(ip(?:hone|od)[\w, ]*)(?:\/|;)/i], [n, [q, A], [p, u]], [/\((ipad);[-\w\),; ]+apple/i, /applecoremedia\/[\w\.]+ \((ipad)/i, /\b(ipad)\d\d?,\d\d?[;\]].+ios/i], [n, [q, A], [p, v]], [/(macintosh);/i], [n, [q, A]], [/\b(sh-?[altvz]?\d\d[a-ekm]?)/i], [n, [q, M], [p, u]], [/\b((?:ag[rs][23]?|bah2?|sht?|btv)-a?[lw]\d{2})\b(?!.+d\/s)/i], [n, [q, H], [p, v]], [/(?:huawei|honor)([-\w ]+)[;\)]/i, /\b(nexus 6p|\w{2,4}e?-[atu]?[ln][\dx][012359c][adn]?)\b(?!.+d\/s)/i], [n, [q, H], [p, u]], [/\b(poco[\w ]+)(?: bui|\))/i, /\b; (\w+) build\/hm\1/i, /\b(hm[-_ ]?note?[_ ]?(?:\d\w)?) bui/i, /\b(redmi[\-_ ]?(?:note|k)?[\w_ ]+)(?: bui|\))/i, /\b(mi[-_ ]?(?:a\d|one|one[_ ]plus|note lte|max|cc)?[_ ]?(?:\d?\w?)[_ ]?(?:plus|se|lite)?)(?: bui|\))/i], [[n, /_/g, " "], [q, O], [p, u]], [/\b(mi[-_ ]?(?:pad)(?:[\w_ ]+))(?: bui|\))/i], [[n, /_/g, " "], [q, O], [p, v]], [/; (\w+) bui.+ oppo/i, /\b(cph[12]\d{3}|p(?:af|c[al]|d\w|e[ar])[mt]\d0|x9007|a101op)\b/i], [n, [q, "OPPO"], [p, u]], [/vivo (\w+)(?: bui|\))/i, /\b(v[12]\d{3}\w?[at])(?: bui|;)/i], [n, [q, "Vivo"], [p, u]], [/\b(rmx[12]\d{3})(?: bui|;|\))/i], [n, [q, "Realme"], [p, u]], [/\b(milestone|droid(?:[2-4x]| (?:bionic|x2|pro|razr))?:?( 4g)?)\b[\w ]+build\//i, /\bmot(?:orola)?[- ](\w*)/i, /((?:moto[\w\(\) ]+|xt\d{3,4}|nexus 6)(?= bui|\)))/i], [n, [q, J], [p, u]], [/\b(mz60\d|xoom[2 ]{0,2}) build\//i], [n, [q, J], [p, v]], [/((?=lg)?[vl]k\-?\d{3}) bui| 3\.[-\w; ]{10}lg?-([06cv9]{3,4})/i], [n, [q, "LG"], [p, v]], [/(lm(?:-?f100[nv]?|-[\w\.]+)(?= bui|\))|nexus [45])/i, /\blg[-e;\/ ]+((?!browser|netcast|android tv)\w+)/i, /\blg-?([\d\w]+) bui/i], [n, [q, "LG"], [p, u]], [/(ideatab[-\w ]+)/i, /lenovo ?(s[56]000[-\w]+|tab(?:[\w ]+)|yt[-\d\w]{6}|tb[-\d\w]{6})/i], [n, [q, "Lenovo"], [p, v]], [/(?:maemo|nokia).*(n900|lumia \d+)/i, /nokia[-_ ]?([-\w\.]*)/i], [[n, /_/g, " "], [q, "Nokia"], [p, u]], [/(pixel c)\b/i], [n, [q, G], [p, v]], [/droid.+; (pixel[\daxl ]{0,6})(?: bui|\))/i], [n, [q, G], [p, u]], [/droid.+ (a?\d[0-2]{2}so|[c-g]\d{4}|so[-gl]\w+|xq-a\w[4-7][12])(?= bui|\).+chrome\/(?![1-6]{0,1}\d\.))/i], [n, [q, N], [p, u]], [/sony tablet [ps]/i, /\b(?:sony)?sgp\w+(?: bui|\))/i], [[n, "Xperia Tablet"], [q, N], [p, v]], [/ (kb2005|in20[12]5|be20[12][59])\b/i, /(?:one)?(?:plus)? (a\d0\d\d)(?: b|\))/i], [n, [q, "OnePlus"], [p, u]], [/(alexa)webm/i, /(kf[a-z]{2}wi|aeo[c-r]{2})( bui|\))/i, /(kf[a-z]+)( bui|\)).+silk\//i], [n, [q, z], [p, v]], [/((?:sd|kf)[0349hijorstuw]+)( bui|\)).+silk\//i], [[n, /(.+)/g, "Fire Phone $1"], [q, z], [p, u]], [/(playbook);[-\w\),; ]+(rim)/i], [n, q, [p, v]], [/\b((?:bb[a-f]|st[hv])100-\d)/i, /\(bb10; (\w+)/i], [n, [q, C], [p, u]], [/(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i], [n, [q, B], [p, v]], [/ (z[bes]6[027][012][km][ls]|zenfone \d\w?)\b/i], [n, [q, B], [p, u]], [/(nexus 9)/i], [n, [q, "HTC"], [p, v]], [/(htc)[-;_ ]{1,2}([\w ]+(?=\)| bui)|\w+)/i, /(zte)[- ]([\w ]+?)(?: bui|\/|\))/i, /(alcatel|geeksphone|nexian|panasonic(?!(?:;|\.))|sony(?!-bra))[-_ ]?([-\w]*)/i], [q, [n, /_/g, " "], [p, u]], [/droid.+; ([ab][1-7]-?[0178a]\d\d?)/i], [n, [q, "Acer"], [p, v]], [/droid.+; (m[1-5] note) bui/i, /\bmz-([-\w]{2,})/i], [n, [q, "Meizu"], [p, u]], [/(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[-_ ]?([-\w]*)/i, /(hp) ([\w ]+\w)/i, /(asus)-?(\w+)/i, /(microsoft); (lumia[\w ]+)/i, /(lenovo)[-_ ]?([-\w]+)/i, /(jolla)/i, /(oppo) ?([\w ]+) bui/i], [q, n, [p, u]], [/(kobo)\s(ereader|touch)/i, /(archos) (gamepad2?)/i, /(hp).+(touchpad(?!.+tablet)|tablet)/i, /(kindle)\/([\w\.]+)/i, /(nook)[\w ]+build\/(\w+)/i, /(dell) (strea[kpr\d ]*[\dko])/i, /(le[- ]+pan)[- ]+(\w{1,9}) bui/i, /(trinity)[- ]*(t\d{3}) bui/i, /(gigaset)[- ]+(q\w{1,9}) bui/i, /(vodafone) ([\w ]+)(?:\)| bui)/i], [q, n, [p, v]], [/(surface duo)/i], [n, [q, I], [p, v]], [/droid [\d\.]+; (fp\du?)(?: b|\))/i], [n, [q, "Fairphone"], [p, u]], [/(u304aa)/i], [n, [q, "AT&T"], [p, u]], [/\bsie-(\w*)/i], [n, [q, "Siemens"], [p, u]], [/\b(rct\w+) b/i], [n, [q, "RCA"], [p, v]], [/\b(venue[\d ]{2,7}) b/i], [n, [q, "Dell"], [p, v]], [/\b(q(?:mv|ta)\w+) b/i], [n, [q, "Verizon"], [p, v]], [/\b(?:barnes[& ]+noble |bn[rt])([\w\+ ]*) b/i], [n, [q, "Barnes & Noble"], [p, v]], [/\b(tm\d{3}\w+) b/i], [n, [q, "NuVision"], [p, v]], [/\b(k88) b/i], [n, [q, "ZTE"], [p, v]], [/\b(nx\d{3}j) b/i], [n, [q, "ZTE"], [p, u]], [/\b(gen\d{3}) b.+49h/i], [n, [q, "Swiss"], [p, u]], [/\b(zur\d{3}) b/i], [n, [q, "Swiss"], [p, v]], [/\b((zeki)?tb.*\b) b/i], [n, [q, "Zeki"], [p, v]], [/\b([yr]\d{2}) b/i, /\b(dragon[- ]+touch |dt)(\w{5}) b/i], [[q, "Dragon Touch"], n, [p, v]], [/\b(ns-?\w{0,9}) b/i], [n, [q, "Insignia"], [p, v]], [/\b((nxa|next)-?\w{0,9}) b/i], [n, [q, "NextBook"], [p, v]], [/\b(xtreme\_)?(v(1[045]|2[015]|[3469]0|7[05])) b/i], [[q, "Voice"], n, [p, u]], [/\b(lvtel\-)?(v1[12]) b/i], [[q, "LvTel"], n, [p, u]], [/\b(ph-1) /i], [n, [q, "Essential"], [p, u]], [/\b(v(100md|700na|7011|917g).*\b) b/i], [n, [q, "Envizen"], [p, v]], [/\b(trio[-\w\. ]+) b/i], [n, [q, "MachSpeed"], [p, v]], [/\btu_(1491) b/i], [n, [q, "Rotor"], [p, v]], [/(shield[\w ]+) b/i], [n, [q, "Nvidia"], [p, v]], [/(sprint) (\w+)/i], [q, n, [p, u]], [/(kin\.[onetw]{3})/i], [[n, /\./g, " "], [q, I], [p, u]], [/droid.+; (cc6666?|et5[16]|mc[239][23]x?|vc8[03]x?)\)/i], [n, [q, P], [p, v]], [/droid.+; (ec30|ps20|tc[2-8]\d[kx])\)/i], [n, [q, P], [p, u]], [/smart-tv.+(samsung)/i], [q, [p, w]], [/hbbtv.+maple;(\d+)/i], [[n, /^/, "SmartTV"], [q, L], [p, w]], [/(nux; netcast.+smarttv|lg (netcast\.tv-201\d|android tv))/i], [[q, "LG"], [p, w]], [/(apple) ?tv/i], [q, [n, A + " TV"], [p, w]], [/crkey/i], [[n, E + "cast"], [q, G], [p, w]], [/droid.+aft(\w)( bui|\))/i], [n, [q, z], [p, w]], [/\(dtv[\);].+(aquos)/i, /(aquos-tv[\w ]+)\)/i], [n, [q, M], [p, w]], [/(bravia[\w ]+)( bui|\))/i], [n, [q, N], [p, w]], [/(mitv-\w{5}) bui/i], [n, [q, O], [p, w]], [/Hbbtv.*(technisat) (.*);/i], [q, n, [p, w]], [/\b(roku)[\dx]*[\)\/]((?:dvp-)?[\d\.]*)/i, /hbbtv\/\d+\.\d+\.\d+ +\([\w\+ ]*; *([\w\d][^;]*);([^;]*)/i], [[q, X], [n, X], [p, w]], [/\b(android tv|smart[- ]?tv|opera tv|tv; rv:)\b/i], [[p, w]], [/(ouya)/i, /(nintendo) ([wids3utch]+)/i], [q, n, [p, t]], [/droid.+; (shield) bui/i], [n, [q, "Nvidia"], [p, t]], [/(playstation [345portablevi]+)/i], [n, [q, N], [p, t]], [/\b(xbox(?: one)?(?!; xbox))[\); ]/i], [n, [q, I], [p, t]], [/((pebble))app/i], [q, n, [p, x]], [/(watch)(?: ?os[,\/]|\d,\d\/)[\d\.]+/i], [n, [q, A], [p, x]], [/droid.+; (glass) \d/i], [n, [q, G], [p, x]], [/droid.+; (wt63?0{2,3})\)/i], [n, [q, P], [p, x]], [/(quest( 2| pro)?)/i], [n, [q, Q], [p, x]], [/(tesla)(?: qtcarbrowser|\/[-\w\.]+)/i], [q, [p, y]], [/(aeobc)\b/i], [n, [q, z], [p, y]], [/droid .+?; ([^;]+?)(?: bui|\) applew).+? mobile safari/i], [n, [p, u]], [/droid .+?; ([^;]+?)(?: bui|\) applew).+?(?! mobile) safari/i], [n, [p, v]], [/\b((tablet|tab)[;\/]|focus\/\d(?!.+mobile))/i], [[p, v]], [/(phone|mobile(?:[;\/]| [ \w\/\.]*safari)|pda(?=.+windows ce))/i], [[p, u]], [/(android[-\w\. ]{0,9});.+buil/i], [n, [q, "Generic"]]], engine: [[/windows.+ edge\/([\w\.]+)/i], [r, [o, "EdgeHTML"]], [/webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i], [r, [o, "Blink"]], [/(presto)\/([\w\.]+)/i, /(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna)\/([\w\.]+)/i, /ekioh(flow)\/([\w\.]+)/i, /(khtml|tasman|links)[\/ ]\(?([\w\.]+)/i, /(icab)[\/ ]([23]\.[\d\.]+)/i, /\b(libweb)/i], [o, r], [/rv\:([\w\.]{1,9})\b.+(gecko)/i], [r, o]], os: [[/microsoft (windows) (vista|xp)/i], [o, r], [/(windows) nt 6\.2; (arm)/i, /(windows (?:phone(?: os)?|mobile))[\/ ]?([\d\.\w ]*)/i, /(windows)[\/ ]?([ntce\d\. ]+\w)(?!.+xbox)/i], [o, [r, Z, $]], [/(win(?=3|9|n)|win 9x )([nt\d\.]+)/i], [[o, "Windows"], [r, Z, $]], [/ip[honead]{2,4}\b(?:.*os ([\w]+) like mac|; opera)/i, /ios;fbsv\/([\d\.]+)/i, /cfnetwork\/.+darwin/i], [[r, /_/g, "."], [o, "iOS"]], [/(mac os x) ?([\w\. ]*)/i, /(macintosh|mac_powerpc\b)(?!.+haiku)/i], [[o, S], [r, /_/g, "."]], [/droid ([\w\.]+)\b.+(android[- ]x86|harmonyos)/i], [r, o], [/(android|webos|qnx|bada|rim tablet os|maemo|meego|sailfish)[-\/ ]?([\w\.]*)/i, /(blackberry)\w*\/([\w\.]*)/i, /(tizen|kaios)[\/ ]([\w\.]+)/i, /\((series40);/i], [o, r], [/\(bb(10);/i], [r, [o, C]], [/(?:symbian ?os|symbos|s60(?=;)|series60)[-\/ ]?([\w\.]*)/i], [r, [o, "Symbian"]], [/mozilla\/[\d\.]+ \((?:mobile|tablet|tv|mobile; [\w ]+); rv:.+ gecko\/([\w\.]+)/i], [r, [o, F + " OS"]], [/web0s;.+rt(tv)/i, /\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i], [r, [o, "webOS"]], [/watch(?: ?os[,\/]|\d,\d\/)([\d\.]+)/i], [r, [o, "watchOS"]], [/crkey\/([\d\.]+)/i], [r, [o, E + "cast"]], [/(cros) [\w]+(?:\)| ([\w\.]+)\b)/i], [[o, R], r], [/panasonic;(viera)/i, /(netrange)mmh/i, /(nettv)\/(\d+\.[\w\.]+)/i, /(nintendo|playstation) ([wids345portablevuch]+)/i, /(xbox); +xbox ([^\);]+)/i, /\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i, /(mint)[\/\(\) ]?(\w*)/i, /(mageia|vectorlinux)[; ]/i, /([kxln]?ubuntu|debian|suse|opensuse|gentoo|arch(?= linux)|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire)(?: gnu\/linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i, /(hurd|linux) ?([\w\.]*)/i, /(gnu) ?([\w\.]*)/i, /\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/i, /(haiku) (\w+)/i], [o, r], [/(sunos) ?([\w\.\d]*)/i], [[o, "Solaris"], r], [/((?:open)?solaris)[-\/ ]?([\w\.]*)/i, /(aix) ((\d)(?=\.|\)| )[\w\.])*/i, /\b(beos|os\/2|amigaos|morphos|openvms|fuchsia|hp-ux|serenityos)/i, /(unix) ?([\w\.]*)/i], [o, r]] }, aa = function(a2, b2) {
              if (typeof a2 === k && (b2 = a2, a2 = h), !(this instanceof aa)) return new aa(a2, b2).getResult();
              var c2 = typeof g2 !== j && g2.navigator ? g2.navigator : h, d2 = a2 || (c2 && c2.userAgent ? c2.userAgent : ""), e3 = c2 && c2.userAgentData ? c2.userAgentData : h, f3 = b2 ? T(_, b2) : _, t2 = c2 && c2.userAgent == d2;
              return this.getBrowser = function() {
                var a3, b3 = {};
                return b3[o] = h, b3[r] = h, Y.call(b3, d2, f3.browser), b3[m] = typeof (a3 = b3[r]) === l ? a3.replace(/[^\d\.]/g, "").split(".")[0] : h, t2 && c2 && c2.brave && typeof c2.brave.isBrave == i && (b3[o] = "Brave"), b3;
              }, this.getCPU = function() {
                var a3 = {};
                return a3[s] = h, Y.call(a3, d2, f3.cpu), a3;
              }, this.getDevice = function() {
                var a3 = {};
                return a3[q] = h, a3[n] = h, a3[p] = h, Y.call(a3, d2, f3.device), t2 && !a3[p] && e3 && e3.mobile && (a3[p] = u), t2 && "Macintosh" == a3[n] && c2 && typeof c2.standalone !== j && c2.maxTouchPoints && c2.maxTouchPoints > 2 && (a3[n] = "iPad", a3[p] = v), a3;
              }, this.getEngine = function() {
                var a3 = {};
                return a3[o] = h, a3[r] = h, Y.call(a3, d2, f3.engine), a3;
              }, this.getOS = function() {
                var a3 = {};
                return a3[o] = h, a3[r] = h, Y.call(a3, d2, f3.os), t2 && !a3[o] && e3 && "Unknown" != e3.platform && (a3[o] = e3.platform.replace(/chrome os/i, R).replace(/macos/i, S)), a3;
              }, this.getResult = function() {
                return { ua: this.getUA(), browser: this.getBrowser(), engine: this.getEngine(), os: this.getOS(), device: this.getDevice(), cpu: this.getCPU() };
              }, this.getUA = function() {
                return d2;
              }, this.setUA = function(a3) {
                return d2 = typeof a3 === l && a3.length > 350 ? X(a3, 350) : a3, this;
              }, this.setUA(d2), this;
            };
            aa.VERSION = "1.0.35", aa.BROWSER = U([o, r, m]), aa.CPU = U([s]), aa.DEVICE = U([n, q, p, t, u, w, v, x, y]), aa.ENGINE = aa.OS = U([o, r]), typeof f2 !== j ? (e2.exports && (f2 = e2.exports = aa), f2.UAParser = aa) : c.amdO ? void 0 === (d = function() {
              return aa;
            }.call(b, c, b, a)) || (a.exports = d) : typeof g2 !== j && (g2.UAParser = aa);
            var ab = typeof g2 !== j && (g2.jQuery || g2.Zepto);
            if (ab && !ab.ua) {
              var ac = new aa();
              ab.ua = ac.getResult(), ab.ua.get = function() {
                return ac.getUA();
              }, ab.ua.set = function(a2) {
                ac.setUA(a2);
                var b2 = ac.getResult();
                for (var c2 in b2) ab.ua[c2] = b2[c2];
              };
            }
          }("object" == typeof window ? window : this);
        } }, f = {};
        function g(a2) {
          var b2 = f[a2];
          if (void 0 !== b2) return b2.exports;
          var c2 = f[a2] = { exports: {} }, d2 = true;
          try {
            e[a2].call(c2.exports, c2, c2.exports, g), d2 = false;
          } finally {
            d2 && delete f[a2];
          }
          return c2.exports;
        }
        g.ab = "//", a.exports = g(226);
      })();
    }, 294: (a) => {
      (() => {
        "use strict";
        var b = { 993: (a2) => {
          var b2 = Object.prototype.hasOwnProperty, c2 = "~";
          function d2() {
          }
          function e2(a3, b3, c3) {
            this.fn = a3, this.context = b3, this.once = c3 || false;
          }
          function f(a3, b3, d3, f2, g2) {
            if ("function" != typeof d3) throw TypeError("The listener must be a function");
            var h2 = new e2(d3, f2 || a3, g2), i = c2 ? c2 + b3 : b3;
            return a3._events[i] ? a3._events[i].fn ? a3._events[i] = [a3._events[i], h2] : a3._events[i].push(h2) : (a3._events[i] = h2, a3._eventsCount++), a3;
          }
          function g(a3, b3) {
            0 == --a3._eventsCount ? a3._events = new d2() : delete a3._events[b3];
          }
          function h() {
            this._events = new d2(), this._eventsCount = 0;
          }
          Object.create && (d2.prototype = /* @__PURE__ */ Object.create(null), new d2().__proto__ || (c2 = false)), h.prototype.eventNames = function() {
            var a3, d3, e3 = [];
            if (0 === this._eventsCount) return e3;
            for (d3 in a3 = this._events) b2.call(a3, d3) && e3.push(c2 ? d3.slice(1) : d3);
            return Object.getOwnPropertySymbols ? e3.concat(Object.getOwnPropertySymbols(a3)) : e3;
          }, h.prototype.listeners = function(a3) {
            var b3 = c2 ? c2 + a3 : a3, d3 = this._events[b3];
            if (!d3) return [];
            if (d3.fn) return [d3.fn];
            for (var e3 = 0, f2 = d3.length, g2 = Array(f2); e3 < f2; e3++) g2[e3] = d3[e3].fn;
            return g2;
          }, h.prototype.listenerCount = function(a3) {
            var b3 = c2 ? c2 + a3 : a3, d3 = this._events[b3];
            return d3 ? d3.fn ? 1 : d3.length : 0;
          }, h.prototype.emit = function(a3, b3, d3, e3, f2, g2) {
            var h2 = c2 ? c2 + a3 : a3;
            if (!this._events[h2]) return false;
            var i, j, k = this._events[h2], l = arguments.length;
            if (k.fn) {
              switch (k.once && this.removeListener(a3, k.fn, void 0, true), l) {
                case 1:
                  return k.fn.call(k.context), true;
                case 2:
                  return k.fn.call(k.context, b3), true;
                case 3:
                  return k.fn.call(k.context, b3, d3), true;
                case 4:
                  return k.fn.call(k.context, b3, d3, e3), true;
                case 5:
                  return k.fn.call(k.context, b3, d3, e3, f2), true;
                case 6:
                  return k.fn.call(k.context, b3, d3, e3, f2, g2), true;
              }
              for (j = 1, i = Array(l - 1); j < l; j++) i[j - 1] = arguments[j];
              k.fn.apply(k.context, i);
            } else {
              var m, n = k.length;
              for (j = 0; j < n; j++) switch (k[j].once && this.removeListener(a3, k[j].fn, void 0, true), l) {
                case 1:
                  k[j].fn.call(k[j].context);
                  break;
                case 2:
                  k[j].fn.call(k[j].context, b3);
                  break;
                case 3:
                  k[j].fn.call(k[j].context, b3, d3);
                  break;
                case 4:
                  k[j].fn.call(k[j].context, b3, d3, e3);
                  break;
                default:
                  if (!i) for (m = 1, i = Array(l - 1); m < l; m++) i[m - 1] = arguments[m];
                  k[j].fn.apply(k[j].context, i);
              }
            }
            return true;
          }, h.prototype.on = function(a3, b3, c3) {
            return f(this, a3, b3, c3, false);
          }, h.prototype.once = function(a3, b3, c3) {
            return f(this, a3, b3, c3, true);
          }, h.prototype.removeListener = function(a3, b3, d3, e3) {
            var f2 = c2 ? c2 + a3 : a3;
            if (!this._events[f2]) return this;
            if (!b3) return g(this, f2), this;
            var h2 = this._events[f2];
            if (h2.fn) h2.fn !== b3 || e3 && !h2.once || d3 && h2.context !== d3 || g(this, f2);
            else {
              for (var i = 0, j = [], k = h2.length; i < k; i++) (h2[i].fn !== b3 || e3 && !h2[i].once || d3 && h2[i].context !== d3) && j.push(h2[i]);
              j.length ? this._events[f2] = 1 === j.length ? j[0] : j : g(this, f2);
            }
            return this;
          }, h.prototype.removeAllListeners = function(a3) {
            var b3;
            return a3 ? (b3 = c2 ? c2 + a3 : a3, this._events[b3] && g(this, b3)) : (this._events = new d2(), this._eventsCount = 0), this;
          }, h.prototype.off = h.prototype.removeListener, h.prototype.addListener = h.prototype.on, h.prefixed = c2, h.EventEmitter = h, a2.exports = h;
        }, 213: (a2) => {
          a2.exports = (a3, b2) => (b2 = b2 || (() => {
          }), a3.then((a4) => new Promise((a5) => {
            a5(b2());
          }).then(() => a4), (a4) => new Promise((a5) => {
            a5(b2());
          }).then(() => {
            throw a4;
          })));
        }, 574: (a2, b2) => {
          Object.defineProperty(b2, "__esModule", { value: true }), b2.default = function(a3, b3, c2) {
            let d2 = 0, e2 = a3.length;
            for (; e2 > 0; ) {
              let f = e2 / 2 | 0, g = d2 + f;
              0 >= c2(a3[g], b3) ? (d2 = ++g, e2 -= f + 1) : e2 = f;
            }
            return d2;
          };
        }, 821: (a2, b2, c2) => {
          Object.defineProperty(b2, "__esModule", { value: true });
          let d2 = c2(574);
          class e2 {
            constructor() {
              this._queue = [];
            }
            enqueue(a3, b3) {
              let c3 = { priority: (b3 = Object.assign({ priority: 0 }, b3)).priority, run: a3 };
              if (this.size && this._queue[this.size - 1].priority >= b3.priority) return void this._queue.push(c3);
              let e3 = d2.default(this._queue, c3, (a4, b4) => b4.priority - a4.priority);
              this._queue.splice(e3, 0, c3);
            }
            dequeue() {
              let a3 = this._queue.shift();
              return null == a3 ? void 0 : a3.run;
            }
            filter(a3) {
              return this._queue.filter((b3) => b3.priority === a3.priority).map((a4) => a4.run);
            }
            get size() {
              return this._queue.length;
            }
          }
          b2.default = e2;
        }, 816: (a2, b2, c2) => {
          let d2 = c2(213);
          class e2 extends Error {
            constructor(a3) {
              super(a3), this.name = "TimeoutError";
            }
          }
          let f = (a3, b3, c3) => new Promise((f2, g) => {
            if ("number" != typeof b3 || b3 < 0) throw TypeError("Expected `milliseconds` to be a positive number");
            if (b3 === 1 / 0) return void f2(a3);
            let h = setTimeout(() => {
              if ("function" == typeof c3) {
                try {
                  f2(c3());
                } catch (a4) {
                  g(a4);
                }
                return;
              }
              let d3 = "string" == typeof c3 ? c3 : `Promise timed out after ${b3} milliseconds`, h2 = c3 instanceof Error ? c3 : new e2(d3);
              "function" == typeof a3.cancel && a3.cancel(), g(h2);
            }, b3);
            d2(a3.then(f2, g), () => {
              clearTimeout(h);
            });
          });
          a2.exports = f, a2.exports.default = f, a2.exports.TimeoutError = e2;
        } }, c = {};
        function d(a2) {
          var e2 = c[a2];
          if (void 0 !== e2) return e2.exports;
          var f = c[a2] = { exports: {} }, g = true;
          try {
            b[a2](f, f.exports, d), g = false;
          } finally {
            g && delete c[a2];
          }
          return f.exports;
        }
        d.ab = "//";
        var e = {};
        (() => {
          Object.defineProperty(e, "__esModule", { value: true });
          let a2 = d(993), b2 = d(816), c2 = d(821), f = () => {
          }, g = new b2.TimeoutError();
          class h extends a2 {
            constructor(a3) {
              var b3, d2, e2, g2;
              if (super(), this._intervalCount = 0, this._intervalEnd = 0, this._pendingCount = 0, this._resolveEmpty = f, this._resolveIdle = f, !("number" == typeof (a3 = Object.assign({ carryoverConcurrencyCount: false, intervalCap: 1 / 0, interval: 0, concurrency: 1 / 0, autoStart: true, queueClass: c2.default }, a3)).intervalCap && a3.intervalCap >= 1)) throw TypeError(`Expected \`intervalCap\` to be a number from 1 and up, got \`${null != (d2 = null == (b3 = a3.intervalCap) ? void 0 : b3.toString()) ? d2 : ""}\` (${typeof a3.intervalCap})`);
              if (void 0 === a3.interval || !(Number.isFinite(a3.interval) && a3.interval >= 0)) throw TypeError(`Expected \`interval\` to be a finite number >= 0, got \`${null != (g2 = null == (e2 = a3.interval) ? void 0 : e2.toString()) ? g2 : ""}\` (${typeof a3.interval})`);
              this._carryoverConcurrencyCount = a3.carryoverConcurrencyCount, this._isIntervalIgnored = a3.intervalCap === 1 / 0 || 0 === a3.interval, this._intervalCap = a3.intervalCap, this._interval = a3.interval, this._queue = new a3.queueClass(), this._queueClass = a3.queueClass, this.concurrency = a3.concurrency, this._timeout = a3.timeout, this._throwOnTimeout = true === a3.throwOnTimeout, this._isPaused = false === a3.autoStart;
            }
            get _doesIntervalAllowAnother() {
              return this._isIntervalIgnored || this._intervalCount < this._intervalCap;
            }
            get _doesConcurrentAllowAnother() {
              return this._pendingCount < this._concurrency;
            }
            _next() {
              this._pendingCount--, this._tryToStartAnother(), this.emit("next");
            }
            _resolvePromises() {
              this._resolveEmpty(), this._resolveEmpty = f, 0 === this._pendingCount && (this._resolveIdle(), this._resolveIdle = f, this.emit("idle"));
            }
            _onResumeInterval() {
              this._onInterval(), this._initializeIntervalIfNeeded(), this._timeoutId = void 0;
            }
            _isIntervalPaused() {
              let a3 = Date.now();
              if (void 0 === this._intervalId) {
                let b3 = this._intervalEnd - a3;
                if (!(b3 < 0)) return void 0 === this._timeoutId && (this._timeoutId = setTimeout(() => {
                  this._onResumeInterval();
                }, b3)), true;
                this._intervalCount = this._carryoverConcurrencyCount ? this._pendingCount : 0;
              }
              return false;
            }
            _tryToStartAnother() {
              if (0 === this._queue.size) return this._intervalId && clearInterval(this._intervalId), this._intervalId = void 0, this._resolvePromises(), false;
              if (!this._isPaused) {
                let a3 = !this._isIntervalPaused();
                if (this._doesIntervalAllowAnother && this._doesConcurrentAllowAnother) {
                  let b3 = this._queue.dequeue();
                  return !!b3 && (this.emit("active"), b3(), a3 && this._initializeIntervalIfNeeded(), true);
                }
              }
              return false;
            }
            _initializeIntervalIfNeeded() {
              this._isIntervalIgnored || void 0 !== this._intervalId || (this._intervalId = setInterval(() => {
                this._onInterval();
              }, this._interval), this._intervalEnd = Date.now() + this._interval);
            }
            _onInterval() {
              0 === this._intervalCount && 0 === this._pendingCount && this._intervalId && (clearInterval(this._intervalId), this._intervalId = void 0), this._intervalCount = this._carryoverConcurrencyCount ? this._pendingCount : 0, this._processQueue();
            }
            _processQueue() {
              for (; this._tryToStartAnother(); ) ;
            }
            get concurrency() {
              return this._concurrency;
            }
            set concurrency(a3) {
              if (!("number" == typeof a3 && a3 >= 1)) throw TypeError(`Expected \`concurrency\` to be a number from 1 and up, got \`${a3}\` (${typeof a3})`);
              this._concurrency = a3, this._processQueue();
            }
            async add(a3, c3 = {}) {
              return new Promise((d2, e2) => {
                let f2 = async () => {
                  this._pendingCount++, this._intervalCount++;
                  try {
                    let f3 = void 0 === this._timeout && void 0 === c3.timeout ? a3() : b2.default(Promise.resolve(a3()), void 0 === c3.timeout ? this._timeout : c3.timeout, () => {
                      (void 0 === c3.throwOnTimeout ? this._throwOnTimeout : c3.throwOnTimeout) && e2(g);
                    });
                    d2(await f3);
                  } catch (a4) {
                    e2(a4);
                  }
                  this._next();
                };
                this._queue.enqueue(f2, c3), this._tryToStartAnother(), this.emit("add");
              });
            }
            async addAll(a3, b3) {
              return Promise.all(a3.map(async (a4) => this.add(a4, b3)));
            }
            start() {
              return this._isPaused && (this._isPaused = false, this._processQueue()), this;
            }
            pause() {
              this._isPaused = true;
            }
            clear() {
              this._queue = new this._queueClass();
            }
            async onEmpty() {
              if (0 !== this._queue.size) return new Promise((a3) => {
                let b3 = this._resolveEmpty;
                this._resolveEmpty = () => {
                  b3(), a3();
                };
              });
            }
            async onIdle() {
              if (0 !== this._pendingCount || 0 !== this._queue.size) return new Promise((a3) => {
                let b3 = this._resolveIdle;
                this._resolveIdle = () => {
                  b3(), a3();
                };
              });
            }
            get size() {
              return this._queue.size;
            }
            sizeBy(a3) {
              return this._queue.filter(a3).length;
            }
            get pending() {
              return this._pendingCount;
            }
            get isPaused() {
              return this._isPaused;
            }
            get timeout() {
              return this._timeout;
            }
            set timeout(a3) {
              this._timeout = a3;
            }
          }
          e.default = h;
        })(), a.exports = e;
      })();
    }, 356: (a) => {
      "use strict";
      a.exports = (init_node_buffer(), __toCommonJS(node_buffer_exports));
    }, 376: (a) => {
      "use strict";
      var b = Object.defineProperty, c = Object.getOwnPropertyDescriptor, d = Object.getOwnPropertyNames, e = Object.prototype.hasOwnProperty, f = {};
      function g(a2) {
        var b2;
        let c2 = ["path" in a2 && a2.path && `Path=${a2.path}`, "expires" in a2 && (a2.expires || 0 === a2.expires) && `Expires=${("number" == typeof a2.expires ? new Date(a2.expires) : a2.expires).toUTCString()}`, "maxAge" in a2 && "number" == typeof a2.maxAge && `Max-Age=${a2.maxAge}`, "domain" in a2 && a2.domain && `Domain=${a2.domain}`, "secure" in a2 && a2.secure && "Secure", "httpOnly" in a2 && a2.httpOnly && "HttpOnly", "sameSite" in a2 && a2.sameSite && `SameSite=${a2.sameSite}`, "partitioned" in a2 && a2.partitioned && "Partitioned", "priority" in a2 && a2.priority && `Priority=${a2.priority}`].filter(Boolean), d2 = `${a2.name}=${encodeURIComponent(null != (b2 = a2.value) ? b2 : "")}`;
        return 0 === c2.length ? d2 : `${d2}; ${c2.join("; ")}`;
      }
      function h(a2) {
        let b2 = /* @__PURE__ */ new Map();
        for (let c2 of a2.split(/; */)) {
          if (!c2) continue;
          let a3 = c2.indexOf("=");
          if (-1 === a3) {
            b2.set(c2, "true");
            continue;
          }
          let [d2, e2] = [c2.slice(0, a3), c2.slice(a3 + 1)];
          try {
            b2.set(d2, decodeURIComponent(null != e2 ? e2 : "true"));
          } catch {
          }
        }
        return b2;
      }
      function i(a2) {
        if (!a2) return;
        let [[b2, c2], ...d2] = h(a2), { domain: e2, expires: f2, httponly: g2, maxage: i2, path: l2, samesite: m2, secure: n, partitioned: o, priority: p } = Object.fromEntries(d2.map(([a3, b3]) => [a3.toLowerCase().replace(/-/g, ""), b3]));
        {
          var q, r, s = { name: b2, value: decodeURIComponent(c2), domain: e2, ...f2 && { expires: new Date(f2) }, ...g2 && { httpOnly: true }, ..."string" == typeof i2 && { maxAge: Number(i2) }, path: l2, ...m2 && { sameSite: j.includes(q = (q = m2).toLowerCase()) ? q : void 0 }, ...n && { secure: true }, ...p && { priority: k.includes(r = (r = p).toLowerCase()) ? r : void 0 }, ...o && { partitioned: true } };
          let a3 = {};
          for (let b3 in s) s[b3] && (a3[b3] = s[b3]);
          return a3;
        }
      }
      ((a2, c2) => {
        for (var d2 in c2) b(a2, d2, { get: c2[d2], enumerable: true });
      })(f, { RequestCookies: () => l, ResponseCookies: () => m, parseCookie: () => h, parseSetCookie: () => i, stringifyCookie: () => g }), a.exports = ((a2, f2, g2, h2) => {
        if (f2 && "object" == typeof f2 || "function" == typeof f2) for (let i2 of d(f2)) e.call(a2, i2) || i2 === g2 || b(a2, i2, { get: () => f2[i2], enumerable: !(h2 = c(f2, i2)) || h2.enumerable });
        return a2;
      })(b({}, "__esModule", { value: true }), f);
      var j = ["strict", "lax", "none"], k = ["low", "medium", "high"], l = class {
        constructor(a2) {
          this._parsed = /* @__PURE__ */ new Map(), this._headers = a2;
          let b2 = a2.get("cookie");
          if (b2) for (let [a3, c2] of h(b2)) this._parsed.set(a3, { name: a3, value: c2 });
        }
        [Symbol.iterator]() {
          return this._parsed[Symbol.iterator]();
        }
        get size() {
          return this._parsed.size;
        }
        get(...a2) {
          let b2 = "string" == typeof a2[0] ? a2[0] : a2[0].name;
          return this._parsed.get(b2);
        }
        getAll(...a2) {
          var b2;
          let c2 = Array.from(this._parsed);
          if (!a2.length) return c2.map(([a3, b3]) => b3);
          let d2 = "string" == typeof a2[0] ? a2[0] : null == (b2 = a2[0]) ? void 0 : b2.name;
          return c2.filter(([a3]) => a3 === d2).map(([a3, b3]) => b3);
        }
        has(a2) {
          return this._parsed.has(a2);
        }
        set(...a2) {
          let [b2, c2] = 1 === a2.length ? [a2[0].name, a2[0].value] : a2, d2 = this._parsed;
          return d2.set(b2, { name: b2, value: c2 }), this._headers.set("cookie", Array.from(d2).map(([a3, b3]) => g(b3)).join("; ")), this;
        }
        delete(a2) {
          let b2 = this._parsed, c2 = Array.isArray(a2) ? a2.map((a3) => b2.delete(a3)) : b2.delete(a2);
          return this._headers.set("cookie", Array.from(b2).map(([a3, b3]) => g(b3)).join("; ")), c2;
        }
        clear() {
          return this.delete(Array.from(this._parsed.keys())), this;
        }
        [Symbol.for("edge-runtime.inspect.custom")]() {
          return `RequestCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`;
        }
        toString() {
          return [...this._parsed.values()].map((a2) => `${a2.name}=${encodeURIComponent(a2.value)}`).join("; ");
        }
      }, m = class {
        constructor(a2) {
          var b2, c2, d2;
          this._parsed = /* @__PURE__ */ new Map(), this._headers = a2;
          let e2 = null != (d2 = null != (c2 = null == (b2 = a2.getSetCookie) ? void 0 : b2.call(a2)) ? c2 : a2.get("set-cookie")) ? d2 : [];
          for (let a3 of Array.isArray(e2) ? e2 : function(a4) {
            if (!a4) return [];
            var b3, c3, d3, e3, f2, g2 = [], h2 = 0;
            function i2() {
              for (; h2 < a4.length && /\s/.test(a4.charAt(h2)); ) h2 += 1;
              return h2 < a4.length;
            }
            for (; h2 < a4.length; ) {
              for (b3 = h2, f2 = false; i2(); ) if ("," === (c3 = a4.charAt(h2))) {
                for (d3 = h2, h2 += 1, i2(), e3 = h2; h2 < a4.length && "=" !== (c3 = a4.charAt(h2)) && ";" !== c3 && "," !== c3; ) h2 += 1;
                h2 < a4.length && "=" === a4.charAt(h2) ? (f2 = true, h2 = e3, g2.push(a4.substring(b3, d3)), b3 = h2) : h2 = d3 + 1;
              } else h2 += 1;
              (!f2 || h2 >= a4.length) && g2.push(a4.substring(b3, a4.length));
            }
            return g2;
          }(e2)) {
            let b3 = i(a3);
            b3 && this._parsed.set(b3.name, b3);
          }
        }
        get(...a2) {
          let b2 = "string" == typeof a2[0] ? a2[0] : a2[0].name;
          return this._parsed.get(b2);
        }
        getAll(...a2) {
          var b2;
          let c2 = Array.from(this._parsed.values());
          if (!a2.length) return c2;
          let d2 = "string" == typeof a2[0] ? a2[0] : null == (b2 = a2[0]) ? void 0 : b2.name;
          return c2.filter((a3) => a3.name === d2);
        }
        has(a2) {
          return this._parsed.has(a2);
        }
        set(...a2) {
          let [b2, c2, d2] = 1 === a2.length ? [a2[0].name, a2[0].value, a2[0]] : a2, e2 = this._parsed;
          return e2.set(b2, function(a3 = { name: "", value: "" }) {
            return "number" == typeof a3.expires && (a3.expires = new Date(a3.expires)), a3.maxAge && (a3.expires = new Date(Date.now() + 1e3 * a3.maxAge)), (null === a3.path || void 0 === a3.path) && (a3.path = "/"), a3;
          }({ name: b2, value: c2, ...d2 })), function(a3, b3) {
            for (let [, c3] of (b3.delete("set-cookie"), a3)) {
              let a4 = g(c3);
              b3.append("set-cookie", a4);
            }
          }(e2, this._headers), this;
        }
        delete(...a2) {
          let [b2, c2] = "string" == typeof a2[0] ? [a2[0]] : [a2[0].name, a2[0]];
          return this.set({ ...c2, name: b2, value: "", expires: /* @__PURE__ */ new Date(0) });
        }
        [Symbol.for("edge-runtime.inspect.custom")]() {
          return `ResponseCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`;
        }
        toString() {
          return [...this._parsed.values()].map(g).join("; ");
        }
      };
    }, 439: (a, b, c) => {
      "use strict";
      let d, e, f, g, h, i, j;
      c.r(b), c.d(b, { default: () => gn });
      var k, l, m, n, o, p, q, r = {};
      async function s() {
        return "_ENTRIES" in globalThis && _ENTRIES.middleware_instrumentation && await _ENTRIES.middleware_instrumentation;
      }
      c.r(r), c.d(r, { config: () => gc, default: () => gj, middleware: () => gh, proxy: () => gi });
      let t = null;
      async function u() {
        if ("phase-production-build" === process.env.NEXT_PHASE) return;
        t || (t = s());
        let a10 = await t;
        if (null == a10 ? void 0 : a10.register) try {
          await a10.register();
        } catch (a11) {
          throw a11.message = `An error occurred while loading instrumentation hook: ${a11.message}`, a11;
        }
      }
      async function v(...a10) {
        let b10 = await s();
        try {
          var c10;
          await (null == b10 || null == (c10 = b10.onRequestError) ? void 0 : c10.call(b10, ...a10));
        } catch (a11) {
          console.error("Error in instrumentation.onRequestError:", a11);
        }
      }
      let w = null;
      function x() {
        return w || (w = u()), w;
      }
      function y(a10) {
        return `The edge runtime does not support Node.js '${a10}' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime`;
      }
      process !== c.g.process && (process.env = c.g.process.env, c.g.process = process);
      try {
        Object.defineProperty(globalThis, "__import_unsupported", { value: function(a10) {
          let b10 = new Proxy(function() {
          }, { get(b11, c10) {
            if ("then" === c10) return {};
            throw Object.defineProperty(Error(y(a10)), "__NEXT_ERROR_CODE", { value: "E394", enumerable: false, configurable: true });
          }, construct() {
            throw Object.defineProperty(Error(y(a10)), "__NEXT_ERROR_CODE", { value: "E394", enumerable: false, configurable: true });
          }, apply(c10, d10, e10) {
            if ("function" == typeof e10[0]) return e10[0](b10);
            throw Object.defineProperty(Error(y(a10)), "__NEXT_ERROR_CODE", { value: "E394", enumerable: false, configurable: true });
          } });
          return new Proxy({}, { get: () => b10 });
        }, enumerable: false, configurable: false });
      } catch {
      }
      x();
      class z extends Error {
        constructor({ page: a10 }) {
          super(`The middleware "${a10}" accepts an async API directly with the form:
  
  export function middleware(request, event) {
    return NextResponse.redirect('/new-location')
  }
  
  Read more: https://nextjs.org/docs/messages/middleware-new-signature
  `);
        }
      }
      class A extends Error {
        constructor() {
          super(`The request.page has been deprecated in favour of \`URLPattern\`.
  Read more: https://nextjs.org/docs/messages/middleware-request-page
  `);
        }
      }
      class B extends Error {
        constructor() {
          super(`The request.ua has been removed in favour of \`userAgent\` function.
  Read more: https://nextjs.org/docs/messages/middleware-parse-user-agent
  `);
        }
      }
      let C = "_N_T_", D = { shared: "shared", reactServerComponents: "rsc", serverSideRendering: "ssr", actionBrowser: "action-browser", apiNode: "api-node", apiEdge: "api-edge", middleware: "middleware", instrument: "instrument", edgeAsset: "edge-asset", appPagesBrowser: "app-pages-browser", pagesDirBrowser: "pages-dir-browser", pagesDirEdge: "pages-dir-edge", pagesDirNode: "pages-dir-node" };
      function E(a10) {
        var b10, c10, d10, e10, f10, g2 = [], h2 = 0;
        function i2() {
          for (; h2 < a10.length && /\s/.test(a10.charAt(h2)); ) h2 += 1;
          return h2 < a10.length;
        }
        for (; h2 < a10.length; ) {
          for (b10 = h2, f10 = false; i2(); ) if ("," === (c10 = a10.charAt(h2))) {
            for (d10 = h2, h2 += 1, i2(), e10 = h2; h2 < a10.length && "=" !== (c10 = a10.charAt(h2)) && ";" !== c10 && "," !== c10; ) h2 += 1;
            h2 < a10.length && "=" === a10.charAt(h2) ? (f10 = true, h2 = e10, g2.push(a10.substring(b10, d10)), b10 = h2) : h2 = d10 + 1;
          } else h2 += 1;
          (!f10 || h2 >= a10.length) && g2.push(a10.substring(b10, a10.length));
        }
        return g2;
      }
      function F(a10) {
        let b10 = {}, c10 = [];
        if (a10) for (let [d10, e10] of a10.entries()) "set-cookie" === d10.toLowerCase() ? (c10.push(...E(e10)), b10[d10] = 1 === c10.length ? c10[0] : c10) : b10[d10] = e10;
        return b10;
      }
      function G(a10) {
        try {
          return String(new URL(String(a10)));
        } catch (b10) {
          throw Object.defineProperty(Error(`URL is malformed "${String(a10)}". Please use only absolute URLs - https://nextjs.org/docs/messages/middleware-relative-urls`, { cause: b10 }), "__NEXT_ERROR_CODE", { value: "E61", enumerable: false, configurable: true });
        }
      }
      ({ ...D, GROUP: { builtinReact: [D.reactServerComponents, D.actionBrowser], serverOnly: [D.reactServerComponents, D.actionBrowser, D.instrument, D.middleware], neutralTarget: [D.apiNode, D.apiEdge], clientOnly: [D.serverSideRendering, D.appPagesBrowser], bundled: [D.reactServerComponents, D.actionBrowser, D.serverSideRendering, D.appPagesBrowser, D.shared, D.instrument, D.middleware], appPages: [D.reactServerComponents, D.serverSideRendering, D.appPagesBrowser, D.actionBrowser] } });
      let H = Symbol("response"), I = Symbol("passThrough"), J = Symbol("waitUntil");
      class K {
        constructor(a10, b10) {
          this[I] = false, this[J] = b10 ? { kind: "external", function: b10 } : { kind: "internal", promises: [] };
        }
        respondWith(a10) {
          this[H] || (this[H] = Promise.resolve(a10));
        }
        passThroughOnException() {
          this[I] = true;
        }
        waitUntil(a10) {
          if ("external" === this[J].kind) return (0, this[J].function)(a10);
          this[J].promises.push(a10);
        }
      }
      class L extends K {
        constructor(a10) {
          var b10;
          super(a10.request, null == (b10 = a10.context) ? void 0 : b10.waitUntil), this.sourcePage = a10.page;
        }
        get request() {
          throw Object.defineProperty(new z({ page: this.sourcePage }), "__NEXT_ERROR_CODE", { value: "E394", enumerable: false, configurable: true });
        }
        respondWith() {
          throw Object.defineProperty(new z({ page: this.sourcePage }), "__NEXT_ERROR_CODE", { value: "E394", enumerable: false, configurable: true });
        }
      }
      function M(a10) {
        return a10.replace(/\/$/, "") || "/";
      }
      function N(a10) {
        let b10 = a10.indexOf("#"), c10 = a10.indexOf("?"), d10 = c10 > -1 && (b10 < 0 || c10 < b10);
        return d10 || b10 > -1 ? { pathname: a10.substring(0, d10 ? c10 : b10), query: d10 ? a10.substring(c10, b10 > -1 ? b10 : void 0) : "", hash: b10 > -1 ? a10.slice(b10) : "" } : { pathname: a10, query: "", hash: "" };
      }
      function O(a10, b10) {
        if (!a10.startsWith("/") || !b10) return a10;
        let { pathname: c10, query: d10, hash: e10 } = N(a10);
        return "" + b10 + c10 + d10 + e10;
      }
      function P(a10, b10) {
        if (!a10.startsWith("/") || !b10) return a10;
        let { pathname: c10, query: d10, hash: e10 } = N(a10);
        return "" + c10 + b10 + d10 + e10;
      }
      function Q(a10, b10) {
        if ("string" != typeof a10) return false;
        let { pathname: c10 } = N(a10);
        return c10 === b10 || c10.startsWith(b10 + "/");
      }
      let R = /* @__PURE__ */ new WeakMap();
      function S(a10, b10) {
        let c10;
        if (!b10) return { pathname: a10 };
        let d10 = R.get(b10);
        d10 || (d10 = b10.map((a11) => a11.toLowerCase()), R.set(b10, d10));
        let e10 = a10.split("/", 2);
        if (!e10[1]) return { pathname: a10 };
        let f10 = e10[1].toLowerCase(), g2 = d10.indexOf(f10);
        return g2 < 0 ? { pathname: a10 } : (c10 = b10[g2], { pathname: a10 = a10.slice(c10.length + 1) || "/", detectedLocale: c10 });
      }
      let T = /(?!^https?:\/\/)(127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}|\[::1\]|localhost)/;
      function U(a10, b10) {
        return new URL(String(a10).replace(T, "localhost"), b10 && String(b10).replace(T, "localhost"));
      }
      let V = Symbol("NextURLInternal");
      class W {
        constructor(a10, b10, c10) {
          let d10, e10;
          "object" == typeof b10 && "pathname" in b10 || "string" == typeof b10 ? (d10 = b10, e10 = c10 || {}) : e10 = c10 || b10 || {}, this[V] = { url: U(a10, d10 ?? e10.base), options: e10, basePath: "" }, this.analyze();
        }
        analyze() {
          var a10, b10, c10, d10, e10;
          let f10 = function(a11, b11) {
            var c11, d11;
            let { basePath: e11, i18n: f11, trailingSlash: g3 } = null != (c11 = b11.nextConfig) ? c11 : {}, h3 = { pathname: a11, trailingSlash: "/" !== a11 ? a11.endsWith("/") : g3 };
            e11 && Q(h3.pathname, e11) && (h3.pathname = function(a12, b12) {
              if (!Q(a12, b12)) return a12;
              let c12 = a12.slice(b12.length);
              return c12.startsWith("/") ? c12 : "/" + c12;
            }(h3.pathname, e11), h3.basePath = e11);
            let i2 = h3.pathname;
            if (h3.pathname.startsWith("/_next/data/") && h3.pathname.endsWith(".json")) {
              let a12 = h3.pathname.replace(/^\/_next\/data\//, "").replace(/\.json$/, "").split("/");
              h3.buildId = a12[0], i2 = "index" !== a12[1] ? "/" + a12.slice(1).join("/") : "/", true === b11.parseData && (h3.pathname = i2);
            }
            if (f11) {
              let a12 = b11.i18nProvider ? b11.i18nProvider.analyze(h3.pathname) : S(h3.pathname, f11.locales);
              h3.locale = a12.detectedLocale, h3.pathname = null != (d11 = a12.pathname) ? d11 : h3.pathname, !a12.detectedLocale && h3.buildId && (a12 = b11.i18nProvider ? b11.i18nProvider.analyze(i2) : S(i2, f11.locales)).detectedLocale && (h3.locale = a12.detectedLocale);
            }
            return h3;
          }(this[V].url.pathname, { nextConfig: this[V].options.nextConfig, parseData: true, i18nProvider: this[V].options.i18nProvider }), g2 = function(a11, b11) {
            let c11;
            if ((null == b11 ? void 0 : b11.host) && !Array.isArray(b11.host)) c11 = b11.host.toString().split(":", 1)[0];
            else {
              if (!a11.hostname) return;
              c11 = a11.hostname;
            }
            return c11.toLowerCase();
          }(this[V].url, this[V].options.headers);
          this[V].domainLocale = this[V].options.i18nProvider ? this[V].options.i18nProvider.detectDomainLocale(g2) : function(a11, b11, c11) {
            if (a11) for (let f11 of (c11 && (c11 = c11.toLowerCase()), a11)) {
              var d11, e11;
              if (b11 === (null == (d11 = f11.domain) ? void 0 : d11.split(":", 1)[0].toLowerCase()) || c11 === f11.defaultLocale.toLowerCase() || (null == (e11 = f11.locales) ? void 0 : e11.some((a12) => a12.toLowerCase() === c11))) return f11;
            }
          }(null == (b10 = this[V].options.nextConfig) || null == (a10 = b10.i18n) ? void 0 : a10.domains, g2);
          let h2 = (null == (c10 = this[V].domainLocale) ? void 0 : c10.defaultLocale) || (null == (e10 = this[V].options.nextConfig) || null == (d10 = e10.i18n) ? void 0 : d10.defaultLocale);
          this[V].url.pathname = f10.pathname, this[V].defaultLocale = h2, this[V].basePath = f10.basePath ?? "", this[V].buildId = f10.buildId, this[V].locale = f10.locale ?? h2, this[V].trailingSlash = f10.trailingSlash;
        }
        formatPathname() {
          var a10;
          let b10;
          return b10 = function(a11, b11, c10, d10) {
            if (!b11 || b11 === c10) return a11;
            let e10 = a11.toLowerCase();
            return !d10 && (Q(e10, "/api") || Q(e10, "/" + b11.toLowerCase())) ? a11 : O(a11, "/" + b11);
          }((a10 = { basePath: this[V].basePath, buildId: this[V].buildId, defaultLocale: this[V].options.forceLocale ? void 0 : this[V].defaultLocale, locale: this[V].locale, pathname: this[V].url.pathname, trailingSlash: this[V].trailingSlash }).pathname, a10.locale, a10.buildId ? void 0 : a10.defaultLocale, a10.ignorePrefix), (a10.buildId || !a10.trailingSlash) && (b10 = M(b10)), a10.buildId && (b10 = P(O(b10, "/_next/data/" + a10.buildId), "/" === a10.pathname ? "index.json" : ".json")), b10 = O(b10, a10.basePath), !a10.buildId && a10.trailingSlash ? b10.endsWith("/") ? b10 : P(b10, "/") : M(b10);
        }
        formatSearch() {
          return this[V].url.search;
        }
        get buildId() {
          return this[V].buildId;
        }
        set buildId(a10) {
          this[V].buildId = a10;
        }
        get locale() {
          return this[V].locale ?? "";
        }
        set locale(a10) {
          var b10, c10;
          if (!this[V].locale || !(null == (c10 = this[V].options.nextConfig) || null == (b10 = c10.i18n) ? void 0 : b10.locales.includes(a10))) throw Object.defineProperty(TypeError(`The NextURL configuration includes no locale "${a10}"`), "__NEXT_ERROR_CODE", { value: "E597", enumerable: false, configurable: true });
          this[V].locale = a10;
        }
        get defaultLocale() {
          return this[V].defaultLocale;
        }
        get domainLocale() {
          return this[V].domainLocale;
        }
        get searchParams() {
          return this[V].url.searchParams;
        }
        get host() {
          return this[V].url.host;
        }
        set host(a10) {
          this[V].url.host = a10;
        }
        get hostname() {
          return this[V].url.hostname;
        }
        set hostname(a10) {
          this[V].url.hostname = a10;
        }
        get port() {
          return this[V].url.port;
        }
        set port(a10) {
          this[V].url.port = a10;
        }
        get protocol() {
          return this[V].url.protocol;
        }
        set protocol(a10) {
          this[V].url.protocol = a10;
        }
        get href() {
          let a10 = this.formatPathname(), b10 = this.formatSearch();
          return `${this.protocol}//${this.host}${a10}${b10}${this.hash}`;
        }
        set href(a10) {
          this[V].url = U(a10), this.analyze();
        }
        get origin() {
          return this[V].url.origin;
        }
        get pathname() {
          return this[V].url.pathname;
        }
        set pathname(a10) {
          this[V].url.pathname = a10;
        }
        get hash() {
          return this[V].url.hash;
        }
        set hash(a10) {
          this[V].url.hash = a10;
        }
        get search() {
          return this[V].url.search;
        }
        set search(a10) {
          this[V].url.search = a10;
        }
        get password() {
          return this[V].url.password;
        }
        set password(a10) {
          this[V].url.password = a10;
        }
        get username() {
          return this[V].url.username;
        }
        set username(a10) {
          this[V].url.username = a10;
        }
        get basePath() {
          return this[V].basePath;
        }
        set basePath(a10) {
          this[V].basePath = a10.startsWith("/") ? a10 : `/${a10}`;
        }
        toString() {
          return this.href;
        }
        toJSON() {
          return this.href;
        }
        [Symbol.for("edge-runtime.inspect.custom")]() {
          return { href: this.href, origin: this.origin, protocol: this.protocol, username: this.username, password: this.password, host: this.host, hostname: this.hostname, port: this.port, pathname: this.pathname, search: this.search, searchParams: this.searchParams, hash: this.hash };
        }
        clone() {
          return new W(String(this), this[V].options);
        }
      }
      var X = c(376);
      let Y = Symbol("internal request");
      class Z extends Request {
        constructor(a10, b10 = {}) {
          let c10 = "string" != typeof a10 && "url" in a10 ? a10.url : String(a10);
          G(c10), a10 instanceof Request ? super(a10, b10) : super(c10, b10);
          let d10 = new W(c10, { headers: F(this.headers), nextConfig: b10.nextConfig });
          this[Y] = { cookies: new X.RequestCookies(this.headers), nextUrl: d10, url: d10.toString() };
        }
        [Symbol.for("edge-runtime.inspect.custom")]() {
          return { cookies: this.cookies, nextUrl: this.nextUrl, url: this.url, bodyUsed: this.bodyUsed, cache: this.cache, credentials: this.credentials, destination: this.destination, headers: Object.fromEntries(this.headers), integrity: this.integrity, keepalive: this.keepalive, method: this.method, mode: this.mode, redirect: this.redirect, referrer: this.referrer, referrerPolicy: this.referrerPolicy, signal: this.signal };
        }
        get cookies() {
          return this[Y].cookies;
        }
        get nextUrl() {
          return this[Y].nextUrl;
        }
        get page() {
          throw new A();
        }
        get ua() {
          throw new B();
        }
        get url() {
          return this[Y].url;
        }
      }
      class $ {
        static get(a10, b10, c10) {
          let d10 = Reflect.get(a10, b10, c10);
          return "function" == typeof d10 ? d10.bind(a10) : d10;
        }
        static set(a10, b10, c10, d10) {
          return Reflect.set(a10, b10, c10, d10);
        }
        static has(a10, b10) {
          return Reflect.has(a10, b10);
        }
        static deleteProperty(a10, b10) {
          return Reflect.deleteProperty(a10, b10);
        }
      }
      let _ = Symbol("internal response"), aa = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
      function ab(a10, b10) {
        var c10;
        if (null == a10 || null == (c10 = a10.request) ? void 0 : c10.headers) {
          if (!(a10.request.headers instanceof Headers)) throw Object.defineProperty(Error("request.headers must be an instance of Headers"), "__NEXT_ERROR_CODE", { value: "E119", enumerable: false, configurable: true });
          let c11 = [];
          for (let [d10, e10] of a10.request.headers) b10.set("x-middleware-request-" + d10, e10), c11.push(d10);
          b10.set("x-middleware-override-headers", c11.join(","));
        }
      }
      class ac extends Response {
        constructor(a10, b10 = {}) {
          super(a10, b10);
          let c10 = this.headers, d10 = new Proxy(new X.ResponseCookies(c10), { get(a11, d11, e10) {
            switch (d11) {
              case "delete":
              case "set":
                return (...e11) => {
                  let f10 = Reflect.apply(a11[d11], a11, e11), g2 = new Headers(c10);
                  return f10 instanceof X.ResponseCookies && c10.set("x-middleware-set-cookie", f10.getAll().map((a12) => (0, X.stringifyCookie)(a12)).join(",")), ab(b10, g2), f10;
                };
              default:
                return $.get(a11, d11, e10);
            }
          } });
          this[_] = { cookies: d10, url: b10.url ? new W(b10.url, { headers: F(c10), nextConfig: b10.nextConfig }) : void 0 };
        }
        [Symbol.for("edge-runtime.inspect.custom")]() {
          return { cookies: this.cookies, url: this.url, body: this.body, bodyUsed: this.bodyUsed, headers: Object.fromEntries(this.headers), ok: this.ok, redirected: this.redirected, status: this.status, statusText: this.statusText, type: this.type };
        }
        get cookies() {
          return this[_].cookies;
        }
        static json(a10, b10) {
          let c10 = Response.json(a10, b10);
          return new ac(c10.body, c10);
        }
        static redirect(a10, b10) {
          let c10 = "number" == typeof b10 ? b10 : (null == b10 ? void 0 : b10.status) ?? 307;
          if (!aa.has(c10)) throw Object.defineProperty(RangeError('Failed to execute "redirect" on "response": Invalid status code'), "__NEXT_ERROR_CODE", { value: "E529", enumerable: false, configurable: true });
          let d10 = "object" == typeof b10 ? b10 : {}, e10 = new Headers(null == d10 ? void 0 : d10.headers);
          return e10.set("Location", G(a10)), new ac(null, { ...d10, headers: e10, status: c10 });
        }
        static rewrite(a10, b10) {
          let c10 = new Headers(null == b10 ? void 0 : b10.headers);
          return c10.set("x-middleware-rewrite", G(a10)), ab(b10, c10), new ac(null, { ...b10, headers: c10 });
        }
        static next(a10) {
          let b10 = new Headers(null == a10 ? void 0 : a10.headers);
          return b10.set("x-middleware-next", "1"), ab(a10, b10), new ac(null, { ...a10, headers: b10 });
        }
      }
      function ad(a10, b10) {
        let c10 = "string" == typeof b10 ? new URL(b10) : b10, d10 = new URL(a10, b10), e10 = d10.origin === c10.origin;
        return { url: e10 ? d10.toString().slice(c10.origin.length) : d10.toString(), isRelative: e10 };
      }
      let ae = "next-router-prefetch", af = ["rsc", "next-router-state-tree", ae, "next-hmr-refresh", "next-router-segment-prefetch"], ag = "_rsc";
      class ah extends Error {
        constructor() {
          super("Headers cannot be modified. Read more: https://nextjs.org/docs/app/api-reference/functions/headers");
        }
        static callable() {
          throw new ah();
        }
      }
      class ai extends Headers {
        constructor(a10) {
          super(), this.headers = new Proxy(a10, { get(b10, c10, d10) {
            if ("symbol" == typeof c10) return $.get(b10, c10, d10);
            let e10 = c10.toLowerCase(), f10 = Object.keys(a10).find((a11) => a11.toLowerCase() === e10);
            if (void 0 !== f10) return $.get(b10, f10, d10);
          }, set(b10, c10, d10, e10) {
            if ("symbol" == typeof c10) return $.set(b10, c10, d10, e10);
            let f10 = c10.toLowerCase(), g2 = Object.keys(a10).find((a11) => a11.toLowerCase() === f10);
            return $.set(b10, g2 ?? c10, d10, e10);
          }, has(b10, c10) {
            if ("symbol" == typeof c10) return $.has(b10, c10);
            let d10 = c10.toLowerCase(), e10 = Object.keys(a10).find((a11) => a11.toLowerCase() === d10);
            return void 0 !== e10 && $.has(b10, e10);
          }, deleteProperty(b10, c10) {
            if ("symbol" == typeof c10) return $.deleteProperty(b10, c10);
            let d10 = c10.toLowerCase(), e10 = Object.keys(a10).find((a11) => a11.toLowerCase() === d10);
            return void 0 === e10 || $.deleteProperty(b10, e10);
          } });
        }
        static seal(a10) {
          return new Proxy(a10, { get(a11, b10, c10) {
            switch (b10) {
              case "append":
              case "delete":
              case "set":
                return ah.callable;
              default:
                return $.get(a11, b10, c10);
            }
          } });
        }
        merge(a10) {
          return Array.isArray(a10) ? a10.join(", ") : a10;
        }
        static from(a10) {
          return a10 instanceof Headers ? a10 : new ai(a10);
        }
        append(a10, b10) {
          let c10 = this.headers[a10];
          "string" == typeof c10 ? this.headers[a10] = [c10, b10] : Array.isArray(c10) ? c10.push(b10) : this.headers[a10] = b10;
        }
        delete(a10) {
          delete this.headers[a10];
        }
        get(a10) {
          let b10 = this.headers[a10];
          return void 0 !== b10 ? this.merge(b10) : null;
        }
        has(a10) {
          return void 0 !== this.headers[a10];
        }
        set(a10, b10) {
          this.headers[a10] = b10;
        }
        forEach(a10, b10) {
          for (let [c10, d10] of this.entries()) a10.call(b10, d10, c10, this);
        }
        *entries() {
          for (let a10 of Object.keys(this.headers)) {
            let b10 = a10.toLowerCase(), c10 = this.get(b10);
            yield [b10, c10];
          }
        }
        *keys() {
          for (let a10 of Object.keys(this.headers)) {
            let b10 = a10.toLowerCase();
            yield b10;
          }
        }
        *values() {
          for (let a10 of Object.keys(this.headers)) {
            let b10 = this.get(a10);
            yield b10;
          }
        }
        [Symbol.iterator]() {
          return this.entries();
        }
      }
      let aj = Object.defineProperty(Error("Invariant: AsyncLocalStorage accessed in runtime where it is not available"), "__NEXT_ERROR_CODE", { value: "E504", enumerable: false, configurable: true });
      class ak {
        disable() {
          throw aj;
        }
        getStore() {
        }
        run() {
          throw aj;
        }
        exit() {
          throw aj;
        }
        enterWith() {
          throw aj;
        }
        static bind(a10) {
          return a10;
        }
      }
      let al = "undefined" != typeof globalThis && globalThis.AsyncLocalStorage;
      function am() {
        return al ? new al() : new ak();
      }
      let an = am();
      class ao extends Error {
        constructor() {
          super("Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#options");
        }
        static callable() {
          throw new ao();
        }
      }
      class ap {
        static seal(a10) {
          return new Proxy(a10, { get(a11, b10, c10) {
            switch (b10) {
              case "clear":
              case "delete":
              case "set":
                return ao.callable;
              default:
                return $.get(a11, b10, c10);
            }
          } });
        }
      }
      let aq = Symbol.for("next.mutated.cookies");
      class ar {
        static wrap(a10, b10) {
          let c10 = new X.ResponseCookies(new Headers());
          for (let b11 of a10.getAll()) c10.set(b11);
          let d10 = [], e10 = /* @__PURE__ */ new Set(), f10 = () => {
            let a11 = an.getStore();
            if (a11 && (a11.pathWasRevalidated = true), d10 = c10.getAll().filter((a12) => e10.has(a12.name)), b10) {
              let a12 = [];
              for (let b11 of d10) {
                let c11 = new X.ResponseCookies(new Headers());
                c11.set(b11), a12.push(c11.toString());
              }
              b10(a12);
            }
          }, g2 = new Proxy(c10, { get(a11, b11, c11) {
            switch (b11) {
              case aq:
                return d10;
              case "delete":
                return function(...b12) {
                  e10.add("string" == typeof b12[0] ? b12[0] : b12[0].name);
                  try {
                    return a11.delete(...b12), g2;
                  } finally {
                    f10();
                  }
                };
              case "set":
                return function(...b12) {
                  e10.add("string" == typeof b12[0] ? b12[0] : b12[0].name);
                  try {
                    return a11.set(...b12), g2;
                  } finally {
                    f10();
                  }
                };
              default:
                return $.get(a11, b11, c11);
            }
          } });
          return g2;
        }
      }
      function as(a10, b10) {
        if ("action" !== a10.phase) throw new ao();
      }
      var at = function(a10) {
        return a10.handleRequest = "BaseServer.handleRequest", a10.run = "BaseServer.run", a10.pipe = "BaseServer.pipe", a10.getStaticHTML = "BaseServer.getStaticHTML", a10.render = "BaseServer.render", a10.renderToResponseWithComponents = "BaseServer.renderToResponseWithComponents", a10.renderToResponse = "BaseServer.renderToResponse", a10.renderToHTML = "BaseServer.renderToHTML", a10.renderError = "BaseServer.renderError", a10.renderErrorToResponse = "BaseServer.renderErrorToResponse", a10.renderErrorToHTML = "BaseServer.renderErrorToHTML", a10.render404 = "BaseServer.render404", a10;
      }(at || {}), au = function(a10) {
        return a10.loadDefaultErrorComponents = "LoadComponents.loadDefaultErrorComponents", a10.loadComponents = "LoadComponents.loadComponents", a10;
      }(au || {}), av = function(a10) {
        return a10.getRequestHandler = "NextServer.getRequestHandler", a10.getServer = "NextServer.getServer", a10.getServerRequestHandler = "NextServer.getServerRequestHandler", a10.createServer = "createServer.createServer", a10;
      }(av || {}), aw = function(a10) {
        return a10.compression = "NextNodeServer.compression", a10.getBuildId = "NextNodeServer.getBuildId", a10.createComponentTree = "NextNodeServer.createComponentTree", a10.clientComponentLoading = "NextNodeServer.clientComponentLoading", a10.getLayoutOrPageModule = "NextNodeServer.getLayoutOrPageModule", a10.generateStaticRoutes = "NextNodeServer.generateStaticRoutes", a10.generateFsStaticRoutes = "NextNodeServer.generateFsStaticRoutes", a10.generatePublicRoutes = "NextNodeServer.generatePublicRoutes", a10.generateImageRoutes = "NextNodeServer.generateImageRoutes.route", a10.sendRenderResult = "NextNodeServer.sendRenderResult", a10.proxyRequest = "NextNodeServer.proxyRequest", a10.runApi = "NextNodeServer.runApi", a10.render = "NextNodeServer.render", a10.renderHTML = "NextNodeServer.renderHTML", a10.imageOptimizer = "NextNodeServer.imageOptimizer", a10.getPagePath = "NextNodeServer.getPagePath", a10.getRoutesManifest = "NextNodeServer.getRoutesManifest", a10.findPageComponents = "NextNodeServer.findPageComponents", a10.getFontManifest = "NextNodeServer.getFontManifest", a10.getServerComponentManifest = "NextNodeServer.getServerComponentManifest", a10.getRequestHandler = "NextNodeServer.getRequestHandler", a10.renderToHTML = "NextNodeServer.renderToHTML", a10.renderError = "NextNodeServer.renderError", a10.renderErrorToHTML = "NextNodeServer.renderErrorToHTML", a10.render404 = "NextNodeServer.render404", a10.startResponse = "NextNodeServer.startResponse", a10.route = "route", a10.onProxyReq = "onProxyReq", a10.apiResolver = "apiResolver", a10.internalFetch = "internalFetch", a10;
      }(aw || {}), ax = function(a10) {
        return a10.startServer = "startServer.startServer", a10;
      }(ax || {}), ay = function(a10) {
        return a10.getServerSideProps = "Render.getServerSideProps", a10.getStaticProps = "Render.getStaticProps", a10.renderToString = "Render.renderToString", a10.renderDocument = "Render.renderDocument", a10.createBodyResult = "Render.createBodyResult", a10;
      }(ay || {}), az = function(a10) {
        return a10.renderToString = "AppRender.renderToString", a10.renderToReadableStream = "AppRender.renderToReadableStream", a10.getBodyResult = "AppRender.getBodyResult", a10.fetch = "AppRender.fetch", a10;
      }(az || {}), aA = function(a10) {
        return a10.executeRoute = "Router.executeRoute", a10;
      }(aA || {}), aB = function(a10) {
        return a10.runHandler = "Node.runHandler", a10;
      }(aB || {}), aC = function(a10) {
        return a10.runHandler = "AppRouteRouteHandlers.runHandler", a10;
      }(aC || {}), aD = function(a10) {
        return a10.generateMetadata = "ResolveMetadata.generateMetadata", a10.generateViewport = "ResolveMetadata.generateViewport", a10;
      }(aD || {}), aE = function(a10) {
        return a10.execute = "Middleware.execute", a10;
      }(aE || {});
      let aF = /* @__PURE__ */ new Set(["Middleware.execute", "BaseServer.handleRequest", "Render.getServerSideProps", "Render.getStaticProps", "AppRender.fetch", "AppRender.getBodyResult", "Render.renderDocument", "Node.runHandler", "AppRouteRouteHandlers.runHandler", "ResolveMetadata.generateMetadata", "ResolveMetadata.generateViewport", "NextNodeServer.createComponentTree", "NextNodeServer.findPageComponents", "NextNodeServer.getLayoutOrPageModule", "NextNodeServer.startResponse", "NextNodeServer.clientComponentLoading"]), aG = /* @__PURE__ */ new Set(["NextNodeServer.findPageComponents", "NextNodeServer.createComponentTree", "NextNodeServer.clientComponentLoading"]);
      function aH(a10) {
        return null !== a10 && "object" == typeof a10 && "then" in a10 && "function" == typeof a10.then;
      }
      let aI = process.env.NEXT_OTEL_PERFORMANCE_PREFIX, { context: aJ, propagation: aK, trace: aL, SpanStatusCode: aM, SpanKind: aN, ROOT_CONTEXT: aO } = d = c(822);
      class aP extends Error {
        constructor(a10, b10) {
          super(), this.bubble = a10, this.result = b10;
        }
      }
      let aQ = (a10, b10) => {
        (function(a11) {
          return "object" == typeof a11 && null !== a11 && a11 instanceof aP;
        })(b10) && b10.bubble ? a10.setAttribute("next.bubble", true) : (b10 && (a10.recordException(b10), a10.setAttribute("error.type", b10.name)), a10.setStatus({ code: aM.ERROR, message: null == b10 ? void 0 : b10.message })), a10.end();
      }, aR = /* @__PURE__ */ new Map(), aS = d.createContextKey("next.rootSpanId"), aT = 0, aU = { set(a10, b10, c10) {
        a10.push({ key: b10, value: c10 });
      } };
      class aV {
        getTracerInstance() {
          return aL.getTracer("next.js", "0.0.1");
        }
        getContext() {
          return aJ;
        }
        getTracePropagationData() {
          let a10 = aJ.active(), b10 = [];
          return aK.inject(a10, b10, aU), b10;
        }
        getActiveScopeSpan() {
          return aL.getSpan(null == aJ ? void 0 : aJ.active());
        }
        withPropagatedContext(a10, b10, c10) {
          let d10 = aJ.active();
          if (aL.getSpanContext(d10)) return b10();
          let e10 = aK.extract(d10, a10, c10);
          return aJ.with(e10, b10);
        }
        trace(...a10) {
          var b10;
          let [c10, d10, e10] = a10, { fn: f10, options: g2 } = "function" == typeof d10 ? { fn: d10, options: {} } : { fn: e10, options: { ...d10 } }, h2 = g2.spanName ?? c10;
          if (!aF.has(c10) && "1" !== process.env.NEXT_OTEL_VERBOSE || g2.hideSpan) return f10();
          let i2 = this.getSpanContext((null == g2 ? void 0 : g2.parentSpan) ?? this.getActiveScopeSpan()), j2 = false;
          i2 ? (null == (b10 = aL.getSpanContext(i2)) ? void 0 : b10.isRemote) && (j2 = true) : (i2 = (null == aJ ? void 0 : aJ.active()) ?? aO, j2 = true);
          let k2 = aT++;
          return g2.attributes = { "next.span_name": h2, "next.span_type": c10, ...g2.attributes }, aJ.with(i2.setValue(aS, k2), () => this.getTracerInstance().startActiveSpan(h2, g2, (a11) => {
            let b11;
            aI && c10 && aG.has(c10) && (b11 = "performance" in globalThis && "measure" in performance ? globalThis.performance.now() : void 0);
            let d11 = false, e11 = () => {
              !d11 && (d11 = true, aR.delete(k2), b11 && performance.measure(`${aI}:next-${(c10.split(".").pop() || "").replace(/[A-Z]/g, (a12) => "-" + a12.toLowerCase())}`, { start: b11, end: performance.now() }));
            };
            if (j2 && aR.set(k2, new Map(Object.entries(g2.attributes ?? {}))), f10.length > 1) try {
              return f10(a11, (b12) => aQ(a11, b12));
            } catch (b12) {
              throw aQ(a11, b12), b12;
            } finally {
              e11();
            }
            try {
              let b12 = f10(a11);
              if (aH(b12)) return b12.then((b13) => (a11.end(), b13)).catch((b13) => {
                throw aQ(a11, b13), b13;
              }).finally(e11);
              return a11.end(), e11(), b12;
            } catch (b12) {
              throw aQ(a11, b12), e11(), b12;
            }
          }));
        }
        wrap(...a10) {
          let b10 = this, [c10, d10, e10] = 3 === a10.length ? a10 : [a10[0], {}, a10[1]];
          return aF.has(c10) || "1" === process.env.NEXT_OTEL_VERBOSE ? function() {
            let a11 = d10;
            "function" == typeof a11 && "function" == typeof e10 && (a11 = a11.apply(this, arguments));
            let f10 = arguments.length - 1, g2 = arguments[f10];
            if ("function" != typeof g2) return b10.trace(c10, a11, () => e10.apply(this, arguments));
            {
              let d11 = b10.getContext().bind(aJ.active(), g2);
              return b10.trace(c10, a11, (a12, b11) => (arguments[f10] = function(a13) {
                return null == b11 || b11(a13), d11.apply(this, arguments);
              }, e10.apply(this, arguments)));
            }
          } : e10;
        }
        startSpan(...a10) {
          let [b10, c10] = a10, d10 = this.getSpanContext((null == c10 ? void 0 : c10.parentSpan) ?? this.getActiveScopeSpan());
          return this.getTracerInstance().startSpan(b10, c10, d10);
        }
        getSpanContext(a10) {
          return a10 ? aL.setSpan(aJ.active(), a10) : void 0;
        }
        getRootSpanAttributes() {
          let a10 = aJ.active().getValue(aS);
          return aR.get(a10);
        }
        setRootSpanAttribute(a10, b10) {
          let c10 = aJ.active().getValue(aS), d10 = aR.get(c10);
          d10 && d10.set(a10, b10);
        }
      }
      let aW = (() => {
        let a10 = new aV();
        return () => a10;
      })(), aX = "__prerender_bypass";
      Symbol("__next_preview_data"), Symbol(aX);
      class aY {
        constructor(a10, b10, c10, d10) {
          var e10;
          let f10 = a10 && function(a11, b11) {
            let c11 = ai.from(a11.headers);
            return { isOnDemandRevalidate: c11.get("x-prerender-revalidate") === b11.previewModeId, revalidateOnlyGenerated: c11.has("x-prerender-revalidate-if-generated") };
          }(b10, a10).isOnDemandRevalidate, g2 = null == (e10 = c10.get(aX)) ? void 0 : e10.value;
          this._isEnabled = !!(!f10 && g2 && a10 && g2 === a10.previewModeId), this._previewModeId = null == a10 ? void 0 : a10.previewModeId, this._mutableCookies = d10;
        }
        get isEnabled() {
          return this._isEnabled;
        }
        enable() {
          if (!this._previewModeId) throw Object.defineProperty(Error("Invariant: previewProps missing previewModeId this should never happen"), "__NEXT_ERROR_CODE", { value: "E93", enumerable: false, configurable: true });
          this._mutableCookies.set({ name: aX, value: this._previewModeId, httpOnly: true, sameSite: "none", secure: true, path: "/" }), this._isEnabled = true;
        }
        disable() {
          this._mutableCookies.set({ name: aX, value: "", httpOnly: true, sameSite: "none", secure: true, path: "/", expires: /* @__PURE__ */ new Date(0) }), this._isEnabled = false;
        }
      }
      function aZ(a10, b10) {
        if ("x-middleware-set-cookie" in a10.headers && "string" == typeof a10.headers["x-middleware-set-cookie"]) {
          let c10 = a10.headers["x-middleware-set-cookie"], d10 = new Headers();
          for (let a11 of E(c10)) d10.append("set-cookie", a11);
          for (let a11 of new X.ResponseCookies(d10).getAll()) b10.set(a11);
        }
      }
      let a$ = am();
      var a_ = c(294), a0 = c.n(a_);
      class a1 extends Error {
        constructor(a10, b10) {
          super("Invariant: " + (a10.endsWith(".") ? a10 : a10 + ".") + " This is a bug in Next.js.", b10), this.name = "InvariantError";
        }
      }
      class a2 {
        constructor(a10, b10, c10) {
          this.prev = null, this.next = null, this.key = a10, this.data = b10, this.size = c10;
        }
      }
      class a3 {
        constructor() {
          this.prev = null, this.next = null;
        }
      }
      class a4 {
        constructor(a10, b10, c10) {
          this.cache = /* @__PURE__ */ new Map(), this.totalSize = 0, this.maxSize = a10, this.calculateSize = b10, this.onEvict = c10, this.head = new a3(), this.tail = new a3(), this.head.next = this.tail, this.tail.prev = this.head;
        }
        addToHead(a10) {
          a10.prev = this.head, a10.next = this.head.next, this.head.next.prev = a10, this.head.next = a10;
        }
        removeNode(a10) {
          a10.prev.next = a10.next, a10.next.prev = a10.prev;
        }
        moveToHead(a10) {
          this.removeNode(a10), this.addToHead(a10);
        }
        removeTail() {
          let a10 = this.tail.prev;
          return this.removeNode(a10), a10;
        }
        set(a10, b10) {
          let c10 = (null == this.calculateSize ? void 0 : this.calculateSize.call(this, b10)) ?? 1;
          if (c10 <= 0) throw Object.defineProperty(Error(`LRUCache: calculateSize returned ${c10}, but size must be > 0. Items with size 0 would never be evicted, causing unbounded cache growth.`), "__NEXT_ERROR_CODE", { value: "E789", enumerable: false, configurable: true });
          if (c10 > this.maxSize) return console.warn("Single item size exceeds maxSize"), false;
          let d10 = this.cache.get(a10);
          if (d10) d10.data = b10, this.totalSize = this.totalSize - d10.size + c10, d10.size = c10, this.moveToHead(d10);
          else {
            let d11 = new a2(a10, b10, c10);
            this.cache.set(a10, d11), this.addToHead(d11), this.totalSize += c10;
          }
          for (; this.totalSize > this.maxSize && this.cache.size > 0; ) {
            let a11 = this.removeTail();
            this.cache.delete(a11.key), this.totalSize -= a11.size, null == this.onEvict || this.onEvict.call(this, a11.key, a11.data);
          }
          return true;
        }
        has(a10) {
          return this.cache.has(a10);
        }
        get(a10) {
          let b10 = this.cache.get(a10);
          if (b10) return this.moveToHead(b10), b10.data;
        }
        *[Symbol.iterator]() {
          let a10 = this.head.next;
          for (; a10 && a10 !== this.tail; ) {
            let b10 = a10;
            yield [b10.key, b10.data], a10 = a10.next;
          }
        }
        remove(a10) {
          let b10 = this.cache.get(a10);
          b10 && (this.removeNode(b10), this.cache.delete(a10), this.totalSize -= b10.size);
        }
        get size() {
          return this.cache.size;
        }
        get currentSize() {
          return this.totalSize;
        }
      }
      c(356).Buffer, new a4(52428800, (a10) => a10.size), process.env.NEXT_PRIVATE_DEBUG_CACHE && console.debug.bind(console, "DefaultCacheHandler:"), process.env.NEXT_PRIVATE_DEBUG_CACHE && ((a10, ...b10) => {
        console.log(`use-cache: ${a10}`, ...b10);
      }), Symbol.for("@next/cache-handlers");
      let a5 = Symbol.for("@next/cache-handlers-map"), a6 = Symbol.for("@next/cache-handlers-set"), a7 = globalThis;
      function a8() {
        if (a7[a5]) return a7[a5].entries();
      }
      async function a9(a10, b10) {
        if (!a10) return b10();
        let c10 = ba(a10);
        try {
          return await b10();
        } finally {
          let b11 = function(a11, b12) {
            let c11 = new Set(a11.pendingRevalidatedTags), d10 = new Set(a11.pendingRevalidateWrites);
            return { pendingRevalidatedTags: b12.pendingRevalidatedTags.filter((a12) => !c11.has(a12)), pendingRevalidates: Object.fromEntries(Object.entries(b12.pendingRevalidates).filter(([b13]) => !(b13 in a11.pendingRevalidates))), pendingRevalidateWrites: b12.pendingRevalidateWrites.filter((a12) => !d10.has(a12)) };
          }(c10, ba(a10));
          await bc(a10, b11);
        }
      }
      function ba(a10) {
        return { pendingRevalidatedTags: a10.pendingRevalidatedTags ? [...a10.pendingRevalidatedTags] : [], pendingRevalidates: { ...a10.pendingRevalidates }, pendingRevalidateWrites: a10.pendingRevalidateWrites ? [...a10.pendingRevalidateWrites] : [] };
      }
      async function bb(a10, b10) {
        if (0 === a10.length) return;
        let c10 = [];
        b10 && c10.push(b10.revalidateTag(a10));
        let d10 = function() {
          if (a7[a6]) return a7[a6].values();
        }();
        if (d10) for (let b11 of d10) c10.push(b11.expireTags(...a10));
        await Promise.all(c10);
      }
      async function bc(a10, b10) {
        let c10 = (null == b10 ? void 0 : b10.pendingRevalidatedTags) ?? a10.pendingRevalidatedTags ?? [], d10 = (null == b10 ? void 0 : b10.pendingRevalidates) ?? a10.pendingRevalidates ?? {}, e10 = (null == b10 ? void 0 : b10.pendingRevalidateWrites) ?? a10.pendingRevalidateWrites ?? [];
        return Promise.all([bb(c10, a10.incrementalCache), ...Object.values(d10), ...e10]);
      }
      let bd = Object.defineProperty(Error("Invariant: AsyncLocalStorage accessed in runtime where it is not available"), "__NEXT_ERROR_CODE", { value: "E504", enumerable: false, configurable: true });
      class be {
        disable() {
          throw bd;
        }
        getStore() {
        }
        run() {
          throw bd;
        }
        exit() {
          throw bd;
        }
        enterWith() {
          throw bd;
        }
        static bind(a10) {
          return a10;
        }
      }
      let bf = "undefined" != typeof globalThis && globalThis.AsyncLocalStorage, bg = bf ? new bf() : new be();
      class bh {
        constructor({ waitUntil: a10, onClose: b10, onTaskError: c10 }) {
          this.workUnitStores = /* @__PURE__ */ new Set(), this.waitUntil = a10, this.onClose = b10, this.onTaskError = c10, this.callbackQueue = new (a0())(), this.callbackQueue.pause();
        }
        after(a10) {
          if (aH(a10)) this.waitUntil || bi(), this.waitUntil(a10.catch((a11) => this.reportTaskError("promise", a11)));
          else if ("function" == typeof a10) this.addCallback(a10);
          else throw Object.defineProperty(Error("`after()`: Argument must be a promise or a function"), "__NEXT_ERROR_CODE", { value: "E50", enumerable: false, configurable: true });
        }
        addCallback(a10) {
          var b10;
          this.waitUntil || bi();
          let c10 = a$.getStore();
          c10 && this.workUnitStores.add(c10);
          let d10 = bg.getStore(), e10 = d10 ? d10.rootTaskSpawnPhase : null == c10 ? void 0 : c10.phase;
          this.runCallbacksOnClosePromise || (this.runCallbacksOnClosePromise = this.runCallbacksOnClose(), this.waitUntil(this.runCallbacksOnClosePromise));
          let f10 = (b10 = async () => {
            try {
              await bg.run({ rootTaskSpawnPhase: e10 }, () => a10());
            } catch (a11) {
              this.reportTaskError("function", a11);
            }
          }, bf ? bf.bind(b10) : be.bind(b10));
          this.callbackQueue.add(f10);
        }
        async runCallbacksOnClose() {
          return await new Promise((a10) => this.onClose(a10)), this.runCallbacks();
        }
        async runCallbacks() {
          if (0 === this.callbackQueue.size) return;
          for (let a11 of this.workUnitStores) a11.phase = "after";
          let a10 = an.getStore();
          if (!a10) throw Object.defineProperty(new a1("Missing workStore in AfterContext.runCallbacks"), "__NEXT_ERROR_CODE", { value: "E547", enumerable: false, configurable: true });
          return a9(a10, () => (this.callbackQueue.start(), this.callbackQueue.onIdle()));
        }
        reportTaskError(a10, b10) {
          if (console.error("promise" === a10 ? "A promise passed to `after()` rejected:" : "An error occurred in a function passed to `after()`:", b10), this.onTaskError) try {
            null == this.onTaskError || this.onTaskError.call(this, b10);
          } catch (a11) {
            console.error(Object.defineProperty(new a1("`onTaskError` threw while handling an error thrown from an `after` task", { cause: a11 }), "__NEXT_ERROR_CODE", { value: "E569", enumerable: false, configurable: true }));
          }
        }
      }
      function bi() {
        throw Object.defineProperty(Error("`after()` will not work correctly, because `waitUntil` is not available in the current environment."), "__NEXT_ERROR_CODE", { value: "E91", enumerable: false, configurable: true });
      }
      function bj(a10) {
        let b10, c10 = { then: (d10, e10) => (b10 || (b10 = a10()), b10.then((a11) => {
          c10.value = a11;
        }).catch(() => {
        }), b10.then(d10, e10)) };
        return c10;
      }
      class bk {
        onClose(a10) {
          if (this.isClosed) throw Object.defineProperty(Error("Cannot subscribe to a closed CloseController"), "__NEXT_ERROR_CODE", { value: "E365", enumerable: false, configurable: true });
          this.target.addEventListener("close", a10), this.listeners++;
        }
        dispatchClose() {
          if (this.isClosed) throw Object.defineProperty(Error("Cannot close a CloseController multiple times"), "__NEXT_ERROR_CODE", { value: "E229", enumerable: false, configurable: true });
          this.listeners > 0 && this.target.dispatchEvent(new Event("close")), this.isClosed = true;
        }
        constructor() {
          this.target = new EventTarget(), this.listeners = 0, this.isClosed = false;
        }
      }
      function bl() {
        return { previewModeId: process.env.__NEXT_PREVIEW_MODE_ID || "", previewModeSigningKey: process.env.__NEXT_PREVIEW_MODE_SIGNING_KEY || "", previewModeEncryptionKey: process.env.__NEXT_PREVIEW_MODE_ENCRYPTION_KEY || "" };
      }
      let bm = Symbol.for("@next/request-context");
      async function bn(a10, b10, c10) {
        let d10 = [], e10 = c10 && c10.size > 0;
        for (let b11 of ((a11) => {
          let b12 = ["/layout"];
          if (a11.startsWith("/")) {
            let c11 = a11.split("/");
            for (let a12 = 1; a12 < c11.length + 1; a12++) {
              let d11 = c11.slice(0, a12).join("/");
              d11 && (d11.endsWith("/page") || d11.endsWith("/route") || (d11 = `${d11}${!d11.endsWith("/") ? "/" : ""}layout`), b12.push(d11));
            }
          }
          return b12;
        })(a10)) b11 = `${C}${b11}`, d10.push(b11);
        if (b10.pathname && !e10) {
          let a11 = `${C}${b10.pathname}`;
          d10.push(a11);
        }
        return { tags: d10, expirationsByCacheKind: function(a11) {
          let b11 = /* @__PURE__ */ new Map(), c11 = a8();
          if (c11) for (let [d11, e11] of c11) "getExpiration" in e11 && b11.set(d11, bj(async () => e11.getExpiration(...a11)));
          return b11;
        }(d10) };
      }
      class bo extends Z {
        constructor(a10) {
          super(a10.input, a10.init), this.sourcePage = a10.page;
        }
        get request() {
          throw Object.defineProperty(new z({ page: this.sourcePage }), "__NEXT_ERROR_CODE", { value: "E394", enumerable: false, configurable: true });
        }
        respondWith() {
          throw Object.defineProperty(new z({ page: this.sourcePage }), "__NEXT_ERROR_CODE", { value: "E394", enumerable: false, configurable: true });
        }
        waitUntil() {
          throw Object.defineProperty(new z({ page: this.sourcePage }), "__NEXT_ERROR_CODE", { value: "E394", enumerable: false, configurable: true });
        }
      }
      let bp = { keys: (a10) => Array.from(a10.keys()), get: (a10, b10) => a10.get(b10) ?? void 0 }, bq = (a10, b10) => aW().withPropagatedContext(a10.headers, b10, bp), br = false;
      async function bs(a10) {
        var b10;
        let d10, e10;
        if (!br && (br = true, "true" === process.env.NEXT_PRIVATE_TEST_PROXY)) {
          let { interceptTestApis: a11, wrapRequestHandler: b11 } = c(101);
          a11(), bq = b11(bq);
        }
        await x();
        let f10 = void 0 !== globalThis.__BUILD_MANIFEST;
        a10.request.url = a10.request.url.replace(/\.rsc($|\?)/, "$1");
        let g2 = a10.bypassNextUrl ? new URL(a10.request.url) : new W(a10.request.url, { headers: a10.request.headers, nextConfig: a10.request.nextConfig });
        for (let a11 of [...g2.searchParams.keys()]) {
          let b11 = g2.searchParams.getAll(a11), c10 = function(a12) {
            for (let b12 of ["nxtP", "nxtI"]) if (a12 !== b12 && a12.startsWith(b12)) return a12.substring(b12.length);
            return null;
          }(a11);
          if (c10) {
            for (let a12 of (g2.searchParams.delete(c10), b11)) g2.searchParams.append(c10, a12);
            g2.searchParams.delete(a11);
          }
        }
        let h2 = process.env.__NEXT_BUILD_ID || "";
        "buildId" in g2 && (h2 = g2.buildId || "", g2.buildId = "");
        let i2 = function(a11) {
          let b11 = new Headers();
          for (let [c10, d11] of Object.entries(a11)) for (let a12 of Array.isArray(d11) ? d11 : [d11]) void 0 !== a12 && ("number" == typeof a12 && (a12 = a12.toString()), b11.append(c10, a12));
          return b11;
        }(a10.request.headers), j2 = i2.has("x-nextjs-data"), k2 = "1" === i2.get("rsc");
        j2 && "/index" === g2.pathname && (g2.pathname = "/");
        let l2 = /* @__PURE__ */ new Map();
        if (!f10) for (let a11 of af) {
          let b11 = i2.get(a11);
          null !== b11 && (l2.set(a11, b11), i2.delete(a11));
        }
        let m2 = g2.searchParams.get(ag), n2 = new bo({ page: a10.page, input: function(a11) {
          let b11 = "string" == typeof a11, c10 = b11 ? new URL(a11) : a11;
          return c10.searchParams.delete(ag), b11 ? c10.toString() : c10;
        }(g2).toString(), init: { body: a10.request.body, headers: i2, method: a10.request.method, nextConfig: a10.request.nextConfig, signal: a10.request.signal } });
        j2 && Object.defineProperty(n2, "__isData", { enumerable: false, value: true }), !globalThis.__incrementalCacheShared && a10.IncrementalCache && (globalThis.__incrementalCache = new a10.IncrementalCache({ CurCacheHandler: a10.incrementalCacheHandler, minimalMode: true, fetchCacheKeyPrefix: "", dev: false, requestHeaders: a10.request.headers, getPrerenderManifest: () => ({ version: -1, routes: {}, dynamicRoutes: {}, notFoundRoutes: [], preview: bl() }) }));
        let o2 = a10.request.waitUntil ?? (null == (b10 = function() {
          let a11 = globalThis[bm];
          return null == a11 ? void 0 : a11.get();
        }()) ? void 0 : b10.waitUntil), p2 = new L({ request: n2, page: a10.page, context: o2 ? { waitUntil: o2 } : void 0 });
        if ((d10 = await bq(n2, () => {
          if ("/middleware" === a10.page || "/src/middleware" === a10.page) {
            let b11 = p2.waitUntil.bind(p2), c10 = new bk();
            return aW().trace(aE.execute, { spanName: `middleware ${n2.method} ${n2.nextUrl.pathname}`, attributes: { "http.target": n2.nextUrl.pathname, "http.method": n2.method } }, async () => {
              try {
                var d11, f11, g3, i3, j3, k3;
                let l3 = bl(), m3 = await bn("/", n2.nextUrl, null), o3 = (j3 = n2.nextUrl, k3 = (a11) => {
                  e10 = a11;
                }, function(a11, b12, c11, d12, e11, f12, g4, h3, i4, j4, k4, l4) {
                  function m4(a12) {
                    c11 && c11.setHeader("Set-Cookie", a12);
                  }
                  let n3 = {};
                  return { type: "request", phase: a11, implicitTags: f12, url: { pathname: d12.pathname, search: d12.search ?? "" }, rootParams: e11, get headers() {
                    return n3.headers || (n3.headers = function(a12) {
                      let b13 = ai.from(a12);
                      for (let a13 of af) b13.delete(a13);
                      return ai.seal(b13);
                    }(b12.headers)), n3.headers;
                  }, get cookies() {
                    if (!n3.cookies) {
                      let a12 = new X.RequestCookies(ai.from(b12.headers));
                      aZ(b12, a12), n3.cookies = ap.seal(a12);
                    }
                    return n3.cookies;
                  }, set cookies(value) {
                    n3.cookies = value;
                  }, get mutableCookies() {
                    if (!n3.mutableCookies) {
                      let a12 = function(a13, b13) {
                        let c12 = new X.RequestCookies(ai.from(a13));
                        return ar.wrap(c12, b13);
                      }(b12.headers, g4 || (c11 ? m4 : void 0));
                      aZ(b12, a12), n3.mutableCookies = a12;
                    }
                    return n3.mutableCookies;
                  }, get userspaceMutableCookies() {
                    return n3.userspaceMutableCookies || (n3.userspaceMutableCookies = function(a12) {
                      let b13 = new Proxy(a12.mutableCookies, { get(c12, d13, e12) {
                        switch (d13) {
                          case "delete":
                            return function(...d14) {
                              return as(a12, "cookies().delete"), c12.delete(...d14), b13;
                            };
                          case "set":
                            return function(...d14) {
                              return as(a12, "cookies().set"), c12.set(...d14), b13;
                            };
                          default:
                            return $.get(c12, d13, e12);
                        }
                      } });
                      return b13;
                    }(this)), n3.userspaceMutableCookies;
                  }, get draftMode() {
                    return n3.draftMode || (n3.draftMode = new aY(i4, b12, this.cookies, this.mutableCookies)), n3.draftMode;
                  }, renderResumeDataCache: h3 ?? null, isHmrRefresh: j4, serverComponentsHmrCache: k4 || globalThis.__serverComponentsHmrCache, devFallbackParams: null };
                }("action", n2, void 0, j3, {}, m3, k3, void 0, l3, false, void 0, null)), q3 = function({ page: a11, renderOpts: b12, isPrefetchRequest: c11, buildId: d12, previouslyRevalidatedTags: e11 }) {
                  var f12;
                  let g4 = !b12.shouldWaitOnAllReady && !b12.supportsDynamicResponse && !b12.isDraftMode && !b12.isPossibleServerAction, h3 = b12.dev ?? false, i4 = h3 || g4 && (!!process.env.NEXT_DEBUG_BUILD || "1" === process.env.NEXT_SSG_FETCH_METRICS), j4 = { isStaticGeneration: g4, page: a11, route: (f12 = a11.split("/").reduce((a12, b13, c12, d13) => b13 ? "(" === b13[0] && b13.endsWith(")") || "@" === b13[0] || ("page" === b13 || "route" === b13) && c12 === d13.length - 1 ? a12 : a12 + "/" + b13 : a12, "")).startsWith("/") ? f12 : "/" + f12, incrementalCache: b12.incrementalCache || globalThis.__incrementalCache, cacheLifeProfiles: b12.cacheLifeProfiles, isRevalidate: b12.isRevalidate, isBuildTimePrerendering: b12.nextExport, hasReadableErrorStacks: b12.hasReadableErrorStacks, fetchCache: b12.fetchCache, isOnDemandRevalidate: b12.isOnDemandRevalidate, isDraftMode: b12.isDraftMode, isPrefetchRequest: c11, buildId: d12, reactLoadableManifest: (null == b12 ? void 0 : b12.reactLoadableManifest) || {}, assetPrefix: (null == b12 ? void 0 : b12.assetPrefix) || "", afterContext: function(a12) {
                    let { waitUntil: b13, onClose: c12, onAfterTaskError: d13 } = a12;
                    return new bh({ waitUntil: b13, onClose: c12, onTaskError: d13 });
                  }(b12), cacheComponentsEnabled: b12.experimental.cacheComponents, dev: h3, previouslyRevalidatedTags: e11, refreshTagsByCacheKind: function() {
                    let a12 = /* @__PURE__ */ new Map(), b13 = a8();
                    if (b13) for (let [c12, d13] of b13) "refreshTags" in d13 && a12.set(c12, bj(async () => d13.refreshTags()));
                    return a12;
                  }(), runInCleanSnapshot: bf ? bf.snapshot() : function(a12, ...b13) {
                    return a12(...b13);
                  }, shouldTrackFetchMetrics: i4 };
                  return b12.store = j4, j4;
                }({ page: "/", renderOpts: { cacheLifeProfiles: null == (f11 = a10.request.nextConfig) || null == (d11 = f11.experimental) ? void 0 : d11.cacheLife, experimental: { isRoutePPREnabled: false, cacheComponents: false, authInterrupts: !!(null == (i3 = a10.request.nextConfig) || null == (g3 = i3.experimental) ? void 0 : g3.authInterrupts) }, supportsDynamicResponse: true, waitUntil: b11, onClose: c10.onClose.bind(c10), onAfterTaskError: void 0 }, isPrefetchRequest: "1" === n2.headers.get(ae), buildId: h2 ?? "", previouslyRevalidatedTags: [] });
                return await an.run(q3, () => a$.run(o3, a10.handler, n2, p2));
              } finally {
                setTimeout(() => {
                  c10.dispatchClose();
                }, 0);
              }
            });
          }
          return a10.handler(n2, p2);
        })) && !(d10 instanceof Response)) throw Object.defineProperty(TypeError("Expected an instance of Response to be returned"), "__NEXT_ERROR_CODE", { value: "E567", enumerable: false, configurable: true });
        d10 && e10 && d10.headers.set("set-cookie", e10);
        let q2 = null == d10 ? void 0 : d10.headers.get("x-middleware-rewrite");
        if (d10 && q2 && (k2 || !f10)) {
          let b11 = new W(q2, { forceLocale: true, headers: a10.request.headers, nextConfig: a10.request.nextConfig });
          f10 || b11.host !== n2.nextUrl.host || (b11.buildId = h2 || b11.buildId, d10.headers.set("x-middleware-rewrite", String(b11)));
          let { url: c10, isRelative: e11 } = ad(b11.toString(), g2.toString());
          !f10 && j2 && d10.headers.set("x-nextjs-rewrite", c10), k2 && e11 && (g2.pathname !== b11.pathname && d10.headers.set("x-nextjs-rewritten-path", b11.pathname), g2.search !== b11.search && d10.headers.set("x-nextjs-rewritten-query", b11.search.slice(1)));
        }
        if (d10 && q2 && k2 && m2) {
          let a11 = new URL(q2);
          a11.searchParams.has(ag) || (a11.searchParams.set(ag, m2), d10.headers.set("x-middleware-rewrite", a11.toString()));
        }
        let r2 = null == d10 ? void 0 : d10.headers.get("Location");
        if (d10 && r2 && !f10) {
          let b11 = new W(r2, { forceLocale: false, headers: a10.request.headers, nextConfig: a10.request.nextConfig });
          d10 = new Response(d10.body, d10), b11.host === g2.host && (b11.buildId = h2 || b11.buildId, d10.headers.set("Location", b11.toString())), j2 && (d10.headers.delete("Location"), d10.headers.set("x-nextjs-redirect", ad(b11.toString(), g2.toString()).url));
        }
        let s2 = d10 || ac.next(), t2 = s2.headers.get("x-middleware-override-headers"), u2 = [];
        if (t2) {
          for (let [a11, b11] of l2) s2.headers.set(`x-middleware-request-${a11}`, b11), u2.push(a11);
          u2.length > 0 && s2.headers.set("x-middleware-override-headers", t2 + "," + u2.join(","));
        }
        return { response: s2, waitUntil: ("internal" === p2[J].kind ? Promise.all(p2[J].promises).then(() => {
        }) : void 0) ?? Promise.resolve(), fetchMetrics: n2.fetchMetrics };
      }
      c(148), "undefined" == typeof URLPattern || URLPattern;
      var bt = c(643);
      if (/* @__PURE__ */ new WeakMap(), bt.unstable_postpone, false === function(a10) {
        return a10.includes("needs to bail out of prerendering at this point because it used") && a10.includes("Learn more: https://nextjs.org/docs/messages/ppr-caught-error");
      }("Route %%% needs to bail out of prerendering at this point because it used ^^^. React throws this special object to indicate where. It should not be caught by your own try/catch. Learn more: https://nextjs.org/docs/messages/ppr-caught-error")) throw Object.defineProperty(Error("Invariant: isDynamicPostpone misidentified a postpone reason. This is a bug in Next.js"), "__NEXT_ERROR_CODE", { value: "E296", enumerable: false, configurable: true });
      RegExp(`\\n\\s+at Suspense \\(<anonymous>\\)(?:(?!\\n\\s+at (?:body|div|main|section|article|aside|header|footer|nav|form|p|span|h1|h2|h3|h4|h5|h6) \\(<anonymous>\\))[\\s\\S])*?\\n\\s+at __next_root_layout_boundary__ \\([^\\n]*\\)`), RegExp(`\\n\\s+at __next_metadata_boundary__[\\n\\s]`), RegExp(`\\n\\s+at __next_viewport_boundary__[\\n\\s]`), RegExp(`\\n\\s+at __next_outlet_boundary__[\\n\\s]`), am();
      let { env: bu, stdout: bv } = (null == (k = globalThis) ? void 0 : k.process) ?? {}, bw = bu && !bu.NO_COLOR && (bu.FORCE_COLOR || (null == bv ? void 0 : bv.isTTY) && !bu.CI && "dumb" !== bu.TERM), bx = (a10, b10, c10, d10) => {
        let e10 = a10.substring(0, d10) + c10, f10 = a10.substring(d10 + b10.length), g2 = f10.indexOf(b10);
        return ~g2 ? e10 + bx(f10, b10, c10, g2) : e10 + f10;
      }, by = (a10, b10, c10 = a10) => bw ? (d10) => {
        let e10 = "" + d10, f10 = e10.indexOf(b10, a10.length);
        return ~f10 ? a10 + bx(e10, b10, c10, f10) + b10 : a10 + e10 + b10;
      } : String, bz = by("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m");
      by("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"), by("\x1B[3m", "\x1B[23m"), by("\x1B[4m", "\x1B[24m"), by("\x1B[7m", "\x1B[27m"), by("\x1B[8m", "\x1B[28m"), by("\x1B[9m", "\x1B[29m"), by("\x1B[30m", "\x1B[39m");
      let bA = by("\x1B[31m", "\x1B[39m"), bB = by("\x1B[32m", "\x1B[39m"), bC = by("\x1B[33m", "\x1B[39m");
      by("\x1B[34m", "\x1B[39m");
      let bD = by("\x1B[35m", "\x1B[39m");
      by("\x1B[38;2;173;127;168m", "\x1B[39m"), by("\x1B[36m", "\x1B[39m");
      let bE = by("\x1B[37m", "\x1B[39m");
      by("\x1B[90m", "\x1B[39m"), by("\x1B[40m", "\x1B[49m"), by("\x1B[41m", "\x1B[49m"), by("\x1B[42m", "\x1B[49m"), by("\x1B[43m", "\x1B[49m"), by("\x1B[44m", "\x1B[49m"), by("\x1B[45m", "\x1B[49m"), by("\x1B[46m", "\x1B[49m"), by("\x1B[47m", "\x1B[49m"), bE(bz("\u25CB")), bA(bz("\u2A2F")), bC(bz("\u26A0")), bE(bz(" ")), bB(bz("\u2713")), bD(bz("\xBB")), new a4(1e4, (a10) => a10.length), /* @__PURE__ */ new WeakMap();
      var bF = c(861);
      function bG() {
        return "undefined" != typeof window && void 0 !== window.document;
      }
      bF.qg, bF.lK;
      let bH = { path: "/", sameSite: "lax", httpOnly: false, maxAge: 3456e4 }, bI = /^(.*)[.](0|[1-9][0-9]*)$/;
      function bJ(a10, b10) {
        if (a10 === b10) return true;
        let c10 = a10.match(bI);
        return !!c10 && c10[1] === b10;
      }
      function bK(a10, b10, c10) {
        let d10 = c10 ?? 3180, e10 = encodeURIComponent(b10);
        if (e10.length <= d10) return [{ name: a10, value: b10 }];
        let f10 = [];
        for (; e10.length > 0; ) {
          let a11 = e10.slice(0, d10), b11 = a11.lastIndexOf("%");
          b11 > d10 - 3 && (a11 = a11.slice(0, b11));
          let c11 = "";
          for (; a11.length > 0; ) try {
            c11 = decodeURIComponent(a11);
            break;
          } catch (b12) {
            if (b12 instanceof URIError && "%" === a11.at(-3) && a11.length > 3) a11 = a11.slice(0, a11.length - 3);
            else throw b12;
          }
          f10.push(c11), e10 = e10.slice(a11.length);
        }
        return f10.map((b11, c11) => ({ name: `${a10}.${c11}`, value: b11 }));
      }
      async function bL(a10, b10) {
        let c10 = await b10(a10);
        if (c10) return c10;
        let d10 = [];
        for (let c11 = 0; ; c11++) {
          let e10 = `${a10}.${c11}`, f10 = await b10(e10);
          if (!f10) break;
          d10.push(f10);
        }
        return d10.length > 0 ? d10.join("") : null;
      }
      let bM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""), bN = " 	\n\r=".split(""), bO = (() => {
        let a10 = Array(128);
        for (let b10 = 0; b10 < a10.length; b10 += 1) a10[b10] = -1;
        for (let b10 = 0; b10 < bN.length; b10 += 1) a10[bN[b10].charCodeAt(0)] = -2;
        for (let b10 = 0; b10 < bM.length; b10 += 1) a10[bM[b10].charCodeAt(0)] = b10;
        return a10;
      })();
      function bP(a10) {
        let b10 = [], c10 = 0, d10 = 0;
        if (function(a11, b11) {
          for (let c11 = 0; c11 < a11.length; c11 += 1) {
            let d11 = a11.charCodeAt(c11);
            if (d11 > 55295 && d11 <= 56319) {
              let b12 = (d11 - 55296) * 1024 & 65535;
              d11 = (a11.charCodeAt(c11 + 1) - 56320 & 65535 | b12) + 65536, c11 += 1;
            }
            !function(a12, b12) {
              if (a12 <= 127) return b12(a12);
              if (a12 <= 2047) {
                b12(192 | a12 >> 6), b12(128 | 63 & a12);
                return;
              }
              if (a12 <= 65535) {
                b12(224 | a12 >> 12), b12(128 | a12 >> 6 & 63), b12(128 | 63 & a12);
                return;
              }
              if (a12 <= 1114111) {
                b12(240 | a12 >> 18), b12(128 | a12 >> 12 & 63), b12(128 | a12 >> 6 & 63), b12(128 | 63 & a12);
                return;
              }
              throw Error(`Unrecognized Unicode codepoint: ${a12.toString(16)}`);
            }(d11, b11);
          }
        }(a10, (a11) => {
          for (c10 = c10 << 8 | a11, d10 += 8; d10 >= 6; ) {
            let a12 = c10 >> d10 - 6 & 63;
            b10.push(bM[a12]), d10 -= 6;
          }
        }), d10 > 0) for (c10 <<= 6 - d10, d10 = 6; d10 >= 6; ) {
          let a11 = c10 >> d10 - 6 & 63;
          b10.push(bM[a11]), d10 -= 6;
        }
        return b10.join("");
      }
      function bQ(a10) {
        let b10 = [], c10 = (a11) => {
          b10.push(String.fromCodePoint(a11));
        }, d10 = { utf8seq: 0, codepoint: 0 }, e10 = 0, f10 = 0;
        for (let b11 = 0; b11 < a10.length; b11 += 1) {
          let g2 = bO[a10.charCodeAt(b11)];
          if (g2 > -1) for (e10 = e10 << 6 | g2, f10 += 6; f10 >= 8; ) (function(a11, b12, c11) {
            if (0 === b12.utf8seq) {
              if (a11 <= 127) return c11(a11);
              for (let c12 = 1; c12 < 6; c12 += 1) if ((a11 >> 7 - c12 & 1) == 0) {
                b12.utf8seq = c12;
                break;
              }
              if (2 === b12.utf8seq) b12.codepoint = 31 & a11;
              else if (3 === b12.utf8seq) b12.codepoint = 15 & a11;
              else if (4 === b12.utf8seq) b12.codepoint = 7 & a11;
              else throw Error("Invalid UTF-8 sequence");
              b12.utf8seq -= 1;
            } else if (b12.utf8seq > 0) {
              if (a11 <= 127) throw Error("Invalid UTF-8 sequence");
              b12.codepoint = b12.codepoint << 6 | 63 & a11, b12.utf8seq -= 1, 0 === b12.utf8seq && c11(b12.codepoint);
            }
          })(e10 >> f10 - 8 & 255, d10, c10), f10 -= 8;
          else if (-2 === g2) continue;
          else throw Error(`Invalid Base64-URL character "${a10.at(b11)}" at position ${b11}`);
        }
        return b10.join("");
      }
      let bR = "base64-";
      async function bS({ getAll: a10, setAll: b10, setItems: c10, removedItems: d10 }, e10) {
        let f10 = e10.cookieEncoding, g2 = e10.cookieOptions ?? null, h2 = await a10([...c10 ? Object.keys(c10) : [], ...d10 ? Object.keys(d10) : []]), i2 = h2?.map(({ name: a11 }) => a11) || [], j2 = Object.keys(d10).flatMap((a11) => i2.filter((b11) => bJ(b11, a11))), k2 = Object.keys(c10).flatMap((a11) => {
          let b11 = new Set(i2.filter((b12) => bJ(b12, a11))), d11 = c10[a11];
          "base64url" === f10 && (d11 = bR + bP(d11));
          let e11 = bK(a11, d11);
          return e11.forEach((a12) => {
            b11.delete(a12.name);
          }), j2.push(...b11), e11;
        }), l2 = { ...bH, ...g2, maxAge: 0 }, m2 = { ...bH, ...g2, maxAge: bH.maxAge };
        delete l2.name, delete m2.name, await b10([...j2.map((a11) => ({ name: a11, value: "", options: l2 })), ...k2.map(({ name: a11, value: b11 }) => ({ name: a11, value: b11, options: m2 }))], { "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0", Expires: "0", Pragma: "no-cache" });
      }
      function bT(a10, b10) {
        var c10 = {};
        for (var d10 in a10) Object.prototype.hasOwnProperty.call(a10, d10) && 0 > b10.indexOf(d10) && (c10[d10] = a10[d10]);
        if (null != a10 && "function" == typeof Object.getOwnPropertySymbols) for (var e10 = 0, d10 = Object.getOwnPropertySymbols(a10); e10 < d10.length; e10++) 0 > b10.indexOf(d10[e10]) && Object.prototype.propertyIsEnumerable.call(a10, d10[e10]) && (c10[d10[e10]] = a10[d10[e10]]);
        return c10;
      }
      Object.create;
      Object.create, "function" == typeof SuppressedError && SuppressedError;
      class bU extends Error {
        constructor(a10, b10 = "FunctionsError", c10) {
          super(a10), this.name = b10, this.context = c10;
        }
      }
      class bV extends bU {
        constructor(a10) {
          super("Failed to send a request to the Edge Function", "FunctionsFetchError", a10);
        }
      }
      class bW extends bU {
        constructor(a10) {
          super("Relay Error invoking the Edge Function", "FunctionsRelayError", a10);
        }
      }
      class bX extends bU {
        constructor(a10) {
          super("Edge Function returned a non-2xx status code", "FunctionsHttpError", a10);
        }
      }
      !function(a10) {
        a10.Any = "any", a10.ApNortheast1 = "ap-northeast-1", a10.ApNortheast2 = "ap-northeast-2", a10.ApSouth1 = "ap-south-1", a10.ApSoutheast1 = "ap-southeast-1", a10.ApSoutheast2 = "ap-southeast-2", a10.CaCentral1 = "ca-central-1", a10.EuCentral1 = "eu-central-1", a10.EuWest1 = "eu-west-1", a10.EuWest2 = "eu-west-2", a10.EuWest3 = "eu-west-3", a10.SaEast1 = "sa-east-1", a10.UsEast1 = "us-east-1", a10.UsWest1 = "us-west-1", a10.UsWest2 = "us-west-2";
      }(l || (l = {}));
      class bY {
        constructor(a10, { headers: b10 = {}, customFetch: c10, region: d10 = l.Any } = {}) {
          this.url = a10, this.headers = b10, this.region = d10, this.fetch = /* @__PURE__ */ ((a11) => a11 ? (...b11) => a11(...b11) : (...a12) => fetch(...a12))(c10);
        }
        setAuth(a10) {
          this.headers.Authorization = `Bearer ${a10}`;
        }
        invoke(a10) {
          var b10, c10, d10, e10;
          return b10 = this, c10 = arguments, d10 = void 0, e10 = function* (a11, b11 = {}) {
            var c11;
            let d11, e11;
            try {
              let f10, { headers: g2, method: h2, body: i2, signal: j2, timeout: k2 } = b11, l2 = {}, { region: m2 } = b11;
              m2 || (m2 = this.region);
              let n2 = new URL(`${this.url}/${a11}`);
              m2 && "any" !== m2 && (l2["x-region"] = m2, n2.searchParams.set("forceFunctionRegion", m2)), i2 && (g2 && !Object.prototype.hasOwnProperty.call(g2, "Content-Type") || !g2) ? "undefined" != typeof Blob && i2 instanceof Blob || i2 instanceof ArrayBuffer ? (l2["Content-Type"] = "application/octet-stream", f10 = i2) : "string" == typeof i2 ? (l2["Content-Type"] = "text/plain", f10 = i2) : "undefined" != typeof FormData && i2 instanceof FormData ? f10 = i2 : (l2["Content-Type"] = "application/json", f10 = JSON.stringify(i2)) : f10 = !i2 || "string" == typeof i2 || "undefined" != typeof Blob && i2 instanceof Blob || i2 instanceof ArrayBuffer || "undefined" != typeof FormData && i2 instanceof FormData ? i2 : JSON.stringify(i2);
              let o2 = j2;
              k2 && (e11 = new AbortController(), d11 = setTimeout(() => e11.abort(), k2), j2 ? (o2 = e11.signal, j2.addEventListener("abort", () => e11.abort())) : o2 = e11.signal);
              let p2 = yield this.fetch(n2.toString(), { method: h2 || "POST", headers: Object.assign(Object.assign(Object.assign({}, l2), this.headers), g2), body: f10, signal: o2 }).catch((a12) => {
                throw new bV(a12);
              }), q2 = p2.headers.get("x-relay-error");
              if (q2 && "true" === q2) throw new bW(p2);
              if (!p2.ok) throw new bX(p2);
              let r2 = (null != (c11 = p2.headers.get("Content-Type")) ? c11 : "text/plain").split(";")[0].trim();
              return { data: "application/json" === r2 ? yield p2.json() : "application/octet-stream" === r2 || "application/pdf" === r2 ? yield p2.blob() : "text/event-stream" === r2 ? p2 : "multipart/form-data" === r2 ? yield p2.formData() : yield p2.text(), error: null, response: p2 };
            } catch (a12) {
              return { data: null, error: a12, response: a12 instanceof bX || a12 instanceof bW ? a12.context : void 0 };
            } finally {
              d11 && clearTimeout(d11);
            }
          }, new (d10 || (d10 = Promise))(function(a11, f10) {
            function g2(a12) {
              try {
                i2(e10.next(a12));
              } catch (a13) {
                f10(a13);
              }
            }
            function h2(a12) {
              try {
                i2(e10.throw(a12));
              } catch (a13) {
                f10(a13);
              }
            }
            function i2(b11) {
              var c11;
              b11.done ? a11(b11.value) : ((c11 = b11.value) instanceof d10 ? c11 : new d10(function(a12) {
                a12(c11);
              })).then(g2, h2);
            }
            i2((e10 = e10.apply(b10, c10 || [])).next());
          });
        }
      }
      var bZ = class extends Error {
        constructor(a10) {
          super(a10.message), this.name = "PostgrestError", this.details = a10.details, this.hint = a10.hint, this.code = a10.code;
        }
      }, b$ = class {
        constructor(a10) {
          var b10, c10, d10;
          this.shouldThrowOnError = false, this.method = a10.method, this.url = a10.url, this.headers = new Headers(a10.headers), this.schema = a10.schema, this.body = a10.body, this.shouldThrowOnError = null != (b10 = a10.shouldThrowOnError) && b10, this.signal = a10.signal, this.isMaybeSingle = null != (c10 = a10.isMaybeSingle) && c10, this.urlLengthLimit = null != (d10 = a10.urlLengthLimit) ? d10 : 8e3, a10.fetch ? this.fetch = a10.fetch : this.fetch = fetch;
        }
        throwOnError() {
          return this.shouldThrowOnError = true, this;
        }
        setHeader(a10, b10) {
          return this.headers = new Headers(this.headers), this.headers.set(a10, b10), this;
        }
        then(a10, b10) {
          var c10 = this;
          void 0 === this.schema || (["GET", "HEAD"].includes(this.method) ? this.headers.set("Accept-Profile", this.schema) : this.headers.set("Content-Profile", this.schema)), "GET" !== this.method && "HEAD" !== this.method && this.headers.set("Content-Type", "application/json");
          let d10 = (0, this.fetch)(this.url.toString(), { method: this.method, headers: this.headers, body: JSON.stringify(this.body), signal: this.signal }).then(async (a11) => {
            let b11 = null, d11 = null, e10 = null, f10 = a11.status, g2 = a11.statusText;
            if (a11.ok) {
              var h2, i2, j2;
              if ("HEAD" !== c10.method) {
                let b12 = await a11.text();
                "" === b12 || (d11 = "text/csv" === c10.headers.get("Accept") || c10.headers.get("Accept") && (null == (j2 = c10.headers.get("Accept")) ? void 0 : j2.includes("application/vnd.pgrst.plan+text")) ? b12 : JSON.parse(b12));
              }
              let k2 = null == (h2 = c10.headers.get("Prefer")) ? void 0 : h2.match(/count=(exact|planned|estimated)/), l2 = null == (i2 = a11.headers.get("content-range")) ? void 0 : i2.split("/");
              k2 && l2 && l2.length > 1 && (e10 = parseInt(l2[1])), c10.isMaybeSingle && Array.isArray(d11) && (d11.length > 1 ? (b11 = { code: "PGRST116", details: `Results contain ${d11.length} rows, application/vnd.pgrst.object+json requires 1 row`, hint: null, message: "JSON object requested, multiple (or no) rows returned" }, d11 = null, e10 = null, f10 = 406, g2 = "Not Acceptable") : d11 = 1 === d11.length ? d11[0] : null);
            } else {
              let e11 = await a11.text();
              try {
                b11 = JSON.parse(e11), Array.isArray(b11) && 404 === a11.status && (d11 = [], b11 = null, f10 = 200, g2 = "OK");
              } catch (c11) {
                404 === a11.status && "" === e11 ? (f10 = 204, g2 = "No Content") : b11 = { message: e11 };
              }
              if (b11 && c10.shouldThrowOnError) throw new bZ(b11);
            }
            return { error: b11, data: d11, count: e10, status: f10, statusText: g2 };
          });
          return this.shouldThrowOnError || (d10 = d10.catch((a11) => {
            var b11, c11, d11, e10, f10, g2;
            let h2 = "", i2 = "", j2 = "", k2 = null == a11 ? void 0 : a11.cause;
            if (k2) {
              let b12 = null != (c11 = null == k2 ? void 0 : k2.message) ? c11 : "", g3 = null != (d11 = null == k2 ? void 0 : k2.code) ? d11 : "";
              h2 = `${null != (e10 = null == a11 ? void 0 : a11.name) ? e10 : "FetchError"}: ${null == a11 ? void 0 : a11.message}

Caused by: ${null != (f10 = null == k2 ? void 0 : k2.name) ? f10 : "Error"}: ${b12}`, g3 && (h2 += ` (${g3})`), (null == k2 ? void 0 : k2.stack) && (h2 += `
${k2.stack}`);
            } else h2 = null != (g2 = null == a11 ? void 0 : a11.stack) ? g2 : "";
            let l2 = this.url.toString().length;
            return (null == a11 ? void 0 : a11.name) === "AbortError" || (null == a11 ? void 0 : a11.code) === "ABORT_ERR" ? (j2 = "", i2 = "Request was aborted (timeout or manual cancellation)", l2 > this.urlLengthLimit && (i2 += `. Note: Your request URL is ${l2} characters, which may exceed server limits. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [many IDs])), consider using an RPC function to pass values server-side.`)) : ((null == k2 ? void 0 : k2.name) === "HeadersOverflowError" || (null == k2 ? void 0 : k2.code) === "UND_ERR_HEADERS_OVERFLOW") && (j2 = "", i2 = "HTTP headers exceeded server limits (typically 16KB)", l2 > this.urlLengthLimit && (i2 += `. Your request URL is ${l2} characters. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [200+ IDs])), consider using an RPC function instead.`)), { error: { message: `${null != (b11 = null == a11 ? void 0 : a11.name) ? b11 : "FetchError"}: ${null == a11 ? void 0 : a11.message}`, details: h2, hint: i2, code: j2 }, data: null, count: null, status: 0, statusText: "" };
          })), d10.then(a10, b10);
        }
        returns() {
          return this;
        }
        overrideTypes() {
          return this;
        }
      }, b_ = class extends b$ {
        select(a10) {
          let b10 = false, c10 = (null != a10 ? a10 : "*").split("").map((a11) => /\s/.test(a11) && !b10 ? "" : ('"' === a11 && (b10 = !b10), a11)).join("");
          return this.url.searchParams.set("select", c10), this.headers.append("Prefer", "return=representation"), this;
        }
        order(a10, { ascending: b10 = true, nullsFirst: c10, foreignTable: d10, referencedTable: e10 = d10 } = {}) {
          let f10 = e10 ? `${e10}.order` : "order", g2 = this.url.searchParams.get(f10);
          return this.url.searchParams.set(f10, `${g2 ? `${g2},` : ""}${a10}.${b10 ? "asc" : "desc"}${void 0 === c10 ? "" : c10 ? ".nullsfirst" : ".nullslast"}`), this;
        }
        limit(a10, { foreignTable: b10, referencedTable: c10 = b10 } = {}) {
          let d10 = void 0 === c10 ? "limit" : `${c10}.limit`;
          return this.url.searchParams.set(d10, `${a10}`), this;
        }
        range(a10, b10, { foreignTable: c10, referencedTable: d10 = c10 } = {}) {
          let e10 = void 0 === d10 ? "offset" : `${d10}.offset`, f10 = void 0 === d10 ? "limit" : `${d10}.limit`;
          return this.url.searchParams.set(e10, `${a10}`), this.url.searchParams.set(f10, `${b10 - a10 + 1}`), this;
        }
        abortSignal(a10) {
          return this.signal = a10, this;
        }
        single() {
          return this.headers.set("Accept", "application/vnd.pgrst.object+json"), this;
        }
        maybeSingle() {
          return this.isMaybeSingle = true, this;
        }
        csv() {
          return this.headers.set("Accept", "text/csv"), this;
        }
        geojson() {
          return this.headers.set("Accept", "application/geo+json"), this;
        }
        explain({ analyze: a10 = false, verbose: b10 = false, settings: c10 = false, buffers: d10 = false, wal: e10 = false, format: f10 = "text" } = {}) {
          var g2;
          let h2 = [a10 ? "analyze" : null, b10 ? "verbose" : null, c10 ? "settings" : null, d10 ? "buffers" : null, e10 ? "wal" : null].filter(Boolean).join("|"), i2 = null != (g2 = this.headers.get("Accept")) ? g2 : "application/json";
          return this.headers.set("Accept", `application/vnd.pgrst.plan+${f10}; for="${i2}"; options=${h2};`), this;
        }
        rollback() {
          return this.headers.append("Prefer", "tx=rollback"), this;
        }
        returns() {
          return this;
        }
        maxAffected(a10) {
          return this.headers.append("Prefer", "handling=strict"), this.headers.append("Prefer", `max-affected=${a10}`), this;
        }
      };
      let b0 = RegExp("[,()]");
      var b1 = class extends b_ {
        eq(a10, b10) {
          return this.url.searchParams.append(a10, `eq.${b10}`), this;
        }
        neq(a10, b10) {
          return this.url.searchParams.append(a10, `neq.${b10}`), this;
        }
        gt(a10, b10) {
          return this.url.searchParams.append(a10, `gt.${b10}`), this;
        }
        gte(a10, b10) {
          return this.url.searchParams.append(a10, `gte.${b10}`), this;
        }
        lt(a10, b10) {
          return this.url.searchParams.append(a10, `lt.${b10}`), this;
        }
        lte(a10, b10) {
          return this.url.searchParams.append(a10, `lte.${b10}`), this;
        }
        like(a10, b10) {
          return this.url.searchParams.append(a10, `like.${b10}`), this;
        }
        likeAllOf(a10, b10) {
          return this.url.searchParams.append(a10, `like(all).{${b10.join(",")}}`), this;
        }
        likeAnyOf(a10, b10) {
          return this.url.searchParams.append(a10, `like(any).{${b10.join(",")}}`), this;
        }
        ilike(a10, b10) {
          return this.url.searchParams.append(a10, `ilike.${b10}`), this;
        }
        ilikeAllOf(a10, b10) {
          return this.url.searchParams.append(a10, `ilike(all).{${b10.join(",")}}`), this;
        }
        ilikeAnyOf(a10, b10) {
          return this.url.searchParams.append(a10, `ilike(any).{${b10.join(",")}}`), this;
        }
        regexMatch(a10, b10) {
          return this.url.searchParams.append(a10, `match.${b10}`), this;
        }
        regexIMatch(a10, b10) {
          return this.url.searchParams.append(a10, `imatch.${b10}`), this;
        }
        is(a10, b10) {
          return this.url.searchParams.append(a10, `is.${b10}`), this;
        }
        isDistinct(a10, b10) {
          return this.url.searchParams.append(a10, `isdistinct.${b10}`), this;
        }
        in(a10, b10) {
          let c10 = Array.from(new Set(b10)).map((a11) => "string" == typeof a11 && b0.test(a11) ? `"${a11}"` : `${a11}`).join(",");
          return this.url.searchParams.append(a10, `in.(${c10})`), this;
        }
        notIn(a10, b10) {
          let c10 = Array.from(new Set(b10)).map((a11) => "string" == typeof a11 && b0.test(a11) ? `"${a11}"` : `${a11}`).join(",");
          return this.url.searchParams.append(a10, `not.in.(${c10})`), this;
        }
        contains(a10, b10) {
          return "string" == typeof b10 ? this.url.searchParams.append(a10, `cs.${b10}`) : Array.isArray(b10) ? this.url.searchParams.append(a10, `cs.{${b10.join(",")}}`) : this.url.searchParams.append(a10, `cs.${JSON.stringify(b10)}`), this;
        }
        containedBy(a10, b10) {
          return "string" == typeof b10 ? this.url.searchParams.append(a10, `cd.${b10}`) : Array.isArray(b10) ? this.url.searchParams.append(a10, `cd.{${b10.join(",")}}`) : this.url.searchParams.append(a10, `cd.${JSON.stringify(b10)}`), this;
        }
        rangeGt(a10, b10) {
          return this.url.searchParams.append(a10, `sr.${b10}`), this;
        }
        rangeGte(a10, b10) {
          return this.url.searchParams.append(a10, `nxl.${b10}`), this;
        }
        rangeLt(a10, b10) {
          return this.url.searchParams.append(a10, `sl.${b10}`), this;
        }
        rangeLte(a10, b10) {
          return this.url.searchParams.append(a10, `nxr.${b10}`), this;
        }
        rangeAdjacent(a10, b10) {
          return this.url.searchParams.append(a10, `adj.${b10}`), this;
        }
        overlaps(a10, b10) {
          return "string" == typeof b10 ? this.url.searchParams.append(a10, `ov.${b10}`) : this.url.searchParams.append(a10, `ov.{${b10.join(",")}}`), this;
        }
        textSearch(a10, b10, { config: c10, type: d10 } = {}) {
          let e10 = "";
          "plain" === d10 ? e10 = "pl" : "phrase" === d10 ? e10 = "ph" : "websearch" === d10 && (e10 = "w");
          let f10 = void 0 === c10 ? "" : `(${c10})`;
          return this.url.searchParams.append(a10, `${e10}fts${f10}.${b10}`), this;
        }
        match(a10) {
          return Object.entries(a10).filter(([a11, b10]) => void 0 !== b10).forEach(([a11, b10]) => {
            this.url.searchParams.append(a11, `eq.${b10}`);
          }), this;
        }
        not(a10, b10, c10) {
          return this.url.searchParams.append(a10, `not.${b10}.${c10}`), this;
        }
        or(a10, { foreignTable: b10, referencedTable: c10 = b10 } = {}) {
          let d10 = c10 ? `${c10}.or` : "or";
          return this.url.searchParams.append(d10, `(${a10})`), this;
        }
        filter(a10, b10, c10) {
          return this.url.searchParams.append(a10, `${b10}.${c10}`), this;
        }
      }, b2 = class {
        constructor(a10, { headers: b10 = {}, schema: c10, fetch: d10, urlLengthLimit: e10 = 8e3 }) {
          this.url = a10, this.headers = new Headers(b10), this.schema = c10, this.fetch = d10, this.urlLengthLimit = e10;
        }
        cloneRequestState() {
          return { url: new URL(this.url.toString()), headers: new Headers(this.headers) };
        }
        select(a10, b10) {
          let { head: c10 = false, count: d10 } = null != b10 ? b10 : {}, e10 = false, f10 = (null != a10 ? a10 : "*").split("").map((a11) => /\s/.test(a11) && !e10 ? "" : ('"' === a11 && (e10 = !e10), a11)).join(""), { url: g2, headers: h2 } = this.cloneRequestState();
          return g2.searchParams.set("select", f10), d10 && h2.append("Prefer", `count=${d10}`), new b1({ method: c10 ? "HEAD" : "GET", url: g2, headers: h2, schema: this.schema, fetch: this.fetch, urlLengthLimit: this.urlLengthLimit });
        }
        insert(a10, { count: b10, defaultToNull: c10 = true } = {}) {
          var d10;
          let { url: e10, headers: f10 } = this.cloneRequestState();
          if (b10 && f10.append("Prefer", `count=${b10}`), c10 || f10.append("Prefer", "missing=default"), Array.isArray(a10)) {
            let b11 = a10.reduce((a11, b12) => a11.concat(Object.keys(b12)), []);
            if (b11.length > 0) {
              let a11 = [...new Set(b11)].map((a12) => `"${a12}"`);
              e10.searchParams.set("columns", a11.join(","));
            }
          }
          return new b1({ method: "POST", url: e10, headers: f10, schema: this.schema, body: a10, fetch: null != (d10 = this.fetch) ? d10 : fetch, urlLengthLimit: this.urlLengthLimit });
        }
        upsert(a10, { onConflict: b10, ignoreDuplicates: c10 = false, count: d10, defaultToNull: e10 = true } = {}) {
          var f10;
          let { url: g2, headers: h2 } = this.cloneRequestState();
          if (h2.append("Prefer", `resolution=${c10 ? "ignore" : "merge"}-duplicates`), void 0 !== b10 && g2.searchParams.set("on_conflict", b10), d10 && h2.append("Prefer", `count=${d10}`), e10 || h2.append("Prefer", "missing=default"), Array.isArray(a10)) {
            let b11 = a10.reduce((a11, b12) => a11.concat(Object.keys(b12)), []);
            if (b11.length > 0) {
              let a11 = [...new Set(b11)].map((a12) => `"${a12}"`);
              g2.searchParams.set("columns", a11.join(","));
            }
          }
          return new b1({ method: "POST", url: g2, headers: h2, schema: this.schema, body: a10, fetch: null != (f10 = this.fetch) ? f10 : fetch, urlLengthLimit: this.urlLengthLimit });
        }
        update(a10, { count: b10 } = {}) {
          var c10;
          let { url: d10, headers: e10 } = this.cloneRequestState();
          return b10 && e10.append("Prefer", `count=${b10}`), new b1({ method: "PATCH", url: d10, headers: e10, schema: this.schema, body: a10, fetch: null != (c10 = this.fetch) ? c10 : fetch, urlLengthLimit: this.urlLengthLimit });
        }
        delete({ count: a10 } = {}) {
          var b10;
          let { url: c10, headers: d10 } = this.cloneRequestState();
          return a10 && d10.append("Prefer", `count=${a10}`), new b1({ method: "DELETE", url: c10, headers: d10, schema: this.schema, fetch: null != (b10 = this.fetch) ? b10 : fetch, urlLengthLimit: this.urlLengthLimit });
        }
      };
      function b3(a10) {
        return (b3 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(a11) {
          return typeof a11;
        } : function(a11) {
          return a11 && "function" == typeof Symbol && a11.constructor === Symbol && a11 !== Symbol.prototype ? "symbol" : typeof a11;
        })(a10);
      }
      function b4(a10, b10) {
        var c10 = Object.keys(a10);
        if (Object.getOwnPropertySymbols) {
          var d10 = Object.getOwnPropertySymbols(a10);
          b10 && (d10 = d10.filter(function(b11) {
            return Object.getOwnPropertyDescriptor(a10, b11).enumerable;
          })), c10.push.apply(c10, d10);
        }
        return c10;
      }
      function b5(a10) {
        for (var b10 = 1; b10 < arguments.length; b10++) {
          var c10 = null != arguments[b10] ? arguments[b10] : {};
          b10 % 2 ? b4(Object(c10), true).forEach(function(b11) {
            !function(a11, b12, c11) {
              var d10;
              (d10 = function(a12, b13) {
                if ("object" != b3(a12) || !a12) return a12;
                var c12 = a12[Symbol.toPrimitive];
                if (void 0 !== c12) {
                  var d11 = c12.call(a12, b13 || "default");
                  if ("object" != b3(d11)) return d11;
                  throw TypeError("@@toPrimitive must return a primitive value.");
                }
                return ("string" === b13 ? String : Number)(a12);
              }(b12, "string"), (b12 = "symbol" == b3(d10) ? d10 : d10 + "") in a11) ? Object.defineProperty(a11, b12, { value: c11, enumerable: true, configurable: true, writable: true }) : a11[b12] = c11;
            }(a10, b11, c10[b11]);
          }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(a10, Object.getOwnPropertyDescriptors(c10)) : b4(Object(c10)).forEach(function(b11) {
            Object.defineProperty(a10, b11, Object.getOwnPropertyDescriptor(c10, b11));
          });
        }
        return a10;
      }
      var b6 = class a10 {
        constructor(a11, { headers: b10 = {}, schema: c10, fetch: d10, timeout: e10, urlLengthLimit: f10 = 8e3 } = {}) {
          this.url = a11, this.headers = new Headers(b10), this.schemaName = c10, this.urlLengthLimit = f10;
          let g2 = null != d10 ? d10 : globalThis.fetch;
          void 0 !== e10 && e10 > 0 ? this.fetch = (a12, b11) => {
            let c11 = new AbortController(), d11 = setTimeout(() => c11.abort(), e10), f11 = null == b11 ? void 0 : b11.signal;
            if (f11) {
              if (f11.aborted) return clearTimeout(d11), g2(a12, b11);
              let e11 = () => {
                clearTimeout(d11), c11.abort();
              };
              return f11.addEventListener("abort", e11, { once: true }), g2(a12, b5(b5({}, b11), {}, { signal: c11.signal })).finally(() => {
                clearTimeout(d11), f11.removeEventListener("abort", e11);
              });
            }
            return g2(a12, b5(b5({}, b11), {}, { signal: c11.signal })).finally(() => clearTimeout(d11));
          } : this.fetch = g2;
        }
        from(a11) {
          if (!a11 || "string" != typeof a11 || "" === a11.trim()) throw Error("Invalid relation name: relation must be a non-empty string.");
          return new b2(new URL(`${this.url}/${a11}`), { headers: new Headers(this.headers), schema: this.schemaName, fetch: this.fetch, urlLengthLimit: this.urlLengthLimit });
        }
        schema(b10) {
          return new a10(this.url, { headers: this.headers, schema: b10, fetch: this.fetch, urlLengthLimit: this.urlLengthLimit });
        }
        rpc(a11, b10 = {}, { head: c10 = false, get: d10 = false, count: e10 } = {}) {
          var f10;
          let g2, h2, i2 = new URL(`${this.url}/rpc/${a11}`), j2 = (a12) => null !== a12 && "object" == typeof a12 && (!Array.isArray(a12) || a12.some(j2)), k2 = c10 && Object.values(b10).some(j2);
          k2 ? (g2 = "POST", h2 = b10) : c10 || d10 ? (g2 = c10 ? "HEAD" : "GET", Object.entries(b10).filter(([a12, b11]) => void 0 !== b11).map(([a12, b11]) => [a12, Array.isArray(b11) ? `{${b11.join(",")}}` : `${b11}`]).forEach(([a12, b11]) => {
            i2.searchParams.append(a12, b11);
          })) : (g2 = "POST", h2 = b10);
          let l2 = new Headers(this.headers);
          return k2 ? l2.set("Prefer", e10 ? `count=${e10},return=minimal` : "return=minimal") : e10 && l2.set("Prefer", `count=${e10}`), new b1({ method: g2, url: i2, headers: l2, schema: this.schemaName, body: h2, fetch: null != (f10 = this.fetch) ? f10 : fetch, urlLengthLimit: this.urlLengthLimit });
        }
      };
      class b7 {
        constructor() {
        }
        static detectEnvironment() {
          var a10;
          if ("undefined" != typeof WebSocket) return { type: "native", constructor: WebSocket };
          if ("undefined" != typeof globalThis && void 0 !== globalThis.WebSocket) return { type: "native", constructor: globalThis.WebSocket };
          if (void 0 !== c.g && void 0 !== c.g.WebSocket) return { type: "native", constructor: c.g.WebSocket };
          if ("undefined" != typeof globalThis && void 0 !== globalThis.WebSocketPair && void 0 === globalThis.WebSocket) return { type: "cloudflare", error: "Cloudflare Workers detected. WebSocket clients are not supported in Cloudflare Workers.", workaround: "Use Cloudflare Workers WebSocket API for server-side WebSocket handling, or deploy to a different runtime." };
          if ("undefined" != typeof globalThis && globalThis.EdgeRuntime || "undefined" != typeof navigator && (null == (a10 = navigator.userAgent) ? void 0 : a10.includes("Vercel-Edge"))) return { type: "unsupported", error: "Edge runtime detected (Vercel Edge/Netlify Edge). WebSockets are not supported in edge functions.", workaround: "Use serverless functions or a different deployment target for WebSocket functionality." };
          let b10 = globalThis.process;
          if (b10) {
            let a11 = b10.versions;
            if (a11 && a11.node) {
              let b11 = parseInt(a11.node.replace(/^v/, "").split(".")[0]);
              return b11 >= 22 ? void 0 !== globalThis.WebSocket ? { type: "native", constructor: globalThis.WebSocket } : { type: "unsupported", error: `Node.js ${b11} detected but native WebSocket not found.`, workaround: "Provide a WebSocket implementation via the transport option." } : { type: "unsupported", error: `Node.js ${b11} detected without native WebSocket support.`, workaround: 'For Node.js < 22, install "ws" package and provide it via the transport option:\nimport ws from "ws"\nnew RealtimeClient(url, { transport: ws })' };
            }
          }
          return { type: "unsupported", error: "Unknown JavaScript runtime without WebSocket support.", workaround: "Ensure you're running in a supported environment (browser, Node.js, Deno) or provide a custom WebSocket implementation." };
        }
        static getWebSocketConstructor() {
          let a10 = this.detectEnvironment();
          if (a10.constructor) return a10.constructor;
          let b10 = a10.error || "WebSocket not supported in this environment.";
          throw a10.workaround && (b10 += `

Suggested solution: ${a10.workaround}`), Error(b10);
        }
        static isWebSocketSupported() {
          try {
            let a10 = this.detectEnvironment();
            return "native" === a10.type || "ws" === a10.type;
          } catch (a10) {
            return false;
          }
        }
      }
      let b8 = "2.0.0", b9 = { closed: "closed", errored: "errored", joined: "joined", joining: "joining", leaving: "leaving" }, ca = { close: "phx_close", error: "phx_error", join: "phx_join", reply: "phx_reply", leave: "phx_leave", access_token: "access_token" }, cb = { connecting: "connecting", closing: "closing", closed: "closed" };
      class cc {
        constructor(a10) {
          this.HEADER_LENGTH = 1, this.USER_BROADCAST_PUSH_META_LENGTH = 6, this.KINDS = { userBroadcastPush: 3, userBroadcast: 4 }, this.BINARY_ENCODING = 0, this.JSON_ENCODING = 1, this.BROADCAST_EVENT = "broadcast", this.allowedMetadataKeys = [], this.allowedMetadataKeys = null != a10 ? a10 : [];
        }
        encode(a10, b10) {
          return a10.event !== this.BROADCAST_EVENT || a10.payload instanceof ArrayBuffer || "string" != typeof a10.payload.event ? b10(JSON.stringify([a10.join_ref, a10.ref, a10.topic, a10.event, a10.payload])) : b10(this._binaryEncodeUserBroadcastPush(a10));
        }
        _binaryEncodeUserBroadcastPush(a10) {
          var b10;
          return this._isArrayBuffer(null == (b10 = a10.payload) ? void 0 : b10.payload) ? this._encodeBinaryUserBroadcastPush(a10) : this._encodeJsonUserBroadcastPush(a10);
        }
        _encodeBinaryUserBroadcastPush(a10) {
          var b10, c10;
          let d10 = null != (c10 = null == (b10 = a10.payload) ? void 0 : b10.payload) ? c10 : new ArrayBuffer(0);
          return this._encodeUserBroadcastPush(a10, this.BINARY_ENCODING, d10);
        }
        _encodeJsonUserBroadcastPush(a10) {
          var b10, c10;
          let d10 = null != (c10 = null == (b10 = a10.payload) ? void 0 : b10.payload) ? c10 : {}, e10 = new TextEncoder().encode(JSON.stringify(d10)).buffer;
          return this._encodeUserBroadcastPush(a10, this.JSON_ENCODING, e10);
        }
        _encodeUserBroadcastPush(a10, b10, c10) {
          let d10 = a10.topic, e10 = null != (n2 = a10.ref) ? n2 : "", f10 = null != (o2 = a10.join_ref) ? o2 : "", g2 = a10.payload.event, h2 = this.allowedMetadataKeys ? this._pick(a10.payload, this.allowedMetadataKeys) : {}, i2 = 0 === Object.keys(h2).length ? "" : JSON.stringify(h2);
          if (f10.length > 255) throw Error(`joinRef length ${f10.length} exceeds maximum of 255`);
          if (e10.length > 255) throw Error(`ref length ${e10.length} exceeds maximum of 255`);
          if (d10.length > 255) throw Error(`topic length ${d10.length} exceeds maximum of 255`);
          if (g2.length > 255) throw Error(`userEvent length ${g2.length} exceeds maximum of 255`);
          if (i2.length > 255) throw Error(`metadata length ${i2.length} exceeds maximum of 255`);
          let j2 = this.USER_BROADCAST_PUSH_META_LENGTH + f10.length + e10.length + d10.length + g2.length + i2.length, k2 = new ArrayBuffer(this.HEADER_LENGTH + j2), l2 = new DataView(k2), m2 = 0;
          l2.setUint8(m2++, this.KINDS.userBroadcastPush), l2.setUint8(m2++, f10.length), l2.setUint8(m2++, e10.length), l2.setUint8(m2++, d10.length), l2.setUint8(m2++, g2.length), l2.setUint8(m2++, i2.length), l2.setUint8(m2++, b10), Array.from(f10, (a11) => l2.setUint8(m2++, a11.charCodeAt(0))), Array.from(e10, (a11) => l2.setUint8(m2++, a11.charCodeAt(0))), Array.from(d10, (a11) => l2.setUint8(m2++, a11.charCodeAt(0))), Array.from(g2, (a11) => l2.setUint8(m2++, a11.charCodeAt(0))), Array.from(i2, (a11) => l2.setUint8(m2++, a11.charCodeAt(0)));
          var n2, o2, p2 = new Uint8Array(k2.byteLength + c10.byteLength);
          return p2.set(new Uint8Array(k2), 0), p2.set(new Uint8Array(c10), k2.byteLength), p2.buffer;
        }
        decode(a10, b10) {
          if (this._isArrayBuffer(a10)) return b10(this._binaryDecode(a10));
          if ("string" == typeof a10) {
            let [c10, d10, e10, f10, g2] = JSON.parse(a10);
            return b10({ join_ref: c10, ref: d10, topic: e10, event: f10, payload: g2 });
          }
          return b10({});
        }
        _binaryDecode(a10) {
          let b10 = new DataView(a10), c10 = b10.getUint8(0), d10 = new TextDecoder();
          if (c10 === this.KINDS.userBroadcast) return this._decodeUserBroadcast(a10, b10, d10);
        }
        _decodeUserBroadcast(a10, b10, c10) {
          let d10 = b10.getUint8(1), e10 = b10.getUint8(2), f10 = b10.getUint8(3), g2 = b10.getUint8(4), h2 = this.HEADER_LENGTH + 4, i2 = c10.decode(a10.slice(h2, h2 + d10));
          h2 += d10;
          let j2 = c10.decode(a10.slice(h2, h2 + e10));
          h2 += e10;
          let k2 = c10.decode(a10.slice(h2, h2 + f10));
          h2 += f10;
          let l2 = a10.slice(h2, a10.byteLength), m2 = g2 === this.JSON_ENCODING ? JSON.parse(c10.decode(l2)) : l2, n2 = { type: this.BROADCAST_EVENT, event: j2, payload: m2 };
          return f10 > 0 && (n2.meta = JSON.parse(k2)), { join_ref: null, ref: null, topic: i2, event: this.BROADCAST_EVENT, payload: n2 };
        }
        _isArrayBuffer(a10) {
          var b10;
          return a10 instanceof ArrayBuffer || (null == (b10 = null == a10 ? void 0 : a10.constructor) ? void 0 : b10.name) === "ArrayBuffer";
        }
        _pick(a10, b10) {
          return a10 && "object" == typeof a10 ? Object.fromEntries(Object.entries(a10).filter(([a11]) => b10.includes(a11))) : {};
        }
      }
      !function(a10) {
        a10.abstime = "abstime", a10.bool = "bool", a10.date = "date", a10.daterange = "daterange", a10.float4 = "float4", a10.float8 = "float8", a10.int2 = "int2", a10.int4 = "int4", a10.int4range = "int4range", a10.int8 = "int8", a10.int8range = "int8range", a10.json = "json", a10.jsonb = "jsonb", a10.money = "money", a10.numeric = "numeric", a10.oid = "oid", a10.reltime = "reltime", a10.text = "text", a10.time = "time", a10.timestamp = "timestamp", a10.timestamptz = "timestamptz", a10.timetz = "timetz", a10.tsrange = "tsrange", a10.tstzrange = "tstzrange";
      }(m || (m = {}));
      let cd = (a10, b10, c10 = {}) => {
        var d10;
        let e10 = null != (d10 = c10.skipTypes) ? d10 : [];
        return b10 ? Object.keys(b10).reduce((c11, d11) => (c11[d11] = ce(d11, a10, b10, e10), c11), {}) : {};
      }, ce = (a10, b10, c10, d10) => {
        let e10 = b10.find((b11) => b11.name === a10), f10 = null == e10 ? void 0 : e10.type, g2 = c10[a10];
        return f10 && !d10.includes(f10) ? cf(f10, g2) : cg(g2);
      }, cf = (a10, b10) => {
        if ("_" === a10.charAt(0)) return ck(b10, a10.slice(1, a10.length));
        switch (a10) {
          case m.bool:
            return ch(b10);
          case m.float4:
          case m.float8:
          case m.int2:
          case m.int4:
          case m.int8:
          case m.numeric:
          case m.oid:
            return ci(b10);
          case m.json:
          case m.jsonb:
            return cj(b10);
          case m.timestamp:
            return cl(b10);
          case m.abstime:
          case m.date:
          case m.daterange:
          case m.int4range:
          case m.int8range:
          case m.money:
          case m.reltime:
          case m.text:
          case m.time:
          case m.timestamptz:
          case m.timetz:
          case m.tsrange:
          case m.tstzrange:
          default:
            return cg(b10);
        }
      }, cg = (a10) => a10, ch = (a10) => {
        switch (a10) {
          case "t":
            return true;
          case "f":
            return false;
          default:
            return a10;
        }
      }, ci = (a10) => {
        if ("string" == typeof a10) {
          let b10 = parseFloat(a10);
          if (!Number.isNaN(b10)) return b10;
        }
        return a10;
      }, cj = (a10) => {
        if ("string" == typeof a10) try {
          return JSON.parse(a10);
        } catch (a11) {
        }
        return a10;
      }, ck = (a10, b10) => {
        if ("string" != typeof a10) return a10;
        let c10 = a10.length - 1, d10 = a10[c10];
        if ("{" === a10[0] && "}" === d10) {
          let d11, e10 = a10.slice(1, c10);
          try {
            d11 = JSON.parse("[" + e10 + "]");
          } catch (a11) {
            d11 = e10 ? e10.split(",") : [];
          }
          return d11.map((a11) => cf(b10, a11));
        }
        return a10;
      }, cl = (a10) => "string" == typeof a10 ? a10.replace(" ", "T") : a10, cm = (a10) => {
        let b10 = new URL(a10);
        return b10.protocol = b10.protocol.replace(/^ws/i, "http"), b10.pathname = b10.pathname.replace(/\/+$/, "").replace(/\/socket\/websocket$/i, "").replace(/\/socket$/i, "").replace(/\/websocket$/i, ""), "" === b10.pathname || "/" === b10.pathname ? b10.pathname = "/api/broadcast" : b10.pathname = b10.pathname + "/api/broadcast", b10.href;
      };
      var cn = (a10) => "function" == typeof a10 ? a10 : function() {
        return a10;
      }, co = "undefined" != typeof window ? window : null, cp = ("undefined" != typeof self ? self : null) || co || globalThis, cq = { connecting: 0, open: 1, closing: 2, closed: 3 }, cr = { closed: "closed", errored: "errored", joined: "joined", joining: "joining", leaving: "leaving" }, cs = { close: "phx_close", error: "phx_error", join: "phx_join", reply: "phx_reply", leave: "phx_leave" }, ct = { longpoll: "longpoll", websocket: "websocket" }, cu = { complete: 4 }, cv = "base64url.bearer.phx.", cw = class {
        constructor(a10, b10, c10, d10) {
          this.channel = a10, this.event = b10, this.payload = c10 || function() {
            return {};
          }, this.receivedResp = null, this.timeout = d10, this.timeoutTimer = null, this.recHooks = [], this.sent = false, this.ref = void 0;
        }
        resend(a10) {
          this.timeout = a10, this.reset(), this.send();
        }
        send() {
          this.hasReceived("timeout") || (this.startTimeout(), this.sent = true, this.channel.socket.push({ topic: this.channel.topic, event: this.event, payload: this.payload(), ref: this.ref, join_ref: this.channel.joinRef() }));
        }
        receive(a10, b10) {
          return this.hasReceived(a10) && b10(this.receivedResp.response), this.recHooks.push({ status: a10, callback: b10 }), this;
        }
        reset() {
          this.cancelRefEvent(), this.ref = null, this.refEvent = null, this.receivedResp = null, this.sent = false;
        }
        destroy() {
          this.cancelRefEvent(), this.cancelTimeout();
        }
        matchReceive({ status: a10, response: b10, _ref: c10 }) {
          this.recHooks.filter((b11) => b11.status === a10).forEach((a11) => a11.callback(b10));
        }
        cancelRefEvent() {
          this.refEvent && this.channel.off(this.refEvent);
        }
        cancelTimeout() {
          clearTimeout(this.timeoutTimer), this.timeoutTimer = null;
        }
        startTimeout() {
          this.timeoutTimer && this.cancelTimeout(), this.ref = this.channel.socket.makeRef(), this.refEvent = this.channel.replyEventName(this.ref), this.channel.on(this.refEvent, (a10) => {
            this.cancelRefEvent(), this.cancelTimeout(), this.receivedResp = a10, this.matchReceive(a10);
          }), this.timeoutTimer = setTimeout(() => {
            this.trigger("timeout", {});
          }, this.timeout);
        }
        hasReceived(a10) {
          return this.receivedResp && this.receivedResp.status === a10;
        }
        trigger(a10, b10) {
          this.channel.trigger(this.refEvent, { status: a10, response: b10 });
        }
      }, cx = class {
        constructor(a10, b10) {
          this.callback = a10, this.timerCalc = b10, this.timer = void 0, this.tries = 0;
        }
        reset() {
          this.tries = 0, clearTimeout(this.timer);
        }
        scheduleTimeout() {
          clearTimeout(this.timer), this.timer = setTimeout(() => {
            this.tries = this.tries + 1, this.callback();
          }, this.timerCalc(this.tries + 1));
        }
      }, cy = class {
        constructor(a10, b10, c10) {
          this.state = cr.closed, this.topic = a10, this.params = cn(b10 || {}), this.socket = c10, this.bindings = [], this.bindingRef = 0, this.timeout = this.socket.timeout, this.joinedOnce = false, this.joinPush = new cw(this, cs.join, this.params, this.timeout), this.pushBuffer = [], this.stateChangeRefs = [], this.rejoinTimer = new cx(() => {
            this.socket.isConnected() && this.rejoin();
          }, this.socket.rejoinAfterMs), this.stateChangeRefs.push(this.socket.onError(() => this.rejoinTimer.reset())), this.stateChangeRefs.push(this.socket.onOpen(() => {
            this.rejoinTimer.reset(), this.isErrored() && this.rejoin();
          })), this.joinPush.receive("ok", () => {
            this.state = cr.joined, this.rejoinTimer.reset(), this.pushBuffer.forEach((a11) => a11.send()), this.pushBuffer = [];
          }), this.joinPush.receive("error", (a11) => {
            this.state = cr.errored, this.socket.hasLogger() && this.socket.log("channel", `error ${this.topic}`, a11), this.socket.isConnected() && this.rejoinTimer.scheduleTimeout();
          }), this.onClose(() => {
            this.rejoinTimer.reset(), this.socket.hasLogger() && this.socket.log("channel", `close ${this.topic}`), this.state = cr.closed, this.socket.remove(this);
          }), this.onError((a11) => {
            this.socket.hasLogger() && this.socket.log("channel", `error ${this.topic}`, a11), this.isJoining() && this.joinPush.reset(), this.state = cr.errored, this.socket.isConnected() && this.rejoinTimer.scheduleTimeout();
          }), this.joinPush.receive("timeout", () => {
            this.socket.hasLogger() && this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout), new cw(this, cs.leave, cn({}), this.timeout).send(), this.state = cr.errored, this.joinPush.reset(), this.socket.isConnected() && this.rejoinTimer.scheduleTimeout();
          }), this.on(cs.reply, (a11, b11) => {
            this.trigger(this.replyEventName(b11), a11);
          });
        }
        join(a10 = this.timeout) {
          if (!this.joinedOnce) return this.timeout = a10, this.joinedOnce = true, this.rejoin(), this.joinPush;
          throw Error("tried to join multiple times. 'join' can only be called a single time per channel instance");
        }
        teardown() {
          this.pushBuffer.forEach((a10) => a10.destroy()), this.pushBuffer = [], this.rejoinTimer.reset(), this.joinPush.destroy(), this.state = cr.closed, this.bindings = [];
        }
        onClose(a10) {
          this.on(cs.close, a10);
        }
        onError(a10) {
          return this.on(cs.error, (b10) => a10(b10));
        }
        on(a10, b10) {
          let c10 = this.bindingRef++;
          return this.bindings.push({ event: a10, ref: c10, callback: b10 }), c10;
        }
        off(a10, b10) {
          this.bindings = this.bindings.filter((c10) => c10.event !== a10 || void 0 !== b10 && b10 !== c10.ref);
        }
        canPush() {
          return this.socket.isConnected() && this.isJoined();
        }
        push(a10, b10, c10 = this.timeout) {
          if (b10 = b10 || {}, !this.joinedOnce) throw Error(`tried to push '${a10}' to '${this.topic}' before joining. Use channel.join() before pushing events`);
          let d10 = new cw(this, a10, function() {
            return b10;
          }, c10);
          return this.canPush() ? d10.send() : (d10.startTimeout(), this.pushBuffer.push(d10)), d10;
        }
        leave(a10 = this.timeout) {
          this.rejoinTimer.reset(), this.joinPush.cancelTimeout(), this.state = cr.leaving;
          let b10 = () => {
            this.socket.hasLogger() && this.socket.log("channel", `leave ${this.topic}`), this.trigger(cs.close, "leave");
          }, c10 = new cw(this, cs.leave, cn({}), a10);
          return c10.receive("ok", () => b10()).receive("timeout", () => b10()), c10.send(), this.canPush() || c10.trigger("ok", {}), c10;
        }
        onMessage(a10, b10, c10) {
          return b10;
        }
        filterBindings(a10, b10, c10) {
          return true;
        }
        isMember(a10, b10, c10, d10) {
          return this.topic === a10 && (!d10 || d10 === this.joinRef() || (this.socket.hasLogger() && this.socket.log("channel", "dropping outdated message", { topic: a10, event: b10, payload: c10, joinRef: d10 }), false));
        }
        joinRef() {
          return this.joinPush.ref;
        }
        rejoin(a10 = this.timeout) {
          this.isLeaving() || (this.socket.leaveOpenTopic(this.topic), this.state = cr.joining, this.joinPush.resend(a10));
        }
        trigger(a10, b10, c10, d10) {
          let e10 = this.onMessage(a10, b10, c10, d10);
          if (b10 && !e10) throw Error("channel onMessage callbacks must return the payload, modified or unmodified");
          let f10 = this.bindings.filter((d11) => d11.event === a10 && this.filterBindings(d11, b10, c10));
          for (let a11 = 0; a11 < f10.length; a11++) f10[a11].callback(e10, c10, d10 || this.joinRef());
        }
        replyEventName(a10) {
          return `chan_reply_${a10}`;
        }
        isClosed() {
          return this.state === cr.closed;
        }
        isErrored() {
          return this.state === cr.errored;
        }
        isJoined() {
          return this.state === cr.joined;
        }
        isJoining() {
          return this.state === cr.joining;
        }
        isLeaving() {
          return this.state === cr.leaving;
        }
      }, cz = class {
        static request(a10, b10, c10, d10, e10, f10, g2) {
          if (cp.XDomainRequest) {
            let c11 = new cp.XDomainRequest();
            return this.xdomainRequest(c11, a10, b10, d10, e10, f10, g2);
          }
          if (cp.XMLHttpRequest) {
            let h2 = new cp.XMLHttpRequest();
            return this.xhrRequest(h2, a10, b10, c10, d10, e10, f10, g2);
          }
          if (cp.fetch && cp.AbortController) return this.fetchRequest(a10, b10, c10, d10, e10, f10, g2);
          throw Error("No suitable XMLHttpRequest implementation found");
        }
        static fetchRequest(a10, b10, c10, d10, e10, f10, g2) {
          let h2 = { method: a10, headers: c10, body: d10 }, i2 = null;
          return e10 && (i2 = new AbortController(), setTimeout(() => i2.abort(), e10), h2.signal = i2.signal), cp.fetch(b10, h2).then((a11) => a11.text()).then((a11) => this.parseJSON(a11)).then((a11) => g2 && g2(a11)).catch((a11) => {
            "AbortError" === a11.name && f10 ? f10() : g2 && g2(null);
          }), i2;
        }
        static xdomainRequest(a10, b10, c10, d10, e10, f10, g2) {
          return a10.timeout = e10, a10.open(b10, c10), a10.onload = () => {
            let b11 = this.parseJSON(a10.responseText);
            g2 && g2(b11);
          }, f10 && (a10.ontimeout = f10), a10.onprogress = () => {
          }, a10.send(d10), a10;
        }
        static xhrRequest(a10, b10, c10, d10, e10, f10, g2, h2) {
          for (let [e11, g3] of (a10.open(b10, c10, true), a10.timeout = f10, Object.entries(d10))) a10.setRequestHeader(e11, g3);
          return a10.onerror = () => h2 && h2(null), a10.onreadystatechange = () => {
            a10.readyState === cu.complete && h2 && h2(this.parseJSON(a10.responseText));
          }, g2 && (a10.ontimeout = g2), a10.send(e10), a10;
        }
        static parseJSON(a10) {
          if (!a10 || "" === a10) return null;
          try {
            return JSON.parse(a10);
          } catch {
            return console && console.log("failed to parse JSON response", a10), null;
          }
        }
        static serialize(a10, b10) {
          let c10 = [];
          for (var d10 in a10) {
            if (!Object.prototype.hasOwnProperty.call(a10, d10)) continue;
            let e10 = b10 ? `${b10}[${d10}]` : d10, f10 = a10[d10];
            "object" == typeof f10 ? c10.push(this.serialize(f10, e10)) : c10.push(encodeURIComponent(e10) + "=" + encodeURIComponent(f10));
          }
          return c10.join("&");
        }
        static appendParams(a10, b10) {
          if (0 === Object.keys(b10).length) return a10;
          let c10 = a10.match(/\?/) ? "&" : "?";
          return `${a10}${c10}${this.serialize(b10)}`;
        }
      }, cA = class {
        constructor(a10, b10) {
          b10 && 2 === b10.length && b10[1].startsWith(cv) && (this.authToken = atob(b10[1].slice(cv.length))), this.endPoint = null, this.token = null, this.skipHeartbeat = true, this.reqs = /* @__PURE__ */ new Set(), this.awaitingBatchAck = false, this.currentBatch = null, this.currentBatchTimer = null, this.batchBuffer = [], this.onopen = function() {
          }, this.onerror = function() {
          }, this.onmessage = function() {
          }, this.onclose = function() {
          }, this.pollEndpoint = this.normalizeEndpoint(a10), this.readyState = cq.connecting, setTimeout(() => this.poll(), 0);
        }
        normalizeEndpoint(a10) {
          return a10.replace("ws://", "http://").replace("wss://", "https://").replace(RegExp("(.*)/" + ct.websocket), "$1/" + ct.longpoll);
        }
        endpointURL() {
          return cz.appendParams(this.pollEndpoint, { token: this.token });
        }
        closeAndRetry(a10, b10, c10) {
          this.close(a10, b10, c10), this.readyState = cq.connecting;
        }
        ontimeout() {
          this.onerror("timeout"), this.closeAndRetry(1005, "timeout", false);
        }
        isActive() {
          return this.readyState === cq.open || this.readyState === cq.connecting;
        }
        poll() {
          let a10 = { Accept: "application/json" };
          this.authToken && (a10["X-Phoenix-AuthToken"] = this.authToken), this.ajax("GET", a10, null, () => this.ontimeout(), (a11) => {
            if (a11) {
              var { status: b10, token: c10, messages: d10 } = a11;
              if (410 === b10 && null !== this.token) {
                this.onerror(410), this.closeAndRetry(3410, "session_gone", false);
                return;
              }
              this.token = c10;
            } else b10 = 0;
            switch (b10) {
              case 200:
                d10.forEach((a12) => {
                  setTimeout(() => this.onmessage({ data: a12 }), 0);
                }), this.poll();
                break;
              case 204:
                this.poll();
                break;
              case 410:
                this.readyState = cq.open, this.onopen({}), this.poll();
                break;
              case 403:
                this.onerror(403), this.close(1008, "forbidden", false);
                break;
              case 0:
              case 500:
                this.onerror(500), this.closeAndRetry(1011, "internal server error", 500);
                break;
              default:
                throw Error(`unhandled poll status ${b10}`);
            }
          });
        }
        send(a10) {
          "string" != typeof a10 && (a10 = ((a11) => {
            let b10 = "", c10 = new Uint8Array(a11), d10 = c10.byteLength;
            for (let a12 = 0; a12 < d10; a12++) b10 += String.fromCharCode(c10[a12]);
            return btoa(b10);
          })(a10)), this.currentBatch ? this.currentBatch.push(a10) : this.awaitingBatchAck ? this.batchBuffer.push(a10) : (this.currentBatch = [a10], this.currentBatchTimer = setTimeout(() => {
            this.batchSend(this.currentBatch), this.currentBatch = null;
          }, 0));
        }
        batchSend(a10) {
          this.awaitingBatchAck = true, this.ajax("POST", { "Content-Type": "application/x-ndjson" }, a10.join("\n"), () => this.onerror("timeout"), (a11) => {
            this.awaitingBatchAck = false, a11 && 200 === a11.status ? this.batchBuffer.length > 0 && (this.batchSend(this.batchBuffer), this.batchBuffer = []) : (this.onerror(a11 && a11.status), this.closeAndRetry(1011, "internal server error", false));
          });
        }
        close(a10, b10, c10) {
          for (let a11 of this.reqs) a11.abort();
          this.readyState = cq.closed;
          let d10 = Object.assign({ code: 1e3, reason: void 0, wasClean: true }, { code: a10, reason: b10, wasClean: c10 });
          this.batchBuffer = [], clearTimeout(this.currentBatchTimer), this.currentBatchTimer = null, "undefined" != typeof CloseEvent ? this.onclose(new CloseEvent("close", d10)) : this.onclose(d10);
        }
        ajax(a10, b10, c10, d10, e10) {
          let f10, g2 = () => {
            this.reqs.delete(f10), d10();
          };
          f10 = cz.request(a10, this.endpointURL(), b10, c10, this.timeout, g2, (a11) => {
            this.reqs.delete(f10), this.isActive() && e10(a11);
          }), this.reqs.add(f10);
        }
      }, cB = class a10 {
        constructor(b10, c10 = {}) {
          let d10 = c10.events || { state: "presence_state", diff: "presence_diff" };
          this.state = {}, this.pendingDiffs = [], this.channel = b10, this.joinRef = null, this.caller = { onJoin: function() {
          }, onLeave: function() {
          }, onSync: function() {
          } }, this.channel.on(d10.state, (b11) => {
            let { onJoin: c11, onLeave: d11, onSync: e10 } = this.caller;
            this.joinRef = this.channel.joinRef(), this.state = a10.syncState(this.state, b11, c11, d11), this.pendingDiffs.forEach((b12) => {
              this.state = a10.syncDiff(this.state, b12, c11, d11);
            }), this.pendingDiffs = [], e10();
          }), this.channel.on(d10.diff, (b11) => {
            let { onJoin: c11, onLeave: d11, onSync: e10 } = this.caller;
            this.inPendingSyncState() ? this.pendingDiffs.push(b11) : (this.state = a10.syncDiff(this.state, b11, c11, d11), e10());
          });
        }
        onJoin(a11) {
          this.caller.onJoin = a11;
        }
        onLeave(a11) {
          this.caller.onLeave = a11;
        }
        onSync(a11) {
          this.caller.onSync = a11;
        }
        list(b10) {
          return a10.list(this.state, b10);
        }
        inPendingSyncState() {
          return !this.joinRef || this.joinRef !== this.channel.joinRef();
        }
        static syncState(a11, b10, c10, d10) {
          let e10 = this.clone(a11), f10 = {}, g2 = {};
          return this.map(e10, (a12, c11) => {
            b10[a12] || (g2[a12] = c11);
          }), this.map(b10, (a12, b11) => {
            let c11 = e10[a12];
            if (c11) {
              let d11 = b11.metas.map((a13) => a13.phx_ref), e11 = c11.metas.map((a13) => a13.phx_ref), h2 = b11.metas.filter((a13) => 0 > e11.indexOf(a13.phx_ref)), i2 = c11.metas.filter((a13) => 0 > d11.indexOf(a13.phx_ref));
              h2.length > 0 && (f10[a12] = b11, f10[a12].metas = h2), i2.length > 0 && (g2[a12] = this.clone(c11), g2[a12].metas = i2);
            } else f10[a12] = b11;
          }), this.syncDiff(e10, { joins: f10, leaves: g2 }, c10, d10);
        }
        static syncDiff(a11, b10, c10, d10) {
          let { joins: e10, leaves: f10 } = this.clone(b10);
          return c10 || (c10 = function() {
          }), d10 || (d10 = function() {
          }), this.map(e10, (b11, d11) => {
            let e11 = a11[b11];
            if (a11[b11] = this.clone(d11), e11) {
              let c11 = a11[b11].metas.map((a12) => a12.phx_ref), d12 = e11.metas.filter((a12) => 0 > c11.indexOf(a12.phx_ref));
              a11[b11].metas.unshift(...d12);
            }
            c10(b11, e11, d11);
          }), this.map(f10, (b11, c11) => {
            let e11 = a11[b11];
            if (!e11) return;
            let f11 = c11.metas.map((a12) => a12.phx_ref);
            e11.metas = e11.metas.filter((a12) => 0 > f11.indexOf(a12.phx_ref)), d10(b11, e11, c11), 0 === e11.metas.length && delete a11[b11];
          }), a11;
        }
        static list(a11, b10) {
          return b10 || (b10 = function(a12, b11) {
            return b11;
          }), this.map(a11, (a12, c10) => b10(a12, c10));
        }
        static map(a11, b10) {
          return Object.getOwnPropertyNames(a11).map((c10) => b10(c10, a11[c10]));
        }
        static clone(a11) {
          return JSON.parse(JSON.stringify(a11));
        }
      }, cC = { HEADER_LENGTH: 1, META_LENGTH: 4, KINDS: { push: 0, reply: 1, broadcast: 2 }, encode(a10, b10) {
        return a10.payload.constructor === ArrayBuffer ? b10(this.binaryEncode(a10)) : b10(JSON.stringify([a10.join_ref, a10.ref, a10.topic, a10.event, a10.payload]));
      }, decode(a10, b10) {
        if (a10.constructor === ArrayBuffer) return b10(this.binaryDecode(a10));
        {
          let [c10, d10, e10, f10, g2] = JSON.parse(a10);
          return b10({ join_ref: c10, ref: d10, topic: e10, event: f10, payload: g2 });
        }
      }, binaryEncode(a10) {
        let { join_ref: b10, ref: c10, event: d10, topic: e10, payload: f10 } = a10, g2 = this.META_LENGTH + b10.length + c10.length + e10.length + d10.length, h2 = new ArrayBuffer(this.HEADER_LENGTH + g2), i2 = new DataView(h2), j2 = 0;
        i2.setUint8(j2++, this.KINDS.push), i2.setUint8(j2++, b10.length), i2.setUint8(j2++, c10.length), i2.setUint8(j2++, e10.length), i2.setUint8(j2++, d10.length), Array.from(b10, (a11) => i2.setUint8(j2++, a11.charCodeAt(0))), Array.from(c10, (a11) => i2.setUint8(j2++, a11.charCodeAt(0))), Array.from(e10, (a11) => i2.setUint8(j2++, a11.charCodeAt(0))), Array.from(d10, (a11) => i2.setUint8(j2++, a11.charCodeAt(0)));
        var k2 = new Uint8Array(h2.byteLength + f10.byteLength);
        return k2.set(new Uint8Array(h2), 0), k2.set(new Uint8Array(f10), h2.byteLength), k2.buffer;
      }, binaryDecode(a10) {
        let b10 = new DataView(a10), c10 = b10.getUint8(0), d10 = new TextDecoder();
        switch (c10) {
          case this.KINDS.push:
            return this.decodePush(a10, b10, d10);
          case this.KINDS.reply:
            return this.decodeReply(a10, b10, d10);
          case this.KINDS.broadcast:
            return this.decodeBroadcast(a10, b10, d10);
        }
      }, decodePush(a10, b10, c10) {
        let d10 = b10.getUint8(1), e10 = b10.getUint8(2), f10 = b10.getUint8(3), g2 = this.HEADER_LENGTH + this.META_LENGTH - 1, h2 = c10.decode(a10.slice(g2, g2 + d10));
        g2 += d10;
        let i2 = c10.decode(a10.slice(g2, g2 + e10));
        g2 += e10;
        let j2 = c10.decode(a10.slice(g2, g2 + f10));
        return g2 += f10, { join_ref: h2, ref: null, topic: i2, event: j2, payload: a10.slice(g2, a10.byteLength) };
      }, decodeReply(a10, b10, c10) {
        let d10 = b10.getUint8(1), e10 = b10.getUint8(2), f10 = b10.getUint8(3), g2 = b10.getUint8(4), h2 = this.HEADER_LENGTH + this.META_LENGTH, i2 = c10.decode(a10.slice(h2, h2 + d10));
        h2 += d10;
        let j2 = c10.decode(a10.slice(h2, h2 + e10));
        h2 += e10;
        let k2 = c10.decode(a10.slice(h2, h2 + f10));
        h2 += f10;
        let l2 = c10.decode(a10.slice(h2, h2 + g2));
        h2 += g2;
        let m2 = a10.slice(h2, a10.byteLength);
        return { join_ref: i2, ref: j2, topic: k2, event: cs.reply, payload: { status: l2, response: m2 } };
      }, decodeBroadcast(a10, b10, c10) {
        let d10 = b10.getUint8(1), e10 = b10.getUint8(2), f10 = this.HEADER_LENGTH + 2, g2 = c10.decode(a10.slice(f10, f10 + d10));
        f10 += d10;
        let h2 = c10.decode(a10.slice(f10, f10 + e10));
        return f10 += e10, { join_ref: null, ref: null, topic: g2, event: h2, payload: a10.slice(f10, a10.byteLength) };
      } }, cD = class {
        constructor(a10, b10 = {}) {
          this.stateChangeCallbacks = { open: [], close: [], error: [], message: [] }, this.channels = [], this.sendBuffer = [], this.ref = 0, this.fallbackRef = null, this.timeout = b10.timeout || 1e4, this.transport = b10.transport || cp.WebSocket || cA, this.conn = void 0, this.primaryPassedHealthCheck = false, this.longPollFallbackMs = b10.longPollFallbackMs, this.fallbackTimer = null, this.sessionStore = b10.sessionStorage || cp && cp.sessionStorage, this.establishedConnections = 0, this.defaultEncoder = cC.encode.bind(cC), this.defaultDecoder = cC.decode.bind(cC), this.closeWasClean = true, this.disconnecting = false, this.binaryType = b10.binaryType || "arraybuffer", this.connectClock = 1, this.pageHidden = false, this.encode = void 0, this.decode = void 0, this.transport !== cA ? (this.encode = b10.encode || this.defaultEncoder, this.decode = b10.decode || this.defaultDecoder) : (this.encode = this.defaultEncoder, this.decode = this.defaultDecoder);
          let c10 = null;
          co && co.addEventListener && (co.addEventListener("pagehide", (a11) => {
            this.conn && (this.disconnect(), c10 = this.connectClock);
          }), co.addEventListener("pageshow", (a11) => {
            c10 === this.connectClock && (c10 = null, this.connect());
          }), co.addEventListener("visibilitychange", () => {
            "hidden" === document.visibilityState ? this.pageHidden = true : (this.pageHidden = false, this.isConnected() || this.closeWasClean || this.teardown(() => this.connect()));
          })), this.heartbeatIntervalMs = b10.heartbeatIntervalMs || 3e4, this.autoSendHeartbeat = b10.autoSendHeartbeat ?? true, this.heartbeatCallback = b10.heartbeatCallback ?? (() => {
          }), this.rejoinAfterMs = (a11) => b10.rejoinAfterMs ? b10.rejoinAfterMs(a11) : [1e3, 2e3, 5e3][a11 - 1] || 1e4, this.reconnectAfterMs = (a11) => b10.reconnectAfterMs ? b10.reconnectAfterMs(a11) : [10, 50, 100, 150, 200, 250, 500, 1e3, 2e3][a11 - 1] || 5e3, this.logger = b10.logger || null, !this.logger && b10.debug && (this.logger = (a11, b11, c11) => {
            console.log(`${a11}: ${b11}`, c11);
          }), this.longpollerTimeout = b10.longpollerTimeout || 2e4, this.params = cn(b10.params || {}), this.endPoint = `${a10}/${ct.websocket}`, this.vsn = b10.vsn || "2.0.0", this.heartbeatTimeoutTimer = null, this.heartbeatTimer = null, this.heartbeatSentAt = null, this.pendingHeartbeatRef = null, this.reconnectTimer = new cx(() => {
            if (this.pageHidden) {
              this.log("Not reconnecting as page is hidden!"), this.teardown();
              return;
            }
            this.teardown(async () => {
              b10.beforeReconnect && await b10.beforeReconnect(), this.connect();
            });
          }, this.reconnectAfterMs), this.authToken = b10.authToken;
        }
        getLongPollTransport() {
          return cA;
        }
        replaceTransport(a10) {
          this.connectClock++, this.closeWasClean = true, clearTimeout(this.fallbackTimer), this.reconnectTimer.reset(), this.conn && (this.conn.close(), this.conn = null), this.transport = a10;
        }
        protocol() {
          return location.protocol.match(/^https/) ? "wss" : "ws";
        }
        endPointURL() {
          let a10 = cz.appendParams(cz.appendParams(this.endPoint, this.params()), { vsn: this.vsn });
          return "/" !== a10.charAt(0) ? a10 : "/" === a10.charAt(1) ? `${this.protocol()}:${a10}` : `${this.protocol()}://${location.host}${a10}`;
        }
        disconnect(a10, b10, c10) {
          this.connectClock++, this.disconnecting = true, this.closeWasClean = true, clearTimeout(this.fallbackTimer), this.reconnectTimer.reset(), this.teardown(() => {
            this.disconnecting = false, a10 && a10();
          }, b10, c10);
        }
        connect(a10) {
          a10 && (console && console.log("passing params to connect is deprecated. Instead pass :params to the Socket constructor"), this.params = cn(a10)), (!this.conn || this.disconnecting) && (this.longPollFallbackMs && this.transport !== cA ? this.connectWithFallback(cA, this.longPollFallbackMs) : this.transportConnect());
        }
        log(a10, b10, c10) {
          this.logger && this.logger(a10, b10, c10);
        }
        hasLogger() {
          return null !== this.logger;
        }
        onOpen(a10) {
          let b10 = this.makeRef();
          return this.stateChangeCallbacks.open.push([b10, a10]), b10;
        }
        onClose(a10) {
          let b10 = this.makeRef();
          return this.stateChangeCallbacks.close.push([b10, a10]), b10;
        }
        onError(a10) {
          let b10 = this.makeRef();
          return this.stateChangeCallbacks.error.push([b10, a10]), b10;
        }
        onMessage(a10) {
          let b10 = this.makeRef();
          return this.stateChangeCallbacks.message.push([b10, a10]), b10;
        }
        onHeartbeat(a10) {
          this.heartbeatCallback = a10;
        }
        ping(a10) {
          if (!this.isConnected()) return false;
          let b10 = this.makeRef(), c10 = Date.now();
          this.push({ topic: "phoenix", event: "heartbeat", payload: {}, ref: b10 });
          let d10 = this.onMessage((e10) => {
            e10.ref === b10 && (this.off([d10]), a10(Date.now() - c10));
          });
          return true;
        }
        transportName(a10) {
          return a10 === cA ? "LongPoll" : a10.name;
        }
        transportConnect() {
          let a10;
          this.connectClock++, this.closeWasClean = false, this.authToken && (a10 = ["phoenix", `${cv}${btoa(this.authToken).replace(/=/g, "")}`]), this.conn = new this.transport(this.endPointURL(), a10), this.conn.binaryType = this.binaryType, this.conn.timeout = this.longpollerTimeout, this.conn.onopen = () => this.onConnOpen(), this.conn.onerror = (a11) => this.onConnError(a11), this.conn.onmessage = (a11) => this.onConnMessage(a11), this.conn.onclose = (a11) => this.onConnClose(a11);
        }
        getSession(a10) {
          return this.sessionStore && this.sessionStore.getItem(a10);
        }
        storeSession(a10, b10) {
          this.sessionStore && this.sessionStore.setItem(a10, b10);
        }
        connectWithFallback(a10, b10 = 2500) {
          let c10, d10;
          clearTimeout(this.fallbackTimer);
          let e10 = false, f10 = true, g2 = this.transportName(a10), h2 = (b11) => {
            this.log("transport", `falling back to ${g2}...`, b11), this.off([c10, d10]), f10 = false, this.replaceTransport(a10), this.transportConnect();
          };
          if (this.getSession(`phx:fallback:${g2}`)) return h2("memorized");
          this.fallbackTimer = setTimeout(h2, b10), d10 = this.onError((a11) => {
            this.log("transport", "error", a11), f10 && !e10 && (clearTimeout(this.fallbackTimer), h2(a11));
          }), this.fallbackRef && this.off([this.fallbackRef]), this.fallbackRef = this.onOpen(() => {
            if (e10 = true, !f10) {
              let b11 = this.transportName(a10);
              return this.primaryPassedHealthCheck || this.storeSession(`phx:fallback:${b11}`, "true"), this.log("transport", `established ${b11} fallback`);
            }
            clearTimeout(this.fallbackTimer), this.fallbackTimer = setTimeout(h2, b10), this.ping((a11) => {
              this.log("transport", "connected to primary after", a11), this.primaryPassedHealthCheck = true, clearTimeout(this.fallbackTimer);
            });
          }), this.transportConnect();
        }
        clearHeartbeats() {
          clearTimeout(this.heartbeatTimer), clearTimeout(this.heartbeatTimeoutTimer);
        }
        onConnOpen() {
          this.hasLogger() && this.log("transport", `connected to ${this.endPointURL()}`), this.closeWasClean = false, this.disconnecting = false, this.establishedConnections++, this.flushSendBuffer(), this.reconnectTimer.reset(), this.autoSendHeartbeat && this.resetHeartbeat(), this.triggerStateCallbacks("open");
        }
        heartbeatTimeout() {
          if (this.pendingHeartbeatRef) {
            this.pendingHeartbeatRef = null, this.heartbeatSentAt = null, this.hasLogger() && this.log("transport", "heartbeat timeout. Attempting to re-establish connection");
            try {
              this.heartbeatCallback("timeout");
            } catch (a10) {
              this.log("error", "error in heartbeat callback", a10);
            }
            this.triggerChanError(), this.closeWasClean = false, this.teardown(() => this.reconnectTimer.scheduleTimeout(), 1e3, "heartbeat timeout");
          }
        }
        resetHeartbeat() {
          this.conn && this.conn.skipHeartbeat || (this.pendingHeartbeatRef = null, this.clearHeartbeats(), this.heartbeatTimer = setTimeout(() => this.sendHeartbeat(), this.heartbeatIntervalMs));
        }
        teardown(a10, b10, c10) {
          if (!this.conn) return a10 && a10();
          let d10 = this.conn;
          this.waitForBufferDone(d10, () => {
            b10 ? d10.close(b10, c10 || "") : d10.close(), this.waitForSocketClosed(d10, () => {
              this.conn === d10 && (this.conn.onopen = function() {
              }, this.conn.onerror = function() {
              }, this.conn.onmessage = function() {
              }, this.conn.onclose = function() {
              }, this.conn = null), a10 && a10();
            });
          });
        }
        waitForBufferDone(a10, b10, c10 = 1) {
          if (5 === c10 || !a10.bufferedAmount) return void b10();
          setTimeout(() => {
            this.waitForBufferDone(a10, b10, c10 + 1);
          }, 150 * c10);
        }
        waitForSocketClosed(a10, b10, c10 = 1) {
          if (5 === c10 || a10.readyState === cq.closed) return void b10();
          setTimeout(() => {
            this.waitForSocketClosed(a10, b10, c10 + 1);
          }, 150 * c10);
        }
        onConnClose(a10) {
          this.conn && (this.conn.onclose = () => {
          }), this.hasLogger() && this.log("transport", "close", a10), this.triggerChanError(), this.clearHeartbeats(), this.closeWasClean || this.reconnectTimer.scheduleTimeout(), this.triggerStateCallbacks("close", a10);
        }
        onConnError(a10) {
          this.hasLogger() && this.log("transport", a10);
          let b10 = this.transport, c10 = this.establishedConnections;
          this.triggerStateCallbacks("error", a10, b10, c10), (b10 === this.transport || c10 > 0) && this.triggerChanError();
        }
        triggerChanError() {
          this.channels.forEach((a10) => {
            a10.isErrored() || a10.isLeaving() || a10.isClosed() || a10.trigger(cs.error);
          });
        }
        connectionState() {
          switch (this.conn && this.conn.readyState) {
            case cq.connecting:
              return "connecting";
            case cq.open:
              return "open";
            case cq.closing:
              return "closing";
            default:
              return "closed";
          }
        }
        isConnected() {
          return "open" === this.connectionState();
        }
        remove(a10) {
          this.off(a10.stateChangeRefs), this.channels = this.channels.filter((b10) => b10 !== a10);
        }
        off(a10) {
          for (let b10 in this.stateChangeCallbacks) this.stateChangeCallbacks[b10] = this.stateChangeCallbacks[b10].filter(([b11]) => -1 === a10.indexOf(b11));
        }
        channel(a10, b10 = {}) {
          let c10 = new cy(a10, b10, this);
          return this.channels.push(c10), c10;
        }
        push(a10) {
          if (this.hasLogger()) {
            let { topic: b10, event: c10, payload: d10, ref: e10, join_ref: f10 } = a10;
            this.log("push", `${b10} ${c10} (${f10}, ${e10})`, d10);
          }
          this.isConnected() ? this.encode(a10, (a11) => this.conn.send(a11)) : this.sendBuffer.push(() => this.encode(a10, (a11) => this.conn.send(a11)));
        }
        makeRef() {
          let a10 = this.ref + 1;
          return a10 === this.ref ? this.ref = 0 : this.ref = a10, this.ref.toString();
        }
        sendHeartbeat() {
          if (!this.isConnected()) {
            try {
              this.heartbeatCallback("disconnected");
            } catch (a10) {
              this.log("error", "error in heartbeat callback", a10);
            }
            return;
          }
          if (this.pendingHeartbeatRef) return void this.heartbeatTimeout();
          this.pendingHeartbeatRef = this.makeRef(), this.heartbeatSentAt = Date.now(), this.push({ topic: "phoenix", event: "heartbeat", payload: {}, ref: this.pendingHeartbeatRef });
          try {
            this.heartbeatCallback("sent");
          } catch (a10) {
            this.log("error", "error in heartbeat callback", a10);
          }
          this.heartbeatTimeoutTimer = setTimeout(() => this.heartbeatTimeout(), this.heartbeatIntervalMs);
        }
        flushSendBuffer() {
          this.isConnected() && this.sendBuffer.length > 0 && (this.sendBuffer.forEach((a10) => a10()), this.sendBuffer = []);
        }
        onConnMessage(a10) {
          this.decode(a10.data, (a11) => {
            let { topic: b10, event: c10, payload: d10, ref: e10, join_ref: f10 } = a11;
            if (e10 && e10 === this.pendingHeartbeatRef) {
              let a12 = this.heartbeatSentAt ? Date.now() - this.heartbeatSentAt : void 0;
              this.clearHeartbeats();
              try {
                this.heartbeatCallback("ok" === d10.status ? "ok" : "error", a12);
              } catch (a13) {
                this.log("error", "error in heartbeat callback", a13);
              }
              this.pendingHeartbeatRef = null, this.heartbeatSentAt = null, this.autoSendHeartbeat && (this.heartbeatTimer = setTimeout(() => this.sendHeartbeat(), this.heartbeatIntervalMs));
            }
            this.hasLogger() && this.log("receive", `${d10.status || ""} ${b10} ${c10} ${e10 && "(" + e10 + ")" || ""}`.trim(), d10);
            for (let a12 = 0; a12 < this.channels.length; a12++) {
              let g2 = this.channels[a12];
              g2.isMember(b10, c10, d10, f10) && g2.trigger(c10, d10, e10, f10);
            }
            this.triggerStateCallbacks("message", a11);
          });
        }
        triggerStateCallbacks(a10, ...b10) {
          try {
            this.stateChangeCallbacks[a10].forEach(([c10, d10]) => {
              try {
                d10(...b10);
              } catch (b11) {
                this.log("error", `error in ${a10} callback`, b11);
              }
            });
          } catch (b11) {
            this.log("error", `error triggering ${a10} callbacks`, b11);
          }
        }
        leaveOpenTopic(a10) {
          let b10 = this.channels.find((b11) => b11.topic === a10 && (b11.isJoined() || b11.isJoining()));
          b10 && (this.hasLogger() && this.log("transport", `leaving duplicate topic "${a10}"`), b10.leave());
        }
      };
      class cE {
        constructor(a10, b10) {
          let c10 = function(a11) {
            return (null == a11 ? void 0 : a11.events) && { events: a11.events };
          }(b10);
          this.presence = new cB(a10.getChannel(), c10), this.presence.onJoin((b11, c11, d10) => {
            let e10 = cE.onJoinPayload(b11, c11, d10);
            a10.getChannel().trigger("presence", e10);
          }), this.presence.onLeave((b11, c11, d10) => {
            let e10 = cE.onLeavePayload(b11, c11, d10);
            a10.getChannel().trigger("presence", e10);
          }), this.presence.onSync(() => {
            a10.getChannel().trigger("presence", { event: "sync" });
          });
        }
        get state() {
          return cE.transformState(this.presence.state);
        }
        static transformState(a10) {
          return Object.getOwnPropertyNames(a10 = JSON.parse(JSON.stringify(a10))).reduce((b10, c10) => {
            let d10 = a10[c10];
            return b10[c10] = cF(d10), b10;
          }, {});
        }
        static onJoinPayload(a10, b10, c10) {
          return { event: "join", key: a10, currentPresences: cG(b10), newPresences: cF(c10) };
        }
        static onLeavePayload(a10, b10, c10) {
          return { event: "leave", key: a10, currentPresences: cG(b10), leftPresences: cF(c10) };
        }
      }
      function cF(a10) {
        return a10.metas.map((a11) => (a11.presence_ref = a11.phx_ref, delete a11.phx_ref, delete a11.phx_ref_prev, a11));
      }
      function cG(a10) {
        return (null == a10 ? void 0 : a10.metas) ? cF(a10) : [];
      }
      !function(a10) {
        a10.SYNC = "sync", a10.JOIN = "join", a10.LEAVE = "leave";
      }(n || (n = {}));
      class cH {
        get state() {
          return this.presenceAdapter.state;
        }
        constructor(a10, b10) {
          this.channel = a10, this.presenceAdapter = new cE(this.channel.channelAdapter, b10);
        }
      }
      class cI {
        constructor(a10, b10, c10) {
          let d10 = { config: Object.assign({ broadcast: { ack: false, self: false }, presence: { key: "", enabled: false }, private: false }, c10.config) };
          this.channel = a10.getSocket().channel(b10, d10), this.socket = a10;
        }
        get state() {
          return this.channel.state;
        }
        set state(a10) {
          this.channel.state = a10;
        }
        get joinedOnce() {
          return this.channel.joinedOnce;
        }
        get joinPush() {
          return this.channel.joinPush;
        }
        get rejoinTimer() {
          return this.channel.rejoinTimer;
        }
        on(a10, b10) {
          return this.channel.on(a10, b10);
        }
        off(a10, b10) {
          this.channel.off(a10, b10);
        }
        subscribe(a10) {
          return this.channel.join(a10);
        }
        unsubscribe(a10) {
          return this.channel.leave(a10);
        }
        teardown() {
          this.channel.teardown();
        }
        onClose(a10) {
          this.channel.onClose(a10);
        }
        onError(a10) {
          return this.channel.onError(a10);
        }
        push(a10, b10, c10) {
          let d10;
          try {
            d10 = this.channel.push(a10, b10, c10);
          } catch (b11) {
            throw `tried to push '${a10}' to '${this.channel.topic}' before joining. Use channel.subscribe() before pushing events`;
          }
          if (this.channel.pushBuffer.length > 100) {
            let a11 = this.channel.pushBuffer.shift();
            a11.cancelTimeout(), this.socket.log("channel", `discarded push due to buffer overflow: ${a11.event}`, a11.payload());
          }
          return d10;
        }
        updateJoinPayload(a10) {
          let b10 = this.channel.joinPush.payload();
          this.channel.joinPush.payload = () => Object.assign(Object.assign({}, b10), a10);
        }
        canPush() {
          return this.socket.isConnected() && this.state === b9.joined;
        }
        isJoined() {
          return this.state === b9.joined;
        }
        isJoining() {
          return this.state === b9.joining;
        }
        isClosed() {
          return this.state === b9.closed;
        }
        isLeaving() {
          return this.state === b9.leaving;
        }
        updateFilterBindings(a10) {
          this.channel.filterBindings = a10;
        }
        updatePayloadTransform(a10) {
          this.channel.onMessage = a10;
        }
        getChannel() {
          return this.channel;
        }
      }
      !function(a10) {
        a10.ALL = "*", a10.INSERT = "INSERT", a10.UPDATE = "UPDATE", a10.DELETE = "DELETE";
      }(o || (o = {})), function(a10) {
        a10.BROADCAST = "broadcast", a10.PRESENCE = "presence", a10.POSTGRES_CHANGES = "postgres_changes", a10.SYSTEM = "system";
      }(p || (p = {})), function(a10) {
        a10.SUBSCRIBED = "SUBSCRIBED", a10.TIMED_OUT = "TIMED_OUT", a10.CLOSED = "CLOSED", a10.CHANNEL_ERROR = "CHANNEL_ERROR";
      }(q || (q = {}));
      class cJ {
        get state() {
          return this.channelAdapter.state;
        }
        set state(a10) {
          this.channelAdapter.state = a10;
        }
        get joinedOnce() {
          return this.channelAdapter.joinedOnce;
        }
        get timeout() {
          return this.socket.timeout;
        }
        get joinPush() {
          return this.channelAdapter.joinPush;
        }
        get rejoinTimer() {
          return this.channelAdapter.rejoinTimer;
        }
        constructor(a10, b10 = { config: {} }, c10) {
          var d10, e10;
          if (this.topic = a10, this.params = b10, this.socket = c10, this.bindings = {}, this.subTopic = a10.replace(/^realtime:/i, ""), this.params.config = Object.assign({ broadcast: { ack: false, self: false }, presence: { key: "", enabled: false }, private: false }, b10.config), this.channelAdapter = new cI(this.socket.socketAdapter, a10, this.params), this.presence = new cH(this), this._onClose(() => {
            this.socket._remove(this);
          }), this._updateFilterTransform(), this.broadcastEndpointURL = cm(this.socket.socketAdapter.endPointURL()), this.private = this.params.config.private || false, !this.private && (null == (e10 = null == (d10 = this.params.config) ? void 0 : d10.broadcast) ? void 0 : e10.replay)) throw `tried to use replay on public channel '${this.topic}'. It must be a private channel.`;
        }
        subscribe(a10, b10 = this.timeout) {
          var c10, d10, e10;
          if (this.socket.isConnected() || this.socket.connect(), this.channelAdapter.isClosed()) {
            let { config: { broadcast: f10, presence: g2, private: h2 } } = this.params, i2 = null != (d10 = null == (c10 = this.bindings.postgres_changes) ? void 0 : c10.map((a11) => a11.filter)) ? d10 : [], j2 = !!this.bindings[p.PRESENCE] && this.bindings[p.PRESENCE].length > 0 || (null == (e10 = this.params.config.presence) ? void 0 : e10.enabled) === true, k2 = {}, l2 = { broadcast: f10, presence: Object.assign(Object.assign({}, g2), { enabled: j2 }), postgres_changes: i2, private: h2 };
            this.socket.accessTokenValue && (k2.access_token = this.socket.accessTokenValue), this._onError((b11) => {
              null == a10 || a10(q.CHANNEL_ERROR, b11);
            }), this._onClose(() => null == a10 ? void 0 : a10(q.CLOSED)), this.updateJoinPayload(Object.assign({ config: l2 }, k2)), this._updateFilterMessage(), this.channelAdapter.subscribe(b10).receive("ok", async ({ postgres_changes: b11 }) => {
              if (this.socket._isManualToken() || this.socket.setAuth(), void 0 === b11) {
                null == a10 || a10(q.SUBSCRIBED);
                return;
              }
              this._updatePostgresBindings(b11, a10);
            }).receive("error", (b11) => {
              this.state = b9.errored, null == a10 || a10(q.CHANNEL_ERROR, Error(JSON.stringify(Object.values(b11).join(", ") || "error")));
            }).receive("timeout", () => {
              null == a10 || a10(q.TIMED_OUT);
            });
          }
          return this;
        }
        _updatePostgresBindings(a10, b10) {
          var c10;
          let d10 = this.bindings.postgres_changes, e10 = null != (c10 = null == d10 ? void 0 : d10.length) ? c10 : 0, f10 = [];
          for (let c11 = 0; c11 < e10; c11++) {
            let e11 = d10[c11], { filter: { event: g2, schema: h2, table: i2, filter: j2 } } = e11, k2 = a10 && a10[c11];
            if (k2 && k2.event === g2 && cJ.isFilterValueEqual(k2.schema, h2) && cJ.isFilterValueEqual(k2.table, i2) && cJ.isFilterValueEqual(k2.filter, j2)) f10.push(Object.assign(Object.assign({}, e11), { id: k2.id }));
            else {
              this.unsubscribe(), this.state = b9.errored, null == b10 || b10(q.CHANNEL_ERROR, Error("mismatch between server and client bindings for postgres changes"));
              return;
            }
          }
          this.bindings.postgres_changes = f10, this.state != b9.errored && b10 && b10(q.SUBSCRIBED);
        }
        presenceState() {
          return this.presence.state;
        }
        async track(a10, b10 = {}) {
          return await this.send({ type: "presence", event: "track", payload: a10 }, b10.timeout || this.timeout);
        }
        async untrack(a10 = {}) {
          return await this.send({ type: "presence", event: "untrack" }, a10);
        }
        on(a10, b10, c10) {
          let d10 = this.channelAdapter.isJoined() || this.channelAdapter.isJoining(), e10 = a10 === p.PRESENCE || a10 === p.POSTGRES_CHANGES;
          if (d10 && e10) throw this.socket.log("channel", `cannot add \`${a10}\` callbacks for ${this.topic} after \`subscribe()\`.`), Error(`cannot add \`${a10}\` callbacks for ${this.topic} after \`subscribe()\`.`);
          return this._on(a10, b10, c10);
        }
        async httpSend(a10, b10, c10 = {}) {
          var d10;
          if (null == b10) return Promise.reject("Payload is required for httpSend()");
          let e10 = { apikey: this.socket.apiKey ? this.socket.apiKey : "", "Content-Type": "application/json" };
          this.socket.accessTokenValue && (e10.Authorization = `Bearer ${this.socket.accessTokenValue}`);
          let f10 = { method: "POST", headers: e10, body: JSON.stringify({ messages: [{ topic: this.subTopic, event: a10, payload: b10, private: this.private }] }) }, g2 = await this._fetchWithTimeout(this.broadcastEndpointURL, f10, null != (d10 = c10.timeout) ? d10 : this.timeout);
          if (202 === g2.status) return { success: true };
          let h2 = g2.statusText;
          try {
            let a11 = await g2.json();
            h2 = a11.error || a11.message || h2;
          } catch (a11) {
          }
          return Promise.reject(Error(h2));
        }
        async send(a10, b10 = {}) {
          var c10, d10;
          if (this.channelAdapter.canPush() || "broadcast" !== a10.type) return new Promise((c11) => {
            var d11, e10, f10;
            let g2 = this.channelAdapter.push(a10.type, a10, b10.timeout || this.timeout);
            "broadcast" !== a10.type || (null == (f10 = null == (e10 = null == (d11 = this.params) ? void 0 : d11.config) ? void 0 : e10.broadcast) ? void 0 : f10.ack) || c11("ok"), g2.receive("ok", () => c11("ok")), g2.receive("error", () => c11("error")), g2.receive("timeout", () => c11("timed out"));
          });
          {
            console.warn("Realtime send() is automatically falling back to REST API. This behavior will be deprecated in the future. Please use httpSend() explicitly for REST delivery.");
            let { event: e10, payload: f10 } = a10, g2 = { apikey: this.socket.apiKey ? this.socket.apiKey : "", "Content-Type": "application/json" };
            this.socket.accessTokenValue && (g2.Authorization = `Bearer ${this.socket.accessTokenValue}`);
            let h2 = { method: "POST", headers: g2, body: JSON.stringify({ messages: [{ topic: this.subTopic, event: e10, payload: f10, private: this.private }] }) };
            try {
              let a11 = await this._fetchWithTimeout(this.broadcastEndpointURL, h2, null != (c10 = b10.timeout) ? c10 : this.timeout);
              return await (null == (d10 = a11.body) ? void 0 : d10.cancel()), a11.ok ? "ok" : "error";
            } catch (a11) {
              if ("AbortError" === a11.name) return "timed out";
              return "error";
            }
          }
        }
        updateJoinPayload(a10) {
          this.channelAdapter.updateJoinPayload(a10);
        }
        async unsubscribe(a10 = this.timeout) {
          return new Promise((b10) => {
            this.channelAdapter.unsubscribe(a10).receive("ok", () => b10("ok")).receive("timeout", () => b10("timed out")).receive("error", () => b10("error"));
          });
        }
        teardown() {
          this.channelAdapter.teardown();
        }
        async _fetchWithTimeout(a10, b10, c10) {
          let d10 = new AbortController(), e10 = setTimeout(() => d10.abort(), c10), f10 = await this.socket.fetch(a10, Object.assign(Object.assign({}, b10), { signal: d10.signal }));
          return clearTimeout(e10), f10;
        }
        _on(a10, b10, c10) {
          let d10 = a10.toLocaleLowerCase(), e10 = this.channelAdapter.on(a10, c10), f10 = { type: d10, filter: b10, callback: c10, ref: e10 };
          return this.bindings[d10] ? this.bindings[d10].push(f10) : this.bindings[d10] = [f10], this._updateFilterMessage(), this;
        }
        _onClose(a10) {
          this.channelAdapter.onClose(a10);
        }
        _onError(a10) {
          this.channelAdapter.onError(a10);
        }
        _updateFilterMessage() {
          this.channelAdapter.updateFilterBindings((a10, b10, c10) => {
            var d10, e10, f10, g2, h2, i2, j2;
            let k2 = a10.event.toLocaleLowerCase();
            if (this._notThisChannelEvent(k2, c10)) return false;
            let l2 = null == (d10 = this.bindings[k2]) ? void 0 : d10.find((b11) => b11.ref === a10.ref);
            if (!l2) return true;
            if (!["broadcast", "presence", "postgres_changes"].includes(k2)) return l2.type.toLocaleLowerCase() === k2;
            if ("id" in l2) {
              let a11 = l2.id, c11 = null == (e10 = l2.filter) ? void 0 : e10.event;
              return a11 && (null == (f10 = b10.ids) ? void 0 : f10.includes(a11)) && ("*" === c11 || (null == c11 ? void 0 : c11.toLocaleLowerCase()) === (null == (g2 = b10.data) ? void 0 : g2.type.toLocaleLowerCase()));
            }
            {
              let a11 = null == (i2 = null == (h2 = null == l2 ? void 0 : l2.filter) ? void 0 : h2.event) ? void 0 : i2.toLocaleLowerCase();
              return "*" === a11 || a11 === (null == (j2 = null == b10 ? void 0 : b10.event) ? void 0 : j2.toLocaleLowerCase());
            }
          });
        }
        _notThisChannelEvent(a10, b10) {
          let { close: c10, error: d10, leave: e10, join: f10 } = ca;
          return b10 && [c10, d10, e10, f10].includes(a10) && b10 !== this.joinPush.ref;
        }
        _updateFilterTransform() {
          this.channelAdapter.updatePayloadTransform((a10, b10, c10) => {
            if ("object" == typeof b10 && "ids" in b10) {
              let a11 = b10.data, { schema: c11, table: d10, commit_timestamp: e10, type: f10, errors: g2 } = a11;
              return Object.assign(Object.assign({}, { schema: c11, table: d10, commit_timestamp: e10, eventType: f10, new: {}, old: {}, errors: g2 }), this._getPayloadRecords(a11));
            }
            return b10;
          });
        }
        copyBindings(a10) {
          if (this.joinedOnce) throw Error("cannot copy bindings into joined channel");
          for (let b10 in a10.bindings) for (let c10 of a10.bindings[b10]) this._on(c10.type, c10.filter, c10.callback);
        }
        static isFilterValueEqual(a10, b10) {
          return (null != a10 ? a10 : void 0) === (null != b10 ? b10 : void 0);
        }
        _getPayloadRecords(a10) {
          let b10 = { new: {}, old: {} };
          return ("INSERT" === a10.type || "UPDATE" === a10.type) && (b10.new = cd(a10.columns, a10.record)), ("UPDATE" === a10.type || "DELETE" === a10.type) && (b10.old = cd(a10.columns, a10.old_record)), b10;
        }
      }
      class cK {
        constructor(a10, b10) {
          this.socket = new cD(a10, b10);
        }
        get timeout() {
          return this.socket.timeout;
        }
        get endPoint() {
          return this.socket.endPoint;
        }
        get transport() {
          return this.socket.transport;
        }
        get heartbeatIntervalMs() {
          return this.socket.heartbeatIntervalMs;
        }
        get heartbeatCallback() {
          return this.socket.heartbeatCallback;
        }
        set heartbeatCallback(a10) {
          this.socket.heartbeatCallback = a10;
        }
        get heartbeatTimer() {
          return this.socket.heartbeatTimer;
        }
        get pendingHeartbeatRef() {
          return this.socket.pendingHeartbeatRef;
        }
        get reconnectTimer() {
          return this.socket.reconnectTimer;
        }
        get vsn() {
          return this.socket.vsn;
        }
        get encode() {
          return this.socket.encode;
        }
        get decode() {
          return this.socket.decode;
        }
        get reconnectAfterMs() {
          return this.socket.reconnectAfterMs;
        }
        get sendBuffer() {
          return this.socket.sendBuffer;
        }
        get stateChangeCallbacks() {
          return this.socket.stateChangeCallbacks;
        }
        connect() {
          this.socket.connect();
        }
        disconnect(a10, b10, c10, d10 = 1e4) {
          return new Promise((e10) => {
            setTimeout(() => e10("timeout"), d10), this.socket.disconnect(() => {
              a10(), e10("ok");
            }, b10, c10);
          });
        }
        push(a10) {
          this.socket.push(a10);
        }
        log(a10, b10, c10) {
          this.socket.log(a10, b10, c10);
        }
        makeRef() {
          return this.socket.makeRef();
        }
        onOpen(a10) {
          this.socket.onOpen(a10);
        }
        onClose(a10) {
          this.socket.onClose(a10);
        }
        onError(a10) {
          this.socket.onError(a10);
        }
        onMessage(a10) {
          this.socket.onMessage(a10);
        }
        isConnected() {
          return this.socket.isConnected();
        }
        isConnecting() {
          return this.socket.connectionState() == cb.connecting;
        }
        isDisconnecting() {
          return this.socket.connectionState() == cb.closing;
        }
        connectionState() {
          return this.socket.connectionState();
        }
        endPointURL() {
          return this.socket.endPointURL();
        }
        sendHeartbeat() {
          this.socket.sendHeartbeat();
        }
        getSocket() {
          return this.socket;
        }
      }
      let cL = { HEARTBEAT_INTERVAL: 25e3 }, cM = [1e3, 2e3, 5e3, 1e4], cN = `
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;
      class cO {
        get endPoint() {
          return this.socketAdapter.endPoint;
        }
        get timeout() {
          return this.socketAdapter.timeout;
        }
        get transport() {
          return this.socketAdapter.transport;
        }
        get heartbeatCallback() {
          return this.socketAdapter.heartbeatCallback;
        }
        get heartbeatIntervalMs() {
          return this.socketAdapter.heartbeatIntervalMs;
        }
        get heartbeatTimer() {
          return this.worker ? this._workerHeartbeatTimer : this.socketAdapter.heartbeatTimer;
        }
        get pendingHeartbeatRef() {
          return this.worker ? this._pendingWorkerHeartbeatRef : this.socketAdapter.pendingHeartbeatRef;
        }
        get reconnectTimer() {
          return this.socketAdapter.reconnectTimer;
        }
        get vsn() {
          return this.socketAdapter.vsn;
        }
        get encode() {
          return this.socketAdapter.encode;
        }
        get decode() {
          return this.socketAdapter.decode;
        }
        get reconnectAfterMs() {
          return this.socketAdapter.reconnectAfterMs;
        }
        get sendBuffer() {
          return this.socketAdapter.sendBuffer;
        }
        get stateChangeCallbacks() {
          return this.socketAdapter.stateChangeCallbacks;
        }
        constructor(a10, b10) {
          var c10;
          if (this.channels = [], this.accessTokenValue = null, this.accessToken = null, this.apiKey = null, this.httpEndpoint = "", this.headers = {}, this.params = {}, this.ref = 0, this.serializer = new cc(), this._manuallySetToken = false, this._authPromise = null, this._workerHeartbeatTimer = void 0, this._pendingWorkerHeartbeatRef = null, this._resolveFetch = (a11) => a11 ? (...b11) => a11(...b11) : (...a12) => fetch(...a12), !(null == (c10 = null == b10 ? void 0 : b10.params) ? void 0 : c10.apikey)) throw Error("API key is required to connect to Realtime");
          this.apiKey = b10.params.apikey;
          let d10 = this._initializeOptions(b10);
          this.socketAdapter = new cK(a10, d10), this.httpEndpoint = cm(a10), this.fetch = this._resolveFetch(null == b10 ? void 0 : b10.fetch);
        }
        connect() {
          if (!(this.isConnecting() || this.isDisconnecting() || this.isConnected())) {
            this.accessToken && !this._authPromise && this._setAuthSafely("connect"), this._setupConnectionHandlers();
            try {
              this.socketAdapter.connect();
            } catch (b10) {
              let a10 = b10.message;
              if (a10.includes("Node.js")) throw Error(`${a10}

To use Realtime in Node.js, you need to provide a WebSocket implementation:

Option 1: Use Node.js 22+ which has native WebSocket support
Option 2: Install and provide the "ws" package:

  npm install ws

  import ws from "ws"
  const client = new RealtimeClient(url, {
    ...options,
    transport: ws
  })`);
              throw Error(`WebSocket not available: ${a10}`);
            }
            this._handleNodeJsRaceCondition();
          }
        }
        endpointURL() {
          return this.socketAdapter.endPointURL();
        }
        async disconnect(a10, b10) {
          return this.isDisconnecting() ? "ok" : await this.socketAdapter.disconnect(() => {
            clearInterval(this._workerHeartbeatTimer), this._terminateWorker();
          }, a10, b10);
        }
        getChannels() {
          return this.channels;
        }
        async removeChannel(a10) {
          let b10 = await a10.unsubscribe();
          return "ok" === b10 && a10.teardown(), 0 === this.channels.length && this.disconnect(), b10;
        }
        async removeAllChannels() {
          let a10 = this.channels.map(async (a11) => {
            let b11 = await a11.unsubscribe();
            return a11.teardown(), b11;
          }), b10 = await Promise.all(a10);
          return this.disconnect(), b10;
        }
        log(a10, b10, c10) {
          this.socketAdapter.log(a10, b10, c10);
        }
        connectionState() {
          return this.socketAdapter.connectionState() || cb.closed;
        }
        isConnected() {
          return this.socketAdapter.isConnected();
        }
        isConnecting() {
          return this.socketAdapter.isConnecting();
        }
        isDisconnecting() {
          return this.socketAdapter.isDisconnecting();
        }
        channel(a10, b10 = { config: {} }) {
          let c10 = `realtime:${a10}`, d10 = this.getChannels().find((a11) => a11.topic === c10);
          if (d10) return d10;
          {
            let c11 = new cJ(`realtime:${a10}`, b10, this);
            return this.channels.push(c11), c11;
          }
        }
        push(a10) {
          this.socketAdapter.push(a10);
        }
        async setAuth(a10 = null) {
          this._authPromise = this._performAuth(a10);
          try {
            await this._authPromise;
          } finally {
            this._authPromise = null;
          }
        }
        _isManualToken() {
          return this._manuallySetToken;
        }
        async sendHeartbeat() {
          this.socketAdapter.sendHeartbeat();
        }
        onHeartbeat(a10) {
          this.socketAdapter.heartbeatCallback = this._wrapHeartbeatCallback(a10);
        }
        _makeRef() {
          return this.socketAdapter.makeRef();
        }
        _remove(a10) {
          this.channels = this.channels.filter((b10) => b10.topic !== a10.topic);
        }
        async _performAuth(a10 = null) {
          let b10, c10 = false;
          if (a10) b10 = a10, c10 = true;
          else if (this.accessToken) try {
            b10 = await this.accessToken();
          } catch (a11) {
            this.log("error", "Error fetching access token from callback", a11), b10 = this.accessTokenValue;
          }
          else b10 = this.accessTokenValue;
          c10 ? this._manuallySetToken = true : this.accessToken && (this._manuallySetToken = false), this.accessTokenValue != b10 && (this.accessTokenValue = b10, this.channels.forEach((a11) => {
            let c11 = { access_token: b10, version: "realtime-js/2.101.1" };
            b10 && a11.updateJoinPayload(c11), a11.joinedOnce && a11.channelAdapter.isJoined() && a11.channelAdapter.push(ca.access_token, { access_token: b10 });
          }));
        }
        async _waitForAuthIfNeeded() {
          this._authPromise && await this._authPromise;
        }
        _setAuthSafely(a10 = "general") {
          this._isManualToken() || this.setAuth().catch((b10) => {
            this.log("error", `Error setting auth in ${a10}`, b10);
          });
        }
        _setupConnectionHandlers() {
          this.socketAdapter.onOpen(() => {
            (this._authPromise || (this.accessToken && !this.accessTokenValue ? this.setAuth() : Promise.resolve())).catch((a10) => {
              this.log("error", "error waiting for auth on connect", a10);
            }), this.worker && !this.workerRef && this._startWorkerHeartbeat();
          }), this.socketAdapter.onClose(() => {
            this.worker && this.workerRef && this._terminateWorker();
          }), this.socketAdapter.onMessage((a10) => {
            a10.ref && a10.ref === this._pendingWorkerHeartbeatRef && (this._pendingWorkerHeartbeatRef = null);
          });
        }
        _handleNodeJsRaceCondition() {
          this.socketAdapter.isConnected() && this.socketAdapter.getSocket().onConnOpen();
        }
        _wrapHeartbeatCallback(a10) {
          return (b10, c10) => {
            "sent" == b10 && this._setAuthSafely(), a10 && a10(b10, c10);
          };
        }
        _startWorkerHeartbeat() {
          this.workerUrl ? this.log("worker", `starting worker for from ${this.workerUrl}`) : this.log("worker", "starting default worker");
          let a10 = this._workerObjectUrl(this.workerUrl);
          this.workerRef = new Worker(a10), this.workerRef.onerror = (a11) => {
            this.log("worker", "worker error", a11.message), this._terminateWorker(), this.disconnect();
          }, this.workerRef.onmessage = (a11) => {
            "keepAlive" === a11.data.event && this.sendHeartbeat();
          }, this.workerRef.postMessage({ event: "start", interval: this.heartbeatIntervalMs });
        }
        _terminateWorker() {
          this.workerRef && (this.log("worker", "terminating worker"), this.workerRef.terminate(), this.workerRef = void 0);
        }
        _workerObjectUrl(a10) {
          let b10;
          if (a10) b10 = a10;
          else {
            let a11 = new Blob([cN], { type: "application/javascript" });
            b10 = URL.createObjectURL(a11);
          }
          return b10;
        }
        _initializeOptions(a10) {
          var b10, c10, d10, e10, f10, g2, h2, i2, j2;
          let k2, l2;
          this.worker = null != (b10 = null == a10 ? void 0 : a10.worker) && b10, this.accessToken = null != (c10 = null == a10 ? void 0 : a10.accessToken) ? c10 : null;
          let m2 = {};
          m2.timeout = null != (d10 = null == a10 ? void 0 : a10.timeout) ? d10 : 1e4, m2.heartbeatIntervalMs = null != (e10 = null == a10 ? void 0 : a10.heartbeatIntervalMs) ? e10 : cL.HEARTBEAT_INTERVAL, m2.transport = null != (f10 = null == a10 ? void 0 : a10.transport) ? f10 : b7.getWebSocketConstructor(), m2.params = null == a10 ? void 0 : a10.params, m2.logger = null == a10 ? void 0 : a10.logger, m2.heartbeatCallback = this._wrapHeartbeatCallback(null == a10 ? void 0 : a10.heartbeatCallback), m2.reconnectAfterMs = null != (g2 = null == a10 ? void 0 : a10.reconnectAfterMs) ? g2 : (a11) => cM[a11 - 1] || 1e4;
          let n2 = null != (h2 = null == a10 ? void 0 : a10.vsn) ? h2 : b8;
          switch (n2) {
            case "1.0.0":
              k2 = (a11, b11) => b11(JSON.stringify(a11)), l2 = (a11, b11) => b11(JSON.parse(a11));
              break;
            case b8:
              k2 = this.serializer.encode.bind(this.serializer), l2 = this.serializer.decode.bind(this.serializer);
              break;
            default:
              throw Error(`Unsupported serializer version: ${m2.vsn}`);
          }
          if (m2.vsn = n2, m2.encode = null != (i2 = null == a10 ? void 0 : a10.encode) ? i2 : k2, m2.decode = null != (j2 = null == a10 ? void 0 : a10.decode) ? j2 : l2, m2.beforeReconnect = this._reconnectAuth.bind(this), ((null == a10 ? void 0 : a10.logLevel) || (null == a10 ? void 0 : a10.log_level)) && (this.logLevel = a10.logLevel || a10.log_level, m2.params = Object.assign(Object.assign({}, m2.params), { log_level: this.logLevel })), this.worker) {
            if ("undefined" != typeof window && !window.Worker) throw Error("Web Worker is not supported");
            this.workerUrl = null == a10 ? void 0 : a10.workerUrl, m2.autoSendHeartbeat = !this.worker;
          }
          return m2;
        }
        async _reconnectAuth() {
          await this._waitForAuthIfNeeded(), this.isConnected() || this.connect();
        }
      }
      var cP = class extends Error {
        constructor(a10, b10) {
          super(a10), this.name = "IcebergError", this.status = b10.status, this.icebergType = b10.icebergType, this.icebergCode = b10.icebergCode, this.details = b10.details, this.isCommitStateUnknown = "CommitStateUnknownException" === b10.icebergType || [500, 502, 504].includes(b10.status) && b10.icebergType?.includes("CommitState") === true;
        }
        isNotFound() {
          return 404 === this.status;
        }
        isConflict() {
          return 409 === this.status;
        }
        isAuthenticationTimeout() {
          return 419 === this.status;
        }
      };
      async function cQ(a10) {
        return a10 && "none" !== a10.type ? "bearer" === a10.type ? { Authorization: `Bearer ${a10.token}` } : "header" === a10.type ? { [a10.name]: a10.value } : "custom" === a10.type ? await a10.getHeaders() : {} : {};
      }
      function cR(a10) {
        return a10.join("");
      }
      var cS = class {
        constructor(a10, b10 = "") {
          this.client = a10, this.prefix = b10;
        }
        async listNamespaces(a10) {
          let b10 = a10 ? { parent: cR(a10.namespace) } : void 0;
          return (await this.client.request({ method: "GET", path: `${this.prefix}/namespaces`, query: b10 })).data.namespaces.map((a11) => ({ namespace: a11 }));
        }
        async createNamespace(a10, b10) {
          let c10 = { namespace: a10.namespace, properties: b10?.properties };
          return (await this.client.request({ method: "POST", path: `${this.prefix}/namespaces`, body: c10 })).data;
        }
        async dropNamespace(a10) {
          await this.client.request({ method: "DELETE", path: `${this.prefix}/namespaces/${cR(a10.namespace)}` });
        }
        async loadNamespaceMetadata(a10) {
          return { properties: (await this.client.request({ method: "GET", path: `${this.prefix}/namespaces/${cR(a10.namespace)}` })).data.properties };
        }
        async namespaceExists(a10) {
          try {
            return await this.client.request({ method: "HEAD", path: `${this.prefix}/namespaces/${cR(a10.namespace)}` }), true;
          } catch (a11) {
            if (a11 instanceof cP && 404 === a11.status) return false;
            throw a11;
          }
        }
        async createNamespaceIfNotExists(a10, b10) {
          try {
            return await this.createNamespace(a10, b10);
          } catch (a11) {
            if (a11 instanceof cP && 409 === a11.status) return;
            throw a11;
          }
        }
      };
      function cT(a10) {
        return a10.join("");
      }
      var cU = class {
        constructor(a10, b10 = "", c10) {
          this.client = a10, this.prefix = b10, this.accessDelegation = c10;
        }
        async listTables(a10) {
          return (await this.client.request({ method: "GET", path: `${this.prefix}/namespaces/${cT(a10.namespace)}/tables` })).data.identifiers;
        }
        async createTable(a10, b10) {
          let c10 = {};
          return this.accessDelegation && (c10["X-Iceberg-Access-Delegation"] = this.accessDelegation), (await this.client.request({ method: "POST", path: `${this.prefix}/namespaces/${cT(a10.namespace)}/tables`, body: b10, headers: c10 })).data.metadata;
        }
        async updateTable(a10, b10) {
          let c10 = await this.client.request({ method: "POST", path: `${this.prefix}/namespaces/${cT(a10.namespace)}/tables/${a10.name}`, body: b10 });
          return { "metadata-location": c10.data["metadata-location"], metadata: c10.data.metadata };
        }
        async dropTable(a10, b10) {
          await this.client.request({ method: "DELETE", path: `${this.prefix}/namespaces/${cT(a10.namespace)}/tables/${a10.name}`, query: { purgeRequested: String(b10?.purge ?? false) } });
        }
        async loadTable(a10) {
          let b10 = {};
          return this.accessDelegation && (b10["X-Iceberg-Access-Delegation"] = this.accessDelegation), (await this.client.request({ method: "GET", path: `${this.prefix}/namespaces/${cT(a10.namespace)}/tables/${a10.name}`, headers: b10 })).data.metadata;
        }
        async tableExists(a10) {
          let b10 = {};
          this.accessDelegation && (b10["X-Iceberg-Access-Delegation"] = this.accessDelegation);
          try {
            return await this.client.request({ method: "HEAD", path: `${this.prefix}/namespaces/${cT(a10.namespace)}/tables/${a10.name}`, headers: b10 }), true;
          } catch (a11) {
            if (a11 instanceof cP && 404 === a11.status) return false;
            throw a11;
          }
        }
        async createTableIfNotExists(a10, b10) {
          try {
            return await this.createTable(a10, b10);
          } catch (c10) {
            if (c10 instanceof cP && 409 === c10.status) return await this.loadTable({ namespace: a10.namespace, name: b10.name });
            throw c10;
          }
        }
      }, cV = class {
        constructor(a10) {
          let b10 = "v1";
          a10.catalogName && (b10 += `/${a10.catalogName}`);
          let c10 = a10.baseUrl.endsWith("/") ? a10.baseUrl : `${a10.baseUrl}/`;
          this.client = function(a11) {
            let b11 = a11.fetchImpl ?? globalThis.fetch;
            return { async request({ method: c11, path: d10, query: e10, body: f10, headers: g2 }) {
              let h2 = function(a12, b12, c12) {
                let d11 = new URL(b12, a12);
                if (c12) for (let [a13, b13] of Object.entries(c12)) void 0 !== b13 && d11.searchParams.set(a13, b13);
                return d11.toString();
              }(a11.baseUrl, d10, e10), i2 = await cQ(a11.auth), j2 = await b11(h2, { method: c11, headers: { ...f10 ? { "Content-Type": "application/json" } : {}, ...i2, ...g2 }, body: f10 ? JSON.stringify(f10) : void 0 }), k2 = await j2.text(), l2 = (j2.headers.get("content-type") || "").includes("application/json"), m2 = l2 && k2 ? JSON.parse(k2) : k2;
              if (!j2.ok) {
                let a12 = l2 ? m2 : void 0, b12 = a12?.error;
                throw new cP(b12?.message ?? `Request failed with status ${j2.status}`, { status: j2.status, icebergType: b12?.type, icebergCode: b12?.code, details: a12 });
              }
              return { status: j2.status, headers: j2.headers, data: m2 };
            } };
          }({ baseUrl: c10, auth: a10.auth, fetchImpl: a10.fetch }), this.accessDelegation = a10.accessDelegation?.join(","), this.namespaceOps = new cS(this.client, b10), this.tableOps = new cU(this.client, b10, this.accessDelegation);
        }
        async listNamespaces(a10) {
          return this.namespaceOps.listNamespaces(a10);
        }
        async createNamespace(a10, b10) {
          return this.namespaceOps.createNamespace(a10, b10);
        }
        async dropNamespace(a10) {
          await this.namespaceOps.dropNamespace(a10);
        }
        async loadNamespaceMetadata(a10) {
          return this.namespaceOps.loadNamespaceMetadata(a10);
        }
        async listTables(a10) {
          return this.tableOps.listTables(a10);
        }
        async createTable(a10, b10) {
          return this.tableOps.createTable(a10, b10);
        }
        async updateTable(a10, b10) {
          return this.tableOps.updateTable(a10, b10);
        }
        async dropTable(a10, b10) {
          await this.tableOps.dropTable(a10, b10);
        }
        async loadTable(a10) {
          return this.tableOps.loadTable(a10);
        }
        async namespaceExists(a10) {
          return this.namespaceOps.namespaceExists(a10);
        }
        async tableExists(a10) {
          return this.tableOps.tableExists(a10);
        }
        async createNamespaceIfNotExists(a10, b10) {
          return this.namespaceOps.createNamespaceIfNotExists(a10, b10);
        }
        async createTableIfNotExists(a10, b10) {
          return this.tableOps.createTableIfNotExists(a10, b10);
        }
      }, cW = c(356).Buffer, cX = class extends Error {
        constructor(a10, b10 = "storage", c10, d10) {
          super(a10), this.__isStorageError = true, this.namespace = b10, this.name = "vectors" === b10 ? "StorageVectorsError" : "StorageError", this.status = c10, this.statusCode = d10;
        }
      };
      function cY(a10) {
        return "object" == typeof a10 && null !== a10 && "__isStorageError" in a10;
      }
      var cZ = class extends cX {
        constructor(a10, b10, c10, d10 = "storage") {
          super(a10, d10, b10, c10), this.name = "vectors" === d10 ? "StorageVectorsApiError" : "StorageApiError", this.status = b10, this.statusCode = c10;
        }
        toJSON() {
          return { name: this.name, message: this.message, status: this.status, statusCode: this.statusCode };
        }
      }, c$ = class extends cX {
        constructor(a10, b10, c10 = "storage") {
          super(a10, c10), this.name = "vectors" === c10 ? "StorageVectorsUnknownError" : "StorageUnknownError", this.originalError = b10;
        }
      };
      let c_ = (a10) => {
        if (Array.isArray(a10)) return a10.map((a11) => c_(a11));
        if ("function" == typeof a10 || a10 !== Object(a10)) return a10;
        let b10 = {};
        return Object.entries(a10).forEach(([a11, c10]) => {
          b10[a11.replace(/([-_][a-z])/gi, (a12) => a12.toUpperCase().replace(/[-_]/g, ""))] = c_(c10);
        }), b10;
      };
      function c0(a10) {
        return (c0 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(a11) {
          return typeof a11;
        } : function(a11) {
          return a11 && "function" == typeof Symbol && a11.constructor === Symbol && a11 !== Symbol.prototype ? "symbol" : typeof a11;
        })(a10);
      }
      function c1(a10, b10) {
        var c10 = Object.keys(a10);
        if (Object.getOwnPropertySymbols) {
          var d10 = Object.getOwnPropertySymbols(a10);
          b10 && (d10 = d10.filter(function(b11) {
            return Object.getOwnPropertyDescriptor(a10, b11).enumerable;
          })), c10.push.apply(c10, d10);
        }
        return c10;
      }
      function c2(a10) {
        for (var b10 = 1; b10 < arguments.length; b10++) {
          var c10 = null != arguments[b10] ? arguments[b10] : {};
          b10 % 2 ? c1(Object(c10), true).forEach(function(b11) {
            !function(a11, b12, c11) {
              var d10;
              (d10 = function(a12, b13) {
                if ("object" != c0(a12) || !a12) return a12;
                var c12 = a12[Symbol.toPrimitive];
                if (void 0 !== c12) {
                  var d11 = c12.call(a12, b13 || "default");
                  if ("object" != c0(d11)) return d11;
                  throw TypeError("@@toPrimitive must return a primitive value.");
                }
                return ("string" === b13 ? String : Number)(a12);
              }(b12, "string"), (b12 = "symbol" == c0(d10) ? d10 : d10 + "") in a11) ? Object.defineProperty(a11, b12, { value: c11, enumerable: true, configurable: true, writable: true }) : a11[b12] = c11;
            }(a10, b11, c10[b11]);
          }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(a10, Object.getOwnPropertyDescriptors(c10)) : c1(Object(c10)).forEach(function(b11) {
            Object.defineProperty(a10, b11, Object.getOwnPropertyDescriptor(c10, b11));
          });
        }
        return a10;
      }
      let c3 = (a10) => {
        var b10;
        return a10.msg || a10.message || a10.error_description || ("string" == typeof a10.error ? a10.error : null == (b10 = a10.error) ? void 0 : b10.message) || JSON.stringify(a10);
      }, c4 = async (a10, b10, c10, d10) => {
        if (null !== a10 && "object" == typeof a10 && "function" == typeof a10.json) {
          let c11 = parseInt(a10.status, 10);
          Number.isFinite(c11) || (c11 = 500), a10.json().then((a11) => {
            let e10 = (null == a11 ? void 0 : a11.statusCode) || (null == a11 ? void 0 : a11.code) || c11 + "";
            b10(new cZ(c3(a11), c11, e10, d10));
          }).catch(() => {
            let e10 = c11 + "";
            b10(new cZ(a10.statusText || `HTTP ${c11} error`, c11, e10, d10));
          });
        } else b10(new c$(c3(a10), a10, d10));
      };
      async function c5(a10, b10, c10, d10, e10, f10, g2) {
        return new Promise((h2, i2) => {
          a10(c10, ((a11, b11, c11, d11) => {
            let e11 = { method: a11, headers: (null == b11 ? void 0 : b11.headers) || {} };
            return "GET" !== a11 && "HEAD" !== a11 && d11 && (((a12) => {
              if ("object" != typeof a12 || null === a12) return false;
              let b12 = Object.getPrototypeOf(a12);
              return (null === b12 || b12 === Object.prototype || null === Object.getPrototypeOf(b12)) && !(Symbol.toStringTag in a12) && !(Symbol.iterator in a12);
            })(d11) ? (e11.headers = c2({ "Content-Type": "application/json" }, null == b11 ? void 0 : b11.headers), e11.body = JSON.stringify(d11)) : e11.body = d11, (null == b11 ? void 0 : b11.duplex) && (e11.duplex = b11.duplex)), c2(c2({}, e11), c11);
          })(b10, d10, e10, f10)).then((a11) => {
            if (!a11.ok) throw a11;
            if (null == d10 ? void 0 : d10.noResolveJson) return a11;
            if ("vectors" === g2) {
              let b11 = a11.headers.get("content-type");
              if ("0" === a11.headers.get("content-length") || 204 === a11.status || !b11 || !b11.includes("application/json")) return {};
            }
            return a11.json();
          }).then((a11) => h2(a11)).catch((a11) => c4(a11, i2, d10, g2));
        });
      }
      function c6(a10 = "storage") {
        return { get: async (b10, c10, d10, e10) => c5(b10, "GET", c10, d10, e10, void 0, a10), post: async (b10, c10, d10, e10, f10) => c5(b10, "POST", c10, e10, f10, d10, a10), put: async (b10, c10, d10, e10, f10) => c5(b10, "PUT", c10, e10, f10, d10, a10), head: async (b10, c10, d10, e10) => c5(b10, "HEAD", c10, c2(c2({}, d10), {}, { noResolveJson: true }), e10, void 0, a10), remove: async (b10, c10, d10, e10, f10) => c5(b10, "DELETE", c10, e10, f10, d10, a10) };
      }
      let { get: c7, post: c8, put: c9, head: da, remove: db } = c6("storage"), dc = c6("vectors");
      var dd = class {
        constructor(a10, b10 = {}, c10, d10 = "storage") {
          this.shouldThrowOnError = false, this.url = a10, this.headers = b10, this.fetch = /* @__PURE__ */ ((a11) => a11 ? (...b11) => a11(...b11) : (...a12) => fetch(...a12))(c10), this.namespace = d10;
        }
        throwOnError() {
          return this.shouldThrowOnError = true, this;
        }
        setHeader(a10, b10) {
          return this.headers = c2(c2({}, this.headers), {}, { [a10]: b10 }), this;
        }
        async handleOperation(a10) {
          try {
            return { data: await a10(), error: null };
          } catch (a11) {
            if (this.shouldThrowOnError) throw a11;
            if (cY(a11)) return { data: null, error: a11 };
            throw a11;
          }
        }
      }, de = class {
        constructor(a10, b10) {
          this.downloadFn = a10, this.shouldThrowOnError = b10;
        }
        then(a10, b10) {
          return this.execute().then(a10, b10);
        }
        async execute() {
          try {
            return { data: (await this.downloadFn()).body, error: null };
          } catch (a10) {
            if (this.shouldThrowOnError) throw a10;
            if (cY(a10)) return { data: null, error: a10 };
            throw a10;
          }
        }
      };
      e = Symbol.toStringTag;
      var df = class {
        constructor(a10, b10) {
          this.downloadFn = a10, this.shouldThrowOnError = b10, this[e] = "BlobDownloadBuilder", this.promise = null;
        }
        asStream() {
          return new de(this.downloadFn, this.shouldThrowOnError);
        }
        then(a10, b10) {
          return this.getPromise().then(a10, b10);
        }
        catch(a10) {
          return this.getPromise().catch(a10);
        }
        finally(a10) {
          return this.getPromise().finally(a10);
        }
        getPromise() {
          return this.promise || (this.promise = this.execute()), this.promise;
        }
        async execute() {
          try {
            return { data: await (await this.downloadFn()).blob(), error: null };
          } catch (a10) {
            if (this.shouldThrowOnError) throw a10;
            if (cY(a10)) return { data: null, error: a10 };
            throw a10;
          }
        }
      };
      let dg = { limit: 100, offset: 0, sortBy: { column: "name", order: "asc" } }, dh = { cacheControl: "3600", contentType: "text/plain;charset=UTF-8", upsert: false };
      var di = class extends dd {
        constructor(a10, b10 = {}, c10, d10) {
          super(a10, b10, d10, "storage"), this.bucketId = c10;
        }
        async uploadOrUpdate(a10, b10, c10, d10) {
          var e10 = this;
          return e10.handleOperation(async () => {
            let f10, g2 = c2(c2({}, dh), d10), h2 = c2(c2({}, e10.headers), "POST" === a10 && { "x-upsert": String(g2.upsert) }), i2 = g2.metadata;
            "undefined" != typeof Blob && c10 instanceof Blob ? ((f10 = new FormData()).append("cacheControl", g2.cacheControl), i2 && f10.append("metadata", e10.encodeMetadata(i2)), f10.append("", c10)) : "undefined" != typeof FormData && c10 instanceof FormData ? ((f10 = c10).has("cacheControl") || f10.append("cacheControl", g2.cacheControl), i2 && !f10.has("metadata") && f10.append("metadata", e10.encodeMetadata(i2))) : (f10 = c10, h2["cache-control"] = `max-age=${g2.cacheControl}`, h2["content-type"] = g2.contentType, i2 && (h2["x-metadata"] = e10.toBase64(e10.encodeMetadata(i2))), ("undefined" != typeof ReadableStream && f10 instanceof ReadableStream || f10 && "object" == typeof f10 && "pipe" in f10 && "function" == typeof f10.pipe) && !g2.duplex && (g2.duplex = "half")), (null == d10 ? void 0 : d10.headers) && (h2 = c2(c2({}, h2), d10.headers));
            let j2 = e10._removeEmptyFolders(b10), k2 = e10._getFinalPath(j2), l2 = await ("PUT" == a10 ? c9 : c8)(e10.fetch, `${e10.url}/object/${k2}`, f10, c2({ headers: h2 }, (null == g2 ? void 0 : g2.duplex) ? { duplex: g2.duplex } : {}));
            return { path: j2, id: l2.Id, fullPath: l2.Key };
          });
        }
        async upload(a10, b10, c10) {
          return this.uploadOrUpdate("POST", a10, b10, c10);
        }
        async uploadToSignedUrl(a10, b10, c10, d10) {
          var e10 = this;
          let f10 = e10._removeEmptyFolders(a10), g2 = e10._getFinalPath(f10), h2 = new URL(e10.url + `/object/upload/sign/${g2}`);
          return h2.searchParams.set("token", b10), e10.handleOperation(async () => {
            let a11, b11 = c2(c2({}, dh), d10), g3 = c2(c2({}, e10.headers), { "x-upsert": String(b11.upsert) });
            return "undefined" != typeof Blob && c10 instanceof Blob ? ((a11 = new FormData()).append("cacheControl", b11.cacheControl), a11.append("", c10)) : "undefined" != typeof FormData && c10 instanceof FormData ? (a11 = c10).append("cacheControl", b11.cacheControl) : (a11 = c10, g3["cache-control"] = `max-age=${b11.cacheControl}`, g3["content-type"] = b11.contentType), { path: f10, fullPath: (await c9(e10.fetch, h2.toString(), a11, { headers: g3 })).Key };
          });
        }
        async createSignedUploadUrl(a10, b10) {
          var c10 = this;
          return c10.handleOperation(async () => {
            let d10 = c10._getFinalPath(a10), e10 = c2({}, c10.headers);
            (null == b10 ? void 0 : b10.upsert) && (e10["x-upsert"] = "true");
            let f10 = await c8(c10.fetch, `${c10.url}/object/upload/sign/${d10}`, {}, { headers: e10 }), g2 = new URL(c10.url + f10.url), h2 = g2.searchParams.get("token");
            if (!h2) throw new cX("No token returned by API");
            return { signedUrl: g2.toString(), path: a10, token: h2 };
          });
        }
        async update(a10, b10, c10) {
          return this.uploadOrUpdate("PUT", a10, b10, c10);
        }
        async move(a10, b10, c10) {
          var d10 = this;
          return d10.handleOperation(async () => await c8(d10.fetch, `${d10.url}/object/move`, { bucketId: d10.bucketId, sourceKey: a10, destinationKey: b10, destinationBucket: null == c10 ? void 0 : c10.destinationBucket }, { headers: d10.headers }));
        }
        async copy(a10, b10, c10) {
          var d10 = this;
          return d10.handleOperation(async () => ({ path: (await c8(d10.fetch, `${d10.url}/object/copy`, { bucketId: d10.bucketId, sourceKey: a10, destinationKey: b10, destinationBucket: null == c10 ? void 0 : c10.destinationBucket }, { headers: d10.headers })).Key }));
        }
        async createSignedUrl(a10, b10, c10) {
          var d10 = this;
          return d10.handleOperation(async () => {
            let e10 = d10._getFinalPath(a10), f10 = "object" == typeof (null == c10 ? void 0 : c10.transform) && null !== c10.transform && Object.keys(c10.transform).length > 0, g2 = await c8(d10.fetch, `${d10.url}/object/sign/${e10}`, c2({ expiresIn: b10 }, f10 ? { transform: c10.transform } : {}), { headers: d10.headers }), h2 = (null == c10 ? void 0 : c10.download) ? `&download=${true === c10.download ? "" : c10.download}` : "", i2 = f10 && g2.signedURL.includes("/object/sign/") ? g2.signedURL.replace("/object/sign/", "/render/image/sign/") : g2.signedURL;
            return { signedUrl: encodeURI(`${d10.url}${i2}${h2}`) };
          });
        }
        async createSignedUrls(a10, b10, c10) {
          var d10 = this;
          return d10.handleOperation(async () => {
            let e10 = await c8(d10.fetch, `${d10.url}/object/sign/${d10.bucketId}`, { expiresIn: b10, paths: a10 }, { headers: d10.headers }), f10 = (null == c10 ? void 0 : c10.download) ? `&download=${true === c10.download ? "" : c10.download}` : "";
            return e10.map((a11) => c2(c2({}, a11), {}, { signedUrl: a11.signedURL ? encodeURI(`${d10.url}${a11.signedURL}${f10}`) : null }));
          });
        }
        download(a10, b10, c10) {
          let d10 = void 0 !== (null == b10 ? void 0 : b10.transform) ? "render/image/authenticated" : "object", e10 = this.transformOptsToQueryString((null == b10 ? void 0 : b10.transform) || {}), f10 = e10 ? `?${e10}` : "", g2 = this._getFinalPath(a10);
          return new df(() => c7(this.fetch, `${this.url}/${d10}/${g2}${f10}`, { headers: this.headers, noResolveJson: true }, c10), this.shouldThrowOnError);
        }
        async info(a10) {
          var b10 = this;
          let c10 = b10._getFinalPath(a10);
          return b10.handleOperation(async () => c_(await c7(b10.fetch, `${b10.url}/object/info/${c10}`, { headers: b10.headers })));
        }
        async exists(a10) {
          var b10;
          let c10 = this._getFinalPath(a10);
          try {
            return await da(this.fetch, `${this.url}/object/${c10}`, { headers: this.headers }), { data: true, error: null };
          } catch (a11) {
            if (this.shouldThrowOnError) throw a11;
            if (cY(a11)) {
              let c11 = a11 instanceof cZ ? a11.status : a11 instanceof c$ ? null == (b10 = a11.originalError) ? void 0 : b10.status : void 0;
              if (void 0 !== c11 && [400, 404].includes(c11)) return { data: false, error: a11 };
            }
            throw a11;
          }
        }
        getPublicUrl(a10, b10) {
          let c10 = this._getFinalPath(a10), d10 = [], e10 = (null == b10 ? void 0 : b10.download) ? `download=${true === b10.download ? "" : b10.download}` : "";
          "" !== e10 && d10.push(e10);
          let f10 = void 0 !== (null == b10 ? void 0 : b10.transform) ? "render/image" : "object", g2 = this.transformOptsToQueryString((null == b10 ? void 0 : b10.transform) || {});
          "" !== g2 && d10.push(g2);
          let h2 = d10.join("&");
          return "" !== h2 && (h2 = `?${h2}`), { data: { publicUrl: encodeURI(`${this.url}/${f10}/public/${c10}${h2}`) } };
        }
        async remove(a10) {
          var b10 = this;
          return b10.handleOperation(async () => await db(b10.fetch, `${b10.url}/object/${b10.bucketId}`, { prefixes: a10 }, { headers: b10.headers }));
        }
        async list(a10, b10, c10) {
          var d10 = this;
          return d10.handleOperation(async () => {
            let e10 = c2(c2(c2({}, dg), b10), {}, { prefix: a10 || "" });
            return await c8(d10.fetch, `${d10.url}/object/list/${d10.bucketId}`, e10, { headers: d10.headers }, c10);
          });
        }
        async listV2(a10, b10) {
          var c10 = this;
          return c10.handleOperation(async () => {
            let d10 = c2({}, a10);
            return await c8(c10.fetch, `${c10.url}/object/list-v2/${c10.bucketId}`, d10, { headers: c10.headers }, b10);
          });
        }
        encodeMetadata(a10) {
          return JSON.stringify(a10);
        }
        toBase64(a10) {
          return void 0 !== cW ? cW.from(a10).toString("base64") : btoa(a10);
        }
        _getFinalPath(a10) {
          return `${this.bucketId}/${a10.replace(/^\/+/, "")}`;
        }
        _removeEmptyFolders(a10) {
          return a10.replace(/^\/|\/$/g, "").replace(/\/+/g, "/");
        }
        transformOptsToQueryString(a10) {
          let b10 = [];
          return a10.width && b10.push(`width=${a10.width}`), a10.height && b10.push(`height=${a10.height}`), a10.resize && b10.push(`resize=${a10.resize}`), a10.format && b10.push(`format=${a10.format}`), a10.quality && b10.push(`quality=${a10.quality}`), b10.join("&");
        }
      };
      let dj = { "X-Client-Info": "storage-js/2.101.1" };
      var dk = class extends dd {
        constructor(a10, b10 = {}, c10, d10) {
          let e10 = new URL(a10);
          (null == d10 ? void 0 : d10.useNewHostname) && /supabase\.(co|in|red)$/.test(e10.hostname) && !e10.hostname.includes("storage.supabase.") && (e10.hostname = e10.hostname.replace("supabase.", "storage.supabase.")), super(e10.href.replace(/\/$/, ""), c2(c2({}, dj), b10), c10, "storage");
        }
        async listBuckets(a10) {
          var b10 = this;
          return b10.handleOperation(async () => {
            let c10 = b10.listBucketOptionsToQueryString(a10);
            return await c7(b10.fetch, `${b10.url}/bucket${c10}`, { headers: b10.headers });
          });
        }
        async getBucket(a10) {
          var b10 = this;
          return b10.handleOperation(async () => await c7(b10.fetch, `${b10.url}/bucket/${a10}`, { headers: b10.headers }));
        }
        async createBucket(a10, b10 = { public: false }) {
          var c10 = this;
          return c10.handleOperation(async () => await c8(c10.fetch, `${c10.url}/bucket`, { id: a10, name: a10, type: b10.type, public: b10.public, file_size_limit: b10.fileSizeLimit, allowed_mime_types: b10.allowedMimeTypes }, { headers: c10.headers }));
        }
        async updateBucket(a10, b10) {
          var c10 = this;
          return c10.handleOperation(async () => await c9(c10.fetch, `${c10.url}/bucket/${a10}`, { id: a10, name: a10, public: b10.public, file_size_limit: b10.fileSizeLimit, allowed_mime_types: b10.allowedMimeTypes }, { headers: c10.headers }));
        }
        async emptyBucket(a10) {
          var b10 = this;
          return b10.handleOperation(async () => await c8(b10.fetch, `${b10.url}/bucket/${a10}/empty`, {}, { headers: b10.headers }));
        }
        async deleteBucket(a10) {
          var b10 = this;
          return b10.handleOperation(async () => await db(b10.fetch, `${b10.url}/bucket/${a10}`, {}, { headers: b10.headers }));
        }
        listBucketOptionsToQueryString(a10) {
          let b10 = {};
          return a10 && ("limit" in a10 && (b10.limit = String(a10.limit)), "offset" in a10 && (b10.offset = String(a10.offset)), a10.search && (b10.search = a10.search), a10.sortColumn && (b10.sortColumn = a10.sortColumn), a10.sortOrder && (b10.sortOrder = a10.sortOrder)), Object.keys(b10).length > 0 ? "?" + new URLSearchParams(b10).toString() : "";
        }
      }, dl = class extends dd {
        constructor(a10, b10 = {}, c10) {
          super(a10.replace(/\/$/, ""), c2(c2({}, dj), b10), c10, "storage");
        }
        async createBucket(a10) {
          var b10 = this;
          return b10.handleOperation(async () => await c8(b10.fetch, `${b10.url}/bucket`, { name: a10 }, { headers: b10.headers }));
        }
        async listBuckets(a10) {
          var b10 = this;
          return b10.handleOperation(async () => {
            let c10 = new URLSearchParams();
            (null == a10 ? void 0 : a10.limit) !== void 0 && c10.set("limit", a10.limit.toString()), (null == a10 ? void 0 : a10.offset) !== void 0 && c10.set("offset", a10.offset.toString()), (null == a10 ? void 0 : a10.sortColumn) && c10.set("sortColumn", a10.sortColumn), (null == a10 ? void 0 : a10.sortOrder) && c10.set("sortOrder", a10.sortOrder), (null == a10 ? void 0 : a10.search) && c10.set("search", a10.search);
            let d10 = c10.toString(), e10 = d10 ? `${b10.url}/bucket?${d10}` : `${b10.url}/bucket`;
            return await c7(b10.fetch, e10, { headers: b10.headers });
          });
        }
        async deleteBucket(a10) {
          var b10 = this;
          return b10.handleOperation(async () => await db(b10.fetch, `${b10.url}/bucket/${a10}`, {}, { headers: b10.headers }));
        }
        from(a10) {
          var b10 = this;
          if (!(!(!a10 || "string" != typeof a10 || 0 === a10.length || a10.length > 100 || a10.trim() !== a10 || a10.includes("/") || a10.includes("\\")) && /^[\w!.\*'() &$@=;:+,?-]+$/.test(a10))) throw new cX("Invalid bucket name: File, folder, and bucket names must follow AWS object key naming guidelines and should avoid the use of any other characters.");
          let c10 = new cV({ baseUrl: this.url, catalogName: a10, auth: { type: "custom", getHeaders: async () => b10.headers }, fetch: this.fetch }), d10 = this.shouldThrowOnError;
          return new Proxy(c10, { get(a11, b11) {
            let c11 = a11[b11];
            return "function" != typeof c11 ? c11 : async (...b12) => {
              try {
                return { data: await c11.apply(a11, b12), error: null };
              } catch (a12) {
                if (d10) throw a12;
                return { data: null, error: a12 };
              }
            };
          } });
        }
      }, dm = class extends dd {
        constructor(a10, b10 = {}, c10) {
          super(a10.replace(/\/$/, ""), c2(c2({}, dj), {}, { "Content-Type": "application/json" }, b10), c10, "vectors");
        }
        async createIndex(a10) {
          var b10 = this;
          return b10.handleOperation(async () => await dc.post(b10.fetch, `${b10.url}/CreateIndex`, a10, { headers: b10.headers }) || {});
        }
        async getIndex(a10, b10) {
          var c10 = this;
          return c10.handleOperation(async () => await dc.post(c10.fetch, `${c10.url}/GetIndex`, { vectorBucketName: a10, indexName: b10 }, { headers: c10.headers }));
        }
        async listIndexes(a10) {
          var b10 = this;
          return b10.handleOperation(async () => await dc.post(b10.fetch, `${b10.url}/ListIndexes`, a10, { headers: b10.headers }));
        }
        async deleteIndex(a10, b10) {
          var c10 = this;
          return c10.handleOperation(async () => await dc.post(c10.fetch, `${c10.url}/DeleteIndex`, { vectorBucketName: a10, indexName: b10 }, { headers: c10.headers }) || {});
        }
      }, dn = class extends dd {
        constructor(a10, b10 = {}, c10) {
          super(a10.replace(/\/$/, ""), c2(c2({}, dj), {}, { "Content-Type": "application/json" }, b10), c10, "vectors");
        }
        async putVectors(a10) {
          var b10 = this;
          if (a10.vectors.length < 1 || a10.vectors.length > 500) throw Error("Vector batch size must be between 1 and 500 items");
          return b10.handleOperation(async () => await dc.post(b10.fetch, `${b10.url}/PutVectors`, a10, { headers: b10.headers }) || {});
        }
        async getVectors(a10) {
          var b10 = this;
          return b10.handleOperation(async () => await dc.post(b10.fetch, `${b10.url}/GetVectors`, a10, { headers: b10.headers }));
        }
        async listVectors(a10) {
          var b10 = this;
          if (void 0 !== a10.segmentCount) {
            if (a10.segmentCount < 1 || a10.segmentCount > 16) throw Error("segmentCount must be between 1 and 16");
            if (void 0 !== a10.segmentIndex && (a10.segmentIndex < 0 || a10.segmentIndex >= a10.segmentCount)) throw Error(`segmentIndex must be between 0 and ${a10.segmentCount - 1}`);
          }
          return b10.handleOperation(async () => await dc.post(b10.fetch, `${b10.url}/ListVectors`, a10, { headers: b10.headers }));
        }
        async queryVectors(a10) {
          var b10 = this;
          return b10.handleOperation(async () => await dc.post(b10.fetch, `${b10.url}/QueryVectors`, a10, { headers: b10.headers }));
        }
        async deleteVectors(a10) {
          var b10 = this;
          if (a10.keys.length < 1 || a10.keys.length > 500) throw Error("Keys batch size must be between 1 and 500 items");
          return b10.handleOperation(async () => await dc.post(b10.fetch, `${b10.url}/DeleteVectors`, a10, { headers: b10.headers }) || {});
        }
      }, dp = class extends dd {
        constructor(a10, b10 = {}, c10) {
          super(a10.replace(/\/$/, ""), c2(c2({}, dj), {}, { "Content-Type": "application/json" }, b10), c10, "vectors");
        }
        async createBucket(a10) {
          var b10 = this;
          return b10.handleOperation(async () => await dc.post(b10.fetch, `${b10.url}/CreateVectorBucket`, { vectorBucketName: a10 }, { headers: b10.headers }) || {});
        }
        async getBucket(a10) {
          var b10 = this;
          return b10.handleOperation(async () => await dc.post(b10.fetch, `${b10.url}/GetVectorBucket`, { vectorBucketName: a10 }, { headers: b10.headers }));
        }
        async listBuckets(a10 = {}) {
          var b10 = this;
          return b10.handleOperation(async () => await dc.post(b10.fetch, `${b10.url}/ListVectorBuckets`, a10, { headers: b10.headers }));
        }
        async deleteBucket(a10) {
          var b10 = this;
          return b10.handleOperation(async () => await dc.post(b10.fetch, `${b10.url}/DeleteVectorBucket`, { vectorBucketName: a10 }, { headers: b10.headers }) || {});
        }
      }, dq = class extends dp {
        constructor(a10, b10 = {}) {
          super(a10, b10.headers || {}, b10.fetch);
        }
        from(a10) {
          return new dr(this.url, this.headers, a10, this.fetch);
        }
        async createBucket(a10) {
          return super.createBucket.call(this, a10);
        }
        async getBucket(a10) {
          return super.getBucket.call(this, a10);
        }
        async listBuckets(a10 = {}) {
          return super.listBuckets.call(this, a10);
        }
        async deleteBucket(a10) {
          return super.deleteBucket.call(this, a10);
        }
      }, dr = class extends dm {
        constructor(a10, b10, c10, d10) {
          super(a10, b10, d10), this.vectorBucketName = c10;
        }
        async createIndex(a10) {
          return super.createIndex.call(this, c2(c2({}, a10), {}, { vectorBucketName: this.vectorBucketName }));
        }
        async listIndexes(a10 = {}) {
          return super.listIndexes.call(this, c2(c2({}, a10), {}, { vectorBucketName: this.vectorBucketName }));
        }
        async getIndex(a10) {
          return super.getIndex.call(this, this.vectorBucketName, a10);
        }
        async deleteIndex(a10) {
          return super.deleteIndex.call(this, this.vectorBucketName, a10);
        }
        index(a10) {
          return new ds(this.url, this.headers, this.vectorBucketName, a10, this.fetch);
        }
      }, ds = class extends dn {
        constructor(a10, b10, c10, d10, e10) {
          super(a10, b10, e10), this.vectorBucketName = c10, this.indexName = d10;
        }
        async putVectors(a10) {
          return super.putVectors.call(this, c2(c2({}, a10), {}, { vectorBucketName: this.vectorBucketName, indexName: this.indexName }));
        }
        async getVectors(a10) {
          return super.getVectors.call(this, c2(c2({}, a10), {}, { vectorBucketName: this.vectorBucketName, indexName: this.indexName }));
        }
        async listVectors(a10 = {}) {
          return super.listVectors.call(this, c2(c2({}, a10), {}, { vectorBucketName: this.vectorBucketName, indexName: this.indexName }));
        }
        async queryVectors(a10) {
          return super.queryVectors.call(this, c2(c2({}, a10), {}, { vectorBucketName: this.vectorBucketName, indexName: this.indexName }));
        }
        async deleteVectors(a10) {
          return super.deleteVectors.call(this, c2(c2({}, a10), {}, { vectorBucketName: this.vectorBucketName, indexName: this.indexName }));
        }
      }, dt = class extends dk {
        constructor(a10, b10 = {}, c10, d10) {
          super(a10, b10, c10, d10);
        }
        from(a10) {
          return new di(this.url, this.headers, a10, this.fetch);
        }
        get vectors() {
          return new dq(this.url + "/vector", { headers: this.headers, fetch: this.fetch });
        }
        get analytics() {
          return new dl(this.url + "/iceberg", this.headers, this.fetch);
        }
      };
      let du = "2.101.1", dv = { "X-Client-Info": `gotrue-js/${du}` }, dw = "X-Supabase-Api-Version", dx = { "2024-01-01": { timestamp: Date.parse("2024-01-01T00:00:00.0Z"), name: "2024-01-01" } }, dy = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i;
      class dz extends Error {
        constructor(a10, b10, c10) {
          super(a10), this.__isAuthError = true, this.name = "AuthError", this.status = b10, this.code = c10;
        }
      }
      function dA(a10) {
        return "object" == typeof a10 && null !== a10 && "__isAuthError" in a10;
      }
      class dB extends dz {
        constructor(a10, b10, c10) {
          super(a10, b10, c10), this.name = "AuthApiError", this.status = b10, this.code = c10;
        }
      }
      class dC extends dz {
        constructor(a10, b10) {
          super(a10), this.name = "AuthUnknownError", this.originalError = b10;
        }
      }
      class dD extends dz {
        constructor(a10, b10, c10, d10) {
          super(a10, c10, d10), this.name = b10, this.status = c10;
        }
      }
      class dE extends dD {
        constructor() {
          super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
        }
      }
      function dF(a10) {
        return dA(a10) && "AuthSessionMissingError" === a10.name;
      }
      class dG extends dD {
        constructor() {
          super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
        }
      }
      class dH extends dD {
        constructor(a10) {
          super(a10, "AuthInvalidCredentialsError", 400, void 0);
        }
      }
      class dI extends dD {
        constructor(a10, b10 = null) {
          super(a10, "AuthImplicitGrantRedirectError", 500, void 0), this.details = null, this.details = b10;
        }
        toJSON() {
          return { name: this.name, message: this.message, status: this.status, details: this.details };
        }
      }
      class dJ extends dD {
        constructor(a10, b10 = null) {
          super(a10, "AuthPKCEGrantCodeExchangeError", 500, void 0), this.details = null, this.details = b10;
        }
        toJSON() {
          return { name: this.name, message: this.message, status: this.status, details: this.details };
        }
      }
      class dK extends dD {
        constructor() {
          super("PKCE code verifier not found in storage. This can happen if the auth flow was initiated in a different browser or device, or if the storage was cleared. For SSR frameworks (Next.js, SvelteKit, etc.), use @supabase/ssr on both the server and client to store the code verifier in cookies.", "AuthPKCECodeVerifierMissingError", 400, "pkce_code_verifier_not_found");
        }
      }
      class dL extends dD {
        constructor(a10, b10) {
          super(a10, "AuthRetryableFetchError", b10, void 0);
        }
      }
      function dM(a10) {
        return dA(a10) && "AuthRetryableFetchError" === a10.name;
      }
      class dN extends dD {
        constructor(a10, b10, c10) {
          super(a10, "AuthWeakPasswordError", b10, "weak_password"), this.reasons = c10;
        }
      }
      class dO extends dD {
        constructor(a10) {
          super(a10, "AuthInvalidJwtError", 400, "invalid_jwt");
        }
      }
      let dP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""), dQ = " 	\n\r=".split(""), dR = (() => {
        let a10 = Array(128);
        for (let b10 = 0; b10 < a10.length; b10 += 1) a10[b10] = -1;
        for (let b10 = 0; b10 < dQ.length; b10 += 1) a10[dQ[b10].charCodeAt(0)] = -2;
        for (let b10 = 0; b10 < dP.length; b10 += 1) a10[dP[b10].charCodeAt(0)] = b10;
        return a10;
      })();
      function dS(a10, b10, c10) {
        if (null !== a10) for (b10.queue = b10.queue << 8 | a10, b10.queuedBits += 8; b10.queuedBits >= 6; ) c10(dP[b10.queue >> b10.queuedBits - 6 & 63]), b10.queuedBits -= 6;
        else if (b10.queuedBits > 0) for (b10.queue = b10.queue << 6 - b10.queuedBits, b10.queuedBits = 6; b10.queuedBits >= 6; ) c10(dP[b10.queue >> b10.queuedBits - 6 & 63]), b10.queuedBits -= 6;
      }
      function dT(a10, b10, c10) {
        let d10 = dR[a10];
        if (d10 > -1) for (b10.queue = b10.queue << 6 | d10, b10.queuedBits += 6; b10.queuedBits >= 8; ) c10(b10.queue >> b10.queuedBits - 8 & 255), b10.queuedBits -= 8;
        else if (-2 === d10) return;
        else throw Error(`Invalid Base64-URL character "${String.fromCharCode(a10)}"`);
      }
      function dU(a10) {
        let b10 = [], c10 = (a11) => {
          b10.push(String.fromCodePoint(a11));
        }, d10 = { utf8seq: 0, codepoint: 0 }, e10 = { queue: 0, queuedBits: 0 }, f10 = (a11) => {
          !function(a12, b11, c11) {
            if (0 === b11.utf8seq) {
              if (a12 <= 127) return c11(a12);
              for (let c12 = 1; c12 < 6; c12 += 1) if ((a12 >> 7 - c12 & 1) == 0) {
                b11.utf8seq = c12;
                break;
              }
              if (2 === b11.utf8seq) b11.codepoint = 31 & a12;
              else if (3 === b11.utf8seq) b11.codepoint = 15 & a12;
              else if (4 === b11.utf8seq) b11.codepoint = 7 & a12;
              else throw Error("Invalid UTF-8 sequence");
              b11.utf8seq -= 1;
            } else if (b11.utf8seq > 0) {
              if (a12 <= 127) throw Error("Invalid UTF-8 sequence");
              b11.codepoint = b11.codepoint << 6 | 63 & a12, b11.utf8seq -= 1, 0 === b11.utf8seq && c11(b11.codepoint);
            }
          }(a11, d10, c10);
        };
        for (let b11 = 0; b11 < a10.length; b11 += 1) dT(a10.charCodeAt(b11), e10, f10);
        return b10.join("");
      }
      function dV(a10) {
        let b10 = [], c10 = { queue: 0, queuedBits: 0 }, d10 = (a11) => {
          b10.push(a11);
        };
        for (let b11 = 0; b11 < a10.length; b11 += 1) dT(a10.charCodeAt(b11), c10, d10);
        return new Uint8Array(b10);
      }
      function dW(a10) {
        let b10 = [], c10 = { queue: 0, queuedBits: 0 }, d10 = (a11) => {
          b10.push(a11);
        };
        return a10.forEach((a11) => dS(a11, c10, d10)), dS(null, c10, d10), b10.join("");
      }
      let dX = () => "undefined" != typeof window && "undefined" != typeof document, dY = { tested: false, writable: false }, dZ = () => {
        if (!dX()) return false;
        try {
          if ("object" != typeof globalThis.localStorage) return false;
        } catch (a11) {
          return false;
        }
        if (dY.tested) return dY.writable;
        let a10 = `lswt-${Math.random()}${Math.random()}`;
        try {
          globalThis.localStorage.setItem(a10, a10), globalThis.localStorage.removeItem(a10), dY.tested = true, dY.writable = true;
        } catch (a11) {
          dY.tested = true, dY.writable = false;
        }
        return dY.writable;
      }, d$ = (a10) => a10 ? (...b10) => a10(...b10) : (...a11) => fetch(...a11), d_ = async (a10, b10, c10) => {
        await a10.setItem(b10, JSON.stringify(c10));
      }, d0 = async (a10, b10) => {
        let c10 = await a10.getItem(b10);
        if (!c10) return null;
        try {
          return JSON.parse(c10);
        } catch (a11) {
          return c10;
        }
      }, d1 = async (a10, b10) => {
        await a10.removeItem(b10);
      };
      class d2 {
        constructor() {
          this.promise = new d2.promiseConstructor((a10, b10) => {
            this.resolve = a10, this.reject = b10;
          });
        }
      }
      function d3(a10) {
        let b10 = a10.split(".");
        if (3 !== b10.length) throw new dO("Invalid JWT structure");
        for (let a11 = 0; a11 < b10.length; a11++) if (!dy.test(b10[a11])) throw new dO("JWT not in base64url format");
        return { header: JSON.parse(dU(b10[0])), payload: JSON.parse(dU(b10[1])), signature: dV(b10[2]), raw: { header: b10[0], payload: b10[1] } };
      }
      async function d4(a10) {
        return await new Promise((b10) => {
          setTimeout(() => b10(null), a10);
        });
      }
      function d5(a10) {
        return ("0" + a10.toString(16)).substr(-2);
      }
      async function d6(a10) {
        let b10 = new TextEncoder().encode(a10);
        return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", b10))).map((a11) => String.fromCharCode(a11)).join("");
      }
      async function d7(a10) {
        return "undefined" == typeof crypto || void 0 === crypto.subtle || "undefined" == typeof TextEncoder ? (console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256."), a10) : btoa(await d6(a10)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      }
      async function d8(a10, b10, c10 = false) {
        let d10 = function() {
          let a11 = new Uint32Array(56);
          if ("undefined" == typeof crypto) {
            let a12 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~", b11 = a12.length, c11 = "";
            for (let d11 = 0; d11 < 56; d11++) c11 += a12.charAt(Math.floor(Math.random() * b11));
            return c11;
          }
          return crypto.getRandomValues(a11), Array.from(a11, d5).join("");
        }(), e10 = d10;
        c10 && (e10 += "/PASSWORD_RECOVERY"), await d_(a10, `${b10}-code-verifier`, e10);
        let f10 = await d7(d10), g2 = d10 === f10 ? "plain" : "s256";
        return [f10, g2];
      }
      d2.promiseConstructor = Promise;
      let d9 = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i, ea = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
      function eb(a10) {
        if (!ea.test(a10)) throw Error("@supabase/auth-js: Expected parameter to be UUID but is not");
      }
      function ec() {
        return new Proxy({}, { get: (a10, b10) => {
          if ("__isUserNotAvailableProxy" === b10) return true;
          if ("symbol" == typeof b10) {
            let a11 = b10.toString();
            if ("Symbol(Symbol.toPrimitive)" === a11 || "Symbol(Symbol.toStringTag)" === a11 || "Symbol(util.inspect.custom)" === a11) return;
          }
          throw Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Accessing the "${b10}" property of the session object is not supported. Please use getUser() instead.`);
        }, set: (a10, b10) => {
          throw Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Setting the "${b10}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
        }, deleteProperty: (a10, b10) => {
          throw Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Deleting the "${b10}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
        } });
      }
      function ed(a10) {
        return JSON.parse(JSON.stringify(a10));
      }
      let ee = (a10) => a10.msg || a10.message || a10.error_description || a10.error || JSON.stringify(a10), ef = [502, 503, 504];
      async function eg(a10) {
        var b10;
        let c10, d10;
        if (!("object" == typeof a10 && null !== a10 && "status" in a10 && "ok" in a10 && "json" in a10 && "function" == typeof a10.json)) throw new dL(ee(a10), 0);
        if (ef.includes(a10.status)) throw new dL(ee(a10), a10.status);
        try {
          c10 = await a10.json();
        } catch (a11) {
          throw new dC(ee(a11), a11);
        }
        let e10 = function(a11) {
          let b11 = a11.headers.get(dw);
          if (!b11 || !b11.match(d9)) return null;
          try {
            return /* @__PURE__ */ new Date(`${b11}T00:00:00.0Z`);
          } catch (a12) {
            return null;
          }
        }(a10);
        if (e10 && e10.getTime() >= dx["2024-01-01"].timestamp && "object" == typeof c10 && c10 && "string" == typeof c10.code ? d10 = c10.code : "object" == typeof c10 && c10 && "string" == typeof c10.error_code && (d10 = c10.error_code), d10) {
          if ("weak_password" === d10) throw new dN(ee(c10), a10.status, (null == (b10 = c10.weak_password) ? void 0 : b10.reasons) || []);
          else if ("session_not_found" === d10) throw new dE();
        } else if ("object" == typeof c10 && c10 && "object" == typeof c10.weak_password && c10.weak_password && Array.isArray(c10.weak_password.reasons) && c10.weak_password.reasons.length && c10.weak_password.reasons.reduce((a11, b11) => a11 && "string" == typeof b11, true)) throw new dN(ee(c10), a10.status, c10.weak_password.reasons);
        throw new dB(ee(c10), a10.status || 500, d10);
      }
      async function eh(a10, b10, c10, d10) {
        var e10;
        let f10 = Object.assign({}, null == d10 ? void 0 : d10.headers);
        f10[dw] || (f10[dw] = dx["2024-01-01"].name), (null == d10 ? void 0 : d10.jwt) && (f10.Authorization = `Bearer ${d10.jwt}`);
        let g2 = null != (e10 = null == d10 ? void 0 : d10.query) ? e10 : {};
        (null == d10 ? void 0 : d10.redirectTo) && (g2.redirect_to = d10.redirectTo);
        let h2 = Object.keys(g2).length ? "?" + new URLSearchParams(g2).toString() : "", i2 = await ei(a10, b10, c10 + h2, { headers: f10, noResolveJson: null == d10 ? void 0 : d10.noResolveJson }, {}, null == d10 ? void 0 : d10.body);
        return (null == d10 ? void 0 : d10.xform) ? null == d10 ? void 0 : d10.xform(i2) : { data: Object.assign({}, i2), error: null };
      }
      async function ei(a10, b10, c10, d10, e10, f10) {
        let g2, h2 = ((a11, b11, c11, d11) => {
          let e11 = { method: a11, headers: (null == b11 ? void 0 : b11.headers) || {} };
          return "GET" === a11 ? e11 : (e11.headers = Object.assign({ "Content-Type": "application/json;charset=UTF-8" }, null == b11 ? void 0 : b11.headers), e11.body = JSON.stringify(d11), Object.assign(Object.assign({}, e11), c11));
        })(b10, d10, e10, f10);
        try {
          g2 = await a10(c10, Object.assign({}, h2));
        } catch (a11) {
          throw console.error(a11), new dL(ee(a11), 0);
        }
        if (g2.ok || await eg(g2), null == d10 ? void 0 : d10.noResolveJson) return g2;
        try {
          return await g2.json();
        } catch (a11) {
          await eg(a11);
        }
      }
      function ej(a10) {
        var b10, c10, d10;
        let e10 = null;
        (d10 = a10).access_token && d10.refresh_token && d10.expires_in && (e10 = Object.assign({}, a10), a10.expires_at || (e10.expires_at = (c10 = a10.expires_in, Math.round(Date.now() / 1e3) + c10)));
        return { data: { session: e10, user: null != (b10 = a10.user) ? b10 : a10 }, error: null };
      }
      function ek(a10) {
        let b10 = ej(a10);
        return !b10.error && a10.weak_password && "object" == typeof a10.weak_password && Array.isArray(a10.weak_password.reasons) && a10.weak_password.reasons.length && a10.weak_password.message && "string" == typeof a10.weak_password.message && a10.weak_password.reasons.reduce((a11, b11) => a11 && "string" == typeof b11, true) && (b10.data.weak_password = a10.weak_password), b10;
      }
      function el(a10) {
        var b10;
        return { data: { user: null != (b10 = a10.user) ? b10 : a10 }, error: null };
      }
      function em(a10) {
        return { data: a10, error: null };
      }
      function en(a10) {
        let { action_link: b10, email_otp: c10, hashed_token: d10, redirect_to: e10, verification_type: f10 } = a10;
        return { data: { properties: { action_link: b10, email_otp: c10, hashed_token: d10, redirect_to: e10, verification_type: f10 }, user: Object.assign({}, bT(a10, ["action_link", "email_otp", "hashed_token", "redirect_to", "verification_type"])) }, error: null };
      }
      function eo(a10) {
        return a10;
      }
      let ep = ["global", "local", "others"];
      class eq {
        constructor({ url: a10 = "", headers: b10 = {}, fetch: c10 }) {
          this.url = a10, this.headers = b10, this.fetch = d$(c10), this.mfa = { listFactors: this._listFactors.bind(this), deleteFactor: this._deleteFactor.bind(this) }, this.oauth = { listClients: this._listOAuthClients.bind(this), createClient: this._createOAuthClient.bind(this), getClient: this._getOAuthClient.bind(this), updateClient: this._updateOAuthClient.bind(this), deleteClient: this._deleteOAuthClient.bind(this), regenerateClientSecret: this._regenerateOAuthClientSecret.bind(this) }, this.customProviders = { listProviders: this._listCustomProviders.bind(this), createProvider: this._createCustomProvider.bind(this), getProvider: this._getCustomProvider.bind(this), updateProvider: this._updateCustomProvider.bind(this), deleteProvider: this._deleteCustomProvider.bind(this) };
        }
        async signOut(a10, b10 = ep[0]) {
          if (0 > ep.indexOf(b10)) throw Error(`@supabase/auth-js: Parameter scope must be one of ${ep.join(", ")}`);
          try {
            return await eh(this.fetch, "POST", `${this.url}/logout?scope=${b10}`, { headers: this.headers, jwt: a10, noResolveJson: true }), { data: null, error: null };
          } catch (a11) {
            if (dA(a11)) return { data: null, error: a11 };
            throw a11;
          }
        }
        async inviteUserByEmail(a10, b10 = {}) {
          try {
            return await eh(this.fetch, "POST", `${this.url}/invite`, { body: { email: a10, data: b10.data }, headers: this.headers, redirectTo: b10.redirectTo, xform: el });
          } catch (a11) {
            if (dA(a11)) return { data: { user: null }, error: a11 };
            throw a11;
          }
        }
        async generateLink(a10) {
          try {
            let { options: b10 } = a10, c10 = bT(a10, ["options"]), d10 = Object.assign(Object.assign({}, c10), b10);
            return "newEmail" in c10 && (d10.new_email = null == c10 ? void 0 : c10.newEmail, delete d10.newEmail), await eh(this.fetch, "POST", `${this.url}/admin/generate_link`, { body: d10, headers: this.headers, xform: en, redirectTo: null == b10 ? void 0 : b10.redirectTo });
          } catch (a11) {
            if (dA(a11)) return { data: { properties: null, user: null }, error: a11 };
            throw a11;
          }
        }
        async createUser(a10) {
          try {
            return await eh(this.fetch, "POST", `${this.url}/admin/users`, { body: a10, headers: this.headers, xform: el });
          } catch (a11) {
            if (dA(a11)) return { data: { user: null }, error: a11 };
            throw a11;
          }
        }
        async listUsers(a10) {
          var b10, c10, d10, e10, f10, g2, h2;
          try {
            let i2 = { nextPage: null, lastPage: 0, total: 0 }, j2 = await eh(this.fetch, "GET", `${this.url}/admin/users`, { headers: this.headers, noResolveJson: true, query: { page: null != (c10 = null == (b10 = null == a10 ? void 0 : a10.page) ? void 0 : b10.toString()) ? c10 : "", per_page: null != (e10 = null == (d10 = null == a10 ? void 0 : a10.perPage) ? void 0 : d10.toString()) ? e10 : "" }, xform: eo });
            if (j2.error) throw j2.error;
            let k2 = await j2.json(), l2 = null != (f10 = j2.headers.get("x-total-count")) ? f10 : 0, m2 = null != (h2 = null == (g2 = j2.headers.get("link")) ? void 0 : g2.split(",")) ? h2 : [];
            return m2.length > 0 && (m2.forEach((a11) => {
              let b11 = parseInt(a11.split(";")[0].split("=")[1].substring(0, 1)), c11 = JSON.parse(a11.split(";")[1].split("=")[1]);
              i2[`${c11}Page`] = b11;
            }), i2.total = parseInt(l2)), { data: Object.assign(Object.assign({}, k2), i2), error: null };
          } catch (a11) {
            if (dA(a11)) return { data: { users: [] }, error: a11 };
            throw a11;
          }
        }
        async getUserById(a10) {
          eb(a10);
          try {
            return await eh(this.fetch, "GET", `${this.url}/admin/users/${a10}`, { headers: this.headers, xform: el });
          } catch (a11) {
            if (dA(a11)) return { data: { user: null }, error: a11 };
            throw a11;
          }
        }
        async updateUserById(a10, b10) {
          eb(a10);
          try {
            return await eh(this.fetch, "PUT", `${this.url}/admin/users/${a10}`, { body: b10, headers: this.headers, xform: el });
          } catch (a11) {
            if (dA(a11)) return { data: { user: null }, error: a11 };
            throw a11;
          }
        }
        async deleteUser(a10, b10 = false) {
          eb(a10);
          try {
            return await eh(this.fetch, "DELETE", `${this.url}/admin/users/${a10}`, { headers: this.headers, body: { should_soft_delete: b10 }, xform: el });
          } catch (a11) {
            if (dA(a11)) return { data: { user: null }, error: a11 };
            throw a11;
          }
        }
        async _listFactors(a10) {
          eb(a10.userId);
          try {
            let { data: b10, error: c10 } = await eh(this.fetch, "GET", `${this.url}/admin/users/${a10.userId}/factors`, { headers: this.headers, xform: (a11) => ({ data: { factors: a11 }, error: null }) });
            return { data: b10, error: c10 };
          } catch (a11) {
            if (dA(a11)) return { data: null, error: a11 };
            throw a11;
          }
        }
        async _deleteFactor(a10) {
          eb(a10.userId), eb(a10.id);
          try {
            return { data: await eh(this.fetch, "DELETE", `${this.url}/admin/users/${a10.userId}/factors/${a10.id}`, { headers: this.headers }), error: null };
          } catch (a11) {
            if (dA(a11)) return { data: null, error: a11 };
            throw a11;
          }
        }
        async _listOAuthClients(a10) {
          var b10, c10, d10, e10, f10, g2, h2;
          try {
            let i2 = { nextPage: null, lastPage: 0, total: 0 }, j2 = await eh(this.fetch, "GET", `${this.url}/admin/oauth/clients`, { headers: this.headers, noResolveJson: true, query: { page: null != (c10 = null == (b10 = null == a10 ? void 0 : a10.page) ? void 0 : b10.toString()) ? c10 : "", per_page: null != (e10 = null == (d10 = null == a10 ? void 0 : a10.perPage) ? void 0 : d10.toString()) ? e10 : "" }, xform: eo });
            if (j2.error) throw j2.error;
            let k2 = await j2.json(), l2 = null != (f10 = j2.headers.get("x-total-count")) ? f10 : 0, m2 = null != (h2 = null == (g2 = j2.headers.get("link")) ? void 0 : g2.split(",")) ? h2 : [];
            return m2.length > 0 && (m2.forEach((a11) => {
              let b11 = parseInt(a11.split(";")[0].split("=")[1].substring(0, 1)), c11 = JSON.parse(a11.split(";")[1].split("=")[1]);
              i2[`${c11}Page`] = b11;
            }), i2.total = parseInt(l2)), { data: Object.assign(Object.assign({}, k2), i2), error: null };
          } catch (a11) {
            if (dA(a11)) return { data: { clients: [] }, error: a11 };
            throw a11;
          }
        }
        async _createOAuthClient(a10) {
          try {
            return await eh(this.fetch, "POST", `${this.url}/admin/oauth/clients`, { body: a10, headers: this.headers, xform: (a11) => ({ data: a11, error: null }) });
          } catch (a11) {
            if (dA(a11)) return { data: null, error: a11 };
            throw a11;
          }
        }
        async _getOAuthClient(a10) {
          try {
            return await eh(this.fetch, "GET", `${this.url}/admin/oauth/clients/${a10}`, { headers: this.headers, xform: (a11) => ({ data: a11, error: null }) });
          } catch (a11) {
            if (dA(a11)) return { data: null, error: a11 };
            throw a11;
          }
        }
        async _updateOAuthClient(a10, b10) {
          try {
            return await eh(this.fetch, "PUT", `${this.url}/admin/oauth/clients/${a10}`, { body: b10, headers: this.headers, xform: (a11) => ({ data: a11, error: null }) });
          } catch (a11) {
            if (dA(a11)) return { data: null, error: a11 };
            throw a11;
          }
        }
        async _deleteOAuthClient(a10) {
          try {
            return await eh(this.fetch, "DELETE", `${this.url}/admin/oauth/clients/${a10}`, { headers: this.headers, noResolveJson: true }), { data: null, error: null };
          } catch (a11) {
            if (dA(a11)) return { data: null, error: a11 };
            throw a11;
          }
        }
        async _regenerateOAuthClientSecret(a10) {
          try {
            return await eh(this.fetch, "POST", `${this.url}/admin/oauth/clients/${a10}/regenerate_secret`, { headers: this.headers, xform: (a11) => ({ data: a11, error: null }) });
          } catch (a11) {
            if (dA(a11)) return { data: null, error: a11 };
            throw a11;
          }
        }
        async _listCustomProviders(a10) {
          try {
            let b10 = {};
            return (null == a10 ? void 0 : a10.type) && (b10.type = a10.type), await eh(this.fetch, "GET", `${this.url}/admin/custom-providers`, { headers: this.headers, query: b10, xform: (a11) => {
              var b11;
              return { data: { providers: null != (b11 = null == a11 ? void 0 : a11.providers) ? b11 : [] }, error: null };
            } });
          } catch (a11) {
            if (dA(a11)) return { data: { providers: [] }, error: a11 };
            throw a11;
          }
        }
        async _createCustomProvider(a10) {
          try {
            return await eh(this.fetch, "POST", `${this.url}/admin/custom-providers`, { body: a10, headers: this.headers, xform: (a11) => ({ data: a11, error: null }) });
          } catch (a11) {
            if (dA(a11)) return { data: null, error: a11 };
            throw a11;
          }
        }
        async _getCustomProvider(a10) {
          try {
            return await eh(this.fetch, "GET", `${this.url}/admin/custom-providers/${a10}`, { headers: this.headers, xform: (a11) => ({ data: a11, error: null }) });
          } catch (a11) {
            if (dA(a11)) return { data: null, error: a11 };
            throw a11;
          }
        }
        async _updateCustomProvider(a10, b10) {
          try {
            return await eh(this.fetch, "PUT", `${this.url}/admin/custom-providers/${a10}`, { body: b10, headers: this.headers, xform: (a11) => ({ data: a11, error: null }) });
          } catch (a11) {
            if (dA(a11)) return { data: null, error: a11 };
            throw a11;
          }
        }
        async _deleteCustomProvider(a10) {
          try {
            return await eh(this.fetch, "DELETE", `${this.url}/admin/custom-providers/${a10}`, { headers: this.headers, noResolveJson: true }), { data: null, error: null };
          } catch (a11) {
            if (dA(a11)) return { data: null, error: a11 };
            throw a11;
          }
        }
      }
      function er(a10 = {}) {
        return { getItem: (b10) => a10[b10] || null, setItem: (b10, c10) => {
          a10[b10] = c10;
        }, removeItem: (b10) => {
          delete a10[b10];
        } };
      }
      let es = { debug: !!(globalThis && dZ() && globalThis.localStorage && "true" === globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug")) };
      class et extends Error {
        constructor(a10) {
          super(a10), this.isAcquireTimeout = true;
        }
      }
      class eu extends et {
      }
      async function ev(a10, b10, c10) {
        let d10;
        es.debug && console.log("@supabase/gotrue-js: navigatorLock: acquire lock", a10, b10);
        let e10 = new globalThis.AbortController();
        b10 > 0 && (d10 = setTimeout(() => {
          e10.abort(), es.debug && console.log("@supabase/gotrue-js: navigatorLock acquire timed out", a10);
        }, b10)), await Promise.resolve();
        try {
          return await globalThis.navigator.locks.request(a10, 0 === b10 ? { mode: "exclusive", ifAvailable: true } : { mode: "exclusive", signal: e10.signal }, async (e11) => {
            if (e11) {
              clearTimeout(d10), es.debug && console.log("@supabase/gotrue-js: navigatorLock: acquired", a10, e11.name);
              try {
                return await c10();
              } finally {
                es.debug && console.log("@supabase/gotrue-js: navigatorLock: released", a10, e11.name);
              }
            }
            if (0 === b10) throw es.debug && console.log("@supabase/gotrue-js: navigatorLock: not immediately available", a10), new eu(`Acquiring an exclusive Navigator LockManager lock "${a10}" immediately failed`);
            if (es.debug) try {
              let a11 = await globalThis.navigator.locks.query();
              console.log("@supabase/gotrue-js: Navigator LockManager state", JSON.stringify(a11, null, "  "));
            } catch (a11) {
              console.warn("@supabase/gotrue-js: Error when querying Navigator LockManager state", a11);
            }
            return console.warn("@supabase/gotrue-js: Navigator LockManager returned a null lock when using #request without ifAvailable set to true, it appears this browser is not following the LockManager spec https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request"), clearTimeout(d10), await c10();
          });
        } catch (f10) {
          if (b10 > 0 && clearTimeout(d10), (null == f10 ? void 0 : f10.name) === "AbortError" && b10 > 0) if (e10.signal.aborted) return es.debug && console.log("@supabase/gotrue-js: navigatorLock: acquire timeout, recovering by stealing lock", a10), console.warn(`@supabase/gotrue-js: Lock "${a10}" was not released within ${b10}ms. This may indicate an orphaned lock from a component unmount (e.g., React Strict Mode). Forcefully acquiring the lock to recover.`), await Promise.resolve().then(() => globalThis.navigator.locks.request(a10, { mode: "exclusive", steal: true }, async (b11) => {
            if (!b11) return console.warn("@supabase/gotrue-js: Navigator LockManager returned null lock even with steal: true"), await c10();
            es.debug && console.log("@supabase/gotrue-js: navigatorLock: recovered (stolen)", a10, b11.name);
            try {
              return await c10();
            } finally {
              es.debug && console.log("@supabase/gotrue-js: navigatorLock: released (stolen)", a10, b11.name);
            }
          }));
          else throw es.debug && console.log("@supabase/gotrue-js: navigatorLock: lock was stolen by another request", a10), new eu(`Lock "${a10}" was released because another request stole it`);
          throw f10;
        }
      }
      function ew(a10) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(a10)) throw Error(`@supabase/auth-js: Address "${a10}" is invalid.`);
        return a10.toLowerCase();
      }
      class ex extends Error {
        constructor({ message: a10, code: b10, cause: c10, name: d10 }) {
          var e10;
          super(a10, { cause: c10 }), this.__isWebAuthnError = true, this.name = null != (e10 = null != d10 ? d10 : c10 instanceof Error ? c10.name : void 0) ? e10 : "Unknown Error", this.code = b10;
        }
      }
      class ey extends ex {
        constructor(a10, b10) {
          super({ code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY", cause: b10, message: a10 }), this.name = "WebAuthnUnknownError", this.originalError = b10;
        }
      }
      class ez {
        createNewAbortSignal() {
          if (this.controller) {
            let a11 = Error("Cancelling existing WebAuthn API call for new one");
            a11.name = "AbortError", this.controller.abort(a11);
          }
          let a10 = new AbortController();
          return this.controller = a10, a10.signal;
        }
        cancelCeremony() {
          if (this.controller) {
            let a10 = Error("Manually cancelling existing WebAuthn API call");
            a10.name = "AbortError", this.controller.abort(a10), this.controller = void 0;
          }
        }
      }
      let eA = new ez();
      function eB(a10) {
        return "localhost" === a10 || /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(a10);
      }
      function eC() {
        var a10, b10;
        return !!(dX() && "PublicKeyCredential" in window && window.PublicKeyCredential && "credentials" in navigator && "function" == typeof (null == (a10 = null == navigator ? void 0 : navigator.credentials) ? void 0 : a10.create) && "function" == typeof (null == (b10 = null == navigator ? void 0 : navigator.credentials) ? void 0 : b10.get));
      }
      async function eD(a10) {
        try {
          let b10 = await navigator.credentials.create(a10);
          if (!b10) return { data: null, error: new ey("Empty credential response", b10) };
          if (!(b10 instanceof PublicKeyCredential)) return { data: null, error: new ey("Browser returned unexpected credential type", b10) };
          return { data: b10, error: null };
        } catch (b10) {
          return { data: null, error: function({ error: a11, options: b11 }) {
            var c10, d10, e10;
            let { publicKey: f10 } = b11;
            if (!f10) throw Error("options was missing required publicKey property");
            if ("AbortError" === a11.name) {
              if (b11.signal instanceof AbortSignal) return new ex({ message: "Registration ceremony was sent an abort signal", code: "ERROR_CEREMONY_ABORTED", cause: a11 });
            } else if ("ConstraintError" === a11.name) {
              if ((null == (c10 = f10.authenticatorSelection) ? void 0 : c10.requireResidentKey) === true) return new ex({ message: "Discoverable credentials were required but no available authenticator supported it", code: "ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT", cause: a11 });
              else if ("conditional" === b11.mediation && (null == (d10 = f10.authenticatorSelection) ? void 0 : d10.userVerification) === "required") return new ex({ message: "User verification was required during automatic registration but it could not be performed", code: "ERROR_AUTO_REGISTER_USER_VERIFICATION_FAILURE", cause: a11 });
              else if ((null == (e10 = f10.authenticatorSelection) ? void 0 : e10.userVerification) === "required") return new ex({ message: "User verification was required but no available authenticator supported it", code: "ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT", cause: a11 });
            } else if ("InvalidStateError" === a11.name) return new ex({ message: "The authenticator was previously registered", code: "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED", cause: a11 });
            else if ("NotAllowedError" === a11.name) return new ex({ message: a11.message, code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY", cause: a11 });
            else if ("NotSupportedError" === a11.name) return new ex(0 === f10.pubKeyCredParams.filter((a12) => "public-key" === a12.type).length ? { message: 'No entry in pubKeyCredParams was of type "public-key"', code: "ERROR_MALFORMED_PUBKEYCREDPARAMS", cause: a11 } : { message: "No available authenticator supported any of the specified pubKeyCredParams algorithms", code: "ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG", cause: a11 });
            else if ("SecurityError" === a11.name) {
              let b12 = window.location.hostname;
              if (!eB(b12)) return new ex({ message: `${window.location.hostname} is an invalid domain`, code: "ERROR_INVALID_DOMAIN", cause: a11 });
              if (f10.rp.id !== b12) return new ex({ message: `The RP ID "${f10.rp.id}" is invalid for this domain`, code: "ERROR_INVALID_RP_ID", cause: a11 });
            } else if ("TypeError" === a11.name) {
              if (f10.user.id.byteLength < 1 || f10.user.id.byteLength > 64) return new ex({ message: "User ID was not between 1 and 64 characters", code: "ERROR_INVALID_USER_ID_LENGTH", cause: a11 });
            } else if ("UnknownError" === a11.name) return new ex({ message: "The authenticator was unable to process the specified options, or could not create a new credential", code: "ERROR_AUTHENTICATOR_GENERAL_ERROR", cause: a11 });
            return new ex({ message: "a Non-Webauthn related error has occurred", code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY", cause: a11 });
          }({ error: b10, options: a10 }) };
        }
      }
      async function eE(a10) {
        try {
          let b10 = await navigator.credentials.get(a10);
          if (!b10) return { data: null, error: new ey("Empty credential response", b10) };
          if (!(b10 instanceof PublicKeyCredential)) return { data: null, error: new ey("Browser returned unexpected credential type", b10) };
          return { data: b10, error: null };
        } catch (b10) {
          return { data: null, error: function({ error: a11, options: b11 }) {
            let { publicKey: c10 } = b11;
            if (!c10) throw Error("options was missing required publicKey property");
            if ("AbortError" === a11.name) {
              if (b11.signal instanceof AbortSignal) return new ex({ message: "Authentication ceremony was sent an abort signal", code: "ERROR_CEREMONY_ABORTED", cause: a11 });
            } else if ("NotAllowedError" === a11.name) return new ex({ message: a11.message, code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY", cause: a11 });
            else if ("SecurityError" === a11.name) {
              let b12 = window.location.hostname;
              if (!eB(b12)) return new ex({ message: `${window.location.hostname} is an invalid domain`, code: "ERROR_INVALID_DOMAIN", cause: a11 });
              if (c10.rpId !== b12) return new ex({ message: `The RP ID "${c10.rpId}" is invalid for this domain`, code: "ERROR_INVALID_RP_ID", cause: a11 });
            } else if ("UnknownError" === a11.name) return new ex({ message: "The authenticator was unable to process the specified options, or could not create a new assertion signature", code: "ERROR_AUTHENTICATOR_GENERAL_ERROR", cause: a11 });
            return new ex({ message: "a Non-Webauthn related error has occurred", code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY", cause: a11 });
          }({ error: b10, options: a10 }) };
        }
      }
      let eF = { hints: ["security-key"], authenticatorSelection: { authenticatorAttachment: "cross-platform", requireResidentKey: false, userVerification: "preferred", residentKey: "discouraged" }, attestation: "direct" }, eG = { userVerification: "preferred", hints: ["security-key"], attestation: "direct" };
      function eH(...a10) {
        let b10 = (a11) => null !== a11 && "object" == typeof a11 && !Array.isArray(a11), c10 = (a11) => a11 instanceof ArrayBuffer || ArrayBuffer.isView(a11), d10 = {};
        for (let e10 of a10) if (e10) for (let a11 in e10) {
          let f10 = e10[a11];
          if (void 0 !== f10) if (Array.isArray(f10)) d10[a11] = f10;
          else if (c10(f10)) d10[a11] = f10;
          else if (b10(f10)) {
            let c11 = d10[a11];
            b10(c11) ? d10[a11] = eH(c11, f10) : d10[a11] = eH(f10);
          } else d10[a11] = f10;
        }
        return d10;
      }
      class eI {
        constructor(a10) {
          this.client = a10, this.enroll = this._enroll.bind(this), this.challenge = this._challenge.bind(this), this.verify = this._verify.bind(this), this.authenticate = this._authenticate.bind(this), this.register = this._register.bind(this);
        }
        async _enroll(a10) {
          return this.client.mfa.enroll(Object.assign(Object.assign({}, a10), { factorType: "webauthn" }));
        }
        async _challenge({ factorId: a10, webauthn: b10, friendlyName: c10, signal: d10 }, e10) {
          var f10, g2, h2, i2, j2;
          try {
            let { data: k2, error: l2 } = await this.client.mfa.challenge({ factorId: a10, webauthn: b10 });
            if (!k2) return { data: null, error: l2 };
            let m2 = null != d10 ? d10 : eA.createNewAbortSignal();
            if ("create" === k2.webauthn.type) {
              let { user: a11 } = k2.webauthn.credential_options.publicKey;
              if (!a11.name) if (c10) a11.name = `${a11.id}:${c10}`;
              else {
                let b11 = (await this.client.getUser()).data.user, c11 = (null == (f10 = null == b11 ? void 0 : b11.user_metadata) ? void 0 : f10.name) || (null == b11 ? void 0 : b11.email) || (null == b11 ? void 0 : b11.id) || "User";
                a11.name = `${a11.id}:${c11}`;
              }
              a11.displayName || (a11.displayName = a11.name);
            }
            switch (k2.webauthn.type) {
              case "create": {
                let b11 = (g2 = k2.webauthn.credential_options.publicKey, h2 = null == e10 ? void 0 : e10.create, eH(eF, g2, h2 || {})), { data: c11, error: d11 } = await eD({ publicKey: b11, signal: m2 });
                if (c11) return { data: { factorId: a10, challengeId: k2.id, webauthn: { type: k2.webauthn.type, credential_response: c11 } }, error: null };
                return { data: null, error: d11 };
              }
              case "request": {
                let b11 = (i2 = k2.webauthn.credential_options.publicKey, j2 = null == e10 ? void 0 : e10.request, eH(eG, i2, j2 || {})), { data: c11, error: d11 } = await eE(Object.assign(Object.assign({}, k2.webauthn.credential_options), { publicKey: b11, signal: m2 }));
                if (c11) return { data: { factorId: a10, challengeId: k2.id, webauthn: { type: k2.webauthn.type, credential_response: c11 } }, error: null };
                return { data: null, error: d11 };
              }
            }
          } catch (a11) {
            if (dA(a11)) return { data: null, error: a11 };
            return { data: null, error: new dC("Unexpected error in challenge", a11) };
          }
        }
        async _verify({ challengeId: a10, factorId: b10, webauthn: c10 }) {
          return this.client.mfa.verify({ factorId: b10, challengeId: a10, webauthn: c10 });
        }
        async _authenticate({ factorId: a10, webauthn: { rpId: b10 = "undefined" != typeof window ? window.location.hostname : void 0, rpOrigins: c10 = "undefined" != typeof window ? [window.location.origin] : void 0, signal: d10 } = {} }, e10) {
          if (!b10) return { data: null, error: new dz("rpId is required for WebAuthn authentication") };
          try {
            if (!eC()) return { data: null, error: new dC("Browser does not support WebAuthn", null) };
            let { data: f10, error: g2 } = await this.challenge({ factorId: a10, webauthn: { rpId: b10, rpOrigins: c10 }, signal: d10 }, { request: e10 });
            if (!f10) return { data: null, error: g2 };
            let { webauthn: h2 } = f10;
            return this._verify({ factorId: a10, challengeId: f10.challengeId, webauthn: { type: h2.type, rpId: b10, rpOrigins: c10, credential_response: h2.credential_response } });
          } catch (a11) {
            if (dA(a11)) return { data: null, error: a11 };
            return { data: null, error: new dC("Unexpected error in authenticate", a11) };
          }
        }
        async _register({ friendlyName: a10, webauthn: { rpId: b10 = "undefined" != typeof window ? window.location.hostname : void 0, rpOrigins: c10 = "undefined" != typeof window ? [window.location.origin] : void 0, signal: d10 } = {} }, e10) {
          if (!b10) return { data: null, error: new dz("rpId is required for WebAuthn registration") };
          try {
            if (!eC()) return { data: null, error: new dC("Browser does not support WebAuthn", null) };
            let { data: f10, error: g2 } = await this._enroll({ friendlyName: a10 });
            if (!f10) return await this.client.mfa.listFactors().then((b11) => {
              var c11;
              return null == (c11 = b11.data) ? void 0 : c11.all.find((b12) => "webauthn" === b12.factor_type && b12.friendly_name === a10 && "unverified" !== b12.status);
            }).then((a11) => a11 ? this.client.mfa.unenroll({ factorId: null == a11 ? void 0 : a11.id }) : void 0), { data: null, error: g2 };
            let { data: h2, error: i2 } = await this._challenge({ factorId: f10.id, friendlyName: f10.friendly_name, webauthn: { rpId: b10, rpOrigins: c10 }, signal: d10 }, { create: e10 });
            if (!h2) return { data: null, error: i2 };
            return this._verify({ factorId: f10.id, challengeId: h2.challengeId, webauthn: { rpId: b10, rpOrigins: c10, type: h2.webauthn.type, credential_response: h2.webauthn.credential_response } });
          } catch (a11) {
            if (dA(a11)) return { data: null, error: a11 };
            return { data: null, error: new dC("Unexpected error in register", a11) };
          }
        }
      }
      if ("object" != typeof globalThis) try {
        Object.defineProperty(Object.prototype, "__magic__", { get: function() {
          return this;
        }, configurable: true }), __magic__.globalThis = __magic__, delete Object.prototype.__magic__;
      } catch (a10) {
        "undefined" != typeof self && (self.globalThis = self);
      }
      let eJ = { url: "http://localhost:9999", storageKey: "supabase.auth.token", autoRefreshToken: true, persistSession: true, detectSessionInUrl: true, headers: dv, flowType: "implicit", debug: false, hasCustomAuthorizationHeader: false, throwOnError: false, lockAcquireTimeout: 5e3, skipAutoInitialize: false };
      async function eK(a10, b10, c10) {
        return await c10();
      }
      let eL = {};
      class eM {
        get jwks() {
          var a10, b10;
          return null != (b10 = null == (a10 = eL[this.storageKey]) ? void 0 : a10.jwks) ? b10 : { keys: [] };
        }
        set jwks(a10) {
          eL[this.storageKey] = Object.assign(Object.assign({}, eL[this.storageKey]), { jwks: a10 });
        }
        get jwks_cached_at() {
          var a10, b10;
          return null != (b10 = null == (a10 = eL[this.storageKey]) ? void 0 : a10.cachedAt) ? b10 : Number.MIN_SAFE_INTEGER;
        }
        set jwks_cached_at(a10) {
          eL[this.storageKey] = Object.assign(Object.assign({}, eL[this.storageKey]), { cachedAt: a10 });
        }
        constructor(a10) {
          var b10, c10, d10;
          this.userStorage = null, this.memoryStorage = null, this.stateChangeEmitters = /* @__PURE__ */ new Map(), this.autoRefreshTicker = null, this.autoRefreshTickTimeout = null, this.visibilityChangedCallback = null, this.refreshingDeferred = null, this.initializePromise = null, this.detectSessionInUrl = true, this.hasCustomAuthorizationHeader = false, this.suppressGetSessionWarning = false, this.lockAcquired = false, this.pendingInLock = [], this.broadcastChannel = null, this.logger = console.log;
          let e10 = Object.assign(Object.assign({}, eJ), a10);
          if (this.storageKey = e10.storageKey, this.instanceID = null != (b10 = eM.nextInstanceID[this.storageKey]) ? b10 : 0, eM.nextInstanceID[this.storageKey] = this.instanceID + 1, this.logDebugMessages = !!e10.debug, "function" == typeof e10.debug && (this.logger = e10.debug), this.instanceID > 0 && dX()) {
            let a11 = `${this._logPrefix()} Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.`;
            console.warn(a11), this.logDebugMessages && console.trace(a11);
          }
          if (this.persistSession = e10.persistSession, this.autoRefreshToken = e10.autoRefreshToken, this.admin = new eq({ url: e10.url, headers: e10.headers, fetch: e10.fetch }), this.url = e10.url, this.headers = e10.headers, this.fetch = d$(e10.fetch), this.lock = e10.lock || eK, this.detectSessionInUrl = e10.detectSessionInUrl, this.flowType = e10.flowType, this.hasCustomAuthorizationHeader = e10.hasCustomAuthorizationHeader, this.throwOnError = e10.throwOnError, this.lockAcquireTimeout = e10.lockAcquireTimeout, e10.lock ? this.lock = e10.lock : this.persistSession && dX() && (null == (c10 = null == globalThis ? void 0 : globalThis.navigator) ? void 0 : c10.locks) ? this.lock = ev : this.lock = eK, this.jwks || (this.jwks = { keys: [] }, this.jwks_cached_at = Number.MIN_SAFE_INTEGER), this.mfa = { verify: this._verify.bind(this), enroll: this._enroll.bind(this), unenroll: this._unenroll.bind(this), challenge: this._challenge.bind(this), listFactors: this._listFactors.bind(this), challengeAndVerify: this._challengeAndVerify.bind(this), getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this), webauthn: new eI(this) }, this.oauth = { getAuthorizationDetails: this._getAuthorizationDetails.bind(this), approveAuthorization: this._approveAuthorization.bind(this), denyAuthorization: this._denyAuthorization.bind(this), listGrants: this._listOAuthGrants.bind(this), revokeGrant: this._revokeOAuthGrant.bind(this) }, this.persistSession ? (e10.storage ? this.storage = e10.storage : dZ() ? this.storage = globalThis.localStorage : (this.memoryStorage = {}, this.storage = er(this.memoryStorage)), e10.userStorage && (this.userStorage = e10.userStorage)) : (this.memoryStorage = {}, this.storage = er(this.memoryStorage)), dX() && globalThis.BroadcastChannel && this.persistSession && this.storageKey) {
            try {
              this.broadcastChannel = new globalThis.BroadcastChannel(this.storageKey);
            } catch (a11) {
              console.error("Failed to create a new BroadcastChannel, multi-tab state changes will not be available", a11);
            }
            null == (d10 = this.broadcastChannel) || d10.addEventListener("message", async (a11) => {
              this._debug("received broadcast notification from other tab or client", a11);
              try {
                await this._notifyAllSubscribers(a11.data.event, a11.data.session, false);
              } catch (a12) {
                this._debug("#broadcastChannel", "error", a12);
              }
            });
          }
          e10.skipAutoInitialize || this.initialize().catch((a11) => {
            this._debug("#initialize()", "error", a11);
          });
        }
        isThrowOnErrorEnabled() {
          return this.throwOnError;
        }
        _returnResult(a10) {
          if (this.throwOnError && a10 && a10.error) throw a10.error;
          return a10;
        }
        _logPrefix() {
          return `GoTrueClient@${this.storageKey}:${this.instanceID} (${du}) ${(/* @__PURE__ */ new Date()).toISOString()}`;
        }
        _debug(...a10) {
          return this.logDebugMessages && this.logger(this._logPrefix(), ...a10), this;
        }
        async initialize() {
          return this.initializePromise || (this.initializePromise = (async () => await this._acquireLock(this.lockAcquireTimeout, async () => await this._initialize()))()), await this.initializePromise;
        }
        async _initialize() {
          var a10;
          try {
            let b10 = {}, c10 = "none";
            if (dX() && (b10 = function(a11) {
              let b11 = {}, c11 = new URL(a11);
              if (c11.hash && "#" === c11.hash[0]) try {
                new URLSearchParams(c11.hash.substring(1)).forEach((a12, c12) => {
                  b11[c12] = a12;
                });
              } catch (a12) {
              }
              return c11.searchParams.forEach((a12, c12) => {
                b11[c12] = a12;
              }), b11;
            }(window.location.href), this._isImplicitGrantCallback(b10) ? c10 = "implicit" : await this._isPKCECallback(b10) && (c10 = "pkce")), dX() && this.detectSessionInUrl && "none" !== c10) {
              let { data: d10, error: e10 } = await this._getSessionFromURL(b10, c10);
              if (e10) {
                (this._debug("#_initialize()", "error detecting session from URL", e10), dA(e10) && "AuthImplicitGrantRedirectError" === e10.name) && (null == (a10 = e10.details) || a10.code);
                return { error: e10 };
              }
              let { session: f10, redirectType: g2 } = d10;
              return this._debug("#_initialize()", "detected session in URL", f10, "redirect type", g2), await this._saveSession(f10), setTimeout(async () => {
                "recovery" === g2 ? await this._notifyAllSubscribers("PASSWORD_RECOVERY", f10) : await this._notifyAllSubscribers("SIGNED_IN", f10);
              }, 0), { error: null };
            }
            return await this._recoverAndRefresh(), { error: null };
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ error: a11 });
            return this._returnResult({ error: new dC("Unexpected error during initialization", a11) });
          } finally {
            await this._handleVisibilityChange(), this._debug("#_initialize()", "end");
          }
        }
        async signInAnonymously(a10) {
          var b10, c10, d10;
          try {
            let { data: e10, error: f10 } = await eh(this.fetch, "POST", `${this.url}/signup`, { headers: this.headers, body: { data: null != (c10 = null == (b10 = null == a10 ? void 0 : a10.options) ? void 0 : b10.data) ? c10 : {}, gotrue_meta_security: { captcha_token: null == (d10 = null == a10 ? void 0 : a10.options) ? void 0 : d10.captchaToken } }, xform: ej });
            if (f10 || !e10) return this._returnResult({ data: { user: null, session: null }, error: f10 });
            let g2 = e10.session, h2 = e10.user;
            return e10.session && (await this._saveSession(e10.session), await this._notifyAllSubscribers("SIGNED_IN", g2)), this._returnResult({ data: { user: h2, session: g2 }, error: null });
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ data: { user: null, session: null }, error: a11 });
            throw a11;
          }
        }
        async signUp(a10) {
          var b10, c10, d10;
          try {
            let e10;
            if ("email" in a10) {
              let { email: c11, password: d11, options: f11 } = a10, g3 = null, h3 = null;
              "pkce" === this.flowType && ([g3, h3] = await d8(this.storage, this.storageKey)), e10 = await eh(this.fetch, "POST", `${this.url}/signup`, { headers: this.headers, redirectTo: null == f11 ? void 0 : f11.emailRedirectTo, body: { email: c11, password: d11, data: null != (b10 = null == f11 ? void 0 : f11.data) ? b10 : {}, gotrue_meta_security: { captcha_token: null == f11 ? void 0 : f11.captchaToken }, code_challenge: g3, code_challenge_method: h3 }, xform: ej });
            } else if ("phone" in a10) {
              let { phone: b11, password: f11, options: g3 } = a10;
              e10 = await eh(this.fetch, "POST", `${this.url}/signup`, { headers: this.headers, body: { phone: b11, password: f11, data: null != (c10 = null == g3 ? void 0 : g3.data) ? c10 : {}, channel: null != (d10 = null == g3 ? void 0 : g3.channel) ? d10 : "sms", gotrue_meta_security: { captcha_token: null == g3 ? void 0 : g3.captchaToken } }, xform: ej });
            } else throw new dH("You must provide either an email or phone number and a password");
            let { data: f10, error: g2 } = e10;
            if (g2 || !f10) return await d1(this.storage, `${this.storageKey}-code-verifier`), this._returnResult({ data: { user: null, session: null }, error: g2 });
            let h2 = f10.session, i2 = f10.user;
            return f10.session && (await this._saveSession(f10.session), await this._notifyAllSubscribers("SIGNED_IN", h2)), this._returnResult({ data: { user: i2, session: h2 }, error: null });
          } catch (a11) {
            if (await d1(this.storage, `${this.storageKey}-code-verifier`), dA(a11)) return this._returnResult({ data: { user: null, session: null }, error: a11 });
            throw a11;
          }
        }
        async signInWithPassword(a10) {
          try {
            let b10;
            if ("email" in a10) {
              let { email: c11, password: d11, options: e10 } = a10;
              b10 = await eh(this.fetch, "POST", `${this.url}/token?grant_type=password`, { headers: this.headers, body: { email: c11, password: d11, gotrue_meta_security: { captcha_token: null == e10 ? void 0 : e10.captchaToken } }, xform: ek });
            } else if ("phone" in a10) {
              let { phone: c11, password: d11, options: e10 } = a10;
              b10 = await eh(this.fetch, "POST", `${this.url}/token?grant_type=password`, { headers: this.headers, body: { phone: c11, password: d11, gotrue_meta_security: { captcha_token: null == e10 ? void 0 : e10.captchaToken } }, xform: ek });
            } else throw new dH("You must provide either an email or phone number and a password");
            let { data: c10, error: d10 } = b10;
            if (d10) return this._returnResult({ data: { user: null, session: null }, error: d10 });
            if (!c10 || !c10.session || !c10.user) {
              let a11 = new dG();
              return this._returnResult({ data: { user: null, session: null }, error: a11 });
            }
            return c10.session && (await this._saveSession(c10.session), await this._notifyAllSubscribers("SIGNED_IN", c10.session)), this._returnResult({ data: Object.assign({ user: c10.user, session: c10.session }, c10.weak_password ? { weakPassword: c10.weak_password } : null), error: d10 });
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ data: { user: null, session: null }, error: a11 });
            throw a11;
          }
        }
        async signInWithOAuth(a10) {
          var b10, c10, d10, e10;
          return await this._handleProviderSignIn(a10.provider, { redirectTo: null == (b10 = a10.options) ? void 0 : b10.redirectTo, scopes: null == (c10 = a10.options) ? void 0 : c10.scopes, queryParams: null == (d10 = a10.options) ? void 0 : d10.queryParams, skipBrowserRedirect: null == (e10 = a10.options) ? void 0 : e10.skipBrowserRedirect });
        }
        async exchangeCodeForSession(a10) {
          return await this.initializePromise, this._acquireLock(this.lockAcquireTimeout, async () => this._exchangeCodeForSession(a10));
        }
        async signInWithWeb3(a10) {
          let { chain: b10 } = a10;
          switch (b10) {
            case "ethereum":
              return await this.signInWithEthereum(a10);
            case "solana":
              return await this.signInWithSolana(a10);
            default:
              throw Error(`@supabase/auth-js: Unsupported chain "${b10}"`);
          }
        }
        async signInWithEthereum(a10) {
          var b10, c10, d10, e10, f10, g2, h2, i2, j2, k2, l2, m2;
          let n2, o2;
          if ("message" in a10) n2 = a10.message, o2 = a10.signature;
          else {
            let k3, { chain: l3, wallet: p2, statement: q2, options: r2 } = a10;
            if (dX()) if ("object" == typeof p2) k3 = p2;
            else {
              let a11 = window;
              if ("ethereum" in a11 && "object" == typeof a11.ethereum && "request" in a11.ethereum && "function" == typeof a11.ethereum.request) k3 = a11.ethereum;
              else throw Error("@supabase/auth-js: No compatible Ethereum wallet interface on the window object (window.ethereum) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'ethereum', wallet: resolvedUserWallet }) instead.");
            }
            else {
              if ("object" != typeof p2 || !(null == r2 ? void 0 : r2.url)) throw Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
              k3 = p2;
            }
            let s2 = new URL(null != (b10 = null == r2 ? void 0 : r2.url) ? b10 : window.location.href), t2 = await k3.request({ method: "eth_requestAccounts" }).then((a11) => a11).catch(() => {
              throw Error("@supabase/auth-js: Wallet method eth_requestAccounts is missing or invalid");
            });
            if (!t2 || 0 === t2.length) throw Error("@supabase/auth-js: No accounts available. Please ensure the wallet is connected.");
            let u2 = ew(t2[0]), v2 = null == (c10 = null == r2 ? void 0 : r2.signInWithEthereum) ? void 0 : c10.chainId;
            v2 || (v2 = parseInt(await k3.request({ method: "eth_chainId" }), 16)), n2 = function(a11) {
              var b11;
              let { chainId: c11, domain: d11, expirationTime: e11, issuedAt: f11 = /* @__PURE__ */ new Date(), nonce: g3, notBefore: h3, requestId: i3, resources: j3, scheme: k4, uri: l4, version: m3 } = a11;
              if (!Number.isInteger(c11)) throw Error(`@supabase/auth-js: Invalid SIWE message field "chainId". Chain ID must be a EIP-155 chain ID. Provided value: ${c11}`);
              if (!d11) throw Error('@supabase/auth-js: Invalid SIWE message field "domain". Domain must be provided.');
              if (g3 && g3.length < 8) throw Error(`@supabase/auth-js: Invalid SIWE message field "nonce". Nonce must be at least 8 characters. Provided value: ${g3}`);
              if (!l4) throw Error('@supabase/auth-js: Invalid SIWE message field "uri". URI must be provided.');
              if ("1" !== m3) throw Error(`@supabase/auth-js: Invalid SIWE message field "version". Version must be '1'. Provided value: ${m3}`);
              if (null == (b11 = a11.statement) ? void 0 : b11.includes("\n")) throw Error(`@supabase/auth-js: Invalid SIWE message field "statement". Statement must not include '\\n'. Provided value: ${a11.statement}`);
              let n3 = ew(a11.address), o3 = k4 ? `${k4}://${d11}` : d11, p3 = a11.statement ? `${a11.statement}
` : "", q3 = `${o3} wants you to sign in with your Ethereum account:
${n3}

${p3}`, r3 = `URI: ${l4}
Version: ${m3}
Chain ID: ${c11}${g3 ? `
Nonce: ${g3}` : ""}
Issued At: ${f11.toISOString()}`;
              if (e11 && (r3 += `
Expiration Time: ${e11.toISOString()}`), h3 && (r3 += `
Not Before: ${h3.toISOString()}`), i3 && (r3 += `
Request ID: ${i3}`), j3) {
                let a12 = "\nResources:";
                for (let b12 of j3) {
                  if (!b12 || "string" != typeof b12) throw Error(`@supabase/auth-js: Invalid SIWE message field "resources". Every resource must be a valid string. Provided value: ${b12}`);
                  a12 += `
- ${b12}`;
                }
                r3 += a12;
              }
              return `${q3}
${r3}`;
            }({ domain: s2.host, address: u2, statement: q2, uri: s2.href, version: "1", chainId: v2, nonce: null == (d10 = null == r2 ? void 0 : r2.signInWithEthereum) ? void 0 : d10.nonce, issuedAt: null != (f10 = null == (e10 = null == r2 ? void 0 : r2.signInWithEthereum) ? void 0 : e10.issuedAt) ? f10 : /* @__PURE__ */ new Date(), expirationTime: null == (g2 = null == r2 ? void 0 : r2.signInWithEthereum) ? void 0 : g2.expirationTime, notBefore: null == (h2 = null == r2 ? void 0 : r2.signInWithEthereum) ? void 0 : h2.notBefore, requestId: null == (i2 = null == r2 ? void 0 : r2.signInWithEthereum) ? void 0 : i2.requestId, resources: null == (j2 = null == r2 ? void 0 : r2.signInWithEthereum) ? void 0 : j2.resources }), o2 = await k3.request({ method: "personal_sign", params: [(m2 = n2, "0x" + Array.from(new TextEncoder().encode(m2), (a11) => a11.toString(16).padStart(2, "0")).join("")), u2] });
          }
          try {
            let { data: b11, error: c11 } = await eh(this.fetch, "POST", `${this.url}/token?grant_type=web3`, { headers: this.headers, body: Object.assign({ chain: "ethereum", message: n2, signature: o2 }, (null == (k2 = a10.options) ? void 0 : k2.captchaToken) ? { gotrue_meta_security: { captcha_token: null == (l2 = a10.options) ? void 0 : l2.captchaToken } } : null), xform: ej });
            if (c11) throw c11;
            if (!b11 || !b11.session || !b11.user) {
              let a11 = new dG();
              return this._returnResult({ data: { user: null, session: null }, error: a11 });
            }
            return b11.session && (await this._saveSession(b11.session), await this._notifyAllSubscribers("SIGNED_IN", b11.session)), this._returnResult({ data: Object.assign({}, b11), error: c11 });
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ data: { user: null, session: null }, error: a11 });
            throw a11;
          }
        }
        async signInWithSolana(a10) {
          var b10, c10, d10, e10, f10, g2, h2, i2, j2, k2, l2, m2;
          let n2, o2;
          if ("message" in a10) n2 = a10.message, o2 = a10.signature;
          else {
            let l3, { chain: m3, wallet: p2, statement: q2, options: r2 } = a10;
            if (dX()) if ("object" == typeof p2) l3 = p2;
            else {
              let a11 = window;
              if ("solana" in a11 && "object" == typeof a11.solana && ("signIn" in a11.solana && "function" == typeof a11.solana.signIn || "signMessage" in a11.solana && "function" == typeof a11.solana.signMessage)) l3 = a11.solana;
              else throw Error("@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.");
            }
            else {
              if ("object" != typeof p2 || !(null == r2 ? void 0 : r2.url)) throw Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
              l3 = p2;
            }
            let s2 = new URL(null != (b10 = null == r2 ? void 0 : r2.url) ? b10 : window.location.href);
            if ("signIn" in l3 && l3.signIn) {
              let a11, b11 = await l3.signIn(Object.assign(Object.assign(Object.assign({ issuedAt: (/* @__PURE__ */ new Date()).toISOString() }, null == r2 ? void 0 : r2.signInWithSolana), { version: "1", domain: s2.host, uri: s2.href }), q2 ? { statement: q2 } : null));
              if (Array.isArray(b11) && b11[0] && "object" == typeof b11[0]) a11 = b11[0];
              else if (b11 && "object" == typeof b11 && "signedMessage" in b11 && "signature" in b11) a11 = b11;
              else throw Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");
              if ("signedMessage" in a11 && "signature" in a11 && ("string" == typeof a11.signedMessage || a11.signedMessage instanceof Uint8Array) && a11.signature instanceof Uint8Array) n2 = "string" == typeof a11.signedMessage ? a11.signedMessage : new TextDecoder().decode(a11.signedMessage), o2 = a11.signature;
              else throw Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields");
            } else {
              if (!("signMessage" in l3) || "function" != typeof l3.signMessage || !("publicKey" in l3) || "object" != typeof l3 || !l3.publicKey || !("toBase58" in l3.publicKey) || "function" != typeof l3.publicKey.toBase58) throw Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");
              n2 = [`${s2.host} wants you to sign in with your Solana account:`, l3.publicKey.toBase58(), ...q2 ? ["", q2, ""] : [""], "Version: 1", `URI: ${s2.href}`, `Issued At: ${null != (d10 = null == (c10 = null == r2 ? void 0 : r2.signInWithSolana) ? void 0 : c10.issuedAt) ? d10 : (/* @__PURE__ */ new Date()).toISOString()}`, ...(null == (e10 = null == r2 ? void 0 : r2.signInWithSolana) ? void 0 : e10.notBefore) ? [`Not Before: ${r2.signInWithSolana.notBefore}`] : [], ...(null == (f10 = null == r2 ? void 0 : r2.signInWithSolana) ? void 0 : f10.expirationTime) ? [`Expiration Time: ${r2.signInWithSolana.expirationTime}`] : [], ...(null == (g2 = null == r2 ? void 0 : r2.signInWithSolana) ? void 0 : g2.chainId) ? [`Chain ID: ${r2.signInWithSolana.chainId}`] : [], ...(null == (h2 = null == r2 ? void 0 : r2.signInWithSolana) ? void 0 : h2.nonce) ? [`Nonce: ${r2.signInWithSolana.nonce}`] : [], ...(null == (i2 = null == r2 ? void 0 : r2.signInWithSolana) ? void 0 : i2.requestId) ? [`Request ID: ${r2.signInWithSolana.requestId}`] : [], ...(null == (k2 = null == (j2 = null == r2 ? void 0 : r2.signInWithSolana) ? void 0 : j2.resources) ? void 0 : k2.length) ? ["Resources", ...r2.signInWithSolana.resources.map((a12) => `- ${a12}`)] : []].join("\n");
              let a11 = await l3.signMessage(new TextEncoder().encode(n2), "utf8");
              if (!a11 || !(a11 instanceof Uint8Array)) throw Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");
              o2 = a11;
            }
          }
          try {
            let { data: b11, error: c11 } = await eh(this.fetch, "POST", `${this.url}/token?grant_type=web3`, { headers: this.headers, body: Object.assign({ chain: "solana", message: n2, signature: dW(o2) }, (null == (l2 = a10.options) ? void 0 : l2.captchaToken) ? { gotrue_meta_security: { captcha_token: null == (m2 = a10.options) ? void 0 : m2.captchaToken } } : null), xform: ej });
            if (c11) throw c11;
            if (!b11 || !b11.session || !b11.user) {
              let a11 = new dG();
              return this._returnResult({ data: { user: null, session: null }, error: a11 });
            }
            return b11.session && (await this._saveSession(b11.session), await this._notifyAllSubscribers("SIGNED_IN", b11.session)), this._returnResult({ data: Object.assign({}, b11), error: c11 });
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ data: { user: null, session: null }, error: a11 });
            throw a11;
          }
        }
        async _exchangeCodeForSession(a10) {
          let b10 = await d0(this.storage, `${this.storageKey}-code-verifier`), [c10, d10] = (null != b10 ? b10 : "").split("/");
          try {
            if (!c10 && "pkce" === this.flowType) throw new dK();
            let { data: b11, error: e10 } = await eh(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, { headers: this.headers, body: { auth_code: a10, code_verifier: c10 }, xform: ej });
            if (await d1(this.storage, `${this.storageKey}-code-verifier`), e10) throw e10;
            if (!b11 || !b11.session || !b11.user) {
              let a11 = new dG();
              return this._returnResult({ data: { user: null, session: null, redirectType: null }, error: a11 });
            }
            return b11.session && (await this._saveSession(b11.session), await this._notifyAllSubscribers("SIGNED_IN", b11.session)), this._returnResult({ data: Object.assign(Object.assign({}, b11), { redirectType: null != d10 ? d10 : null }), error: e10 });
          } catch (a11) {
            if (await d1(this.storage, `${this.storageKey}-code-verifier`), dA(a11)) return this._returnResult({ data: { user: null, session: null, redirectType: null }, error: a11 });
            throw a11;
          }
        }
        async signInWithIdToken(a10) {
          try {
            let { options: b10, provider: c10, token: d10, access_token: e10, nonce: f10 } = a10, { data: g2, error: h2 } = await eh(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, { headers: this.headers, body: { provider: c10, id_token: d10, access_token: e10, nonce: f10, gotrue_meta_security: { captcha_token: null == b10 ? void 0 : b10.captchaToken } }, xform: ej });
            if (h2) return this._returnResult({ data: { user: null, session: null }, error: h2 });
            if (!g2 || !g2.session || !g2.user) {
              let a11 = new dG();
              return this._returnResult({ data: { user: null, session: null }, error: a11 });
            }
            return g2.session && (await this._saveSession(g2.session), await this._notifyAllSubscribers("SIGNED_IN", g2.session)), this._returnResult({ data: g2, error: h2 });
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ data: { user: null, session: null }, error: a11 });
            throw a11;
          }
        }
        async signInWithOtp(a10) {
          var b10, c10, d10, e10, f10;
          try {
            if ("email" in a10) {
              let { email: d11, options: e11 } = a10, f11 = null, g2 = null;
              "pkce" === this.flowType && ([f11, g2] = await d8(this.storage, this.storageKey));
              let { error: h2 } = await eh(this.fetch, "POST", `${this.url}/otp`, { headers: this.headers, body: { email: d11, data: null != (b10 = null == e11 ? void 0 : e11.data) ? b10 : {}, create_user: null == (c10 = null == e11 ? void 0 : e11.shouldCreateUser) || c10, gotrue_meta_security: { captcha_token: null == e11 ? void 0 : e11.captchaToken }, code_challenge: f11, code_challenge_method: g2 }, redirectTo: null == e11 ? void 0 : e11.emailRedirectTo });
              return this._returnResult({ data: { user: null, session: null }, error: h2 });
            }
            if ("phone" in a10) {
              let { phone: b11, options: c11 } = a10, { data: g2, error: h2 } = await eh(this.fetch, "POST", `${this.url}/otp`, { headers: this.headers, body: { phone: b11, data: null != (d10 = null == c11 ? void 0 : c11.data) ? d10 : {}, create_user: null == (e10 = null == c11 ? void 0 : c11.shouldCreateUser) || e10, gotrue_meta_security: { captcha_token: null == c11 ? void 0 : c11.captchaToken }, channel: null != (f10 = null == c11 ? void 0 : c11.channel) ? f10 : "sms" } });
              return this._returnResult({ data: { user: null, session: null, messageId: null == g2 ? void 0 : g2.message_id }, error: h2 });
            }
            throw new dH("You must provide either an email or phone number.");
          } catch (a11) {
            if (await d1(this.storage, `${this.storageKey}-code-verifier`), dA(a11)) return this._returnResult({ data: { user: null, session: null }, error: a11 });
            throw a11;
          }
        }
        async verifyOtp(a10) {
          var b10, c10;
          try {
            let d10, e10;
            "options" in a10 && (d10 = null == (b10 = a10.options) ? void 0 : b10.redirectTo, e10 = null == (c10 = a10.options) ? void 0 : c10.captchaToken);
            let { data: f10, error: g2 } = await eh(this.fetch, "POST", `${this.url}/verify`, { headers: this.headers, body: Object.assign(Object.assign({}, a10), { gotrue_meta_security: { captcha_token: e10 } }), redirectTo: d10, xform: ej });
            if (g2) throw g2;
            if (!f10) throw Error("An error occurred on token verification.");
            let h2 = f10.session, i2 = f10.user;
            return (null == h2 ? void 0 : h2.access_token) && (await this._saveSession(h2), await this._notifyAllSubscribers("recovery" == a10.type ? "PASSWORD_RECOVERY" : "SIGNED_IN", h2)), this._returnResult({ data: { user: i2, session: h2 }, error: null });
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ data: { user: null, session: null }, error: a11 });
            throw a11;
          }
        }
        async signInWithSSO(a10) {
          var b10, c10, d10, e10, f10;
          try {
            let g2 = null, h2 = null;
            "pkce" === this.flowType && ([g2, h2] = await d8(this.storage, this.storageKey));
            let i2 = await eh(this.fetch, "POST", `${this.url}/sso`, { body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in a10 ? { provider_id: a10.providerId } : null), "domain" in a10 ? { domain: a10.domain } : null), { redirect_to: null != (c10 = null == (b10 = a10.options) ? void 0 : b10.redirectTo) ? c10 : void 0 }), (null == (d10 = null == a10 ? void 0 : a10.options) ? void 0 : d10.captchaToken) ? { gotrue_meta_security: { captcha_token: a10.options.captchaToken } } : null), { skip_http_redirect: true, code_challenge: g2, code_challenge_method: h2 }), headers: this.headers, xform: em });
            return (null == (e10 = i2.data) ? void 0 : e10.url) && dX() && !(null == (f10 = a10.options) ? void 0 : f10.skipBrowserRedirect) && window.location.assign(i2.data.url), this._returnResult(i2);
          } catch (a11) {
            if (await d1(this.storage, `${this.storageKey}-code-verifier`), dA(a11)) return this._returnResult({ data: null, error: a11 });
            throw a11;
          }
        }
        async reauthenticate() {
          return await this.initializePromise, await this._acquireLock(this.lockAcquireTimeout, async () => await this._reauthenticate());
        }
        async _reauthenticate() {
          try {
            return await this._useSession(async (a10) => {
              let { data: { session: b10 }, error: c10 } = a10;
              if (c10) throw c10;
              if (!b10) throw new dE();
              let { error: d10 } = await eh(this.fetch, "GET", `${this.url}/reauthenticate`, { headers: this.headers, jwt: b10.access_token });
              return this._returnResult({ data: { user: null, session: null }, error: d10 });
            });
          } catch (a10) {
            if (dA(a10)) return this._returnResult({ data: { user: null, session: null }, error: a10 });
            throw a10;
          }
        }
        async resend(a10) {
          try {
            let b10 = `${this.url}/resend`;
            if ("email" in a10) {
              let { email: c10, type: d10, options: e10 } = a10, { error: f10 } = await eh(this.fetch, "POST", b10, { headers: this.headers, body: { email: c10, type: d10, gotrue_meta_security: { captcha_token: null == e10 ? void 0 : e10.captchaToken } }, redirectTo: null == e10 ? void 0 : e10.emailRedirectTo });
              return this._returnResult({ data: { user: null, session: null }, error: f10 });
            }
            if ("phone" in a10) {
              let { phone: c10, type: d10, options: e10 } = a10, { data: f10, error: g2 } = await eh(this.fetch, "POST", b10, { headers: this.headers, body: { phone: c10, type: d10, gotrue_meta_security: { captcha_token: null == e10 ? void 0 : e10.captchaToken } } });
              return this._returnResult({ data: { user: null, session: null, messageId: null == f10 ? void 0 : f10.message_id }, error: g2 });
            }
            throw new dH("You must provide either an email or phone number and a type");
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ data: { user: null, session: null }, error: a11 });
            throw a11;
          }
        }
        async getSession() {
          return await this.initializePromise, await this._acquireLock(this.lockAcquireTimeout, async () => this._useSession(async (a10) => a10));
        }
        async _acquireLock(a10, b10) {
          this._debug("#_acquireLock", "begin", a10);
          try {
            if (this.lockAcquired) {
              let a11 = this.pendingInLock.length ? this.pendingInLock[this.pendingInLock.length - 1] : Promise.resolve(), c10 = (async () => (await a11, await b10()))();
              return this.pendingInLock.push((async () => {
                try {
                  await c10;
                } catch (a12) {
                }
              })()), c10;
            }
            return await this.lock(`lock:${this.storageKey}`, a10, async () => {
              this._debug("#_acquireLock", "lock acquired for storage key", this.storageKey);
              try {
                this.lockAcquired = true;
                let a11 = b10();
                for (this.pendingInLock.push((async () => {
                  try {
                    await a11;
                  } catch (a12) {
                  }
                })()), await a11; this.pendingInLock.length; ) {
                  let a12 = [...this.pendingInLock];
                  await Promise.all(a12), this.pendingInLock.splice(0, a12.length);
                }
                return await a11;
              } finally {
                this._debug("#_acquireLock", "lock released for storage key", this.storageKey), this.lockAcquired = false;
              }
            });
          } finally {
            this._debug("#_acquireLock", "end");
          }
        }
        async _useSession(a10) {
          this._debug("#_useSession", "begin");
          try {
            let b10 = await this.__loadSession();
            return await a10(b10);
          } finally {
            this._debug("#_useSession", "end");
          }
        }
        async __loadSession() {
          this._debug("#__loadSession()", "begin"), this.lockAcquired || this._debug("#__loadSession()", "used outside of an acquired lock!", Error().stack);
          try {
            let b10 = null, c10 = await d0(this.storage, this.storageKey);
            if (this._debug("#getSession()", "session from storage", c10), null !== c10 && (this._isValidSession(c10) ? b10 = c10 : (this._debug("#getSession()", "session from storage is not valid"), await this._removeSession())), !b10) return { data: { session: null }, error: null };
            let d10 = !!b10.expires_at && 1e3 * b10.expires_at - Date.now() < 9e4;
            if (this._debug("#__loadSession()", `session has${d10 ? "" : " not"} expired`, "expires_at", b10.expires_at), !d10) {
              if (this.userStorage) {
                let a11 = await d0(this.userStorage, this.storageKey + "-user");
                (null == a11 ? void 0 : a11.user) ? b10.user = a11.user : b10.user = ec();
              }
              if (this.storage.isServer && b10.user && !b10.user.__isUserNotAvailableProxy) {
                var a10;
                let c11 = { value: this.suppressGetSessionWarning };
                b10.user = (a10 = b10.user, new Proxy(a10, { get: (a11, b11, d11) => {
                  if ("__isInsecureUserWarningProxy" === b11) return true;
                  if ("symbol" == typeof b11) {
                    let c12 = b11.toString();
                    if ("Symbol(Symbol.toPrimitive)" === c12 || "Symbol(Symbol.toStringTag)" === c12 || "Symbol(util.inspect.custom)" === c12 || "Symbol(nodejs.util.inspect.custom)" === c12) return Reflect.get(a11, b11, d11);
                  }
                  return c11.value || "string" != typeof b11 || (console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server."), c11.value = true), Reflect.get(a11, b11, d11);
                } })), c11.value && (this.suppressGetSessionWarning = true);
              }
              return { data: { session: b10 }, error: null };
            }
            let { data: e10, error: f10 } = await this._callRefreshToken(b10.refresh_token);
            if (f10) return this._returnResult({ data: { session: null }, error: f10 });
            return this._returnResult({ data: { session: e10 }, error: null });
          } finally {
            this._debug("#__loadSession()", "end");
          }
        }
        async getUser(a10) {
          if (a10) return await this._getUser(a10);
          await this.initializePromise;
          let b10 = await this._acquireLock(this.lockAcquireTimeout, async () => await this._getUser());
          return b10.data.user && (this.suppressGetSessionWarning = true), b10;
        }
        async _getUser(a10) {
          try {
            if (a10) return await eh(this.fetch, "GET", `${this.url}/user`, { headers: this.headers, jwt: a10, xform: el });
            return await this._useSession(async (a11) => {
              var b10, c10, d10;
              let { data: e10, error: f10 } = a11;
              if (f10) throw f10;
              return (null == (b10 = e10.session) ? void 0 : b10.access_token) || this.hasCustomAuthorizationHeader ? await eh(this.fetch, "GET", `${this.url}/user`, { headers: this.headers, jwt: null != (d10 = null == (c10 = e10.session) ? void 0 : c10.access_token) ? d10 : void 0, xform: el }) : { data: { user: null }, error: new dE() };
            });
          } catch (a11) {
            if (dA(a11)) return dF(a11) && (await this._removeSession(), await d1(this.storage, `${this.storageKey}-code-verifier`)), this._returnResult({ data: { user: null }, error: a11 });
            throw a11;
          }
        }
        async updateUser(a10, b10 = {}) {
          return await this.initializePromise, await this._acquireLock(this.lockAcquireTimeout, async () => await this._updateUser(a10, b10));
        }
        async _updateUser(a10, b10 = {}) {
          try {
            return await this._useSession(async (c10) => {
              let { data: d10, error: e10 } = c10;
              if (e10) throw e10;
              if (!d10.session) throw new dE();
              let f10 = d10.session, g2 = null, h2 = null;
              "pkce" === this.flowType && null != a10.email && ([g2, h2] = await d8(this.storage, this.storageKey));
              let { data: i2, error: j2 } = await eh(this.fetch, "PUT", `${this.url}/user`, { headers: this.headers, redirectTo: null == b10 ? void 0 : b10.emailRedirectTo, body: Object.assign(Object.assign({}, a10), { code_challenge: g2, code_challenge_method: h2 }), jwt: f10.access_token, xform: el });
              if (j2) throw j2;
              return f10.user = i2.user, await this._saveSession(f10), await this._notifyAllSubscribers("USER_UPDATED", f10), this._returnResult({ data: { user: f10.user }, error: null });
            });
          } catch (a11) {
            if (await d1(this.storage, `${this.storageKey}-code-verifier`), dA(a11)) return this._returnResult({ data: { user: null }, error: a11 });
            throw a11;
          }
        }
        async setSession(a10) {
          return await this.initializePromise, await this._acquireLock(this.lockAcquireTimeout, async () => await this._setSession(a10));
        }
        async _setSession(a10) {
          try {
            if (!a10.access_token || !a10.refresh_token) throw new dE();
            let b10 = Date.now() / 1e3, c10 = b10, d10 = true, e10 = null, { payload: f10 } = d3(a10.access_token);
            if (f10.exp && (d10 = (c10 = f10.exp) <= b10), d10) {
              let { data: b11, error: c11 } = await this._callRefreshToken(a10.refresh_token);
              if (c11) return this._returnResult({ data: { user: null, session: null }, error: c11 });
              if (!b11) return { data: { user: null, session: null }, error: null };
              e10 = b11;
            } else {
              let { data: d11, error: f11 } = await this._getUser(a10.access_token);
              if (f11) return this._returnResult({ data: { user: null, session: null }, error: f11 });
              e10 = { access_token: a10.access_token, refresh_token: a10.refresh_token, user: d11.user, token_type: "bearer", expires_in: c10 - b10, expires_at: c10 }, await this._saveSession(e10), await this._notifyAllSubscribers("SIGNED_IN", e10);
            }
            return this._returnResult({ data: { user: e10.user, session: e10 }, error: null });
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ data: { session: null, user: null }, error: a11 });
            throw a11;
          }
        }
        async refreshSession(a10) {
          return await this.initializePromise, await this._acquireLock(this.lockAcquireTimeout, async () => await this._refreshSession(a10));
        }
        async _refreshSession(a10) {
          try {
            return await this._useSession(async (b10) => {
              var c10;
              if (!a10) {
                let { data: d11, error: e11 } = b10;
                if (e11) throw e11;
                a10 = null != (c10 = d11.session) ? c10 : void 0;
              }
              if (!(null == a10 ? void 0 : a10.refresh_token)) throw new dE();
              let { data: d10, error: e10 } = await this._callRefreshToken(a10.refresh_token);
              return e10 ? this._returnResult({ data: { user: null, session: null }, error: e10 }) : d10 ? this._returnResult({ data: { user: d10.user, session: d10 }, error: null }) : this._returnResult({ data: { user: null, session: null }, error: null });
            });
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ data: { user: null, session: null }, error: a11 });
            throw a11;
          }
        }
        async _getSessionFromURL(a10, b10) {
          try {
            if (!dX()) throw new dI("No browser detected.");
            if (a10.error || a10.error_description || a10.error_code) throw new dI(a10.error_description || "Error in URL with unspecified error_description", { error: a10.error || "unspecified_error", code: a10.error_code || "unspecified_code" });
            switch (b10) {
              case "implicit":
                if ("pkce" === this.flowType) throw new dJ("Not a valid PKCE flow url.");
                break;
              case "pkce":
                if ("implicit" === this.flowType) throw new dI("Not a valid implicit grant flow url.");
            }
            if ("pkce" === b10) {
              if (this._debug("#_initialize()", "begin", "is PKCE flow", true), !a10.code) throw new dJ("No code detected.");
              let { data: b11, error: c11 } = await this._exchangeCodeForSession(a10.code);
              if (c11) throw c11;
              let d11 = new URL(window.location.href);
              return d11.searchParams.delete("code"), window.history.replaceState(window.history.state, "", d11.toString()), { data: { session: b11.session, redirectType: null }, error: null };
            }
            let { provider_token: c10, provider_refresh_token: d10, access_token: e10, refresh_token: f10, expires_in: g2, expires_at: h2, token_type: i2 } = a10;
            if (!e10 || !g2 || !f10 || !i2) throw new dI("No session defined in URL");
            let j2 = Math.round(Date.now() / 1e3), k2 = parseInt(g2), l2 = j2 + k2;
            h2 && (l2 = parseInt(h2));
            let m2 = l2 - j2;
            1e3 * m2 <= 3e4 && console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${m2}s, should have been closer to ${k2}s`);
            let n2 = l2 - k2;
            j2 - n2 >= 120 ? console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale", n2, l2, j2) : j2 - n2 < 0 && console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew", n2, l2, j2);
            let { data: o2, error: p2 } = await this._getUser(e10);
            if (p2) throw p2;
            let q2 = { provider_token: c10, provider_refresh_token: d10, access_token: e10, expires_in: k2, expires_at: l2, refresh_token: f10, token_type: i2, user: o2.user };
            return window.location.hash = "", this._debug("#_getSessionFromURL()", "clearing window.location.hash"), this._returnResult({ data: { session: q2, redirectType: a10.type }, error: null });
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ data: { session: null, redirectType: null }, error: a11 });
            throw a11;
          }
        }
        _isImplicitGrantCallback(a10) {
          return "function" == typeof this.detectSessionInUrl ? this.detectSessionInUrl(new URL(window.location.href), a10) : !!(a10.access_token || a10.error_description);
        }
        async _isPKCECallback(a10) {
          let b10 = await d0(this.storage, `${this.storageKey}-code-verifier`);
          return !!(a10.code && b10);
        }
        async signOut(a10 = { scope: "global" }) {
          return await this.initializePromise, await this._acquireLock(this.lockAcquireTimeout, async () => await this._signOut(a10));
        }
        async _signOut({ scope: a10 } = { scope: "global" }) {
          return await this._useSession(async (b10) => {
            var c10;
            let { data: d10, error: e10 } = b10;
            if (e10 && !dF(e10)) return this._returnResult({ error: e10 });
            let f10 = null == (c10 = d10.session) ? void 0 : c10.access_token;
            if (f10) {
              let { error: b11 } = await this.admin.signOut(f10, a10);
              if (b11 && !(dA(b11) && "AuthApiError" === b11.name && (404 === b11.status || 401 === b11.status || 403 === b11.status) || dF(b11))) return this._returnResult({ error: b11 });
            }
            return "others" !== a10 && (await this._removeSession(), await d1(this.storage, `${this.storageKey}-code-verifier`)), this._returnResult({ error: null });
          });
        }
        onAuthStateChange(a10) {
          let b10 = Symbol("auth-callback"), c10 = { id: b10, callback: a10, unsubscribe: () => {
            this._debug("#unsubscribe()", "state change callback with id removed", b10), this.stateChangeEmitters.delete(b10);
          } };
          return this._debug("#onAuthStateChange()", "registered callback with id", b10), this.stateChangeEmitters.set(b10, c10), (async () => {
            await this.initializePromise, await this._acquireLock(this.lockAcquireTimeout, async () => {
              this._emitInitialSession(b10);
            });
          })(), { data: { subscription: c10 } };
        }
        async _emitInitialSession(a10) {
          return await this._useSession(async (b10) => {
            var c10, d10;
            try {
              let { data: { session: d11 }, error: e10 } = b10;
              if (e10) throw e10;
              await (null == (c10 = this.stateChangeEmitters.get(a10)) ? void 0 : c10.callback("INITIAL_SESSION", d11)), this._debug("INITIAL_SESSION", "callback id", a10, "session", d11);
            } catch (b11) {
              await (null == (d10 = this.stateChangeEmitters.get(a10)) ? void 0 : d10.callback("INITIAL_SESSION", null)), this._debug("INITIAL_SESSION", "callback id", a10, "error", b11), console.error(b11);
            }
          });
        }
        async resetPasswordForEmail(a10, b10 = {}) {
          let c10 = null, d10 = null;
          "pkce" === this.flowType && ([c10, d10] = await d8(this.storage, this.storageKey, true));
          try {
            return await eh(this.fetch, "POST", `${this.url}/recover`, { body: { email: a10, code_challenge: c10, code_challenge_method: d10, gotrue_meta_security: { captcha_token: b10.captchaToken } }, headers: this.headers, redirectTo: b10.redirectTo });
          } catch (a11) {
            if (await d1(this.storage, `${this.storageKey}-code-verifier`), dA(a11)) return this._returnResult({ data: null, error: a11 });
            throw a11;
          }
        }
        async getUserIdentities() {
          var a10;
          try {
            let { data: b10, error: c10 } = await this.getUser();
            if (c10) throw c10;
            return this._returnResult({ data: { identities: null != (a10 = b10.user.identities) ? a10 : [] }, error: null });
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ data: null, error: a11 });
            throw a11;
          }
        }
        async linkIdentity(a10) {
          return "token" in a10 ? this.linkIdentityIdToken(a10) : this.linkIdentityOAuth(a10);
        }
        async linkIdentityOAuth(a10) {
          var b10;
          try {
            let { data: c10, error: d10 } = await this._useSession(async (b11) => {
              var c11, d11, e10, f10, g2;
              let { data: h2, error: i2 } = b11;
              if (i2) throw i2;
              let j2 = await this._getUrlForProvider(`${this.url}/user/identities/authorize`, a10.provider, { redirectTo: null == (c11 = a10.options) ? void 0 : c11.redirectTo, scopes: null == (d11 = a10.options) ? void 0 : d11.scopes, queryParams: null == (e10 = a10.options) ? void 0 : e10.queryParams, skipBrowserRedirect: true });
              return await eh(this.fetch, "GET", j2, { headers: this.headers, jwt: null != (g2 = null == (f10 = h2.session) ? void 0 : f10.access_token) ? g2 : void 0 });
            });
            if (d10) throw d10;
            return !dX() || (null == (b10 = a10.options) ? void 0 : b10.skipBrowserRedirect) || window.location.assign(null == c10 ? void 0 : c10.url), this._returnResult({ data: { provider: a10.provider, url: null == c10 ? void 0 : c10.url }, error: null });
          } catch (b11) {
            if (dA(b11)) return this._returnResult({ data: { provider: a10.provider, url: null }, error: b11 });
            throw b11;
          }
        }
        async linkIdentityIdToken(a10) {
          return await this._useSession(async (b10) => {
            var c10;
            try {
              let { error: d10, data: { session: e10 } } = b10;
              if (d10) throw d10;
              let { options: f10, provider: g2, token: h2, access_token: i2, nonce: j2 } = a10, { data: k2, error: l2 } = await eh(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, { headers: this.headers, jwt: null != (c10 = null == e10 ? void 0 : e10.access_token) ? c10 : void 0, body: { provider: g2, id_token: h2, access_token: i2, nonce: j2, link_identity: true, gotrue_meta_security: { captcha_token: null == f10 ? void 0 : f10.captchaToken } }, xform: ej });
              if (l2) return this._returnResult({ data: { user: null, session: null }, error: l2 });
              if (!k2 || !k2.session || !k2.user) return this._returnResult({ data: { user: null, session: null }, error: new dG() });
              return k2.session && (await this._saveSession(k2.session), await this._notifyAllSubscribers("USER_UPDATED", k2.session)), this._returnResult({ data: k2, error: l2 });
            } catch (a11) {
              if (await d1(this.storage, `${this.storageKey}-code-verifier`), dA(a11)) return this._returnResult({ data: { user: null, session: null }, error: a11 });
              throw a11;
            }
          });
        }
        async unlinkIdentity(a10) {
          try {
            return await this._useSession(async (b10) => {
              var c10, d10;
              let { data: e10, error: f10 } = b10;
              if (f10) throw f10;
              return await eh(this.fetch, "DELETE", `${this.url}/user/identities/${a10.identity_id}`, { headers: this.headers, jwt: null != (d10 = null == (c10 = e10.session) ? void 0 : c10.access_token) ? d10 : void 0 });
            });
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ data: null, error: a11 });
            throw a11;
          }
        }
        async _refreshAccessToken(a10) {
          let b10 = `#_refreshAccessToken(${a10.substring(0, 5)}...)`;
          this._debug(b10, "begin");
          try {
            var c10, d10;
            let e10 = Date.now();
            return await (c10 = async (c11) => (c11 > 0 && await d4(200 * Math.pow(2, c11 - 1)), this._debug(b10, "refreshing attempt", c11), await eh(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, { body: { refresh_token: a10 }, headers: this.headers, xform: ej })), d10 = (a11, b11) => {
              let c11 = 200 * Math.pow(2, a11);
              return b11 && dM(b11) && Date.now() + c11 - e10 < 3e4;
            }, new Promise((a11, b11) => {
              (async () => {
                for (let e11 = 0; e11 < 1 / 0; e11++) try {
                  let b12 = await c10(e11);
                  if (!d10(e11, null, b12)) return void a11(b12);
                } catch (a12) {
                  if (!d10(e11, a12)) return void b11(a12);
                }
              })();
            }));
          } catch (a11) {
            if (this._debug(b10, "error", a11), dA(a11)) return this._returnResult({ data: { session: null, user: null }, error: a11 });
            throw a11;
          } finally {
            this._debug(b10, "end");
          }
        }
        _isValidSession(a10) {
          return "object" == typeof a10 && null !== a10 && "access_token" in a10 && "refresh_token" in a10 && "expires_at" in a10;
        }
        async _handleProviderSignIn(a10, b10) {
          let c10 = await this._getUrlForProvider(`${this.url}/authorize`, a10, { redirectTo: b10.redirectTo, scopes: b10.scopes, queryParams: b10.queryParams });
          return this._debug("#_handleProviderSignIn()", "provider", a10, "options", b10, "url", c10), dX() && !b10.skipBrowserRedirect && window.location.assign(c10), { data: { provider: a10, url: c10 }, error: null };
        }
        async _recoverAndRefresh() {
          var a10, b10;
          let c10 = "#_recoverAndRefresh()";
          this._debug(c10, "begin");
          try {
            let d10 = await d0(this.storage, this.storageKey);
            if (d10 && this.userStorage) {
              let b11 = await d0(this.userStorage, this.storageKey + "-user");
              !this.storage.isServer && Object.is(this.storage, this.userStorage) && !b11 && (b11 = { user: d10.user }, await d_(this.userStorage, this.storageKey + "-user", b11)), d10.user = null != (a10 = null == b11 ? void 0 : b11.user) ? a10 : ec();
            } else if (d10 && !d10.user && !d10.user) {
              let a11 = await d0(this.storage, this.storageKey + "-user");
              a11 && (null == a11 ? void 0 : a11.user) ? (d10.user = a11.user, await d1(this.storage, this.storageKey + "-user"), await d_(this.storage, this.storageKey, d10)) : d10.user = ec();
            }
            if (this._debug(c10, "session from storage", d10), !this._isValidSession(d10)) {
              this._debug(c10, "session is not valid"), null !== d10 && await this._removeSession();
              return;
            }
            let e10 = (null != (b10 = d10.expires_at) ? b10 : 1 / 0) * 1e3 - Date.now() < 9e4;
            if (this._debug(c10, `session has${e10 ? "" : " not"} expired with margin of 90000s`), e10) {
              if (this.autoRefreshToken && d10.refresh_token) {
                let { error: a11 } = await this._callRefreshToken(d10.refresh_token);
                a11 && (console.error(a11), dM(a11) || (this._debug(c10, "refresh failed with a non-retryable error, removing the session", a11), await this._removeSession()));
              }
            } else if (d10.user && true === d10.user.__isUserNotAvailableProxy) try {
              let { data: a11, error: b11 } = await this._getUser(d10.access_token);
              !b11 && (null == a11 ? void 0 : a11.user) ? (d10.user = a11.user, await this._saveSession(d10), await this._notifyAllSubscribers("SIGNED_IN", d10)) : this._debug(c10, "could not get user data, skipping SIGNED_IN notification");
            } catch (a11) {
              console.error("Error getting user data:", a11), this._debug(c10, "error getting user data, skipping SIGNED_IN notification", a11);
            }
            else await this._notifyAllSubscribers("SIGNED_IN", d10);
          } catch (a11) {
            this._debug(c10, "error", a11), console.error(a11);
            return;
          } finally {
            this._debug(c10, "end");
          }
        }
        async _callRefreshToken(a10) {
          var b10, c10;
          if (!a10) throw new dE();
          if (this.refreshingDeferred) return this.refreshingDeferred.promise;
          let d10 = `#_callRefreshToken(${a10.substring(0, 5)}...)`;
          this._debug(d10, "begin");
          try {
            this.refreshingDeferred = new d2();
            let { data: b11, error: c11 } = await this._refreshAccessToken(a10);
            if (c11) throw c11;
            if (!b11.session) throw new dE();
            await this._saveSession(b11.session), await this._notifyAllSubscribers("TOKEN_REFRESHED", b11.session);
            let d11 = { data: b11.session, error: null };
            return this.refreshingDeferred.resolve(d11), d11;
          } catch (a11) {
            if (this._debug(d10, "error", a11), dA(a11)) {
              let c11 = { data: null, error: a11 };
              return dM(a11) || await this._removeSession(), null == (b10 = this.refreshingDeferred) || b10.resolve(c11), c11;
            }
            throw null == (c10 = this.refreshingDeferred) || c10.reject(a11), a11;
          } finally {
            this.refreshingDeferred = null, this._debug(d10, "end");
          }
        }
        async _notifyAllSubscribers(a10, b10, c10 = true) {
          let d10 = `#_notifyAllSubscribers(${a10})`;
          this._debug(d10, "begin", b10, `broadcast = ${c10}`);
          try {
            this.broadcastChannel && c10 && this.broadcastChannel.postMessage({ event: a10, session: b10 });
            let d11 = [], e10 = Array.from(this.stateChangeEmitters.values()).map(async (c11) => {
              try {
                await c11.callback(a10, b10);
              } catch (a11) {
                d11.push(a11);
              }
            });
            if (await Promise.all(e10), d11.length > 0) {
              for (let a11 = 0; a11 < d11.length; a11 += 1) console.error(d11[a11]);
              throw d11[0];
            }
          } finally {
            this._debug(d10, "end");
          }
        }
        async _saveSession(a10) {
          this._debug("#_saveSession()", a10), this.suppressGetSessionWarning = true, await d1(this.storage, `${this.storageKey}-code-verifier`);
          let b10 = Object.assign({}, a10), c10 = b10.user && true === b10.user.__isUserNotAvailableProxy;
          if (this.userStorage) {
            !c10 && b10.user && await d_(this.userStorage, this.storageKey + "-user", { user: b10.user });
            let a11 = Object.assign({}, b10);
            delete a11.user;
            let d10 = ed(a11);
            await d_(this.storage, this.storageKey, d10);
          } else {
            let a11 = ed(b10);
            await d_(this.storage, this.storageKey, a11);
          }
        }
        async _removeSession() {
          this._debug("#_removeSession()"), this.suppressGetSessionWarning = false, await d1(this.storage, this.storageKey), await d1(this.storage, this.storageKey + "-code-verifier"), await d1(this.storage, this.storageKey + "-user"), this.userStorage && await d1(this.userStorage, this.storageKey + "-user"), await this._notifyAllSubscribers("SIGNED_OUT", null);
        }
        _removeVisibilityChangedCallback() {
          this._debug("#_removeVisibilityChangedCallback()");
          let a10 = this.visibilityChangedCallback;
          this.visibilityChangedCallback = null;
          try {
            a10 && dX() && (null == window ? void 0 : window.removeEventListener) && window.removeEventListener("visibilitychange", a10);
          } catch (a11) {
            console.error("removing visibilitychange callback failed", a11);
          }
        }
        async _startAutoRefresh() {
          await this._stopAutoRefresh(), this._debug("#_startAutoRefresh()");
          let a10 = setInterval(() => this._autoRefreshTokenTick(), 3e4);
          this.autoRefreshTicker = a10, a10 && "object" == typeof a10 && "function" == typeof a10.unref ? a10.unref() : "undefined" != typeof Deno && "function" == typeof Deno.unrefTimer && Deno.unrefTimer(a10);
          let b10 = setTimeout(async () => {
            await this.initializePromise, await this._autoRefreshTokenTick();
          }, 0);
          this.autoRefreshTickTimeout = b10, b10 && "object" == typeof b10 && "function" == typeof b10.unref ? b10.unref() : "undefined" != typeof Deno && "function" == typeof Deno.unrefTimer && Deno.unrefTimer(b10);
        }
        async _stopAutoRefresh() {
          this._debug("#_stopAutoRefresh()");
          let a10 = this.autoRefreshTicker;
          this.autoRefreshTicker = null, a10 && clearInterval(a10);
          let b10 = this.autoRefreshTickTimeout;
          this.autoRefreshTickTimeout = null, b10 && clearTimeout(b10);
        }
        async startAutoRefresh() {
          this._removeVisibilityChangedCallback(), await this._startAutoRefresh();
        }
        async stopAutoRefresh() {
          this._removeVisibilityChangedCallback(), await this._stopAutoRefresh();
        }
        async _autoRefreshTokenTick() {
          this._debug("#_autoRefreshTokenTick()", "begin");
          try {
            await this._acquireLock(0, async () => {
              try {
                let a10 = Date.now();
                try {
                  return await this._useSession(async (b10) => {
                    let { data: { session: c10 } } = b10;
                    if (!c10 || !c10.refresh_token || !c10.expires_at) return void this._debug("#_autoRefreshTokenTick()", "no session");
                    let d10 = Math.floor((1e3 * c10.expires_at - a10) / 3e4);
                    this._debug("#_autoRefreshTokenTick()", `access token expires in ${d10} ticks, a tick lasts 30000ms, refresh threshold is 3 ticks`), d10 <= 3 && await this._callRefreshToken(c10.refresh_token);
                  });
                } catch (a11) {
                  console.error("Auto refresh tick failed with error. This is likely a transient error.", a11);
                }
              } finally {
                this._debug("#_autoRefreshTokenTick()", "end");
              }
            });
          } catch (a10) {
            if (a10.isAcquireTimeout || a10 instanceof et) this._debug("auto refresh token tick lock not available");
            else throw a10;
          }
        }
        async _handleVisibilityChange() {
          if (this._debug("#_handleVisibilityChange()"), !dX() || !(null == window ? void 0 : window.addEventListener)) return this.autoRefreshToken && this.startAutoRefresh(), false;
          try {
            this.visibilityChangedCallback = async () => {
              try {
                await this._onVisibilityChanged(false);
              } catch (a10) {
                this._debug("#visibilityChangedCallback", "error", a10);
              }
            }, null == window || window.addEventListener("visibilitychange", this.visibilityChangedCallback), await this._onVisibilityChanged(true);
          } catch (a10) {
            console.error("_handleVisibilityChange", a10);
          }
        }
        async _onVisibilityChanged(a10) {
          let b10 = `#_onVisibilityChanged(${a10})`;
          this._debug(b10, "visibilityState", document.visibilityState), "visible" === document.visibilityState ? (this.autoRefreshToken && this._startAutoRefresh(), a10 || (await this.initializePromise, await this._acquireLock(this.lockAcquireTimeout, async () => {
            if ("visible" !== document.visibilityState) return void this._debug(b10, "acquired the lock to recover the session, but the browser visibilityState is no longer visible, aborting");
            await this._recoverAndRefresh();
          }))) : "hidden" === document.visibilityState && this.autoRefreshToken && this._stopAutoRefresh();
        }
        async _getUrlForProvider(a10, b10, c10) {
          let d10 = [`provider=${encodeURIComponent(b10)}`];
          if ((null == c10 ? void 0 : c10.redirectTo) && d10.push(`redirect_to=${encodeURIComponent(c10.redirectTo)}`), (null == c10 ? void 0 : c10.scopes) && d10.push(`scopes=${encodeURIComponent(c10.scopes)}`), "pkce" === this.flowType) {
            let [a11, b11] = await d8(this.storage, this.storageKey), c11 = new URLSearchParams({ code_challenge: `${encodeURIComponent(a11)}`, code_challenge_method: `${encodeURIComponent(b11)}` });
            d10.push(c11.toString());
          }
          if (null == c10 ? void 0 : c10.queryParams) {
            let a11 = new URLSearchParams(c10.queryParams);
            d10.push(a11.toString());
          }
          return (null == c10 ? void 0 : c10.skipBrowserRedirect) && d10.push(`skip_http_redirect=${c10.skipBrowserRedirect}`), `${a10}?${d10.join("&")}`;
        }
        async _unenroll(a10) {
          try {
            return await this._useSession(async (b10) => {
              var c10;
              let { data: d10, error: e10 } = b10;
              return e10 ? this._returnResult({ data: null, error: e10 }) : await eh(this.fetch, "DELETE", `${this.url}/factors/${a10.factorId}`, { headers: this.headers, jwt: null == (c10 = null == d10 ? void 0 : d10.session) ? void 0 : c10.access_token });
            });
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ data: null, error: a11 });
            throw a11;
          }
        }
        async _enroll(a10) {
          try {
            return await this._useSession(async (b10) => {
              var c10, d10;
              let { data: e10, error: f10 } = b10;
              if (f10) return this._returnResult({ data: null, error: f10 });
              let g2 = Object.assign({ friendly_name: a10.friendlyName, factor_type: a10.factorType }, "phone" === a10.factorType ? { phone: a10.phone } : "totp" === a10.factorType ? { issuer: a10.issuer } : {}), { data: h2, error: i2 } = await eh(this.fetch, "POST", `${this.url}/factors`, { body: g2, headers: this.headers, jwt: null == (c10 = null == e10 ? void 0 : e10.session) ? void 0 : c10.access_token });
              return i2 ? this._returnResult({ data: null, error: i2 }) : ("totp" === a10.factorType && "totp" === h2.type && (null == (d10 = null == h2 ? void 0 : h2.totp) ? void 0 : d10.qr_code) && (h2.totp.qr_code = `data:image/svg+xml;utf-8,${h2.totp.qr_code}`), this._returnResult({ data: h2, error: null }));
            });
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ data: null, error: a11 });
            throw a11;
          }
        }
        async _verify(a10) {
          return this._acquireLock(this.lockAcquireTimeout, async () => {
            try {
              return await this._useSession(async (b10) => {
                var c10, d10, e10;
                let { data: f10, error: g2 } = b10;
                if (g2) return this._returnResult({ data: null, error: g2 });
                let h2 = Object.assign({ challenge_id: a10.challengeId }, "webauthn" in a10 ? { webauthn: Object.assign(Object.assign({}, a10.webauthn), { credential_response: "create" === a10.webauthn.type ? (d10 = a10.webauthn.credential_response, "toJSON" in d10 && "function" == typeof d10.toJSON ? d10.toJSON() : { id: d10.id, rawId: d10.id, response: { attestationObject: dW(new Uint8Array(d10.response.attestationObject)), clientDataJSON: dW(new Uint8Array(d10.response.clientDataJSON)) }, type: "public-key", clientExtensionResults: d10.getClientExtensionResults(), authenticatorAttachment: null != (e10 = d10.authenticatorAttachment) ? e10 : void 0 }) : function(a11) {
                  var b11;
                  if ("toJSON" in a11 && "function" == typeof a11.toJSON) return a11.toJSON();
                  let c11 = a11.getClientExtensionResults(), d11 = a11.response;
                  return { id: a11.id, rawId: a11.id, response: { authenticatorData: dW(new Uint8Array(d11.authenticatorData)), clientDataJSON: dW(new Uint8Array(d11.clientDataJSON)), signature: dW(new Uint8Array(d11.signature)), userHandle: d11.userHandle ? dW(new Uint8Array(d11.userHandle)) : void 0 }, type: "public-key", clientExtensionResults: c11, authenticatorAttachment: null != (b11 = a11.authenticatorAttachment) ? b11 : void 0 };
                }(a10.webauthn.credential_response) }) } : { code: a10.code }), { data: i2, error: j2 } = await eh(this.fetch, "POST", `${this.url}/factors/${a10.factorId}/verify`, { body: h2, headers: this.headers, jwt: null == (c10 = null == f10 ? void 0 : f10.session) ? void 0 : c10.access_token });
                return j2 ? this._returnResult({ data: null, error: j2 }) : (await this._saveSession(Object.assign({ expires_at: Math.round(Date.now() / 1e3) + i2.expires_in }, i2)), await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED", i2), this._returnResult({ data: i2, error: j2 }));
              });
            } catch (a11) {
              if (dA(a11)) return this._returnResult({ data: null, error: a11 });
              throw a11;
            }
          });
        }
        async _challenge(a10) {
          return this._acquireLock(this.lockAcquireTimeout, async () => {
            try {
              return await this._useSession(async (b10) => {
                var c10;
                let { data: d10, error: e10 } = b10;
                if (e10) return this._returnResult({ data: null, error: e10 });
                let f10 = await eh(this.fetch, "POST", `${this.url}/factors/${a10.factorId}/challenge`, { body: a10, headers: this.headers, jwt: null == (c10 = null == d10 ? void 0 : d10.session) ? void 0 : c10.access_token });
                if (f10.error) return f10;
                let { data: g2 } = f10;
                if ("webauthn" !== g2.type) return { data: g2, error: null };
                switch (g2.webauthn.type) {
                  case "create":
                    return { data: Object.assign(Object.assign({}, g2), { webauthn: Object.assign(Object.assign({}, g2.webauthn), { credential_options: Object.assign(Object.assign({}, g2.webauthn.credential_options), { publicKey: function(a11) {
                      if (!a11) throw Error("Credential creation options are required");
                      if ("undefined" != typeof PublicKeyCredential && "parseCreationOptionsFromJSON" in PublicKeyCredential && "function" == typeof PublicKeyCredential.parseCreationOptionsFromJSON) return PublicKeyCredential.parseCreationOptionsFromJSON(a11);
                      let { challenge: b11, user: c11, excludeCredentials: d11 } = a11, e11 = bT(a11, ["challenge", "user", "excludeCredentials"]), f11 = dV(b11).buffer, g3 = Object.assign(Object.assign({}, c11), { id: dV(c11.id).buffer }), h2 = Object.assign(Object.assign({}, e11), { challenge: f11, user: g3 });
                      if (d11 && d11.length > 0) {
                        h2.excludeCredentials = Array(d11.length);
                        for (let a12 = 0; a12 < d11.length; a12++) {
                          let b12 = d11[a12];
                          h2.excludeCredentials[a12] = Object.assign(Object.assign({}, b12), { id: dV(b12.id).buffer, type: b12.type || "public-key", transports: b12.transports });
                        }
                      }
                      return h2;
                    }(g2.webauthn.credential_options.publicKey) }) }) }), error: null };
                  case "request":
                    return { data: Object.assign(Object.assign({}, g2), { webauthn: Object.assign(Object.assign({}, g2.webauthn), { credential_options: Object.assign(Object.assign({}, g2.webauthn.credential_options), { publicKey: function(a11) {
                      if (!a11) throw Error("Credential request options are required");
                      if ("undefined" != typeof PublicKeyCredential && "parseRequestOptionsFromJSON" in PublicKeyCredential && "function" == typeof PublicKeyCredential.parseRequestOptionsFromJSON) return PublicKeyCredential.parseRequestOptionsFromJSON(a11);
                      let { challenge: b11, allowCredentials: c11 } = a11, d11 = bT(a11, ["challenge", "allowCredentials"]), e11 = dV(b11).buffer, f11 = Object.assign(Object.assign({}, d11), { challenge: e11 });
                      if (c11 && c11.length > 0) {
                        f11.allowCredentials = Array(c11.length);
                        for (let a12 = 0; a12 < c11.length; a12++) {
                          let b12 = c11[a12];
                          f11.allowCredentials[a12] = Object.assign(Object.assign({}, b12), { id: dV(b12.id).buffer, type: b12.type || "public-key", transports: b12.transports });
                        }
                      }
                      return f11;
                    }(g2.webauthn.credential_options.publicKey) }) }) }), error: null };
                }
              });
            } catch (a11) {
              if (dA(a11)) return this._returnResult({ data: null, error: a11 });
              throw a11;
            }
          });
        }
        async _challengeAndVerify(a10) {
          let { data: b10, error: c10 } = await this._challenge({ factorId: a10.factorId });
          return c10 ? this._returnResult({ data: null, error: c10 }) : await this._verify({ factorId: a10.factorId, challengeId: b10.id, code: a10.code });
        }
        async _listFactors() {
          var a10;
          let { data: { user: b10 }, error: c10 } = await this.getUser();
          if (c10) return { data: null, error: c10 };
          let d10 = { all: [], phone: [], totp: [], webauthn: [] };
          for (let c11 of null != (a10 = null == b10 ? void 0 : b10.factors) ? a10 : []) d10.all.push(c11), "verified" === c11.status && d10[c11.factor_type].push(c11);
          return { data: d10, error: null };
        }
        async _getAuthenticatorAssuranceLevel(a10) {
          var b10, c10, d10, e10;
          if (a10) try {
            let { payload: d11 } = d3(a10), e11 = null;
            d11.aal && (e11 = d11.aal);
            let f11 = e11, { data: { user: g3 }, error: h3 } = await this.getUser(a10);
            if (h3) return this._returnResult({ data: null, error: h3 });
            (null != (c10 = null == (b10 = null == g3 ? void 0 : g3.factors) ? void 0 : b10.filter((a11) => "verified" === a11.status)) ? c10 : []).length > 0 && (f11 = "aal2");
            let i3 = d11.amr || [];
            return { data: { currentLevel: e11, nextLevel: f11, currentAuthenticationMethods: i3 }, error: null };
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ data: null, error: a11 });
            throw a11;
          }
          let { data: { session: f10 }, error: g2 } = await this.getSession();
          if (g2) return this._returnResult({ data: null, error: g2 });
          if (!f10) return { data: { currentLevel: null, nextLevel: null, currentAuthenticationMethods: [] }, error: null };
          let { payload: h2 } = d3(f10.access_token), i2 = null;
          h2.aal && (i2 = h2.aal);
          let j2 = i2;
          return (null != (e10 = null == (d10 = f10.user.factors) ? void 0 : d10.filter((a11) => "verified" === a11.status)) ? e10 : []).length > 0 && (j2 = "aal2"), { data: { currentLevel: i2, nextLevel: j2, currentAuthenticationMethods: h2.amr || [] }, error: null };
        }
        async _getAuthorizationDetails(a10) {
          try {
            return await this._useSession(async (b10) => {
              let { data: { session: c10 }, error: d10 } = b10;
              return d10 ? this._returnResult({ data: null, error: d10 }) : c10 ? await eh(this.fetch, "GET", `${this.url}/oauth/authorizations/${a10}`, { headers: this.headers, jwt: c10.access_token, xform: (a11) => ({ data: a11, error: null }) }) : this._returnResult({ data: null, error: new dE() });
            });
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ data: null, error: a11 });
            throw a11;
          }
        }
        async _approveAuthorization(a10, b10) {
          try {
            return await this._useSession(async (c10) => {
              let { data: { session: d10 }, error: e10 } = c10;
              if (e10) return this._returnResult({ data: null, error: e10 });
              if (!d10) return this._returnResult({ data: null, error: new dE() });
              let f10 = await eh(this.fetch, "POST", `${this.url}/oauth/authorizations/${a10}/consent`, { headers: this.headers, jwt: d10.access_token, body: { action: "approve" }, xform: (a11) => ({ data: a11, error: null }) });
              return f10.data && f10.data.redirect_url && dX() && !(null == b10 ? void 0 : b10.skipBrowserRedirect) && window.location.assign(f10.data.redirect_url), f10;
            });
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ data: null, error: a11 });
            throw a11;
          }
        }
        async _denyAuthorization(a10, b10) {
          try {
            return await this._useSession(async (c10) => {
              let { data: { session: d10 }, error: e10 } = c10;
              if (e10) return this._returnResult({ data: null, error: e10 });
              if (!d10) return this._returnResult({ data: null, error: new dE() });
              let f10 = await eh(this.fetch, "POST", `${this.url}/oauth/authorizations/${a10}/consent`, { headers: this.headers, jwt: d10.access_token, body: { action: "deny" }, xform: (a11) => ({ data: a11, error: null }) });
              return f10.data && f10.data.redirect_url && dX() && !(null == b10 ? void 0 : b10.skipBrowserRedirect) && window.location.assign(f10.data.redirect_url), f10;
            });
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ data: null, error: a11 });
            throw a11;
          }
        }
        async _listOAuthGrants() {
          try {
            return await this._useSession(async (a10) => {
              let { data: { session: b10 }, error: c10 } = a10;
              return c10 ? this._returnResult({ data: null, error: c10 }) : b10 ? await eh(this.fetch, "GET", `${this.url}/user/oauth/grants`, { headers: this.headers, jwt: b10.access_token, xform: (a11) => ({ data: a11, error: null }) }) : this._returnResult({ data: null, error: new dE() });
            });
          } catch (a10) {
            if (dA(a10)) return this._returnResult({ data: null, error: a10 });
            throw a10;
          }
        }
        async _revokeOAuthGrant(a10) {
          try {
            return await this._useSession(async (b10) => {
              let { data: { session: c10 }, error: d10 } = b10;
              return d10 ? this._returnResult({ data: null, error: d10 }) : c10 ? (await eh(this.fetch, "DELETE", `${this.url}/user/oauth/grants`, { headers: this.headers, jwt: c10.access_token, query: { client_id: a10.clientId }, noResolveJson: true }), { data: {}, error: null }) : this._returnResult({ data: null, error: new dE() });
            });
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ data: null, error: a11 });
            throw a11;
          }
        }
        async fetchJwk(a10, b10 = { keys: [] }) {
          let c10 = b10.keys.find((b11) => b11.kid === a10);
          if (c10) return c10;
          let d10 = Date.now();
          if ((c10 = this.jwks.keys.find((b11) => b11.kid === a10)) && this.jwks_cached_at + 6e5 > d10) return c10;
          let { data: e10, error: f10 } = await eh(this.fetch, "GET", `${this.url}/.well-known/jwks.json`, { headers: this.headers });
          if (f10) throw f10;
          return e10.keys && 0 !== e10.keys.length && (this.jwks = e10, this.jwks_cached_at = d10, c10 = e10.keys.find((b11) => b11.kid === a10)) ? c10 : null;
        }
        async getClaims(a10, b10 = {}) {
          try {
            let c10 = a10;
            if (!c10) {
              let { data: a11, error: b11 } = await this.getSession();
              if (b11 || !a11.session) return this._returnResult({ data: null, error: b11 });
              c10 = a11.session.access_token;
            }
            let { header: d10, payload: e10, signature: f10, raw: { header: g2, payload: h2 } } = d3(c10);
            (null == b10 ? void 0 : b10.allowExpired) || function(a11) {
              if (!a11) throw Error("Missing exp claim");
              if (a11 <= Math.floor(Date.now() / 1e3)) throw Error("JWT has expired");
            }(e10.exp);
            let i2 = !d10.alg || d10.alg.startsWith("HS") || !d10.kid || !("crypto" in globalThis && "subtle" in globalThis.crypto) ? null : await this.fetchJwk(d10.kid, (null == b10 ? void 0 : b10.keys) ? { keys: b10.keys } : null == b10 ? void 0 : b10.jwks);
            if (!i2) {
              let { error: a11 } = await this.getUser(c10);
              if (a11) throw a11;
              return { data: { claims: e10, header: d10, signature: f10 }, error: null };
            }
            let j2 = function(a11) {
              switch (a11) {
                case "RS256":
                  return { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-256" } };
                case "ES256":
                  return { name: "ECDSA", namedCurve: "P-256", hash: { name: "SHA-256" } };
                default:
                  throw Error("Invalid alg claim");
              }
            }(d10.alg), k2 = await crypto.subtle.importKey("jwk", i2, j2, true, ["verify"]);
            if (!await crypto.subtle.verify(j2, k2, f10, function(a11) {
              let b11 = [];
              return !function(a12, b12) {
                for (let c11 = 0; c11 < a12.length; c11 += 1) {
                  let d11 = a12.charCodeAt(c11);
                  if (d11 > 55295 && d11 <= 56319) {
                    let b13 = (d11 - 55296) * 1024 & 65535;
                    d11 = (a12.charCodeAt(c11 + 1) - 56320 & 65535 | b13) + 65536, c11 += 1;
                  }
                  !function(a13, b13) {
                    if (a13 <= 127) return b13(a13);
                    if (a13 <= 2047) {
                      b13(192 | a13 >> 6), b13(128 | 63 & a13);
                      return;
                    }
                    if (a13 <= 65535) {
                      b13(224 | a13 >> 12), b13(128 | a13 >> 6 & 63), b13(128 | 63 & a13);
                      return;
                    }
                    if (a13 <= 1114111) {
                      b13(240 | a13 >> 18), b13(128 | a13 >> 12 & 63), b13(128 | a13 >> 6 & 63), b13(128 | 63 & a13);
                      return;
                    }
                    throw Error(`Unrecognized Unicode codepoint: ${a13.toString(16)}`);
                  }(d11, b12);
                }
              }(a11, (a12) => b11.push(a12)), new Uint8Array(b11);
            }(`${g2}.${h2}`))) throw new dO("Invalid JWT signature");
            return { data: { claims: e10, header: d10, signature: f10 }, error: null };
          } catch (a11) {
            if (dA(a11)) return this._returnResult({ data: null, error: a11 });
            throw a11;
          }
        }
      }
      eM.nextInstanceID = {};
      let eN = eM, eO = "";
      eO = "undefined" != typeof Deno ? "deno" : "undefined" != typeof document ? "web" : "undefined" != typeof navigator && "ReactNative" === navigator.product ? "react-native" : "node";
      let eP = { headers: { "X-Client-Info": `supabase-js-${eO}/2.101.1` } }, eQ = { schema: "public" }, eR = { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true, flowType: "implicit" }, eS = {};
      function eT(a10) {
        return (eT = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(a11) {
          return typeof a11;
        } : function(a11) {
          return a11 && "function" == typeof Symbol && a11.constructor === Symbol && a11 !== Symbol.prototype ? "symbol" : typeof a11;
        })(a10);
      }
      function eU(a10, b10) {
        var c10 = Object.keys(a10);
        if (Object.getOwnPropertySymbols) {
          var d10 = Object.getOwnPropertySymbols(a10);
          b10 && (d10 = d10.filter(function(b11) {
            return Object.getOwnPropertyDescriptor(a10, b11).enumerable;
          })), c10.push.apply(c10, d10);
        }
        return c10;
      }
      function eV(a10) {
        for (var b10 = 1; b10 < arguments.length; b10++) {
          var c10 = null != arguments[b10] ? arguments[b10] : {};
          b10 % 2 ? eU(Object(c10), true).forEach(function(b11) {
            !function(a11, b12, c11) {
              var d10;
              (d10 = function(a12, b13) {
                if ("object" != eT(a12) || !a12) return a12;
                var c12 = a12[Symbol.toPrimitive];
                if (void 0 !== c12) {
                  var d11 = c12.call(a12, b13 || "default");
                  if ("object" != eT(d11)) return d11;
                  throw TypeError("@@toPrimitive must return a primitive value.");
                }
                return ("string" === b13 ? String : Number)(a12);
              }(b12, "string"), (b12 = "symbol" == eT(d10) ? d10 : d10 + "") in a11) ? Object.defineProperty(a11, b12, { value: c11, enumerable: true, configurable: true, writable: true }) : a11[b12] = c11;
            }(a10, b11, c10[b11]);
          }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(a10, Object.getOwnPropertyDescriptors(c10)) : eU(Object(c10)).forEach(function(b11) {
            Object.defineProperty(a10, b11, Object.getOwnPropertyDescriptor(c10, b11));
          });
        }
        return a10;
      }
      var eW = class extends eN {
        constructor(a10) {
          super(a10);
        }
      }, eX = class {
        constructor(a10, b10, c10) {
          var d10, e10, f10;
          this.supabaseUrl = a10, this.supabaseKey = b10;
          let g2 = function(a11) {
            let b11 = null == a11 ? void 0 : a11.trim();
            if (!b11) throw Error("supabaseUrl is required.");
            if (!b11.match(/^https?:\/\//i)) throw Error("Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.");
            try {
              return new URL(b11.endsWith("/") ? b11 : b11 + "/");
            } catch (a12) {
              throw Error("Invalid supabaseUrl: Provided URL is malformed.");
            }
          }(a10);
          if (!b10) throw Error("supabaseKey is required.");
          this.realtimeUrl = new URL("realtime/v1", g2), this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws"), this.authUrl = new URL("auth/v1", g2), this.storageUrl = new URL("storage/v1", g2), this.functionsUrl = new URL("functions/v1", g2);
          let h2 = `sb-${g2.hostname.split(".")[0]}-auth-token`, i2 = function(a11, b11) {
            var c11, d11;
            let { db: e11, auth: f11, realtime: g3, global: h3 } = a11, { db: i3, auth: j2, realtime: k2, global: l2 } = b11, m2 = { db: eV(eV({}, i3), e11), auth: eV(eV({}, j2), f11), realtime: eV(eV({}, k2), g3), storage: {}, global: eV(eV(eV({}, l2), h3), {}, { headers: eV(eV({}, null != (c11 = null == l2 ? void 0 : l2.headers) ? c11 : {}), null != (d11 = null == h3 ? void 0 : h3.headers) ? d11 : {}) }), accessToken: async () => "" };
            return a11.accessToken ? m2.accessToken = a11.accessToken : delete m2.accessToken, m2;
          }(null != c10 ? c10 : {}, { db: eQ, realtime: eS, auth: eV(eV({}, eR), {}, { storageKey: h2 }), global: eP });
          this.storageKey = null != (d10 = i2.auth.storageKey) ? d10 : "", this.headers = null != (e10 = i2.global.headers) ? e10 : {}, i2.accessToken ? (this.accessToken = i2.accessToken, this.auth = new Proxy({}, { get: (a11, b11) => {
            throw Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(b11)} is not possible`);
          } })) : this.auth = this._initSupabaseAuthClient(null != (f10 = i2.auth) ? f10 : {}, this.headers, i2.global.fetch), this.fetch = /* @__PURE__ */ ((a11, b11, c11) => {
            let d11 = /* @__PURE__ */ ((a12) => a12 ? (...b12) => a12(...b12) : (...a13) => fetch(...a13))(c11), e11 = Headers;
            return async (c12, f11) => {
              var g3;
              let h3 = null != (g3 = await b11()) ? g3 : a11, i3 = new e11(null == f11 ? void 0 : f11.headers);
              return i3.has("apikey") || i3.set("apikey", a11), i3.has("Authorization") || i3.set("Authorization", `Bearer ${h3}`), d11(c12, eV(eV({}, f11), {}, { headers: i3 }));
            };
          })(b10, this._getAccessToken.bind(this), i2.global.fetch), this.realtime = this._initRealtimeClient(eV({ headers: this.headers, accessToken: this._getAccessToken.bind(this) }, i2.realtime)), this.accessToken && Promise.resolve(this.accessToken()).then((a11) => this.realtime.setAuth(a11)).catch((a11) => console.warn("Failed to set initial Realtime auth token:", a11)), this.rest = new b6(new URL("rest/v1", g2).href, { headers: this.headers, schema: i2.db.schema, fetch: this.fetch, timeout: i2.db.timeout, urlLengthLimit: i2.db.urlLengthLimit }), this.storage = new dt(this.storageUrl.href, this.headers, this.fetch, null == c10 ? void 0 : c10.storage), i2.accessToken || this._listenForAuthEvents();
        }
        get functions() {
          return new bY(this.functionsUrl.href, { headers: this.headers, customFetch: this.fetch });
        }
        from(a10) {
          return this.rest.from(a10);
        }
        schema(a10) {
          return this.rest.schema(a10);
        }
        rpc(a10, b10 = {}, c10 = { head: false, get: false, count: void 0 }) {
          return this.rest.rpc(a10, b10, c10);
        }
        channel(a10, b10 = { config: {} }) {
          return this.realtime.channel(a10, b10);
        }
        getChannels() {
          return this.realtime.getChannels();
        }
        removeChannel(a10) {
          return this.realtime.removeChannel(a10);
        }
        removeAllChannels() {
          return this.realtime.removeAllChannels();
        }
        async _getAccessToken() {
          var a10, b10;
          if (this.accessToken) return await this.accessToken();
          let { data: c10 } = await this.auth.getSession();
          return null != (a10 = null == (b10 = c10.session) ? void 0 : b10.access_token) ? a10 : this.supabaseKey;
        }
        _initSupabaseAuthClient({ autoRefreshToken: a10, persistSession: b10, detectSessionInUrl: c10, storage: d10, userStorage: e10, storageKey: f10, flowType: g2, lock: h2, debug: i2, throwOnError: j2 }, k2, l2) {
          let m2 = { Authorization: `Bearer ${this.supabaseKey}`, apikey: `${this.supabaseKey}` };
          return new eW({ url: this.authUrl.href, headers: eV(eV({}, m2), k2), storageKey: f10, autoRefreshToken: a10, persistSession: b10, detectSessionInUrl: c10, storage: d10, userStorage: e10, flowType: g2, lock: h2, debug: i2, throwOnError: j2, fetch: l2, hasCustomAuthorizationHeader: Object.keys(this.headers).some((a11) => "authorization" === a11.toLowerCase()) });
        }
        _initRealtimeClient(a10) {
          return new cO(this.realtimeUrl.href, eV(eV({}, a10), {}, { params: eV(eV({}, { apikey: this.supabaseKey }), null == a10 ? void 0 : a10.params) }));
        }
        _listenForAuthEvents() {
          return this.auth.onAuthStateChange((a10, b10) => {
            this._handleTokenChanged(a10, "CLIENT", null == b10 ? void 0 : b10.access_token);
          });
        }
        _handleTokenChanged(a10, b10, c10) {
          ("TOKEN_REFRESHED" === a10 || "SIGNED_IN" === a10) && this.changedAccessToken !== c10 ? (this.changedAccessToken = c10, this.realtime.setAuth(c10)) : "SIGNED_OUT" === a10 && (this.realtime.setAuth(), "STORAGE" == b10 && this.auth.signOut(), this.changedAccessToken = void 0);
        }
      };
      if (function() {
        if ("undefined" != typeof window) return false;
        let a10 = globalThis.process;
        if (!a10) return false;
        let b10 = a10.version;
        if (null == b10) return false;
        let c10 = b10.match(/^v(\d+)\./);
        return !!c10 && 18 >= parseInt(c10[1], 10);
      }() && console.warn("\u26A0\uFE0F  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217"), "undefined" != typeof process && process.env?.npm_package_name) {
        let a10 = process.env.npm_package_name;
        ["@supabase/auth-helpers-nextjs", "@supabase/auth-helpers-react", "@supabase/auth-helpers-remix", "@supabase/auth-helpers-sveltekit"].includes(a10) && console.warn(`
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551 \u26A0\uFE0F  IMPORTANT: Package Consolidation Notice                                \u2551
\u2551                                                                            \u2551
\u2551 The ${a10.padEnd(35)} package name is deprecated.  \u2551
\u2551                                                                            \u2551
\u2551 You are now using @supabase/ssr - a unified solution for all frameworks.  \u2551
\u2551                                                                            \u2551
\u2551 The auth-helpers packages have been consolidated into @supabase/ssr       \u2551
\u2551 to provide better maintenance and consistent APIs across frameworks.      \u2551
\u2551                                                                            \u2551
\u2551 Please update your package.json to use @supabase/ssr directly:            \u2551
\u2551   npm uninstall ${a10.padEnd(42)} \u2551
\u2551   npm install @supabase/ssr                                               \u2551
\u2551                                                                            \u2551
\u2551 For more information, visit:                                              \u2551
\u2551 https://supabase.com/docs/guides/auth/server-side                         \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D
    `);
      }
      let eY = "10.47.0", eZ = globalThis;
      function e$() {
        return e_(eZ), eZ;
      }
      function e_(a10) {
        let b10 = a10.__SENTRY__ = a10.__SENTRY__ || {};
        return b10.version = b10.version || eY, b10[eY] = b10[eY] || {};
      }
      function e0(a10, b10, c10 = eZ) {
        let d10 = c10.__SENTRY__ = c10.__SENTRY__ || {}, e10 = d10[eY] = d10[eY] || {};
        return e10[a10] || (e10[a10] = b10());
      }
      let e1 = "undefined" == typeof __SENTRY_DEBUG__ || __SENTRY_DEBUG__;
      function e2(a10) {
        if (void 0 !== f) return f ? f(a10) : a10();
        let b10 = Symbol.for("__SENTRY_SAFE_RANDOM_ID_WRAPPER__");
        return b10 in eZ && "function" == typeof eZ[b10] ? (f = eZ[b10])(a10) : (f = null, a10());
      }
      function e3() {
        return e2(() => Math.random());
      }
      function e4(a10 = eZ.crypto || eZ.msCrypto) {
        try {
          if (a10?.randomUUID) return e2(() => a10.randomUUID()).replace(/-/g, "");
        } catch {
        }
        return g || (g = "10000000100040008000100000000000"), g.replace(/[018]/g, (a11) => (a11 ^ (15 & 16 * e3()) >> a11 / 4).toString(16));
      }
      function e5() {
        return e2(() => Date.now()) / 1e3;
      }
      function e6() {
        return (h ?? (h = function() {
          let { performance: a10 } = eZ;
          if (!a10?.now || !a10.timeOrigin) return e5;
          let b10 = a10.timeOrigin;
          return () => (b10 + e2(() => a10.now())) / 1e3;
        }()))();
      }
      let e7 = {};
      function e8(a10) {
        if (!("console" in eZ)) return a10();
        let b10 = eZ.console, c10 = {}, d10 = Object.keys(e7);
        d10.forEach((a11) => {
          let d11 = e7[a11];
          c10[a11] = b10[a11], b10[a11] = d11;
        });
        try {
          return a10();
        } finally {
          d10.forEach((a11) => {
            b10[a11] = c10[a11];
          });
        }
      }
      function e9(a10, ...b10) {
        e1 && function() {
          return e1 ? e0("loggerSettings", () => ({ enabled: false })) : { enabled: false };
        }().enabled && e8(() => {
          eZ.console[a10](`Sentry Logger [${a10}]:`, ...b10);
        });
      }
      let fa = { log: function(...a10) {
        e9("log", ...a10);
      }, warn: function(...a10) {
        e9("warn", ...a10);
      } }, fb = Object.prototype.toString;
      function fc(a10, b10) {
        return fb.call(a10) === `[object ${b10}]`;
      }
      function fd(a10) {
        return fc(a10, "String");
      }
      function fe(a10) {
        return !!(a10?.then && "function" == typeof a10.then);
      }
      function ff() {
        return e4().substring(16);
      }
      function fg(a10, b10, c10) {
        try {
          Object.defineProperty(a10, b10, { value: c10, writable: true, configurable: true });
        } catch {
          e1 && fa.log(`Failed to add non-enumerable property "${b10}" to object`, a10);
        }
      }
      let fh = "_sentrySpan";
      function fi(a10, b10) {
        b10 ? fg(a10, fh, b10) : delete a10[fh];
      }
      function fj(a10, b10, c10 = false) {
        return !!fd(a10) && (fc(b10, "RegExp") ? b10.test(a10) : !!fd(b10) && (c10 ? a10 === b10 : a10.includes(b10)));
      }
      class fk {
        constructor() {
          this._notifyingListeners = false, this._scopeListeners = [], this._eventProcessors = [], this._breadcrumbs = [], this._attachments = [], this._user = {}, this._tags = {}, this._attributes = {}, this._extra = {}, this._contexts = {}, this._sdkProcessingMetadata = {}, this._propagationContext = { traceId: e4(), sampleRand: e3() };
        }
        clone() {
          let a10 = new fk();
          return a10._breadcrumbs = [...this._breadcrumbs], a10._tags = { ...this._tags }, a10._attributes = { ...this._attributes }, a10._extra = { ...this._extra }, a10._contexts = { ...this._contexts }, this._contexts.flags && (a10._contexts.flags = { values: [...this._contexts.flags.values] }), a10._user = this._user, a10._level = this._level, a10._session = this._session, a10._transactionName = this._transactionName, a10._fingerprint = this._fingerprint, a10._eventProcessors = [...this._eventProcessors], a10._attachments = [...this._attachments], a10._sdkProcessingMetadata = { ...this._sdkProcessingMetadata }, a10._propagationContext = { ...this._propagationContext }, a10._client = this._client, a10._lastEventId = this._lastEventId, a10._conversationId = this._conversationId, fi(a10, this[fh]), a10;
        }
        setClient(a10) {
          this._client = a10;
        }
        setLastEventId(a10) {
          this._lastEventId = a10;
        }
        getClient() {
          return this._client;
        }
        lastEventId() {
          return this._lastEventId;
        }
        addScopeListener(a10) {
          this._scopeListeners.push(a10);
        }
        addEventProcessor(a10) {
          return this._eventProcessors.push(a10), this;
        }
        setUser(a10) {
          return this._user = a10 || { email: void 0, id: void 0, ip_address: void 0, username: void 0 }, this._session && function(a11, b10 = {}) {
            if (b10.user && (!a11.ipAddress && b10.user.ip_address && (a11.ipAddress = b10.user.ip_address), a11.did || b10.did || (a11.did = b10.user.id || b10.user.email || b10.user.username)), a11.timestamp = b10.timestamp || e6(), b10.abnormal_mechanism && (a11.abnormal_mechanism = b10.abnormal_mechanism), b10.ignoreDuration && (a11.ignoreDuration = b10.ignoreDuration), b10.sid && (a11.sid = 32 === b10.sid.length ? b10.sid : e4()), void 0 !== b10.init && (a11.init = b10.init), !a11.did && b10.did && (a11.did = `${b10.did}`), "number" == typeof b10.started && (a11.started = b10.started), a11.ignoreDuration) a11.duration = void 0;
            else if ("number" == typeof b10.duration) a11.duration = b10.duration;
            else {
              let b11 = a11.timestamp - a11.started;
              a11.duration = b11 >= 0 ? b11 : 0;
            }
            b10.release && (a11.release = b10.release), b10.environment && (a11.environment = b10.environment), !a11.ipAddress && b10.ipAddress && (a11.ipAddress = b10.ipAddress), !a11.userAgent && b10.userAgent && (a11.userAgent = b10.userAgent), "number" == typeof b10.errors && (a11.errors = b10.errors), b10.status && (a11.status = b10.status);
          }(this._session, { user: a10 }), this._notifyScopeListeners(), this;
        }
        getUser() {
          return this._user;
        }
        setConversationId(a10) {
          return this._conversationId = a10 || void 0, this._notifyScopeListeners(), this;
        }
        setTags(a10) {
          return this._tags = { ...this._tags, ...a10 }, this._notifyScopeListeners(), this;
        }
        setTag(a10, b10) {
          return this.setTags({ [a10]: b10 });
        }
        setAttributes(a10) {
          return this._attributes = { ...this._attributes, ...a10 }, this._notifyScopeListeners(), this;
        }
        setAttribute(a10, b10) {
          return this.setAttributes({ [a10]: b10 });
        }
        removeAttribute(a10) {
          return a10 in this._attributes && (delete this._attributes[a10], this._notifyScopeListeners()), this;
        }
        setExtras(a10) {
          return this._extra = { ...this._extra, ...a10 }, this._notifyScopeListeners(), this;
        }
        setExtra(a10, b10) {
          return this._extra = { ...this._extra, [a10]: b10 }, this._notifyScopeListeners(), this;
        }
        setFingerprint(a10) {
          return this._fingerprint = a10, this._notifyScopeListeners(), this;
        }
        setLevel(a10) {
          return this._level = a10, this._notifyScopeListeners(), this;
        }
        setTransactionName(a10) {
          return this._transactionName = a10, this._notifyScopeListeners(), this;
        }
        setContext(a10, b10) {
          return null === b10 ? delete this._contexts[a10] : this._contexts[a10] = b10, this._notifyScopeListeners(), this;
        }
        setSession(a10) {
          return a10 ? this._session = a10 : delete this._session, this._notifyScopeListeners(), this;
        }
        getSession() {
          return this._session;
        }
        update(a10) {
          if (!a10) return this;
          let b10 = "function" == typeof a10 ? a10(this) : a10, { tags: c10, attributes: d10, extra: e10, user: f10, contexts: g2, level: h2, fingerprint: i2 = [], propagationContext: j2, conversationId: k2 } = (b10 instanceof fk ? b10.getScopeData() : fc(b10, "Object") ? a10 : void 0) || {};
          return this._tags = { ...this._tags, ...c10 }, this._attributes = { ...this._attributes, ...d10 }, this._extra = { ...this._extra, ...e10 }, this._contexts = { ...this._contexts, ...g2 }, f10 && Object.keys(f10).length && (this._user = f10), h2 && (this._level = h2), i2.length && (this._fingerprint = i2), j2 && (this._propagationContext = j2), k2 && (this._conversationId = k2), this;
        }
        clear() {
          return this._breadcrumbs = [], this._tags = {}, this._attributes = {}, this._extra = {}, this._user = {}, this._contexts = {}, this._level = void 0, this._transactionName = void 0, this._fingerprint = void 0, this._session = void 0, this._conversationId = void 0, fi(this, void 0), this._attachments = [], this.setPropagationContext({ traceId: e4(), sampleRand: e3() }), this._notifyScopeListeners(), this;
        }
        addBreadcrumb(a10, b10) {
          let c10 = "number" == typeof b10 ? b10 : 100;
          if (c10 <= 0) return this;
          let d10 = { timestamp: e5(), ...a10, message: a10.message ? function(a11, b11 = 0) {
            return "string" != typeof a11 || 0 === b11 || a11.length <= b11 ? a11 : `${a11.slice(0, b11)}...`;
          }(a10.message, 2048) : a10.message };
          return this._breadcrumbs.push(d10), this._breadcrumbs.length > c10 && (this._breadcrumbs = this._breadcrumbs.slice(-c10), this._client?.recordDroppedEvent("buffer_overflow", "log_item")), this._notifyScopeListeners(), this;
        }
        getLastBreadcrumb() {
          return this._breadcrumbs[this._breadcrumbs.length - 1];
        }
        clearBreadcrumbs() {
          return this._breadcrumbs = [], this._notifyScopeListeners(), this;
        }
        addAttachment(a10) {
          return this._attachments.push(a10), this;
        }
        clearAttachments() {
          return this._attachments = [], this;
        }
        getScopeData() {
          return { breadcrumbs: this._breadcrumbs, attachments: this._attachments, contexts: this._contexts, tags: this._tags, attributes: this._attributes, extra: this._extra, user: this._user, level: this._level, fingerprint: this._fingerprint || [], eventProcessors: this._eventProcessors, propagationContext: this._propagationContext, sdkProcessingMetadata: this._sdkProcessingMetadata, transactionName: this._transactionName, span: this[fh], conversationId: this._conversationId };
        }
        setSDKProcessingMetadata(a10) {
          return this._sdkProcessingMetadata = function a11(b10, c10, d10 = 2) {
            if (!c10 || "object" != typeof c10 || d10 <= 0) return c10;
            if (b10 && 0 === Object.keys(c10).length) return b10;
            let e10 = { ...b10 };
            for (let b11 in c10) Object.prototype.hasOwnProperty.call(c10, b11) && (e10[b11] = a11(e10[b11], c10[b11], d10 - 1));
            return e10;
          }(this._sdkProcessingMetadata, a10, 2), this;
        }
        setPropagationContext(a10) {
          return this._propagationContext = a10, this;
        }
        getPropagationContext() {
          return this._propagationContext;
        }
        captureException(a10, b10) {
          let c10 = b10?.event_id || e4();
          if (!this._client) return e1 && fa.warn("No client configured on scope - will not capture exception!"), c10;
          let d10 = Error("Sentry syntheticException");
          return this._client.captureException(a10, { originalException: a10, syntheticException: d10, ...b10, event_id: c10 }, this), c10;
        }
        captureMessage(a10, b10, c10) {
          let d10 = c10?.event_id || e4();
          if (!this._client) return e1 && fa.warn("No client configured on scope - will not capture message!"), d10;
          let e10 = c10?.syntheticException ?? Error(a10);
          return this._client.captureMessage(a10, b10, { originalException: a10, syntheticException: e10, ...c10, event_id: d10 }, this), d10;
        }
        captureEvent(a10, b10) {
          let c10 = a10.event_id || b10?.event_id || e4();
          return this._client ? this._client.captureEvent(a10, { ...b10, event_id: c10 }, this) : e1 && fa.warn("No client configured on scope - will not capture event!"), c10;
        }
        _notifyScopeListeners() {
          this._notifyingListeners || (this._notifyingListeners = true, this._scopeListeners.forEach((a10) => {
            a10(this);
          }), this._notifyingListeners = false);
        }
      }
      let fl = (a10) => a10 instanceof Promise && !a10[fm], fm = Symbol("chained PromiseLike"), fn = (a10, b10, c10) => {
        let d10 = a10.then((a11) => (b10(a11), a11), (a11) => {
          throw c10(a11), a11;
        });
        return fl(d10) && fl(a10) ? d10 : fo(a10, d10);
      }, fo = (a10, b10) => {
        let c10 = false;
        for (let d10 in a10) {
          if (d10 in b10) continue;
          c10 = true;
          let e10 = a10[d10];
          "function" == typeof e10 ? Object.defineProperty(b10, d10, { value: (...b11) => e10.apply(a10, b11), enumerable: true, configurable: true, writable: true }) : b10[d10] = e10;
        }
        return c10 && Object.assign(b10, { [fm]: true }), b10;
      };
      class fp {
        constructor(a10, b10) {
          let c10, d10;
          c10 = a10 || new fk(), d10 = b10 || new fk(), this._stack = [{ scope: c10 }], this._isolationScope = d10;
        }
        withScope(a10) {
          let b10, c10 = this._pushScope();
          try {
            b10 = a10(c10);
          } catch (a11) {
            throw this._popScope(), a11;
          }
          return fe(b10) ? fn(b10, () => this._popScope(), () => this._popScope()) : (this._popScope(), b10);
        }
        getClient() {
          return this.getStackTop().client;
        }
        getScope() {
          return this.getStackTop().scope;
        }
        getIsolationScope() {
          return this._isolationScope;
        }
        getStackTop() {
          return this._stack[this._stack.length - 1];
        }
        _pushScope() {
          let a10 = this.getScope().clone();
          return this._stack.push({ client: this.getClient(), scope: a10 }), a10;
        }
        _popScope() {
          return !(this._stack.length <= 1) && !!this._stack.pop();
        }
      }
      function fq() {
        let a10 = e_(e$());
        return a10.stack = a10.stack || new fp(e0("defaultCurrentScope", () => new fk()), e0("defaultIsolationScope", () => new fk()));
      }
      function fr(a10) {
        return fq().withScope(a10);
      }
      function fs(a10, b10) {
        let c10 = fq();
        return c10.withScope(() => (c10.getStackTop().scope = a10, b10(a10)));
      }
      function ft(a10) {
        return fq().withScope(() => a10(fq().getIsolationScope()));
      }
      function fu(a10) {
        let b10 = e_(a10);
        return b10.acs ? b10.acs : { withIsolationScope: ft, withScope: fr, withSetScope: fs, withSetIsolationScope: (a11, b11) => ft(b11), getCurrentScope: () => fq().getScope(), getIsolationScope: () => fq().getIsolationScope() };
      }
      function fv() {
        return fu(e$()).getCurrentScope();
      }
      function fw(...a10) {
        let b10 = fu(e$());
        if (2 === a10.length) {
          let [c10, d10] = a10;
          return c10 ? b10.withSetScope(c10, d10) : b10.withScope(d10);
        }
        return b10.withScope(a10[0]);
      }
      function fx() {
        return fv().getClient();
      }
      let fy = "sentry.source", fz = "sentry.sample_rate", fA = "sentry.op", fB = "sentry.origin", fC = "sentry.custom_span_name", fD = false;
      function fE(a10) {
        return a10 && a10.length > 0 ? a10.map(({ context: { spanId: a11, traceId: b10, traceFlags: c10, ...d10 }, attributes: e10 }) => ({ span_id: a11, trace_id: b10, sampled: 1 === c10, attributes: e10, ...d10 })) : void 0;
      }
      function fF(a10) {
        return "number" == typeof a10 ? fG(a10) : Array.isArray(a10) ? a10[0] + a10[1] / 1e9 : a10 instanceof Date ? fG(a10.getTime()) : e6();
      }
      function fG(a10) {
        return a10 > 9999999999 ? a10 / 1e3 : a10;
      }
      function fH(a10) {
        var b10;
        if ("function" == typeof a10.getSpanJSON) return a10.getSpanJSON();
        let { spanId: c10, traceId: d10 } = a10.spanContext();
        if ((b10 = a10).attributes && b10.startTime && b10.name && b10.endTime && b10.status) {
          let { attributes: b11, startTime: e10, name: f10, endTime: g2, status: h2, links: i2 } = a10;
          return { span_id: c10, trace_id: d10, data: b11, description: f10, parent_span_id: "parentSpanId" in a10 ? a10.parentSpanId : "parentSpanContext" in a10 ? a10.parentSpanContext?.spanId : void 0, start_timestamp: fF(e10), timestamp: fF(g2) || void 0, status: fJ(h2), op: b11[fA], origin: b11[fB], links: fE(i2) };
        }
        return { span_id: c10, trace_id: d10, start_timestamp: 0, data: {} };
      }
      function fI(a10) {
        let { traceFlags: b10 } = a10.spanContext();
        return 1 === b10;
      }
      function fJ(a10) {
        if (a10 && 0 !== a10.code) return 1 === a10.code ? "ok" : a10.message || "internal_error";
      }
      let fK = "_sentryChildSpans", fL = "_sentryRootSpan";
      function fM(a10, b10) {
        let c10 = a10[fL] || a10;
        fg(b10, fL, c10), a10[fK] ? a10[fK].add(b10) : fg(a10, fK, /* @__PURE__ */ new Set([b10]));
      }
      function fN(a10) {
        return a10[fL] || a10;
      }
      let fO = "_sentryScope", fP = "_sentryIsolationScope";
      function fQ(a10, b10, c10) {
        a10 && (fg(a10, fP, function(a11) {
          try {
            let b11 = eZ.WeakRef;
            if ("function" == typeof b11) return new b11(a11);
          } catch {
          }
          return a11;
        }(c10)), fg(a10, fO, b10));
      }
      function fR(a10) {
        return { scope: a10[fO], isolationScope: function(a11) {
          if (a11) {
            if ("object" == typeof a11 && "deref" in a11 && "function" == typeof a11.deref) try {
              return a11.deref();
            } catch {
              return;
            }
            return a11;
          }
        }(a10[fP]) };
      }
      function fS(a10, b10, c10 = () => {
      }, d10 = () => {
      }) {
        var e10, f10, g2, h2;
        let i2;
        try {
          i2 = a10();
        } catch (a11) {
          throw b10(a11), c10(), a11;
        }
        return e10 = i2, f10 = b10, g2 = c10, h2 = d10, fe(e10) ? fn(e10, (a11) => {
          g2(), h2(a11);
        }, (a11) => {
          f10(a11), g2();
        }) : (g2(), h2(e10), e10);
      }
      function fT(a10) {
        if ("boolean" == typeof __SENTRY_TRACING__ && !__SENTRY_TRACING__) return false;
        let b10 = a10 || fx()?.getOptions();
        return !!b10 && (null != b10.tracesSampleRate || !!b10.tracesSampler);
      }
      function fU(a10) {
        if ("boolean" == typeof a10) return Number(a10);
        let b10 = "string" == typeof a10 ? parseFloat(a10) : a10;
        if (!("number" != typeof b10 || isNaN(b10)) && !(b10 < 0) && !(b10 > 1)) return b10;
      }
      let fV = "sentry-";
      function fW(a10) {
        return a10.split(",").map((a11) => {
          let b10 = a11.indexOf("=");
          return -1 === b10 ? [] : [a11.slice(0, b10), a11.slice(b10 + 1)].map((a12) => {
            try {
              return decodeURIComponent(a12.trim());
            } catch {
              return;
            }
          });
        }).reduce((a11, [b10, c10]) => (b10 && c10 && (a11[b10] = c10), a11), {});
      }
      let fX = /^o(\d+)\./, fY = "_frozenDsc";
      function fZ(a10) {
        let b10 = fx();
        if (!b10) return {};
        let c10 = fN(a10), d10 = fH(c10), e10 = d10.data, f10 = c10.spanContext().traceState, g2 = f10?.get("sentry.sample_rate") ?? e10[fz] ?? e10["sentry.previous_trace_sample_rate"];
        function h2(a11) {
          return ("number" == typeof g2 || "string" == typeof g2) && (a11.sample_rate = `${g2}`), a11;
        }
        let i2 = c10[fY];
        if (i2) return h2(i2);
        let j2 = f10?.get("sentry.dsc"), k2 = j2 && function(a11) {
          let b11 = function(a12) {
            if (a12 && (fd(a12) || Array.isArray(a12))) return Array.isArray(a12) ? a12.reduce((a13, b12) => (Object.entries(fW(b12)).forEach(([b13, c12]) => {
              a13[b13] = c12;
            }), a13), {}) : fW(a12);
          }(a11);
          if (!b11) return;
          let c11 = Object.entries(b11).reduce((a12, [b12, c12]) => (b12.startsWith(fV) && (a12[b12.slice(fV.length)] = c12), a12), {});
          return Object.keys(c11).length > 0 ? c11 : void 0;
        }(j2);
        if (k2) return h2(k2);
        let l2 = function(a11, b11) {
          let c11 = b11.getOptions(), { publicKey: d11 } = b11.getDsn() || {}, e11 = { environment: c11.environment || "production", release: c11.release, public_key: d11, trace_id: a11, org_id: function(a12) {
            let b12, c12 = a12.getOptions(), { host: d12 } = a12.getDsn() || {};
            return c12.orgId ? b12 = String(c12.orgId) : d12 && (b12 = function(a13) {
              let b13 = a13.match(fX);
              return b13?.[1];
            }(d12)), b12;
          }(b11) };
          return b11.emit("createDsc", e11), e11;
        }(a10.spanContext().traceId, b10), m2 = e10[fy], n2 = d10.description;
        return "url" !== m2 && n2 && (l2.transaction = n2), fT() && (l2.sampled = String(fI(c10)), l2.sample_rand = f10?.get("sentry.sample_rand") ?? fR(c10).scope?.getPropagationContext().sampleRand.toString()), h2(l2), b10.emit("createDsc", l2, c10), l2;
      }
      class f$ {
        constructor(a10 = {}) {
          this._traceId = a10.traceId || e4(), this._spanId = a10.spanId || ff();
        }
        spanContext() {
          return { spanId: this._spanId, traceId: this._traceId, traceFlags: 0 };
        }
        end(a10) {
        }
        setAttribute(a10, b10) {
          return this;
        }
        setAttributes(a10) {
          return this;
        }
        setStatus(a10) {
          return this;
        }
        updateName(a10) {
          return this;
        }
        isRecording() {
          return false;
        }
        addEvent(a10, b10, c10) {
          return this;
        }
        addLink(a10) {
          return this;
        }
        addLinks(a10) {
          return this;
        }
        recordException(a10, b10) {
        }
      }
      function f_(a10) {
        fa.log(`Ignoring span ${a10.op} - ${a10.description} because it matches \`ignoreSpans\`.`);
      }
      function f0(a10) {
        if (!a10 || 0 === a10.length) return;
        let b10 = {};
        return a10.forEach((a11) => {
          let c10 = a11.attributes || {}, d10 = c10["sentry.measurement_unit"], e10 = c10["sentry.measurement_value"];
          "string" == typeof d10 && "number" == typeof e10 && (b10[a11.name] = { value: e10, unit: d10 });
        }), b10;
      }
      class f1 {
        constructor(a10 = {}) {
          this._traceId = a10.traceId || e4(), this._spanId = a10.spanId || ff(), this._startTime = a10.startTimestamp || e6(), this._links = a10.links, this._attributes = {}, this.setAttributes({ [fB]: "manual", [fA]: a10.op, ...a10.attributes }), this._name = a10.name, a10.parentSpanId && (this._parentSpanId = a10.parentSpanId), "sampled" in a10 && (this._sampled = a10.sampled), a10.endTimestamp && (this._endTime = a10.endTimestamp), this._events = [], this._isStandaloneSpan = a10.isStandalone, this._endTime && this._onSpanEnded();
        }
        addLink(a10) {
          return this._links ? this._links.push(a10) : this._links = [a10], this;
        }
        addLinks(a10) {
          return this._links ? this._links.push(...a10) : this._links = a10, this;
        }
        recordException(a10, b10) {
        }
        spanContext() {
          let { _spanId: a10, _traceId: b10, _sampled: c10 } = this;
          return { spanId: a10, traceId: b10, traceFlags: +!!c10 };
        }
        setAttribute(a10, b10) {
          return void 0 === b10 ? delete this._attributes[a10] : this._attributes[a10] = b10, this;
        }
        setAttributes(a10) {
          return Object.keys(a10).forEach((b10) => this.setAttribute(b10, a10[b10])), this;
        }
        updateStartTime(a10) {
          this._startTime = fF(a10);
        }
        setStatus(a10) {
          return this._status = a10, this;
        }
        updateName(a10) {
          return this._name = a10, this.setAttribute(fy, "custom"), this;
        }
        end(a10) {
          this._endTime || (this._endTime = fF(a10), function(a11) {
            if (!e1) return;
            let { description: b10 = "< unknown name >", op: c10 = "< unknown op >" } = fH(a11), { spanId: d10 } = a11.spanContext(), e10 = fN(a11) === a11, f10 = `[Tracing] Finishing "${c10}" ${e10 ? "root " : ""}span "${b10}" with ID ${d10}`;
            fa.log(f10);
          }(this), this._onSpanEnded());
        }
        getSpanJSON() {
          return { data: this._attributes, description: this._name, op: this._attributes[fA], parent_span_id: this._parentSpanId, span_id: this._spanId, start_timestamp: this._startTime, status: fJ(this._status), timestamp: this._endTime, trace_id: this._traceId, origin: this._attributes[fB], profile_id: this._attributes["sentry.profile_id"], exclusive_time: this._attributes["sentry.exclusive_time"], measurements: f0(this._events), is_segment: this._isStandaloneSpan && fN(this) === this || void 0, segment_id: this._isStandaloneSpan ? fN(this).spanContext().spanId : void 0, links: fE(this._links) };
        }
        isRecording() {
          return !this._endTime && !!this._sampled;
        }
        addEvent(a10, b10, c10) {
          e1 && fa.log("[Tracing] Adding an event to span:", a10);
          let d10 = f2(b10) ? b10 : c10 || e6(), e10 = f2(b10) ? {} : b10 || {}, f10 = { name: a10, time: fF(d10), attributes: e10 };
          return this._events.push(f10), this;
        }
        isStandaloneSpan() {
          return !!this._isStandaloneSpan;
        }
        _onSpanEnded() {
          let a10 = fx();
          if (a10 && a10.emit("spanEnd", this), !(this._isStandaloneSpan || this === fN(this))) return;
          if (this._isStandaloneSpan) return void (this._sampled ? function(a11) {
            let b11 = fx();
            if (!b11) return;
            let c10 = a11[1];
            if (!c10 || 0 === c10.length) return b11.recordDroppedEvent("before_send", "span");
            b11.sendEnvelope(a11);
          }(function(a11, b11) {
            let c10 = fZ(a11[0]), d10 = b11?.getDsn(), e10 = b11?.getOptions().tunnel, f10 = { sent_at: (/* @__PURE__ */ new Date()).toISOString(), ...!!c10.trace_id && !!c10.public_key && { trace: c10 }, ...!!e10 && d10 && { dsn: function(a12, b12 = false) {
              let { host: c11, path: d11, pass: e11, port: f11, projectId: g3, protocol: h3, publicKey: i3 } = a12;
              return `${h3}://${i3}${b12 && e11 ? `:${e11}` : ""}@${c11}${f11 ? `:${f11}` : ""}/${d11 ? `${d11}/` : d11}${g3}`;
            }(d10) } }, { beforeSendSpan: g2, ignoreSpans: h2 } = b11?.getOptions() || {}, i2 = h2?.length ? a11.filter((a12) => !function(a13, b12) {
              if (!b12?.length || !a13.description) return false;
              for (let d11 of b12) {
                var c11;
                if ("string" == typeof (c11 = d11) || c11 instanceof RegExp) {
                  if (fj(a13.description, d11)) return e1 && f_(a13), true;
                  continue;
                }
                if (!d11.name && !d11.op) continue;
                let b13 = !d11.name || fj(a13.description, d11.name), e11 = !d11.op || a13.op && fj(a13.op, d11.op);
                if (b13 && e11) return e1 && f_(a13), true;
              }
              return false;
            }(fH(a12), h2)) : a11, j2 = a11.length - i2.length;
            j2 && b11?.recordDroppedEvent("before_send", "span", j2);
            let k2 = g2 ? (a12) => {
              let b12 = fH(a12), c11 = g2(b12);
              return c11 || (fD || (e8(() => {
                console.warn("[Sentry] Returning null from `beforeSendSpan` is disallowed. To drop certain spans, configure the respective integrations directly or use `ignoreSpans`.");
              }), fD = true), b12);
            } : fH, l2 = [];
            for (let a12 of i2) {
              let b12 = k2(a12);
              b12 && l2.push([{ type: "span" }, b12]);
            }
            return /* @__PURE__ */ function(a12, b12 = []) {
              return [a12, b12];
            }(f10, l2);
          }([this], a10)) : (e1 && fa.log("[Tracing] Discarding standalone span because its trace was not chosen to be sampled."), a10 && a10.recordDroppedEvent("sample_rate", "span")));
          let b10 = this._convertSpanToTransaction();
          b10 && (fR(this).scope || fv()).captureEvent(b10);
        }
        _convertSpanToTransaction() {
          if (!f3(fH(this))) return;
          this._name || (e1 && fa.warn("Transaction has no name, falling back to `<unlabeled transaction>`."), this._name = "<unlabeled transaction>");
          let { scope: a10, isolationScope: b10 } = fR(this), c10 = a10?.getScopeData().sdkProcessingMetadata?.normalizedRequest;
          if (true !== this._sampled) return;
          let d10 = function(a11) {
            let b11 = /* @__PURE__ */ new Set();
            return !function a12(c11) {
              if (!b11.has(c11) && fI(c11)) for (let d11 of (b11.add(c11), c11[fK] ? Array.from(c11[fK]) : [])) a12(d11);
            }(a11), Array.from(b11);
          }(this).filter((a11) => {
            var b11;
            return a11 !== this && !((b11 = a11) instanceof f1 && b11.isStandaloneSpan());
          }).map((a11) => fH(a11)).filter(f3), e10 = this._attributes[fy];
          delete this._attributes[fC], d10.forEach((a11) => {
            delete a11.data[fC];
          });
          let f10 = { contexts: { trace: function(a11) {
            let { spanId: b11, traceId: c11 } = a11.spanContext(), { data: d11, op: e11, parent_span_id: f11, status: g3, origin: h2, links: i2 } = fH(a11);
            return { parent_span_id: f11, span_id: b11, trace_id: c11, data: d11, op: e11, status: g3, origin: h2, links: i2 };
          }(this) }, spans: d10.length > 1e3 ? d10.sort((a11, b11) => a11.start_timestamp - b11.start_timestamp).slice(0, 1e3) : d10, start_timestamp: this._startTime, timestamp: this._endTime, transaction: this._name, type: "transaction", sdkProcessingMetadata: { capturedSpanScope: a10, capturedSpanIsolationScope: b10, dynamicSamplingContext: fZ(this) }, request: c10, ...e10 && { transaction_info: { source: e10 } } }, g2 = f0(this._events);
          return g2 && Object.keys(g2).length && (e1 && fa.log("[Measurements] Adding measurements to transaction event", JSON.stringify(g2, void 0, 2)), f10.measurements = g2), f10;
        }
      }
      function f2(a10) {
        return a10 && "number" == typeof a10 || a10 instanceof Date || Array.isArray(a10);
      }
      function f3(a10) {
        return !!a10.start_timestamp && !!a10.timestamp && !!a10.span_id && !!a10.trace_id;
      }
      let f4 = "__SENTRY_SUPPRESS_TRACING__";
      function f5(a10, b10, c10) {
        let d10 = fx(), e10 = d10?.getOptions() || {}, { name: f10 = "" } = a10, g2 = { spanAttributes: { ...a10.attributes }, spanName: f10, parentSampled: c10 };
        d10?.emit("beforeSampling", g2, { decision: false });
        let h2 = g2.parentSampled ?? c10, i2 = g2.spanAttributes, j2 = b10.getPropagationContext(), [k2, l2, m2] = b10.getScopeData().sdkProcessingMetadata[f4] ? [false] : function(a11, b11, c11) {
          let d11, e11;
          if (!fT(a11)) return [false];
          "function" == typeof a11.tracesSampler ? (d11 = a11.tracesSampler({ ...b11, inheritOrSampleWith: (a12) => "number" == typeof b11.parentSampleRate ? b11.parentSampleRate : "boolean" == typeof b11.parentSampled ? Number(b11.parentSampled) : a12 }), e11 = true) : void 0 !== b11.parentSampled ? d11 = b11.parentSampled : void 0 !== a11.tracesSampleRate && (d11 = a11.tracesSampleRate, e11 = true);
          let f11 = fU(d11);
          if (void 0 === f11) return e1 && fa.warn(`[Tracing] Discarding root span because of invalid sample rate. Sample rate must be a boolean or a number between 0 and 1. Got ${JSON.stringify(d11)} of type ${JSON.stringify(typeof d11)}.`), [false];
          if (!f11) return e1 && fa.log(`[Tracing] Discarding transaction because ${"function" == typeof a11.tracesSampler ? "tracesSampler returned 0 or false" : "a negative sampling decision was inherited or tracesSampleRate is set to 0"}`), [false, f11, e11];
          let g3 = c11 < f11;
          return !g3 && e1 && fa.log(`[Tracing] Discarding transaction because it's not included in the random sample (sampling rate = ${Number(d11)})`), [g3, f11, e11];
        }(e10, { name: f10, parentSampled: h2, attributes: i2, parentSampleRate: fU(j2.dsc?.sample_rate) }, j2.sampleRand), n2 = new f1({ ...a10, attributes: { [fy]: "custom", [fz]: void 0 !== l2 && m2 ? l2 : void 0, ...i2 }, sampled: k2 });
        return !k2 && d10 && (e1 && fa.log("[Tracing] Discarding root span because its trace was not chosen to be sampled."), d10.recordDroppedEvent("sample_rate", "transaction")), d10 && d10.emit("spanStart", n2), n2;
      }
      let f6 = ["user", "level", "extra", "contexts", "tags", "fingerprint", "propagationContext"];
      async function f7(a10) {
        let b10 = fx();
        return b10 ? b10.flush(a10) : (e1 && fa.warn("Cannot flush events. No client defined."), Promise.resolve(false));
      }
      let f8 = "undefined" == typeof __SENTRY_DEBUG__ || __SENTRY_DEBUG__;
      async function f9() {
        try {
          f8 && fa.log("Flushing events..."), await f7(2e3), f8 && fa.log("Done flushing events");
        } catch (a10) {
          f8 && fa.log("Error while flushing events:\n", a10);
        }
      }
      function ga() {
        let a10 = Symbol.for("__cloudflare-context__");
        return eZ[a10]?.ctx;
      }
      function gb(a10) {
        return new Proxy(a10, { apply: async (a11, b10, c10) => {
          let d10 = "_sentryRewritesTunnelPath" in globalThis ? globalThis._sentryRewritesTunnelPath : void 0;
          if (d10 && "string" == typeof d10) {
            let a12 = c10[0];
            if (a12 instanceof Request && new URL(a12.url).pathname.startsWith(d10)) return new Response(null, { status: 200, headers: { "x-middleware-next": "1" } });
          }
          return function(...a12) {
            let b11 = fu(e$());
            if (2 === a12.length) {
              let [c11, d11] = a12;
              return c11 ? b11.withSetIsolationScope(c11, d11) : b11.withIsolationScope(d11);
            }
            return b11.withIsolationScope(a12[0]);
          }((d11) => {
            let e10, f10, g2 = c10[0], h2 = fv();
            g2 instanceof Request ? (d11.setSDKProcessingMetadata({ normalizedRequest: function(a12) {
              let b11 = function(a13) {
                let b12 = {};
                try {
                  a13.forEach((a14, c11) => {
                    "string" == typeof a14 && (b12[c11] = a14);
                  });
                } catch {
                }
                return b12;
              }(a12.headers);
              return { method: a12.method, url: a12.url, query_string: function(a13) {
                if (a13) try {
                  let b12 = new URL(a13, "http://s.io").search.slice(1);
                  return b12.length ? b12 : void 0;
                } catch {
                  return;
                }
              }(a12.url), headers: b11 };
            }(g2) }), e10 = `middleware ${g2.method}`, f10 = "url") : (e10 = "middleware", f10 = "component"), h2.setTransactionName(e10);
            let i2 = function() {
              let a12 = fu(e$());
              return a12.getActiveSpan ? a12.getActiveSpan() : fv()[fh];
            }();
            if (i2) {
              e10 = "middleware", f10 = "component";
              let a12 = fN(i2);
              a12 && fQ(a12, h2, d11);
            }
            return function(a12, b11) {
              let c11 = fu(e$());
              if (c11.startSpan) return c11.startSpan(a12, b11);
              let d12 = function(a13) {
                let b12 = { isStandalone: (a13.experimental || {}).standalone, ...a13 };
                if (a13.startTime) {
                  let c12 = { ...b12 };
                  return c12.startTimestamp = fF(a13.startTime), delete c12.startTime, c12;
                }
                return b12;
              }(a12), { forceTransaction: e11, parentSpan: f11, scope: g3 } = a12;
              return fw(g3?.clone(), () => {
                var c12;
                return (void 0 !== (c12 = f11) ? (a13) => function(a14, b12) {
                  let c13 = fu(e$());
                  return c13.withActiveSpan ? c13.withActiveSpan(a14, b12) : fw((c14) => (fi(c14, a14 || void 0), b12(c14)));
                }(c12, a13) : (a13) => a13())(() => {
                  let c13 = fv(), g4 = function(a13, b12) {
                    if (b12) return b12;
                    if (null === b12) return;
                    let c14 = a13[fh];
                    if (!c14) return;
                    let d13 = fx();
                    return (d13 ? d13.getOptions() : {}).parentSpanIsAlwaysRootSpan ? fN(c14) : c14;
                  }(c13, f11), h3 = a12.onlyIfParent && !g4 ? new f$() : function({ parentSpan: a13, spanArguments: b12, forceTransaction: c14, scope: d13 }) {
                    let e12;
                    if (!fT()) {
                      let d14 = new f$();
                      if (c14 || !a13) {
                        let a14 = { sampled: "false", sample_rate: "0", transaction: b12.name, ...fZ(d14) };
                        fg(d14, fY, a14);
                      }
                      return d14;
                    }
                    let f12 = fu(e$()).getIsolationScope();
                    if (a13 && !c14) e12 = function(a14, b13, c15) {
                      let { spanId: d14, traceId: e13 } = a14.spanContext(), f13 = !b13.getScopeData().sdkProcessingMetadata[f4] && fI(a14), g5 = f13 ? new f1({ ...c15, parentSpanId: d14, traceId: e13, sampled: f13 }) : new f$({ traceId: e13 });
                      fM(a14, g5);
                      let h4 = fx();
                      return h4 && (h4.emit("spanStart", g5), c15.endTimestamp && h4.emit("spanEnd", g5)), g5;
                    }(a13, d13, b12), fM(a13, e12);
                    else if (a13) {
                      let c15 = fZ(a13), { traceId: f13, spanId: g5 } = a13.spanContext(), h4 = fI(a13);
                      fg(e12 = f5({ traceId: f13, parentSpanId: g5, ...b12 }, d13, h4), fY, c15);
                    } else {
                      let { traceId: a14, dsc: c15, parentSpanId: g5, sampled: h4 } = { ...f12.getPropagationContext(), ...d13.getPropagationContext() };
                      e12 = f5({ traceId: a14, parentSpanId: g5, ...b12 }, d13, h4), c15 && fg(e12, fY, c15);
                    }
                    return !function(a14) {
                      if (!e1) return;
                      let { description: b13 = "< unknown name >", op: c15 = "< unknown op >", parent_span_id: d14 } = fH(a14), { spanId: e13 } = a14.spanContext(), f13 = fI(a14), g5 = fN(a14), h4 = g5 === a14, i3 = `[Tracing] Starting ${f13 ? "sampled" : "unsampled"} ${h4 ? "root " : ""}span`, j2 = [`op: ${c15}`, `name: ${b13}`, `ID: ${e13}`];
                      if (d14 && j2.push(`parent ID: ${d14}`), !h4) {
                        let { op: a15, description: b14 } = fH(g5);
                        j2.push(`root ID: ${g5.spanContext().spanId}`), a15 && j2.push(`root op: ${a15}`), b14 && j2.push(`root description: ${b14}`);
                      }
                      fa.log(`${i3}
  ${j2.join("\n  ")}`);
                    }(e12), fQ(e12, d13, f12), e12;
                  }({ parentSpan: g4, spanArguments: d12, forceTransaction: e11, scope: c13 });
                  return fi(c13, h3), fS(() => b11(h3), () => {
                    let { status: a13 } = fH(h3);
                    h3.isRecording() && (!a13 || "ok" === a13) && h3.setStatus({ code: 2, message: "internal_error" });
                  }, () => {
                    h3.end();
                  });
                });
              });
            }({ name: e10, op: "http.server.middleware", attributes: { [fy]: f10, [fB]: "auto.function.nextjs.wrap_middleware" } }, () => fS(() => a11.apply(b10, c10), (a12) => {
              fv().captureException(a12, function(a13) {
                if (a13) {
                  var b11;
                  return (b11 = a13) instanceof fk || "function" == typeof b11 || Object.keys(a13).some((a14) => f6.includes(a14)) ? { captureContext: a13 } : a13;
                }
              }({ mechanism: { type: "auto.function.nextjs.wrap_middleware", handled: false } }));
            }, () => {
              !function(a12) {
                if ("function" == typeof ga()?.waitUntil) {
                  var b11;
                  return b11 = a12, ga()?.waitUntil(b11);
                }
                let c11 = eZ[Symbol.for("@vercel/request-context")], d12 = c11?.get?.();
                d12?.waitUntil && d12.waitUntil(a12);
              }(f9());
            }));
          });
        } });
      }
      let gc = { matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"] };
      var gd = Object.freeze({ __proto__: null, config: gc, middleware: async function(a10) {
        let b10 = a10.nextUrl.pathname, c10 = a10.headers.get("x-forwarded-host")?.toLowerCase().split(":")[0] ?? a10.headers.get("host")?.toLowerCase().split(":")[0] ?? "";
        if ("clarityhome.chapaisolutions.com" === c10) {
          let c11 = new URL(("/" === b10 ? "/ccrn" : b10) + a10.nextUrl.search, "https://clarityccrn.chapaisolutions.com");
          return ac.redirect(c11);
        }
        if ("/" === b10 && "clarityccrn.chapaisolutions.com" === c10) return ac.redirect(new URL("/ccrn", a10.url));
        if ("/" === b10 && "claritynclex.chapaisolutions.com" === c10) return ac.redirect(new URL("/nclex", a10.url));
        if ("/home" === b10) return ac.redirect(new URL("/", a10.url));
        let d10 = process.env.NEXT_PUBLIC_SUPABASE_URL, e10 = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!d10 || !e10) return ac.next({ request: { headers: a10.headers } });
        let f10 = ac.next({ request: { headers: a10.headers } }), g2 = function(a11, b11, c11) {
          if (!a11 || !b11) throw Error(`Your project's URL and Key are required to create a Supabase client!

Check your Supabase project's API settings to find these values

https://supabase.com/dashboard/project/_/settings/api`);
          let { storage: d11, getAll: e11, setAll: f11, setItems: g3, removedItems: h3 } = function(a12, b12) {
            let c12, d12, e12 = a12.cookies ?? null, f12 = a12.cookieEncoding, g4 = {}, h4 = {};
            if (e12) if ("get" in e12) {
              let a13 = async (a14) => {
                let b13 = a14.flatMap((a15) => [a15, ...Array.from({ length: 5 }).map((b14, c14) => `${a15}.${c14}`)]), c13 = [];
                for (let a15 = 0; a15 < b13.length; a15 += 1) {
                  let d13 = await e12.get(b13[a15]);
                  (d13 || "string" == typeof d13) && c13.push({ name: b13[a15], value: d13 });
                }
                return c13;
              };
              if (c12 = async (b13) => await a13(b13), "set" in e12 && "remove" in e12) d12 = async (a14) => {
                for (let b13 = 0; b13 < a14.length; b13 += 1) {
                  let { name: c13, value: d13, options: f13 } = a14[b13];
                  d13 ? await e12.set(c13, d13, f13) : await e12.remove(c13, f13);
                }
              };
              else if (b12) d12 = async () => {
                console.warn("@supabase/ssr: createServerClient was configured without set and remove cookie methods, but the client needs to set cookies. This can lead to issues such as random logouts, early session termination or increased token refresh requests. If in NextJS, check your middleware.ts file, route handlers and server actions for correctness. Consider switching to the getAll and setAll cookie methods instead of get, set and remove which are deprecated and can be difficult to use correctly.");
              };
              else throw Error("@supabase/ssr: createBrowserClient requires configuring a getAll and setAll cookie method (deprecated: alternatively both get, set and remove can be used)");
            } else if ("getAll" in e12) if (c12 = async () => await e12.getAll(), "setAll" in e12) d12 = e12.setAll;
            else if (b12) d12 = async () => {
              console.warn("@supabase/ssr: createServerClient was configured without the setAll cookie method, but the client needs to set cookies. This can lead to issues such as random logouts, early session termination or increased token refresh requests. If in NextJS, check your middleware.ts file, route handlers and server actions for correctness.");
            };
            else throw Error("@supabase/ssr: createBrowserClient requires configuring both getAll and setAll cookie methods (deprecated: alternatively both get, set and remove can be used)");
            else throw Error(`@supabase/ssr: ${b12 ? "createServerClient" : "createBrowserClient"} requires configuring getAll and setAll cookie methods (deprecated: alternatively use get, set and remove).${bG() ? " As this is called in a browser runtime, consider removing the cookies option object to use the document.cookie API automatically." : ""}`);
            else if (!b12 && bG()) c12 = () => (() => {
              let a13 = (0, bF.qg)(document.cookie);
              return Object.keys(a13).map((b13) => ({ name: b13, value: a13[b13] ?? "" }));
            })(), d12 = (a13) => {
              a13.forEach(({ name: a14, value: b13, options: c13 }) => {
                document.cookie = (0, bF.lK)(a14, b13, c13);
              });
            };
            else if (b12) throw Error("@supabase/ssr: createServerClient must be initialized with cookie options that specify getAll and setAll functions (deprecated, not recommended: alternatively use get, set and remove)");
            else c12 = () => [], d12 = () => {
              throw Error("@supabase/ssr: createBrowserClient in non-browser runtimes (including Next.js pre-rendering mode) was not initialized cookie options that specify getAll and setAll functions (deprecated: alternatively use get, set and remove), but they were needed");
            };
            return b12 ? { getAll: c12, setAll: d12, setItems: g4, removedItems: h4, storage: { isServer: true, getItem: async (a13) => {
              if ("string" == typeof g4[a13]) return g4[a13];
              if (h4[a13]) return null;
              let b13 = await c12([a13]), d13 = await bL(a13, async (a14) => {
                let c13 = b13?.find(({ name: b14 }) => b14 === a14) || null;
                return c13 ? c13.value : null;
              });
              if (!d13) return null;
              let e13 = d13;
              return "string" == typeof d13 && d13.startsWith(bR) && (e13 = bQ(d13.substring(bR.length))), e13;
            }, setItem: async (b13, e13) => {
              b13.endsWith("-code-verifier") && await bS({ getAll: c12, setAll: d12, setItems: { [b13]: e13 }, removedItems: {} }, { cookieOptions: a12?.cookieOptions ?? null, cookieEncoding: f12 }), g4[b13] = e13, delete h4[b13];
            }, removeItem: async (a13) => {
              delete g4[a13], h4[a13] = true;
            } } } : { getAll: c12, setAll: d12, setItems: g4, removedItems: h4, storage: { isServer: false, getItem: async (a13) => {
              let b13 = await c12([a13]), d13 = await bL(a13, async (a14) => {
                let c13 = b13?.find(({ name: b14 }) => b14 === a14) || null;
                return c13 ? c13.value : null;
              });
              if (!d13) return null;
              let e13 = d13;
              return d13.startsWith(bR) && (e13 = bQ(d13.substring(bR.length))), e13;
            }, setItem: async (b13, e13) => {
              let g5 = await c12([b13]), h5 = new Set((g5?.map(({ name: a13 }) => a13) || []).filter((a13) => bJ(a13, b13))), i3 = e13;
              "base64url" === f12 && (i3 = bR + bP(e13));
              let j2 = bK(b13, i3);
              j2.forEach(({ name: a13 }) => {
                h5.delete(a13);
              });
              let k2 = { ...bH, ...a12?.cookieOptions, maxAge: 0 }, l2 = { ...bH, ...a12?.cookieOptions, maxAge: bH.maxAge };
              delete k2.name, delete l2.name;
              let m2 = [...[...h5].map((a13) => ({ name: a13, value: "", options: k2 })), ...j2.map(({ name: a13, value: b14 }) => ({ name: a13, value: b14, options: l2 }))];
              m2.length > 0 && await d12(m2, {});
            }, removeItem: async (b13) => {
              let e13 = await c12([b13]), f13 = (e13?.map(({ name: a13 }) => a13) || []).filter((a13) => bJ(a13, b13)), g5 = { ...bH, ...a12?.cookieOptions, maxAge: 0 };
              delete g5.name, f13.length > 0 && await d12(f13.map((a13) => ({ name: a13, value: "", options: g5 })), {});
            } } };
          }({ ...c11, cookieEncoding: c11?.cookieEncoding ?? "base64url" }, true), i2 = new eX(a11, b11, { ...c11, global: { ...c11?.global, headers: { ...c11?.global?.headers, "X-Client-Info": "supabase-ssr/0.10.0 createServerClient" } }, auth: { ...c11?.cookieOptions?.name ? { storageKey: c11.cookieOptions.name } : null, ...c11?.auth, flowType: "pkce", autoRefreshToken: false, detectSessionInUrl: false, persistSession: true, skipAutoInitialize: true, storage: d11, ...c11?.cookies && "encode" in c11.cookies && "tokens-only" === c11.cookies.encode ? { userStorage: c11?.auth?.userStorage ?? /* @__PURE__ */ function(a12 = {}) {
            return { getItem: (b12) => a12[b12] || null, setItem: (b12, c12) => {
              a12[b12] = c12;
            }, removeItem: (b12) => {
              delete a12[b12];
            } };
          }() } : null } });
          return i2.auth.onAuthStateChange(async (a12) => {
            (Object.keys(g3).length > 0 || Object.keys(h3).length > 0) && ("SIGNED_IN" === a12 || "TOKEN_REFRESHED" === a12 || "USER_UPDATED" === a12 || "PASSWORD_RECOVERY" === a12 || "SIGNED_OUT" === a12 || "MFA_CHALLENGE_VERIFIED" === a12) && await bS({ getAll: e11, setAll: f11, setItems: g3, removedItems: h3 }, { cookieOptions: c11?.cookieOptions ?? null, cookieEncoding: c11?.cookieEncoding ?? "base64url" });
          }), i2;
        }(d10, e10, { cookies: { getAll: () => a10.cookies.getAll(), setAll(b11) {
          b11.forEach(({ name: b12, value: c11 }) => a10.cookies.set(b12, c11)), f10 = ac.next({ request: { headers: a10.headers } }), b11.forEach(({ name: a11, value: b12, options: c11 }) => {
            f10.cookies.set(a11, b12, c11);
          });
        } } }), { data: { user: h2 } } = await g2.auth.getUser();
        if (b10.startsWith("/account") && !h2) {
          let c11 = new URL("/auth/login", a10.url), d11 = `${b10}${a10.nextUrl.search}`;
          return c11.searchParams.set("next", d11 || "/account/billing"), ac.redirect(c11);
        }
        if ("/auth/login" === b10 && h2) {
          let b11 = a10.nextUrl.searchParams.get("next"), c11 = new URL(b11?.startsWith("/") ? b11 : "/account/billing", a10.url);
          return ac.redirect(c11);
        }
        return f10;
      } });
      let ge = false, gf = false;
      "middleware" in gd && "function" == typeof gd.middleware ? (i = gd.middleware, ge = true) : "proxy" in gd && "function" == typeof gd.proxy ? (i = gd.proxy, gf = true) : "default" in gd && "function" == typeof gd.default ? j = gd.default : "function" == typeof gd && (j = gd);
      let gg = i ? gb(i) : void 0, gh = ge ? gg : void 0, gi = gf ? gg : void 0, gj = j ? gb(j) : void 0;
      Object.values({ NOT_FOUND: 404, FORBIDDEN: 403, UNAUTHORIZED: 401 });
      let gk = { ...r }, gl = gk.middleware || gk.default, gm = "/src/middleware";
      if ("function" != typeof gl) throw Object.defineProperty(Error(`The Middleware "${gm}" must export a \`middleware\` or a \`default\` function`), "__NEXT_ERROR_CODE", { value: "E120", enumerable: false, configurable: true });
      function gn(a10) {
        return bs({ ...a10, page: gm, handler: async (...a11) => {
          try {
            return await gl(...a11);
          } catch (e10) {
            let b10 = a11[0], c10 = new URL(b10.url), d10 = c10.pathname + c10.search;
            throw await v(e10, { path: d10, method: b10.method, headers: Object.fromEntries(b10.headers.entries()) }, { routerKind: "Pages Router", routePath: "/middleware", routeType: "middleware", revalidateReason: void 0 }), e10;
          }
        } });
      }
    }, 521: (a) => {
      "use strict";
      a.exports = (init_node_async_hooks(), __toCommonJS(node_async_hooks_exports));
    }, 643: (a, b, c) => {
      "use strict";
      a.exports = c(663);
    }, 663: (a, b) => {
      "use strict";
      Symbol.for("react.transitional.element"), Symbol.for("react.portal"), Symbol.for("react.fragment"), Symbol.for("react.strict_mode"), Symbol.for("react.profiler"), Symbol.for("react.forward_ref"), Symbol.for("react.suspense"), Symbol.for("react.memo"), Symbol.for("react.lazy"), Symbol.iterator;
      Object.prototype.hasOwnProperty, Object.assign;
    }, 764: (a, b, c) => {
      "use strict";
      var d = c(356).Buffer;
      Object.defineProperty(b, "__esModule", { value: true }), !function(a2, b2) {
        for (var c2 in b2) Object.defineProperty(a2, c2, { enumerable: true, get: b2[c2] });
      }(b, { handleFetch: function() {
        return h;
      }, interceptFetch: function() {
        return i;
      }, reader: function() {
        return f;
      } });
      let e = c(917), f = { url: (a2) => a2.url, header: (a2, b2) => a2.headers.get(b2) };
      async function g(a2, b2) {
        let { url: c2, method: e2, headers: f2, body: g2, cache: h2, credentials: i2, integrity: j, mode: k, redirect: l, referrer: m, referrerPolicy: n } = b2;
        return { testData: a2, api: "fetch", request: { url: c2, method: e2, headers: [...Array.from(f2), ["next-test-stack", function() {
          let a3 = (Error().stack ?? "").split("\n");
          for (let b3 = 1; b3 < a3.length; b3++) if (a3[b3].length > 0) {
            a3 = a3.slice(b3);
            break;
          }
          return (a3 = (a3 = (a3 = a3.filter((a4) => !a4.includes("/next/dist/"))).slice(0, 5)).map((a4) => a4.replace("webpack-internal:///(rsc)/", "").trim())).join("    ");
        }()]], body: g2 ? d.from(await b2.arrayBuffer()).toString("base64") : null, cache: h2, credentials: i2, integrity: j, mode: k, redirect: l, referrer: m, referrerPolicy: n } };
      }
      async function h(a2, b2) {
        let c2 = (0, e.getTestReqInfo)(b2, f);
        if (!c2) return a2(b2);
        let { testData: h2, proxyPort: i2 } = c2, j = await g(h2, b2), k = await a2(`http://localhost:${i2}`, { method: "POST", body: JSON.stringify(j), next: { internal: true } });
        if (!k.ok) throw Object.defineProperty(Error(`Proxy request failed: ${k.status}`), "__NEXT_ERROR_CODE", { value: "E146", enumerable: false, configurable: true });
        let l = await k.json(), { api: m } = l;
        switch (m) {
          case "continue":
            return a2(b2);
          case "abort":
          case "unhandled":
            throw Object.defineProperty(Error(`Proxy request aborted [${b2.method} ${b2.url}]`), "__NEXT_ERROR_CODE", { value: "E145", enumerable: false, configurable: true });
          case "fetch":
            let { status: n, headers: o, body: p } = l.response;
            return new Response(p ? d.from(p, "base64") : null, { status: n, headers: new Headers(o) });
          default:
            return m;
        }
      }
      function i(a2) {
        return c.g.fetch = function(b2, c2) {
          var d2;
          return (null == c2 || null == (d2 = c2.next) ? void 0 : d2.internal) ? a2(b2, c2) : h(a2, new Request(b2, c2));
        }, () => {
          c.g.fetch = a2;
        };
      }
    }, 766: (a) => {
      (() => {
        "use strict";
        "undefined" != typeof __nccwpck_require__ && (__nccwpck_require__.ab = "//");
        var b = {};
        (() => {
          b.parse = function(b2, c2) {
            if ("string" != typeof b2) throw TypeError("argument str must be a string");
            for (var e2 = {}, f = b2.split(d), g = (c2 || {}).decode || a2, h = 0; h < f.length; h++) {
              var i = f[h], j = i.indexOf("=");
              if (!(j < 0)) {
                var k = i.substr(0, j).trim(), l = i.substr(++j, i.length).trim();
                '"' == l[0] && (l = l.slice(1, -1)), void 0 == e2[k] && (e2[k] = function(a3, b3) {
                  try {
                    return b3(a3);
                  } catch (b4) {
                    return a3;
                  }
                }(l, g));
              }
            }
            return e2;
          }, b.serialize = function(a3, b2, d2) {
            var f = d2 || {}, g = f.encode || c;
            if ("function" != typeof g) throw TypeError("option encode is invalid");
            if (!e.test(a3)) throw TypeError("argument name is invalid");
            var h = g(b2);
            if (h && !e.test(h)) throw TypeError("argument val is invalid");
            var i = a3 + "=" + h;
            if (null != f.maxAge) {
              var j = f.maxAge - 0;
              if (isNaN(j) || !isFinite(j)) throw TypeError("option maxAge is invalid");
              i += "; Max-Age=" + Math.floor(j);
            }
            if (f.domain) {
              if (!e.test(f.domain)) throw TypeError("option domain is invalid");
              i += "; Domain=" + f.domain;
            }
            if (f.path) {
              if (!e.test(f.path)) throw TypeError("option path is invalid");
              i += "; Path=" + f.path;
            }
            if (f.expires) {
              if ("function" != typeof f.expires.toUTCString) throw TypeError("option expires is invalid");
              i += "; Expires=" + f.expires.toUTCString();
            }
            if (f.httpOnly && (i += "; HttpOnly"), f.secure && (i += "; Secure"), f.sameSite) switch ("string" == typeof f.sameSite ? f.sameSite.toLowerCase() : f.sameSite) {
              case true:
              case "strict":
                i += "; SameSite=Strict";
                break;
              case "lax":
                i += "; SameSite=Lax";
                break;
              case "none":
                i += "; SameSite=None";
                break;
              default:
                throw TypeError("option sameSite is invalid");
            }
            return i;
          };
          var a2 = decodeURIComponent, c = encodeURIComponent, d = /; */, e = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
        })(), a.exports = b;
      })();
    }, 822: (a, b, c) => {
      "use strict";
      var d, e, f, g, h, i;
      c.r(b), c.d(b, { DiagConsoleLogger: () => F, DiagLogLevel: () => d, INVALID_SPANID: () => ad, INVALID_SPAN_CONTEXT: () => af, INVALID_TRACEID: () => ae, ProxyTracer: () => ax, ProxyTracerProvider: () => aA, ROOT_CONTEXT: () => C, SamplingDecision: () => g, SpanKind: () => h, SpanStatusCode: () => i, TraceFlags: () => f, ValueType: () => e, baggageEntryMetadataFromString: () => z, context: () => aJ, createContextKey: () => A, createNoopMeter: () => Y, createTraceState: () => aI, default: () => a1, defaultTextMapGetter: () => Z, defaultTextMapSetter: () => $, diag: () => aK, isSpanContextValid: () => as, isValidSpanId: () => ar, isValidTraceId: () => aq, metrics: () => aP, propagation: () => aZ, trace: () => a0 });
      let j = "1.9.1", k = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/, l = function(a2) {
        let b2 = /* @__PURE__ */ new Set([a2]), c2 = /* @__PURE__ */ new Set(), d2 = a2.match(k);
        if (!d2) return () => false;
        let e2 = { major: +d2[1], minor: +d2[2], patch: +d2[3], prerelease: d2[4] };
        if (null != e2.prerelease) return function(b3) {
          return b3 === a2;
        };
        function f2(a3) {
          return c2.add(a3), false;
        }
        return function(a3) {
          if (b2.has(a3)) return true;
          if (c2.has(a3)) return false;
          let d3 = a3.match(k);
          if (!d3) return f2(a3);
          let g2 = { major: +d3[1], minor: +d3[2], patch: +d3[3], prerelease: d3[4] };
          if (null != g2.prerelease || e2.major !== g2.major) return f2(a3);
          if (0 === e2.major) return e2.minor === g2.minor && e2.patch <= g2.patch ? (b2.add(a3), true) : f2(a3);
          return e2.minor <= g2.minor ? (b2.add(a3), true) : f2(a3);
        };
      }(j), m = j.split(".")[0], n = Symbol.for(`opentelemetry.js.api.${m}`), o = "object" == typeof globalThis ? globalThis : "object" == typeof self ? self : "object" == typeof window ? window : "object" == typeof c.g ? c.g : {};
      function p(a2, b2, c2, d2 = false) {
        var e2;
        let f2 = o[n] = null != (e2 = o[n]) ? e2 : { version: j };
        if (!d2 && f2[a2]) {
          let b3 = Error(`@opentelemetry/api: Attempted duplicate registration of API: ${a2}`);
          return c2.error(b3.stack || b3.message), false;
        }
        if (f2.version !== j) {
          let b3 = Error(`@opentelemetry/api: Registration of version v${f2.version} for ${a2} does not match previously registered API v${j}`);
          return c2.error(b3.stack || b3.message), false;
        }
        return f2[a2] = b2, c2.debug(`@opentelemetry/api: Registered a global for ${a2} v${j}.`), true;
      }
      function q(a2) {
        var b2, c2;
        let d2 = null == (b2 = o[n]) ? void 0 : b2.version;
        if (d2 && l(d2)) return null == (c2 = o[n]) ? void 0 : c2[a2];
      }
      function r(a2, b2) {
        b2.debug(`@opentelemetry/api: Unregistering a global for ${a2} v${j}.`);
        let c2 = o[n];
        c2 && delete c2[a2];
      }
      class s {
        constructor(a2) {
          this._namespace = a2.namespace || "DiagComponentLogger";
        }
        debug(...a2) {
          return t("debug", this._namespace, a2);
        }
        error(...a2) {
          return t("error", this._namespace, a2);
        }
        info(...a2) {
          return t("info", this._namespace, a2);
        }
        warn(...a2) {
          return t("warn", this._namespace, a2);
        }
        verbose(...a2) {
          return t("verbose", this._namespace, a2);
        }
      }
      function t(a2, b2, c2) {
        let d2 = q("diag");
        if (d2) return d2[a2](b2, ...c2);
      }
      !function(a2) {
        a2[a2.NONE = 0] = "NONE", a2[a2.ERROR = 30] = "ERROR", a2[a2.WARN = 50] = "WARN", a2[a2.INFO = 60] = "INFO", a2[a2.DEBUG = 70] = "DEBUG", a2[a2.VERBOSE = 80] = "VERBOSE", a2[a2.ALL = 9999] = "ALL";
      }(d || (d = {}));
      class u {
        static instance() {
          return this._instance || (this._instance = new u()), this._instance;
        }
        constructor() {
          function a2(a3) {
            return function(...b3) {
              let c3 = q("diag");
              if (c3) return c3[a3](...b3);
            };
          }
          let b2 = this, c2 = (a3, c3 = { logLevel: d.INFO }) => {
            var e2, f2, g2;
            if (a3 === b2) {
              let a4 = Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");
              return b2.error(null != (e2 = a4.stack) ? e2 : a4.message), false;
            }
            "number" == typeof c3 && (c3 = { logLevel: c3 });
            let h2 = q("diag"), i2 = function(a4, b3) {
              function c4(c5, d2) {
                let e3 = b3[c5];
                return "function" == typeof e3 && a4 >= d2 ? e3.bind(b3) : function() {
                };
              }
              return a4 < d.NONE ? a4 = d.NONE : a4 > d.ALL && (a4 = d.ALL), b3 = b3 || {}, { error: c4("error", d.ERROR), warn: c4("warn", d.WARN), info: c4("info", d.INFO), debug: c4("debug", d.DEBUG), verbose: c4("verbose", d.VERBOSE) };
            }(null != (f2 = c3.logLevel) ? f2 : d.INFO, a3);
            if (h2 && !c3.suppressOverrideMessage) {
              let a4 = null != (g2 = Error().stack) ? g2 : "<failed to generate stacktrace>";
              h2.warn(`Current logger will be overwritten from ${a4}`), i2.warn(`Current logger will overwrite one already registered from ${a4}`);
            }
            return p("diag", i2, b2, true);
          };
          b2.setLogger = c2, b2.disable = () => {
            r("diag", b2);
          }, b2.createComponentLogger = (a3) => new s(a3), b2.verbose = a2("verbose"), b2.debug = a2("debug"), b2.info = a2("info"), b2.warn = a2("warn"), b2.error = a2("error");
        }
      }
      class v {
        constructor(a2) {
          this._entries = a2 ? new Map(a2) : /* @__PURE__ */ new Map();
        }
        getEntry(a2) {
          let b2 = this._entries.get(a2);
          if (b2) return Object.assign({}, b2);
        }
        getAllEntries() {
          return Array.from(this._entries.entries());
        }
        setEntry(a2, b2) {
          let c2 = new v(this._entries);
          return c2._entries.set(a2, b2), c2;
        }
        removeEntry(a2) {
          let b2 = new v(this._entries);
          return b2._entries.delete(a2), b2;
        }
        removeEntries(...a2) {
          let b2 = new v(this._entries);
          for (let c2 of a2) b2._entries.delete(c2);
          return b2;
        }
        clear() {
          return new v();
        }
      }
      let w = Symbol("BaggageEntryMetadata"), x = u.instance();
      function y(a2 = {}) {
        return new v(new Map(Object.entries(a2)));
      }
      function z(a2) {
        return "string" != typeof a2 && (x.error(`Cannot create baggage metadata from unknown type: ${typeof a2}`), a2 = ""), { __TYPE__: w, toString: () => a2 };
      }
      function A(a2) {
        return Symbol.for(a2);
      }
      class B {
        constructor(a2) {
          let b2 = this;
          b2._currentContext = a2 ? new Map(a2) : /* @__PURE__ */ new Map(), b2.getValue = (a3) => b2._currentContext.get(a3), b2.setValue = (a3, c2) => {
            let d2 = new B(b2._currentContext);
            return d2._currentContext.set(a3, c2), d2;
          }, b2.deleteValue = (a3) => {
            let c2 = new B(b2._currentContext);
            return c2._currentContext.delete(a3), c2;
          };
        }
      }
      let C = new B(), D = [{ n: "error", c: "error" }, { n: "warn", c: "warn" }, { n: "info", c: "info" }, { n: "debug", c: "debug" }, { n: "verbose", c: "trace" }], E = {};
      if ("undefined" != typeof console) for (let a2 of ["error", "warn", "info", "debug", "trace", "log"]) "function" == typeof console[a2] && (E[a2] = console[a2]);
      class F {
        constructor() {
          for (let a2 = 0; a2 < D.length; a2++) this[D[a2].n] = /* @__PURE__ */ function(a3) {
            return function(...b2) {
              let c2 = E[a3];
              if ("function" != typeof c2 && (c2 = E.log), "function" != typeof c2 && console && "function" != typeof (c2 = console[a3]) && (c2 = console.log), "function" == typeof c2) return c2.apply(console, b2);
            };
          }(D[a2].c);
        }
      }
      class G {
        constructor() {
        }
        createGauge(a2, b2) {
          return S;
        }
        createHistogram(a2, b2) {
          return T;
        }
        createCounter(a2, b2) {
          return R;
        }
        createUpDownCounter(a2, b2) {
          return U;
        }
        createObservableGauge(a2, b2) {
          return W;
        }
        createObservableCounter(a2, b2) {
          return V;
        }
        createObservableUpDownCounter(a2, b2) {
          return X;
        }
        addBatchObservableCallback(a2, b2) {
        }
        removeBatchObservableCallback(a2) {
        }
      }
      class H {
      }
      class I extends H {
        add(a2, b2) {
        }
      }
      class J extends H {
        add(a2, b2) {
        }
      }
      class K extends H {
        record(a2, b2) {
        }
      }
      class L extends H {
        record(a2, b2) {
        }
      }
      class M {
        addCallback(a2) {
        }
        removeCallback(a2) {
        }
      }
      class N extends M {
      }
      class O extends M {
      }
      class P extends M {
      }
      let Q = new G(), R = new I(), S = new K(), T = new L(), U = new J(), V = new N(), W = new O(), X = new P();
      function Y() {
        return Q;
      }
      !function(a2) {
        a2[a2.INT = 0] = "INT", a2[a2.DOUBLE = 1] = "DOUBLE";
      }(e || (e = {}));
      let Z = { get(a2, b2) {
        if (null != a2) return a2[b2];
      }, keys: (a2) => null == a2 ? [] : Object.keys(a2) }, $ = { set(a2, b2, c2) {
        null != a2 && (a2[b2] = c2);
      } };
      class _ {
        active() {
          return C;
        }
        with(a2, b2, c2, ...d2) {
          return b2.call(c2, ...d2);
        }
        bind(a2, b2) {
          return b2;
        }
        enable() {
          return this;
        }
        disable() {
          return this;
        }
      }
      let aa = "context", ab = new _();
      class ac {
        constructor() {
        }
        static getInstance() {
          return this._instance || (this._instance = new ac()), this._instance;
        }
        setGlobalContextManager(a2) {
          return p(aa, a2, u.instance());
        }
        active() {
          return this._getContextManager().active();
        }
        with(a2, b2, c2, ...d2) {
          return this._getContextManager().with(a2, b2, c2, ...d2);
        }
        bind(a2, b2) {
          return this._getContextManager().bind(a2, b2);
        }
        _getContextManager() {
          return q(aa) || ab;
        }
        disable() {
          this._getContextManager().disable(), r(aa, u.instance());
        }
      }
      !function(a2) {
        a2[a2.NONE = 0] = "NONE", a2[a2.SAMPLED = 1] = "SAMPLED";
      }(f || (f = {}));
      let ad = "0000000000000000", ae = "00000000000000000000000000000000", af = { traceId: ae, spanId: ad, traceFlags: f.NONE };
      class ag {
        constructor(a2 = af) {
          this._spanContext = a2;
        }
        spanContext() {
          return this._spanContext;
        }
        setAttribute(a2, b2) {
          return this;
        }
        setAttributes(a2) {
          return this;
        }
        addEvent(a2, b2) {
          return this;
        }
        addLink(a2) {
          return this;
        }
        addLinks(a2) {
          return this;
        }
        setStatus(a2) {
          return this;
        }
        updateName(a2) {
          return this;
        }
        end(a2) {
        }
        isRecording() {
          return false;
        }
        recordException(a2, b2) {
        }
      }
      let ah = A("OpenTelemetry Context Key SPAN");
      function ai(a2) {
        return a2.getValue(ah) || void 0;
      }
      function aj() {
        return ai(ac.getInstance().active());
      }
      function ak(a2, b2) {
        return a2.setValue(ah, b2);
      }
      function al(a2) {
        return a2.deleteValue(ah);
      }
      function am(a2, b2) {
        return ak(a2, new ag(b2));
      }
      function an(a2) {
        var b2;
        return null == (b2 = ai(a2)) ? void 0 : b2.spanContext();
      }
      let ao = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]);
      function ap(a2, b2) {
        if ("string" != typeof a2 || a2.length !== b2) return false;
        let c2 = 0;
        for (let b3 = 0; b3 < a2.length; b3 += 4) c2 += (0 | ao[a2.charCodeAt(b3)]) + (0 | ao[a2.charCodeAt(b3 + 1)]) + (0 | ao[a2.charCodeAt(b3 + 2)]) + (0 | ao[a2.charCodeAt(b3 + 3)]);
        return c2 === b2;
      }
      function aq(a2) {
        return ap(a2, 32) && a2 !== ae;
      }
      function ar(a2) {
        return ap(a2, 16) && a2 !== ad;
      }
      function as(a2) {
        return aq(a2.traceId) && ar(a2.spanId);
      }
      function at(a2) {
        return new ag(a2);
      }
      let au = ac.getInstance();
      class av {
        startSpan(a2, b2, c2 = au.active()) {
          var d2;
          if (null == b2 ? void 0 : b2.root) return new ag();
          let e2 = c2 && an(c2);
          return null !== (d2 = e2) && "object" == typeof d2 && "spanId" in d2 && "string" == typeof d2.spanId && "traceId" in d2 && "string" == typeof d2.traceId && "traceFlags" in d2 && "number" == typeof d2.traceFlags && as(e2) ? new ag(e2) : new ag();
        }
        startActiveSpan(a2, b2, c2, d2) {
          let e2, f2, g2;
          if (arguments.length < 2) return;
          2 == arguments.length ? g2 = b2 : 3 == arguments.length ? (e2 = b2, g2 = c2) : (e2 = b2, f2 = c2, g2 = d2);
          let h2 = null != f2 ? f2 : au.active(), i2 = this.startSpan(a2, e2, h2), j2 = ak(h2, i2);
          return au.with(j2, g2, void 0, i2);
        }
      }
      let aw = new av();
      class ax {
        constructor(a2, b2, c2, d2) {
          this._provider = a2, this.name = b2, this.version = c2, this.options = d2;
        }
        startSpan(a2, b2, c2) {
          return this._getTracer().startSpan(a2, b2, c2);
        }
        startActiveSpan(a2, b2, c2, d2) {
          let e2 = this._getTracer();
          return Reflect.apply(e2.startActiveSpan, e2, arguments);
        }
        _getTracer() {
          if (this._delegate) return this._delegate;
          let a2 = this._provider.getDelegateTracer(this.name, this.version, this.options);
          return a2 ? (this._delegate = a2, this._delegate) : aw;
        }
      }
      class ay {
        getTracer(a2, b2, c2) {
          return new av();
        }
      }
      let az = new ay();
      class aA {
        getTracer(a2, b2, c2) {
          var d2;
          return null != (d2 = this.getDelegateTracer(a2, b2, c2)) ? d2 : new ax(this, a2, b2, c2);
        }
        getDelegate() {
          var a2;
          return null != (a2 = this._delegate) ? a2 : az;
        }
        setDelegate(a2) {
          this._delegate = a2;
        }
        getDelegateTracer(a2, b2, c2) {
          var d2;
          return null == (d2 = this._delegate) ? void 0 : d2.getTracer(a2, b2, c2);
        }
      }
      !function(a2) {
        a2[a2.NOT_RECORD = 0] = "NOT_RECORD", a2[a2.RECORD = 1] = "RECORD", a2[a2.RECORD_AND_SAMPLED = 2] = "RECORD_AND_SAMPLED";
      }(g || (g = {})), function(a2) {
        a2[a2.INTERNAL = 0] = "INTERNAL", a2[a2.SERVER = 1] = "SERVER", a2[a2.CLIENT = 2] = "CLIENT", a2[a2.PRODUCER = 3] = "PRODUCER", a2[a2.CONSUMER = 4] = "CONSUMER";
      }(h || (h = {})), function(a2) {
        a2[a2.UNSET = 0] = "UNSET", a2[a2.OK = 1] = "OK", a2[a2.ERROR = 2] = "ERROR";
      }(i || (i = {}));
      let aB = "[_0-9a-z-*/]", aC = `[a-z]${aB}{0,255}`, aD = `[a-z0-9]${aB}{0,240}@[a-z]${aB}{0,13}`, aE = RegExp(`^(?:${aC}|${aD})$`), aF = /^[ -~]{0,255}[!-~]$/, aG = /,|=/;
      class aH {
        constructor(a2) {
          this._internalState = /* @__PURE__ */ new Map(), a2 && this._parse(a2);
        }
        set(a2, b2) {
          let c2 = this._clone();
          return c2._internalState.has(a2) && c2._internalState.delete(a2), c2._internalState.set(a2, b2), c2;
        }
        unset(a2) {
          let b2 = this._clone();
          return b2._internalState.delete(a2), b2;
        }
        get(a2) {
          return this._internalState.get(a2);
        }
        serialize() {
          return Array.from(this._internalState.keys()).reduceRight((a2, b2) => (a2.push(b2 + "=" + this.get(b2)), a2), []).join(",");
        }
        _parse(a2) {
          !(a2.length > 512) && (this._internalState = a2.split(",").reduceRight((a3, b2) => {
            let c2 = b2.trim(), d2 = c2.indexOf("=");
            if (-1 !== d2) {
              let e2 = c2.slice(0, d2), f2 = c2.slice(d2 + 1, b2.length);
              aE.test(e2) && aF.test(f2) && !aG.test(f2) && a3.set(e2, f2);
            }
            return a3;
          }, /* @__PURE__ */ new Map()), this._internalState.size > 32 && (this._internalState = new Map(Array.from(this._internalState.entries()).reverse().slice(0, 32))));
        }
        _keys() {
          return Array.from(this._internalState.keys()).reverse();
        }
        _clone() {
          let a2 = new aH();
          return a2._internalState = new Map(this._internalState), a2;
        }
      }
      function aI(a2) {
        return new aH(a2);
      }
      let aJ = ac.getInstance(), aK = u.instance();
      class aL {
        getMeter(a2, b2, c2) {
          return Q;
        }
      }
      let aM = new aL(), aN = "metrics";
      class aO {
        constructor() {
        }
        static getInstance() {
          return this._instance || (this._instance = new aO()), this._instance;
        }
        setGlobalMeterProvider(a2) {
          return p(aN, a2, u.instance());
        }
        getMeterProvider() {
          return q(aN) || aM;
        }
        getMeter(a2, b2, c2) {
          return this.getMeterProvider().getMeter(a2, b2, c2);
        }
        disable() {
          r(aN, u.instance());
        }
      }
      let aP = aO.getInstance();
      class aQ {
        inject(a2, b2) {
        }
        extract(a2, b2) {
          return a2;
        }
        fields() {
          return [];
        }
      }
      let aR = A("OpenTelemetry Baggage Key");
      function aS(a2) {
        return a2.getValue(aR) || void 0;
      }
      function aT() {
        return aS(ac.getInstance().active());
      }
      function aU(a2, b2) {
        return a2.setValue(aR, b2);
      }
      function aV(a2) {
        return a2.deleteValue(aR);
      }
      let aW = "propagation", aX = new aQ();
      class aY {
        constructor() {
          this.createBaggage = y, this.getBaggage = aS, this.getActiveBaggage = aT, this.setBaggage = aU, this.deleteBaggage = aV;
        }
        static getInstance() {
          return this._instance || (this._instance = new aY()), this._instance;
        }
        setGlobalPropagator(a2) {
          return p(aW, a2, u.instance());
        }
        inject(a2, b2, c2 = $) {
          return this._getGlobalPropagator().inject(a2, b2, c2);
        }
        extract(a2, b2, c2 = Z) {
          return this._getGlobalPropagator().extract(a2, b2, c2);
        }
        fields() {
          return this._getGlobalPropagator().fields();
        }
        disable() {
          r(aW, u.instance());
        }
        _getGlobalPropagator() {
          return q(aW) || aX;
        }
      }
      let aZ = aY.getInstance(), a$ = "trace";
      class a_ {
        constructor() {
          this._proxyTracerProvider = new aA(), this.wrapSpanContext = at, this.isSpanContextValid = as, this.deleteSpan = al, this.getSpan = ai, this.getActiveSpan = aj, this.getSpanContext = an, this.setSpan = ak, this.setSpanContext = am;
        }
        static getInstance() {
          return this._instance || (this._instance = new a_()), this._instance;
        }
        setGlobalTracerProvider(a2) {
          let b2 = p(a$, this._proxyTracerProvider, u.instance());
          return b2 && this._proxyTracerProvider.setDelegate(a2), b2;
        }
        getTracerProvider() {
          return q(a$) || this._proxyTracerProvider;
        }
        getTracer(a2, b2) {
          return this.getTracerProvider().getTracer(a2, b2);
        }
        disable() {
          r(a$, u.instance()), this._proxyTracerProvider = new aA();
        }
      }
      let a0 = a_.getInstance(), a1 = { context: aJ, diag: aK, metrics: aP, propagation: aZ, trace: a0 };
    }, 861: (a, b) => {
      "use strict";
      b.qg = function(a2, b2) {
        let c2 = new h(), d2 = a2.length;
        if (d2 < 2) return c2;
        let e2 = b2?.decode || k, f2 = 0;
        do {
          let b3 = function(a3, b4, c3) {
            let d3 = a3.indexOf("=", b4);
            return d3 < c3 ? d3 : -1;
          }(a2, f2, d2);
          if (-1 === b3) break;
          let g2 = function(a3, b4, c3) {
            let d3 = a3.indexOf(";", b4);
            return -1 === d3 ? c3 : d3;
          }(a2, f2, d2);
          if (b3 > g2) {
            f2 = a2.lastIndexOf(";", b3 - 1) + 1;
            continue;
          }
          let h2 = j(a2, f2, b3);
          void 0 === c2[h2] && (c2[h2] = e2(j(a2, b3 + 1, g2))), f2 = g2 + 1;
        } while (f2 < d2);
        return c2;
      }, b.lK = i, b.lK = i;
      let c = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/, d = /^[\u0021-\u003A\u003C-\u007E]*$/, e = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i, f = /^[\u0020-\u003A\u003D-\u007E]*$/, g = Object.prototype.toString, h = (() => {
        let a2 = function() {
        };
        return a2.prototype = /* @__PURE__ */ Object.create(null), a2;
      })();
      function i(a2, b2, h2) {
        let i2 = "object" == typeof a2 ? a2 : { ...h2, name: a2, value: String(b2) }, j2 = ("object" == typeof b2 ? b2 : h2)?.encode || encodeURIComponent;
        if (!c.test(i2.name)) throw TypeError(`argument name is invalid: ${i2.name}`);
        let k2 = i2.value ? j2(i2.value) : "";
        if (!d.test(k2)) throw TypeError(`argument val is invalid: ${i2.value}`);
        let l = i2.name + "=" + k2;
        if (void 0 !== i2.maxAge) {
          if (!Number.isInteger(i2.maxAge)) throw TypeError(`option maxAge is invalid: ${i2.maxAge}`);
          l += "; Max-Age=" + i2.maxAge;
        }
        if (i2.domain) {
          if (!e.test(i2.domain)) throw TypeError(`option domain is invalid: ${i2.domain}`);
          l += "; Domain=" + i2.domain;
        }
        if (i2.path) {
          if (!f.test(i2.path)) throw TypeError(`option path is invalid: ${i2.path}`);
          l += "; Path=" + i2.path;
        }
        if (i2.expires) {
          var m;
          if (m = i2.expires, "[object Date]" !== g.call(m) || !Number.isFinite(i2.expires.valueOf())) throw TypeError(`option expires is invalid: ${i2.expires}`);
          l += "; Expires=" + i2.expires.toUTCString();
        }
        if (i2.httpOnly && (l += "; HttpOnly"), i2.secure && (l += "; Secure"), i2.partitioned && (l += "; Partitioned"), i2.priority) switch ("string" == typeof i2.priority ? i2.priority.toLowerCase() : void 0) {
          case "low":
            l += "; Priority=Low";
            break;
          case "medium":
            l += "; Priority=Medium";
            break;
          case "high":
            l += "; Priority=High";
            break;
          default:
            throw TypeError(`option priority is invalid: ${i2.priority}`);
        }
        if (i2.sameSite) switch ("string" == typeof i2.sameSite ? i2.sameSite.toLowerCase() : i2.sameSite) {
          case true:
          case "strict":
            l += "; SameSite=Strict";
            break;
          case "lax":
            l += "; SameSite=Lax";
            break;
          case "none":
            l += "; SameSite=None";
            break;
          default:
            throw TypeError(`option sameSite is invalid: ${i2.sameSite}`);
        }
        return l;
      }
      function j(a2, b2, c2) {
        let d2 = b2, e2 = c2;
        do {
          let b3 = a2.charCodeAt(d2);
          if (32 !== b3 && 9 !== b3) break;
        } while (++d2 < e2);
        for (; e2 > d2; ) {
          let b3 = a2.charCodeAt(e2 - 1);
          if (32 !== b3 && 9 !== b3) break;
          e2--;
        }
        return a2.slice(d2, e2);
      }
      function k(a2) {
        if (-1 === a2.indexOf("%")) return a2;
        try {
          return decodeURIComponent(a2);
        } catch (b2) {
          return a2;
        }
      }
    }, 917: (a, b, c) => {
      "use strict";
      Object.defineProperty(b, "__esModule", { value: true }), !function(a2, b2) {
        for (var c2 in b2) Object.defineProperty(a2, c2, { enumerable: true, get: b2[c2] });
      }(b, { getTestReqInfo: function() {
        return g;
      }, withRequest: function() {
        return f;
      } });
      let d = new (c(521)).AsyncLocalStorage();
      function e(a2, b2) {
        let c2 = b2.header(a2, "next-test-proxy-port");
        if (!c2) return;
        let d2 = b2.url(a2);
        return { url: d2, proxyPort: Number(c2), testData: b2.header(a2, "next-test-data") || "" };
      }
      function f(a2, b2, c2) {
        let f2 = e(a2, b2);
        return f2 ? d.run(f2, c2) : c2();
      }
      function g(a2, b2) {
        let c2 = d.getStore();
        return c2 || (a2 && b2 ? e(a2, b2) : void 0);
      }
    } }, (a) => {
      var b = a(a.s = 439);
      (_ENTRIES = "undefined" == typeof _ENTRIES ? {} : _ENTRIES)["middleware_src/middleware"] = b;
    }]);
  }
});

// ../../node_modules/@opennextjs/aws/dist/core/edgeFunctionHandler.js
var edgeFunctionHandler_exports = {};
__export(edgeFunctionHandler_exports, {
  default: () => edgeFunctionHandler
});
async function edgeFunctionHandler(request) {
  const path3 = new URL(request.url).pathname;
  const routes = globalThis._ROUTES;
  const correspondingRoute = routes.find((route) => route.regex.some((r) => new RegExp(r).test(path3)));
  if (!correspondingRoute) {
    throw new Error(`No route found for ${request.url}`);
  }
  const entry = await self._ENTRIES[`middleware_${correspondingRoute.name}`];
  const result = await entry.default({
    page: correspondingRoute.page,
    request: {
      ...request,
      page: {
        name: correspondingRoute.name
      }
    }
  });
  globalThis.__openNextAls.getStore()?.pendingPromiseRunner.add(result.waitUntil);
  const response = result.response;
  return response;
}
var init_edgeFunctionHandler = __esm({
  "../../node_modules/@opennextjs/aws/dist/core/edgeFunctionHandler.js"() {
    globalThis._ENTRIES = {};
    globalThis.self = globalThis;
    globalThis._ROUTES = [{ "name": "src/middleware", "page": "/", "regex": ["^(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/((?!_next\\/static|_next\\/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*))(\\.json)?[\\/#\\?]?$"] }];
    require_edge_runtime_webpack();
    require_middleware();
  }
});

// ../../node_modules/@opennextjs/aws/dist/utils/promise.js
init_logger();
var DetachedPromise = class {
  resolve;
  reject;
  promise;
  constructor() {
    let resolve;
    let reject;
    this.promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this.resolve = resolve;
    this.reject = reject;
  }
};
var DetachedPromiseRunner = class {
  promises = [];
  withResolvers() {
    const detachedPromise = new DetachedPromise();
    this.promises.push(detachedPromise);
    return detachedPromise;
  }
  add(promise) {
    const detachedPromise = new DetachedPromise();
    this.promises.push(detachedPromise);
    promise.then(detachedPromise.resolve, detachedPromise.reject);
  }
  async await() {
    debug(`Awaiting ${this.promises.length} detached promises`);
    const results = await Promise.allSettled(this.promises.map((p) => p.promise));
    const rejectedPromises = results.filter((r) => r.status === "rejected");
    rejectedPromises.forEach((r) => {
      error(r.reason);
    });
  }
};
async function awaitAllDetachedPromise() {
  const store = globalThis.__openNextAls.getStore();
  const promisesToAwait = store?.pendingPromiseRunner.await() ?? Promise.resolve();
  if (store?.waitUntil) {
    store.waitUntil(promisesToAwait);
    return;
  }
  await promisesToAwait;
}
function provideNextAfterProvider() {
  const NEXT_REQUEST_CONTEXT_SYMBOL = Symbol.for("@next/request-context");
  const VERCEL_REQUEST_CONTEXT_SYMBOL = Symbol.for("@vercel/request-context");
  const store = globalThis.__openNextAls.getStore();
  const waitUntil = store?.waitUntil ?? ((promise) => store?.pendingPromiseRunner.add(promise));
  const nextAfterContext = {
    get: () => ({
      waitUntil
    })
  };
  globalThis[NEXT_REQUEST_CONTEXT_SYMBOL] = nextAfterContext;
  if (process.env.EMULATE_VERCEL_REQUEST_CONTEXT) {
    globalThis[VERCEL_REQUEST_CONTEXT_SYMBOL] = nextAfterContext;
  }
}
function runWithOpenNextRequestContext({ isISRRevalidation, waitUntil, requestId = Math.random().toString(36) }, fn) {
  return globalThis.__openNextAls.run({
    requestId,
    pendingPromiseRunner: new DetachedPromiseRunner(),
    isISRRevalidation,
    waitUntil,
    writtenTags: /* @__PURE__ */ new Set()
  }, async () => {
    provideNextAfterProvider();
    let result;
    try {
      result = await fn();
    } finally {
      await awaitAllDetachedPromise();
    }
    return result;
  });
}

// ../../node_modules/@opennextjs/aws/dist/adapters/middleware.js
init_logger();

// ../../node_modules/@opennextjs/aws/dist/core/createGenericHandler.js
init_logger();

// ../../node_modules/@opennextjs/aws/dist/core/resolve.js
async function resolveConverter(converter2) {
  if (typeof converter2 === "function") {
    return converter2();
  }
  const m_1 = await Promise.resolve().then(() => (init_edge(), edge_exports));
  return m_1.default;
}
async function resolveWrapper(wrapper) {
  if (typeof wrapper === "function") {
    return wrapper();
  }
  const m_1 = await Promise.resolve().then(() => (init_cloudflare_edge(), cloudflare_edge_exports));
  return m_1.default;
}
async function resolveOriginResolver(originResolver) {
  if (typeof originResolver === "function") {
    return originResolver();
  }
  const m_1 = await Promise.resolve().then(() => (init_pattern_env(), pattern_env_exports));
  return m_1.default;
}
async function resolveAssetResolver(assetResolver) {
  if (typeof assetResolver === "function") {
    return assetResolver();
  }
  const m_1 = await Promise.resolve().then(() => (init_dummy(), dummy_exports));
  return m_1.default;
}
async function resolveProxyRequest(proxyRequest) {
  if (typeof proxyRequest === "function") {
    return proxyRequest();
  }
  const m_1 = await Promise.resolve().then(() => (init_fetch(), fetch_exports));
  return m_1.default;
}

// ../../node_modules/@opennextjs/aws/dist/core/createGenericHandler.js
async function createGenericHandler(handler3) {
  const config = await import("./open-next.config.mjs").then((m) => m.default);
  globalThis.openNextConfig = config;
  const handlerConfig = config[handler3.type];
  const override = handlerConfig && "override" in handlerConfig ? handlerConfig.override : void 0;
  const converter2 = await resolveConverter(override?.converter);
  const { name, wrapper } = await resolveWrapper(override?.wrapper);
  debug("Using wrapper", name);
  return wrapper(handler3.handler, converter2);
}

// ../../node_modules/@opennextjs/aws/dist/core/routing/util.js
import crypto2 from "node:crypto";
import { parse as parseQs, stringify as stringifyQs } from "node:querystring";

// ../../node_modules/@opennextjs/aws/dist/adapters/config/index.js
init_logger();
import path from "node:path";
globalThis.__dirname ??= "";
var NEXT_DIR = path.join(__dirname, ".next");
var OPEN_NEXT_DIR = path.join(__dirname, ".open-next");
debug({ NEXT_DIR, OPEN_NEXT_DIR });
var NextConfig = { "env": { "_sentryRewriteFramesDistDir": ".next", "_sentryRewriteFramesAssetPrefixPath": "", "_sentryRelease": "f958009056e3fd66a1478fc3ca3923b4458c3400" }, "eslint": { "ignoreDuringBuilds": false }, "typescript": { "ignoreBuildErrors": false, "tsconfigPath": "tsconfig.json" }, "typedRoutes": false, "distDir": ".next", "cleanDistDir": true, "assetPrefix": "", "cacheMaxMemorySize": 52428800, "configOrigin": "next.config.ts", "useFileSystemPublicRoutes": true, "generateEtags": true, "pageExtensions": ["tsx", "ts", "jsx", "js"], "poweredByHeader": true, "compress": true, "images": { "deviceSizes": [640, 750, 828, 1080, 1200, 1920, 2048, 3840], "imageSizes": [16, 32, 48, 64, 96, 128, 256, 384], "path": "/_next/image", "loader": "default", "loaderFile": "", "domains": [], "disableStaticImages": false, "minimumCacheTTL": 60, "formats": ["image/webp"], "maximumResponseBody": 5e7, "dangerouslyAllowSVG": false, "contentSecurityPolicy": "script-src 'none'; frame-src 'none'; sandbox;", "contentDispositionType": "attachment", "remotePatterns": [], "unoptimized": false }, "devIndicators": { "position": "bottom-left" }, "onDemandEntries": { "maxInactiveAge": 6e4, "pagesBufferLength": 5 }, "amp": { "canonicalBase": "" }, "basePath": "", "sassOptions": {}, "trailingSlash": false, "i18n": null, "productionBrowserSourceMaps": false, "excludeDefaultMomentLocales": true, "serverRuntimeConfig": {}, "publicRuntimeConfig": {}, "reactProductionProfiling": false, "reactStrictMode": null, "reactMaxHeadersLength": 6e3, "httpAgentOptions": { "keepAlive": true }, "logging": {}, "compiler": {}, "expireTime": 31536e3, "staticPageGenerationTimeout": 60, "output": "standalone", "modularizeImports": { "@mui/icons-material": { "transform": "@mui/icons-material/{{member}}" }, "lodash": { "transform": "lodash/{{member}}" } }, "outputFileTracingRoot": "C:\\Users\\Chapman\\Desktop\\ai\\chapai", "experimental": { "useSkewCookie": false, "cacheLife": { "default": { "stale": 300, "revalidate": 900, "expire": 4294967294 }, "seconds": { "stale": 30, "revalidate": 1, "expire": 60 }, "minutes": { "stale": 300, "revalidate": 60, "expire": 3600 }, "hours": { "stale": 300, "revalidate": 3600, "expire": 86400 }, "days": { "stale": 300, "revalidate": 86400, "expire": 604800 }, "weeks": { "stale": 300, "revalidate": 604800, "expire": 2592e3 }, "max": { "stale": 300, "revalidate": 2592e3, "expire": 4294967294 } }, "cacheHandlers": {}, "cssChunking": true, "multiZoneDraftMode": false, "appNavFailHandling": false, "prerenderEarlyExit": true, "serverMinification": true, "serverSourceMaps": false, "linkNoTouchStart": false, "caseSensitiveRoutes": false, "clientSegmentCache": false, "clientParamParsing": false, "dynamicOnHover": false, "preloadEntriesOnStart": true, "clientRouterFilter": true, "clientRouterFilterRedirects": false, "fetchCacheKeyPrefix": "", "middlewarePrefetch": "flexible", "optimisticClientCache": true, "manualClientBasePath": false, "cpus": 15, "memoryBasedWorkersCount": false, "imgOptConcurrency": null, "imgOptTimeoutInSeconds": 7, "imgOptMaxInputPixels": 268402689, "imgOptSequentialRead": null, "imgOptSkipMetadata": null, "isrFlushToDisk": true, "workerThreads": false, "optimizeCss": false, "nextScriptWorkers": false, "scrollRestoration": false, "externalDir": false, "disableOptimizedLoading": false, "gzipSize": true, "craCompat": false, "esmExternals": true, "fullySpecified": false, "swcTraceProfiling": false, "forceSwcTransforms": false, "largePageDataBytes": 128e3, "typedEnv": false, "clientTraceMetadata": ["baggage", "sentry-trace"], "parallelServerCompiles": false, "parallelServerBuildTraces": false, "ppr": false, "authInterrupts": false, "webpackMemoryOptimizations": false, "optimizeServerReact": true, "viewTransition": false, "routerBFCache": false, "removeUncaughtErrorAndRejectionListeners": false, "validateRSCRequestHeaders": false, "staleTimes": { "dynamic": 0, "static": 300 }, "serverComponentsHmrCache": true, "staticGenerationMaxConcurrency": 8, "staticGenerationMinPagesPerWorker": 25, "cacheComponents": false, "inlineCss": false, "useCache": false, "globalNotFound": false, "devtoolSegmentExplorer": true, "browserDebugInfoInTerminal": false, "optimizeRouterScrolling": false, "middlewareClientMaxBodySize": 10485760, "optimizePackageImports": ["lucide-react", "date-fns", "lodash-es", "ramda", "antd", "react-bootstrap", "ahooks", "@ant-design/icons", "@headlessui/react", "@headlessui-float/react", "@heroicons/react/20/solid", "@heroicons/react/24/solid", "@heroicons/react/24/outline", "@visx/visx", "@tremor/react", "rxjs", "@mui/material", "@mui/icons-material", "recharts", "react-use", "effect", "@effect/schema", "@effect/platform", "@effect/platform-node", "@effect/platform-browser", "@effect/platform-bun", "@effect/sql", "@effect/sql-mssql", "@effect/sql-mysql2", "@effect/sql-pg", "@effect/sql-sqlite-node", "@effect/sql-sqlite-bun", "@effect/sql-sqlite-wasm", "@effect/sql-sqlite-react-native", "@effect/rpc", "@effect/rpc-http", "@effect/typeclass", "@effect/experimental", "@effect/opentelemetry", "@material-ui/core", "@material-ui/icons", "@tabler/icons-react", "mui-core", "react-icons/ai", "react-icons/bi", "react-icons/bs", "react-icons/cg", "react-icons/ci", "react-icons/di", "react-icons/fa", "react-icons/fa6", "react-icons/fc", "react-icons/fi", "react-icons/gi", "react-icons/go", "react-icons/gr", "react-icons/hi", "react-icons/hi2", "react-icons/im", "react-icons/io", "react-icons/io5", "react-icons/lia", "react-icons/lib", "react-icons/lu", "react-icons/md", "react-icons/pi", "react-icons/ri", "react-icons/rx", "react-icons/si", "react-icons/sl", "react-icons/tb", "react-icons/tfi", "react-icons/ti", "react-icons/vsc", "react-icons/wi"], "trustHostHeader": false, "isExperimentalCompile": false }, "htmlLimitedBots": "[\\w-]+-Google|Google-[\\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight", "bundlePagesRouterDependencies": false, "configFileName": "next.config.ts", "serverExternalPackages": ["amqplib", "connect", "dataloader", "express", "generic-pool", "graphql", "@hapi/hapi", "ioredis", "kafkajs", "koa", "lru-memoizer", "mongodb", "mongoose", "mysql", "mysql2", "knex", "pg", "pg-pool", "@node-redis/client", "@redis/client", "redis", "tedious"], "turbopack": { "root": "C:\\Users\\Chapman\\Desktop\\ai\\chapai" } };
var BuildId = "tdaMHYKo4hMyVjJ_KgLII";
var RoutesManifest = { "basePath": "", "rewrites": { "beforeFiles": [], "afterFiles": [], "fallback": [] }, "redirects": [{ "source": "/:path+/", "destination": "/:path+", "internal": true, "statusCode": 308, "regex": "^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))/$" }], "routes": { "static": [{ "page": "/", "regex": "^/(?:/)?$", "routeKeys": {}, "namedRegex": "^/(?:/)?$" }, { "page": "/_not-found", "regex": "^/_not\\-found(?:/)?$", "routeKeys": {}, "namedRegex": "^/_not\\-found(?:/)?$" }, { "page": "/account/billing", "regex": "^/account/billing(?:/)?$", "routeKeys": {}, "namedRegex": "^/account/billing(?:/)?$" }, { "page": "/auth/callback", "regex": "^/auth/callback(?:/)?$", "routeKeys": {}, "namedRegex": "^/auth/callback(?:/)?$" }, { "page": "/auth/login", "regex": "^/auth/login(?:/)?$", "routeKeys": {}, "namedRegex": "^/auth/login(?:/)?$" }, { "page": "/auth/logout", "regex": "^/auth/logout(?:/)?$", "routeKeys": {}, "namedRegex": "^/auth/logout(?:/)?$" }, { "page": "/ccrn", "regex": "^/ccrn(?:/)?$", "routeKeys": {}, "namedRegex": "^/ccrn(?:/)?$" }, { "page": "/ccrn/24-hour-cram", "regex": "^/ccrn/24\\-hour\\-cram(?:/)?$", "routeKeys": {}, "namedRegex": "^/ccrn/24\\-hour\\-cram(?:/)?$" }, { "page": "/ccrn/ai-tutor", "regex": "^/ccrn/ai\\-tutor(?:/)?$", "routeKeys": {}, "namedRegex": "^/ccrn/ai\\-tutor(?:/)?$" }, { "page": "/ccrn/best-study-tool", "regex": "^/ccrn/best\\-study\\-tool(?:/)?$", "routeKeys": {}, "namedRegex": "^/ccrn/best\\-study\\-tool(?:/)?$" }, { "page": "/ccrn/hemodynamics-questions", "regex": "^/ccrn/hemodynamics\\-questions(?:/)?$", "routeKeys": {}, "namedRegex": "^/ccrn/hemodynamics\\-questions(?:/)?$" }, { "page": "/ccrn/study-plan", "regex": "^/ccrn/study\\-plan(?:/)?$", "routeKeys": {}, "namedRegex": "^/ccrn/study\\-plan(?:/)?$" }, { "page": "/ccrn/vasoactive-drips", "regex": "^/ccrn/vasoactive\\-drips(?:/)?$", "routeKeys": {}, "namedRegex": "^/ccrn/vasoactive\\-drips(?:/)?$" }, { "page": "/compare/chapai-vs-archer", "regex": "^/compare/chapai\\-vs\\-archer(?:/)?$", "routeKeys": {}, "namedRegex": "^/compare/chapai\\-vs\\-archer(?:/)?$" }, { "page": "/compare/chapai-vs-uworld", "regex": "^/compare/chapai\\-vs\\-uworld(?:/)?$", "routeKeys": {}, "namedRegex": "^/compare/chapai\\-vs\\-uworld(?:/)?$" }, { "page": "/dashboard", "regex": "^/dashboard(?:/)?$", "routeKeys": {}, "namedRegex": "^/dashboard(?:/)?$" }, { "page": "/demo", "regex": "^/demo(?:/)?$", "routeKeys": {}, "namedRegex": "^/demo(?:/)?$" }, { "page": "/demo-access", "regex": "^/demo\\-access(?:/)?$", "routeKeys": {}, "namedRegex": "^/demo\\-access(?:/)?$" }, { "page": "/design-review", "regex": "^/design\\-review(?:/)?$", "routeKeys": {}, "namedRegex": "^/design\\-review(?:/)?$" }, { "page": "/guild-access", "regex": "^/guild\\-access(?:/)?$", "routeKeys": {}, "namedRegex": "^/guild\\-access(?:/)?$" }, { "page": "/home", "regex": "^/home(?:/)?$", "routeKeys": {}, "namedRegex": "^/home(?:/)?$" }, { "page": "/nclex", "regex": "^/nclex(?:/)?$", "routeKeys": {}, "namedRegex": "^/nclex(?:/)?$" }, { "page": "/nclex/24-hour-cram", "regex": "^/nclex/24\\-hour\\-cram(?:/)?$", "routeKeys": {}, "namedRegex": "^/nclex/24\\-hour\\-cram(?:/)?$" }, { "page": "/nclex/ai-tutor", "regex": "^/nclex/ai\\-tutor(?:/)?$", "routeKeys": {}, "namedRegex": "^/nclex/ai\\-tutor(?:/)?$" }, { "page": "/nclex/delegation-questions", "regex": "^/nclex/delegation\\-questions(?:/)?$", "routeKeys": {}, "namedRegex": "^/nclex/delegation\\-questions(?:/)?$" }, { "page": "/nclex/prioritization-questions", "regex": "^/nclex/prioritization\\-questions(?:/)?$", "routeKeys": {}, "namedRegex": "^/nclex/prioritization\\-questions(?:/)?$" }, { "page": "/nclex/study-plan", "regex": "^/nclex/study\\-plan(?:/)?$", "routeKeys": {}, "namedRegex": "^/nclex/study\\-plan(?:/)?$" }, { "page": "/privacy", "regex": "^/privacy(?:/)?$", "routeKeys": {}, "namedRegex": "^/privacy(?:/)?$" }, { "page": "/quiz", "regex": "^/quiz(?:/)?$", "routeKeys": {}, "namedRegex": "^/quiz(?:/)?$" }, { "page": "/robots.txt", "regex": "^/robots\\.txt(?:/)?$", "routeKeys": {}, "namedRegex": "^/robots\\.txt(?:/)?$" }, { "page": "/sitemap.xml", "regex": "^/sitemap\\.xml(?:/)?$", "routeKeys": {}, "namedRegex": "^/sitemap\\.xml(?:/)?$" }, { "page": "/success", "regex": "^/success(?:/)?$", "routeKeys": {}, "namedRegex": "^/success(?:/)?$" }, { "page": "/terms", "regex": "^/terms(?:/)?$", "routeKeys": {}, "namedRegex": "^/terms(?:/)?$" }, { "page": "/upgrade", "regex": "^/upgrade(?:/)?$", "routeKeys": {}, "namedRegex": "^/upgrade(?:/)?$" }], "dynamic": [{ "page": "/api/quiz/practice-exams/[examId]", "regex": "^/api/quiz/practice\\-exams/([^/]+?)(?:/)?$", "routeKeys": { "nxtPexamId": "nxtPexamId" }, "namedRegex": "^/api/quiz/practice\\-exams/(?<nxtPexamId>[^/]+?)(?:/)?$" }], "data": { "static": [], "dynamic": [] } }, "locales": [] };
var ConfigHeaders = [{ "source": "/((?!_next/static|_next/image|favicon.ico).*)", "headers": [{ "key": "Cache-Control", "value": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" }, { "key": "Pragma", "value": "no-cache" }, { "key": "Expires", "value": "0" }], "regex": "^(?:/((?!_next/static|_next/image|favicon.ico).*))(?:/)?$" }];
var PrerenderManifest = { "version": 4, "routes": { "/robots.txt": { "initialHeaders": { "cache-control": "public, max-age=0, must-revalidate", "content-type": "text/plain", "x-next-cache-tags": "_N_T_/layout,_N_T_/robots.txt/layout,_N_T_/robots.txt/route,_N_T_/robots.txt" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/robots.txt", "dataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/sitemap.xml": { "initialHeaders": { "cache-control": "public, max-age=0, must-revalidate", "content-type": "application/xml", "x-next-cache-tags": "_N_T_/layout,_N_T_/sitemap.xml/layout,_N_T_/sitemap.xml/route,_N_T_/sitemap.xml" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/sitemap.xml", "dataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] } }, "dynamicRoutes": {}, "notFoundRoutes": [], "preview": { "previewModeId": "32d3194f835a9a77e71a39b4bf3d6775", "previewModeSigningKey": "0a0ce9cd054753316543fcaa34cca2b25668fd444e30b2abc679cfe33fcb58d8", "previewModeEncryptionKey": "c44dcd052c55942b52ff7de14c2abf897f357cce9a1d45753101e4c66f3b5071" } };
var MiddlewareManifest = { "version": 3, "middleware": { "/": { "files": ["server/edge-runtime-webpack.js", "server/src/middleware.js"], "name": "src/middleware", "page": "/", "matchers": [{ "regexp": "^(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/((?!_next\\/static|_next\\/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*))(\\.json)?[\\/#\\?]?$", "originalSource": "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "tdaMHYKo4hMyVjJ_KgLII", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "eSvM3jyL0lKtQZp2DJvPFTHszAIxX//EaAz+2dTPbe0=", "__NEXT_PREVIEW_MODE_ID": "32d3194f835a9a77e71a39b4bf3d6775", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "0a0ce9cd054753316543fcaa34cca2b25668fd444e30b2abc679cfe33fcb58d8", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "c44dcd052c55942b52ff7de14c2abf897f357cce9a1d45753101e4c66f3b5071" } } }, "functions": {}, "sortedMiddleware": ["/"] };
var AppPathRoutesManifest = { "/_not-found/page": "/_not-found", "/api/daily-question-signup/route": "/api/daily-question-signup", "/api/quiz/practice-exams/[examId]/route": "/api/quiz/practice-exams/[examId]", "/api/tutor/route": "/api/tutor", "/api/webhook/stripe/route": "/api/webhook/stripe", "/robots.txt/route": "/robots.txt", "/sitemap.xml/route": "/sitemap.xml", "/api/access-keys/redeem/route": "/api/access-keys/redeem", "/api/auth/magic-link/route": "/api/auth/magic-link", "/api/checkout/activate/route": "/api/checkout/activate", "/api/dashboard-auth/login/route": "/api/dashboard-auth/login", "/api/dashboard-auth/logout/route": "/api/dashboard-auth/logout", "/api/checkout/route": "/api/checkout", "/api/health/ready/route": "/api/health/ready", "/api/health/live/route": "/api/health/live", "/api/legal/accept/route": "/api/legal/accept", "/api/quiz/history/route": "/api/quiz/history", "/api/quiz/results/route": "/api/quiz/results", "/api/quiz/answer/route": "/api/quiz/answer", "/api/quiz/review-queue/route": "/api/quiz/review-queue", "/api/stripe/portal/route": "/api/stripe/portal", "/api/quiz/start/route": "/api/quiz/start", "/api/stripe/webhook/route": "/api/stripe/webhook", "/auth/callback/route": "/auth/callback", "/auth/logout/route": "/auth/logout", "/api/tutor/ask/route": "/api/tutor/ask", "/home/page": "/home", "/account/billing/page": "/account/billing", "/ccrn/24-hour-cram/page": "/ccrn/24-hour-cram", "/auth/login/page": "/auth/login", "/ccrn/ai-tutor/page": "/ccrn/ai-tutor", "/ccrn/best-study-tool/page": "/ccrn/best-study-tool", "/ccrn/page": "/ccrn", "/ccrn/hemodynamics-questions/page": "/ccrn/hemodynamics-questions", "/ccrn/study-plan/page": "/ccrn/study-plan", "/compare/chapai-vs-archer/page": "/compare/chapai-vs-archer", "/ccrn/vasoactive-drips/page": "/ccrn/vasoactive-drips", "/dashboard/page": "/dashboard", "/compare/chapai-vs-uworld/page": "/compare/chapai-vs-uworld", "/demo-access/page": "/demo-access", "/design-review/page": "/design-review", "/demo/page": "/demo", "/guild-access/page": "/guild-access", "/nclex/24-hour-cram/page": "/nclex/24-hour-cram", "/nclex/ai-tutor/page": "/nclex/ai-tutor", "/nclex/delegation-questions/page": "/nclex/delegation-questions", "/nclex/page": "/nclex", "/nclex/prioritization-questions/page": "/nclex/prioritization-questions", "/nclex/study-plan/page": "/nclex/study-plan", "/page": "/", "/privacy/page": "/privacy", "/quiz/page": "/quiz", "/success/page": "/success", "/terms/page": "/terms", "/upgrade/page": "/upgrade" };
var FunctionsConfigManifest = { "version": 1, "functions": { "/api/auth/magic-link": {}, "/api/checkout/activate": {}, "/api/checkout": {}, "/api/health/ready": {}, "/api/legal/accept": {}, "/api/health/live": {}, "/api/stripe/portal": {}, "/api/stripe/webhook": {}, "/api/tutor/ask": {}, "/auth/callback": {}, "/auth/logout": {} } };
var PagesManifest = { "/_app": "pages/_app.js", "/_error": "pages/_error.js", "/_document": "pages/_document.js" };
process.env.NEXT_BUILD_ID = BuildId;
process.env.NEXT_PREVIEW_MODE_ID = PrerenderManifest?.preview?.previewModeId;

// ../../node_modules/@opennextjs/aws/dist/http/openNextResponse.js
init_logger();
init_util();
import { Transform } from "node:stream";

// ../../node_modules/@opennextjs/aws/dist/core/routing/util.js
init_util();
init_logger();
import { ReadableStream as ReadableStream3 } from "node:stream/web";

// ../../node_modules/@opennextjs/aws/dist/utils/binary.js
var commonBinaryMimeTypes = /* @__PURE__ */ new Set([
  "application/octet-stream",
  // Docs
  "application/epub+zip",
  "application/msword",
  "application/pdf",
  "application/rtf",
  "application/vnd.amazon.ebook",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Fonts
  "font/otf",
  "font/woff",
  "font/woff2",
  // Images
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/vnd.microsoft.icon",
  "image/webp",
  // Audio
  "audio/3gpp",
  "audio/aac",
  "audio/basic",
  "audio/flac",
  "audio/mpeg",
  "audio/ogg",
  "audio/wavaudio/webm",
  "audio/x-aiff",
  "audio/x-midi",
  "audio/x-wav",
  // Video
  "video/3gpp",
  "video/mp2t",
  "video/mpeg",
  "video/ogg",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  // Archives
  "application/java-archive",
  "application/vnd.apple.installer+xml",
  "application/x-7z-compressed",
  "application/x-apple-diskimage",
  "application/x-bzip",
  "application/x-bzip2",
  "application/x-gzip",
  "application/x-java-archive",
  "application/x-rar-compressed",
  "application/x-tar",
  "application/x-zip",
  "application/zip",
  // Serialized data
  "application/x-protobuf"
]);
function isBinaryContentType(contentType) {
  if (!contentType)
    return false;
  const value = contentType.split(";")[0];
  return commonBinaryMimeTypes.has(value);
}

// ../../node_modules/@opennextjs/aws/dist/core/routing/i18n/index.js
init_stream();
init_logger();

// ../../node_modules/@opennextjs/aws/dist/core/routing/i18n/accept-header.js
function parse(raw, preferences, options) {
  const lowers = /* @__PURE__ */ new Map();
  const header = raw.replace(/[ \t]/g, "");
  if (preferences) {
    let pos = 0;
    for (const preference of preferences) {
      const lower = preference.toLowerCase();
      lowers.set(lower, { orig: preference, pos: pos++ });
      if (options.prefixMatch) {
        const parts2 = lower.split("-");
        while (parts2.pop(), parts2.length > 0) {
          const joined = parts2.join("-");
          if (!lowers.has(joined)) {
            lowers.set(joined, { orig: preference, pos: pos++ });
          }
        }
      }
    }
  }
  const parts = header.split(",");
  const selections = [];
  const map = /* @__PURE__ */ new Set();
  for (let i = 0; i < parts.length; ++i) {
    const part = parts[i];
    if (!part) {
      continue;
    }
    const params = part.split(";");
    if (params.length > 2) {
      throw new Error(`Invalid ${options.type} header`);
    }
    const token = params[0].toLowerCase();
    if (!token) {
      throw new Error(`Invalid ${options.type} header`);
    }
    const selection = { token, pos: i, q: 1 };
    if (preferences && lowers.has(token)) {
      selection.pref = lowers.get(token).pos;
    }
    map.add(selection.token);
    if (params.length === 2) {
      const q = params[1];
      const [key, value] = q.split("=");
      if (!value || key !== "q" && key !== "Q") {
        throw new Error(`Invalid ${options.type} header`);
      }
      const score = Number.parseFloat(value);
      if (score === 0) {
        continue;
      }
      if (Number.isFinite(score) && score <= 1 && score >= 1e-3) {
        selection.q = score;
      }
    }
    selections.push(selection);
  }
  selections.sort((a, b) => {
    if (b.q !== a.q) {
      return b.q - a.q;
    }
    if (b.pref !== a.pref) {
      if (a.pref === void 0) {
        return 1;
      }
      if (b.pref === void 0) {
        return -1;
      }
      return a.pref - b.pref;
    }
    return a.pos - b.pos;
  });
  const values = selections.map((selection) => selection.token);
  if (!preferences || !preferences.length) {
    return values;
  }
  const preferred = [];
  for (const selection of values) {
    if (selection === "*") {
      for (const [preference, value] of lowers) {
        if (!map.has(preference)) {
          preferred.push(value.orig);
        }
      }
    } else {
      const lower = selection.toLowerCase();
      if (lowers.has(lower)) {
        preferred.push(lowers.get(lower).orig);
      }
    }
  }
  return preferred;
}
function acceptLanguage(header = "", preferences) {
  return parse(header, preferences, {
    type: "accept-language",
    prefixMatch: true
  })[0] || void 0;
}

// ../../node_modules/@opennextjs/aws/dist/core/routing/i18n/index.js
function isLocalizedPath(path3) {
  return NextConfig.i18n?.locales.includes(path3.split("/")[1].toLowerCase()) ?? false;
}
function getLocaleFromCookie(cookies) {
  const i18n = NextConfig.i18n;
  const nextLocale = cookies.NEXT_LOCALE?.toLowerCase();
  return nextLocale ? i18n?.locales.find((locale) => nextLocale === locale.toLowerCase()) : void 0;
}
function detectDomainLocale({ hostname, detectedLocale }) {
  const i18n = NextConfig.i18n;
  const domains = i18n?.domains;
  if (!domains) {
    return;
  }
  const lowercasedLocale = detectedLocale?.toLowerCase();
  for (const domain of domains) {
    const domainHostname = domain.domain.split(":", 1)[0].toLowerCase();
    if (hostname === domainHostname || lowercasedLocale === domain.defaultLocale.toLowerCase() || domain.locales?.some((locale) => lowercasedLocale === locale.toLowerCase())) {
      return domain;
    }
  }
}
function detectLocale(internalEvent, i18n) {
  const domainLocale = detectDomainLocale({
    hostname: internalEvent.headers.host
  });
  if (i18n.localeDetection === false) {
    return domainLocale?.defaultLocale ?? i18n.defaultLocale;
  }
  const cookiesLocale = getLocaleFromCookie(internalEvent.cookies);
  const preferredLocale = acceptLanguage(internalEvent.headers["accept-language"], i18n?.locales);
  debug({
    cookiesLocale,
    preferredLocale,
    defaultLocale: i18n.defaultLocale,
    domainLocale
  });
  return domainLocale?.defaultLocale ?? cookiesLocale ?? preferredLocale ?? i18n.defaultLocale;
}
function localizePath(internalEvent) {
  const i18n = NextConfig.i18n;
  if (!i18n) {
    return internalEvent.rawPath;
  }
  if (isLocalizedPath(internalEvent.rawPath)) {
    return internalEvent.rawPath;
  }
  const detectedLocale = detectLocale(internalEvent, i18n);
  return `/${detectedLocale}${internalEvent.rawPath}`;
}
function handleLocaleRedirect(internalEvent) {
  const i18n = NextConfig.i18n;
  if (!i18n || i18n.localeDetection === false || internalEvent.rawPath !== "/") {
    return false;
  }
  const preferredLocale = acceptLanguage(internalEvent.headers["accept-language"], i18n?.locales);
  const detectedLocale = detectLocale(internalEvent, i18n);
  const domainLocale = detectDomainLocale({
    hostname: internalEvent.headers.host
  });
  const preferredDomain = detectDomainLocale({
    detectedLocale: preferredLocale
  });
  if (domainLocale && preferredDomain) {
    const isPDomain = preferredDomain.domain === domainLocale.domain;
    const isPLocale = preferredDomain.defaultLocale === preferredLocale;
    if (!isPDomain || !isPLocale) {
      const scheme = `http${preferredDomain.http ? "" : "s"}`;
      const rlocale = isPLocale ? "" : preferredLocale;
      return {
        type: "core",
        statusCode: 307,
        headers: {
          Location: `${scheme}://${preferredDomain.domain}/${rlocale}`
        },
        body: emptyReadableStream(),
        isBase64Encoded: false
      };
    }
  }
  const defaultLocale = domainLocale?.defaultLocale ?? i18n.defaultLocale;
  if (detectedLocale.toLowerCase() !== defaultLocale.toLowerCase()) {
    return {
      type: "core",
      statusCode: 307,
      headers: {
        Location: constructNextUrl(internalEvent.url, `/${detectedLocale}`)
      },
      body: emptyReadableStream(),
      isBase64Encoded: false
    };
  }
  return false;
}

// ../../node_modules/@opennextjs/aws/dist/core/routing/queue.js
function generateShardId(rawPath, maxConcurrency, prefix) {
  let a = cyrb128(rawPath);
  let t = a += 1831565813;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  const randomFloat = ((t ^ t >>> 14) >>> 0) / 4294967296;
  const randomInt = Math.floor(randomFloat * maxConcurrency);
  return `${prefix}-${randomInt}`;
}
function generateMessageGroupId(rawPath) {
  const maxConcurrency = Number.parseInt(process.env.MAX_REVALIDATE_CONCURRENCY ?? "10");
  return generateShardId(rawPath, maxConcurrency, "revalidate");
}
function cyrb128(str) {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ h1 >>> 18, 597399067);
  h2 = Math.imul(h4 ^ h2 >>> 22, 2869860233);
  h3 = Math.imul(h1 ^ h3 >>> 17, 951274213);
  h4 = Math.imul(h2 ^ h4 >>> 19, 2716044179);
  h1 ^= h2 ^ h3 ^ h4, h2 ^= h1, h3 ^= h1, h4 ^= h1;
  return h1 >>> 0;
}

// ../../node_modules/@opennextjs/aws/dist/core/routing/util.js
function isExternal(url, host) {
  if (!url)
    return false;
  const pattern = /^https?:\/\//;
  if (!pattern.test(url))
    return false;
  if (host) {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.host !== host;
    } catch {
      return !url.includes(host);
    }
  }
  return true;
}
function convertFromQueryString(query) {
  if (query === "")
    return {};
  const queryParts = query.split("&");
  return getQueryFromIterator(queryParts.map((p) => {
    const [key, value] = p.split("=");
    return [key, value];
  }));
}
function getUrlParts(url, isExternal2) {
  if (!isExternal2) {
    const regex2 = /\/([^?]*)\??(.*)/;
    const match3 = url.match(regex2);
    return {
      hostname: "",
      pathname: match3?.[1] ? `/${match3[1]}` : url,
      protocol: "",
      queryString: match3?.[2] ?? ""
    };
  }
  const regex = /^(https?:)\/\/?([^\/\s]+)(\/[^?]*)?(\?.*)?/;
  const match2 = url.match(regex);
  if (!match2) {
    throw new Error(`Invalid external URL: ${url}`);
  }
  return {
    protocol: match2[1] ?? "https:",
    hostname: match2[2],
    pathname: match2[3] ?? "",
    queryString: match2[4]?.slice(1) ?? ""
  };
}
function constructNextUrl(baseUrl, path3) {
  const nextBasePath = NextConfig.basePath ?? "";
  const url = new URL(`${nextBasePath}${path3}`, baseUrl);
  return url.href;
}
function convertToQueryString(query) {
  const queryStrings = [];
  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => queryStrings.push(`${key}=${entry}`));
    } else {
      queryStrings.push(`${key}=${value}`);
    }
  });
  return queryStrings.length > 0 ? `?${queryStrings.join("&")}` : "";
}
function getMiddlewareMatch(middlewareManifest2, functionsManifest) {
  if (functionsManifest?.functions?.["/_middleware"]) {
    return functionsManifest.functions["/_middleware"].matchers?.map(({ regexp }) => new RegExp(regexp)) ?? [/.*/];
  }
  const rootMiddleware = middlewareManifest2.middleware["/"];
  if (!rootMiddleware?.matchers)
    return [];
  return rootMiddleware.matchers.map(({ regexp }) => new RegExp(regexp));
}
function escapeRegex(str, { isPath } = {}) {
  const result = str.replaceAll("(.)", "_\xB51_").replaceAll("(..)", "_\xB52_").replaceAll("(...)", "_\xB53_");
  return isPath ? result : result.replaceAll("+", "_\xB54_");
}
function unescapeRegex(str) {
  return str.replaceAll("_\xB51_", "(.)").replaceAll("_\xB52_", "(..)").replaceAll("_\xB53_", "(...)").replaceAll("_\xB54_", "+");
}
function convertBodyToReadableStream(method, body) {
  if (method === "GET" || method === "HEAD")
    return void 0;
  if (!body)
    return void 0;
  return new ReadableStream3({
    start(controller) {
      controller.enqueue(body);
      controller.close();
    }
  });
}
var CommonHeaders;
(function(CommonHeaders2) {
  CommonHeaders2["CACHE_CONTROL"] = "cache-control";
  CommonHeaders2["NEXT_CACHE"] = "x-nextjs-cache";
})(CommonHeaders || (CommonHeaders = {}));
function normalizeLocationHeader(location2, baseUrl, encodeQuery = false) {
  if (!URL.canParse(location2)) {
    return location2;
  }
  const locationURL = new URL(location2);
  const origin = new URL(baseUrl).origin;
  let search = locationURL.search;
  if (encodeQuery && search) {
    search = `?${stringifyQs(parseQs(search.slice(1)))}`;
  }
  const href = `${locationURL.origin}${locationURL.pathname}${search}${locationURL.hash}`;
  if (locationURL.origin === origin) {
    return href.slice(origin.length);
  }
  return href;
}

// ../../node_modules/@opennextjs/aws/dist/core/routingHandler.js
init_logger();

// ../../node_modules/@opennextjs/aws/dist/core/routing/cacheInterceptor.js
import { createHash } from "node:crypto";
init_stream();

// ../../node_modules/@opennextjs/aws/dist/utils/cache.js
init_logger();
async function hasBeenRevalidated(key, tags, cacheEntry) {
  if (globalThis.openNextConfig.dangerous?.disableTagCache) {
    return false;
  }
  const value = cacheEntry.value;
  if (!value) {
    return true;
  }
  if ("type" in cacheEntry && cacheEntry.type === "page") {
    return false;
  }
  const lastModified = cacheEntry.lastModified ?? Date.now();
  if (globalThis.tagCache.mode === "nextMode") {
    return tags.length === 0 ? false : await globalThis.tagCache.hasBeenRevalidated(tags, lastModified);
  }
  const _lastModified = await globalThis.tagCache.getLastModified(key, lastModified);
  return _lastModified === -1;
}
function getTagsFromValue(value) {
  if (!value) {
    return [];
  }
  try {
    const cacheTags = value.meta?.headers?.["x-next-cache-tags"]?.split(",") ?? [];
    delete value.meta?.headers?.["x-next-cache-tags"];
    return cacheTags;
  } catch (e) {
    return [];
  }
}

// ../../node_modules/@opennextjs/aws/dist/core/routing/cacheInterceptor.js
init_logger();
var CACHE_ONE_YEAR = 60 * 60 * 24 * 365;
var CACHE_ONE_MONTH = 60 * 60 * 24 * 30;
var VARY_HEADER = "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Next-Url";
var NEXT_SEGMENT_PREFETCH_HEADER = "next-router-segment-prefetch";
var NEXT_PRERENDER_HEADER = "x-nextjs-prerender";
var NEXT_POSTPONED_HEADER = "x-nextjs-postponed";
async function computeCacheControl(path3, body, host, revalidate, lastModified) {
  let finalRevalidate = CACHE_ONE_YEAR;
  const existingRoute = Object.entries(PrerenderManifest?.routes ?? {}).find((p) => p[0] === path3)?.[1];
  if (revalidate === void 0 && existingRoute) {
    finalRevalidate = existingRoute.initialRevalidateSeconds === false ? CACHE_ONE_YEAR : existingRoute.initialRevalidateSeconds;
  } else if (revalidate !== void 0) {
    finalRevalidate = revalidate === false ? CACHE_ONE_YEAR : revalidate;
  }
  const age = Math.round((Date.now() - (lastModified ?? 0)) / 1e3);
  const hash = (str) => createHash("md5").update(str).digest("hex");
  const etag = hash(body);
  if (revalidate === 0) {
    return {
      "cache-control": "private, no-cache, no-store, max-age=0, must-revalidate",
      "x-opennext-cache": "ERROR",
      etag
    };
  }
  if (finalRevalidate !== CACHE_ONE_YEAR) {
    const sMaxAge = Math.max(finalRevalidate - age, 1);
    debug("sMaxAge", {
      finalRevalidate,
      age,
      lastModified,
      revalidate
    });
    const isStale = sMaxAge === 1;
    if (isStale) {
      let url = NextConfig.trailingSlash ? `${path3}/` : path3;
      if (NextConfig.basePath) {
        url = `${NextConfig.basePath}${url}`;
      }
      await globalThis.queue.send({
        MessageBody: {
          host,
          url,
          eTag: etag,
          lastModified: lastModified ?? Date.now()
        },
        MessageDeduplicationId: hash(`${path3}-${lastModified}-${etag}`),
        MessageGroupId: generateMessageGroupId(path3)
      });
    }
    return {
      "cache-control": `s-maxage=${sMaxAge}, stale-while-revalidate=${CACHE_ONE_MONTH}`,
      "x-opennext-cache": isStale ? "STALE" : "HIT",
      etag
    };
  }
  return {
    "cache-control": `s-maxage=${CACHE_ONE_YEAR}, stale-while-revalidate=${CACHE_ONE_MONTH}`,
    "x-opennext-cache": "HIT",
    etag
  };
}
function getBodyForAppRouter(event, cachedValue) {
  if (cachedValue.type !== "app") {
    throw new Error("getBodyForAppRouter called with non-app cache value");
  }
  try {
    const segmentHeader = `${event.headers[NEXT_SEGMENT_PREFETCH_HEADER]}`;
    const isSegmentResponse = Boolean(segmentHeader) && segmentHeader in (cachedValue.segmentData || {});
    const body = isSegmentResponse ? cachedValue.segmentData[segmentHeader] : cachedValue.rsc;
    return {
      body,
      additionalHeaders: isSegmentResponse ? { [NEXT_PRERENDER_HEADER]: "1", [NEXT_POSTPONED_HEADER]: "2" } : {}
    };
  } catch (e) {
    error("Error while getting body for app router from cache:", e);
    return { body: cachedValue.rsc, additionalHeaders: {} };
  }
}
async function generateResult(event, localizedPath, cachedValue, lastModified) {
  debug("Returning result from experimental cache");
  let body = "";
  let type = "application/octet-stream";
  let isDataRequest = false;
  let additionalHeaders = {};
  if (cachedValue.type === "app") {
    isDataRequest = Boolean(event.headers.rsc);
    if (isDataRequest) {
      const { body: appRouterBody, additionalHeaders: appHeaders } = getBodyForAppRouter(event, cachedValue);
      body = appRouterBody;
      additionalHeaders = appHeaders;
    } else {
      body = cachedValue.html;
    }
    type = isDataRequest ? "text/x-component" : "text/html; charset=utf-8";
  } else if (cachedValue.type === "page") {
    isDataRequest = Boolean(event.query.__nextDataReq);
    body = isDataRequest ? JSON.stringify(cachedValue.json) : cachedValue.html;
    type = isDataRequest ? "application/json" : "text/html; charset=utf-8";
  } else {
    throw new Error("generateResult called with unsupported cache value type, only 'app' and 'page' are supported");
  }
  const cacheControl = await computeCacheControl(localizedPath, body, event.headers.host, cachedValue.revalidate, lastModified);
  return {
    type: "core",
    // Sometimes other status codes can be cached, like 404. For these cases, we should return the correct status code
    // Also set the status code to the rewriteStatusCode if defined
    // This can happen in handleMiddleware in routingHandler.
    // `NextResponse.rewrite(url, { status: xxx})
    // The rewrite status code should take precedence over the cached one
    statusCode: event.rewriteStatusCode ?? cachedValue.meta?.status ?? 200,
    body: toReadableStream(body, false),
    isBase64Encoded: false,
    headers: {
      ...cacheControl,
      "content-type": type,
      ...cachedValue.meta?.headers,
      vary: VARY_HEADER,
      ...additionalHeaders
    }
  };
}
function escapePathDelimiters(segment, escapeEncoded) {
  return segment.replace(new RegExp(`([/#?]${escapeEncoded ? "|%(2f|23|3f|5c)" : ""})`, "gi"), (char) => encodeURIComponent(char));
}
function decodePathParams(pathname) {
  return pathname.split("/").map((segment) => {
    try {
      return escapePathDelimiters(decodeURIComponent(segment), true);
    } catch (e) {
      return segment;
    }
  }).join("/");
}
async function cacheInterceptor(event) {
  if (Boolean(event.headers["next-action"]) || Boolean(event.headers["x-prerender-revalidate"]))
    return event;
  const cookies = event.headers.cookie || "";
  const hasPreviewData = cookies.includes("__prerender_bypass") || cookies.includes("__next_preview_data");
  if (hasPreviewData) {
    debug("Preview mode detected, passing through to handler");
    return event;
  }
  let localizedPath = localizePath(event);
  if (NextConfig.basePath) {
    localizedPath = localizedPath.replace(NextConfig.basePath, "");
  }
  localizedPath = localizedPath.replace(/\/$/, "");
  localizedPath = decodePathParams(localizedPath);
  debug("Checking cache for", localizedPath, PrerenderManifest);
  const isISR = Object.keys(PrerenderManifest?.routes ?? {}).includes(localizedPath ?? "/") || Object.values(PrerenderManifest?.dynamicRoutes ?? {}).some((dr) => new RegExp(dr.routeRegex).test(localizedPath));
  debug("isISR", isISR);
  if (isISR) {
    try {
      const cachedData = await globalThis.incrementalCache.get(localizedPath ?? "/index");
      debug("cached data in interceptor", cachedData);
      if (!cachedData?.value) {
        return event;
      }
      if (cachedData.value?.type === "app" || cachedData.value?.type === "route") {
        const tags = getTagsFromValue(cachedData.value);
        const _hasBeenRevalidated = cachedData.shouldBypassTagCache ? false : await hasBeenRevalidated(localizedPath, tags, cachedData);
        if (_hasBeenRevalidated) {
          return event;
        }
      }
      const host = event.headers.host;
      switch (cachedData?.value?.type) {
        case "app":
        case "page":
          return generateResult(event, localizedPath, cachedData.value, cachedData.lastModified);
        case "redirect": {
          const cacheControl = await computeCacheControl(localizedPath, "", host, cachedData.value.revalidate, cachedData.lastModified);
          return {
            type: "core",
            statusCode: cachedData.value.meta?.status ?? 307,
            body: emptyReadableStream(),
            headers: {
              ...cachedData.value.meta?.headers ?? {},
              ...cacheControl
            },
            isBase64Encoded: false
          };
        }
        case "route": {
          const cacheControl = await computeCacheControl(localizedPath, cachedData.value.body, host, cachedData.value.revalidate, cachedData.lastModified);
          const isBinary = isBinaryContentType(String(cachedData.value.meta?.headers?.["content-type"]));
          return {
            type: "core",
            statusCode: event.rewriteStatusCode ?? cachedData.value.meta?.status ?? 200,
            body: toReadableStream(cachedData.value.body, isBinary),
            headers: {
              ...cacheControl,
              ...cachedData.value.meta?.headers,
              vary: VARY_HEADER
            },
            isBase64Encoded: isBinary
          };
        }
        default:
          return event;
      }
    } catch (e) {
      debug("Error while fetching cache", e);
      return event;
    }
  }
  return event;
}

// ../../node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
function parse2(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path3 = "";
  var tryConsume = function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  };
  var mustConsume = function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  };
  var consumeText = function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  };
  var isSafe = function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  };
  var safePattern = function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  };
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path3 += prefix;
        prefix = "";
      }
      if (path3) {
        result.push(path3);
        path3 = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path3 += value;
      continue;
    }
    if (path3) {
      result.push(path3);
      path3 = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
function compile(str, options) {
  return tokensToFunction(parse2(str, options), options);
}
function tokensToFunction(tokens, options) {
  if (options === void 0) {
    options = {};
  }
  var reFlags = flags(options);
  var _a = options.encode, encode = _a === void 0 ? function(x) {
    return x;
  } : _a, _b = options.validate, validate = _b === void 0 ? true : _b;
  var matches = tokens.map(function(token) {
    if (typeof token === "object") {
      return new RegExp("^(?:".concat(token.pattern, ")$"), reFlags);
    }
  });
  return function(data) {
    var path3 = "";
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      if (typeof token === "string") {
        path3 += token;
        continue;
      }
      var value = data ? data[token.name] : void 0;
      var optional = token.modifier === "?" || token.modifier === "*";
      var repeat = token.modifier === "*" || token.modifier === "+";
      if (Array.isArray(value)) {
        if (!repeat) {
          throw new TypeError('Expected "'.concat(token.name, '" to not repeat, but got an array'));
        }
        if (value.length === 0) {
          if (optional)
            continue;
          throw new TypeError('Expected "'.concat(token.name, '" to not be empty'));
        }
        for (var j = 0; j < value.length; j++) {
          var segment = encode(value[j], token);
          if (validate && !matches[i].test(segment)) {
            throw new TypeError('Expected all "'.concat(token.name, '" to match "').concat(token.pattern, '", but got "').concat(segment, '"'));
          }
          path3 += token.prefix + segment + token.suffix;
        }
        continue;
      }
      if (typeof value === "string" || typeof value === "number") {
        var segment = encode(String(value), token);
        if (validate && !matches[i].test(segment)) {
          throw new TypeError('Expected "'.concat(token.name, '" to match "').concat(token.pattern, '", but got "').concat(segment, '"'));
        }
        path3 += token.prefix + segment + token.suffix;
        continue;
      }
      if (optional)
        continue;
      var typeOfMessage = repeat ? "an array" : "a string";
      throw new TypeError('Expected "'.concat(token.name, '" to be ').concat(typeOfMessage));
    }
    return path3;
  };
}
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path3 = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    };
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path: path3, index, params };
  };
}
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
function regexpToRegexp(path3, keys) {
  if (!keys)
    return path3;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path3.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path3.source);
  }
  return path3;
}
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path3) {
    return pathToRegexp(path3, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
function stringToRegexp(path3, keys, options) {
  return tokensToRegexp(parse2(path3, options), keys, options);
}
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
function pathToRegexp(path3, keys, options) {
  if (path3 instanceof RegExp)
    return regexpToRegexp(path3, keys);
  if (Array.isArray(path3))
    return arrayToRegexp(path3, keys, options);
  return stringToRegexp(path3, keys, options);
}

// ../../node_modules/@opennextjs/aws/dist/utils/normalize-path.js
import path2 from "node:path";
function normalizeRepeatedSlashes(url) {
  const urlNoQuery = url.host + url.pathname;
  return `${url.protocol}//${urlNoQuery.replace(/\\/g, "/").replace(/\/\/+/g, "/")}${url.search}`;
}

// ../../node_modules/@opennextjs/aws/dist/core/routing/matcher.js
init_stream();
init_logger();

// ../../node_modules/@opennextjs/aws/dist/core/routing/routeMatcher.js
var optionalLocalePrefixRegex = `^/(?:${RoutesManifest.locales.map((locale) => `${locale}/?`).join("|")})?`;
var optionalBasepathPrefixRegex = RoutesManifest.basePath ? `^${RoutesManifest.basePath}/?` : "^/";
var optionalPrefix = optionalLocalePrefixRegex.replace("^/", optionalBasepathPrefixRegex);
function routeMatcher(routeDefinitions) {
  const regexp = routeDefinitions.map((route) => ({
    page: route.page,
    regexp: new RegExp(route.regex.replace("^/", optionalPrefix))
  }));
  const appPathsSet = /* @__PURE__ */ new Set();
  const routePathsSet = /* @__PURE__ */ new Set();
  for (const [k, v] of Object.entries(AppPathRoutesManifest)) {
    if (k.endsWith("page")) {
      appPathsSet.add(v);
    } else if (k.endsWith("route")) {
      routePathsSet.add(v);
    }
  }
  return function matchRoute(path3) {
    const foundRoutes = regexp.filter((route) => route.regexp.test(path3));
    return foundRoutes.map((foundRoute) => {
      let routeType = "page";
      if (appPathsSet.has(foundRoute.page)) {
        routeType = "app";
      } else if (routePathsSet.has(foundRoute.page)) {
        routeType = "route";
      }
      return {
        route: foundRoute.page,
        type: routeType
      };
    });
  };
}
var staticRouteMatcher = routeMatcher([
  ...RoutesManifest.routes.static,
  ...getStaticAPIRoutes()
]);
var dynamicRouteMatcher = routeMatcher(RoutesManifest.routes.dynamic);
function getStaticAPIRoutes() {
  const createRouteDefinition = (route) => ({
    page: route,
    regex: `^${route}(?:/)?$`
  });
  const dynamicRoutePages = new Set(RoutesManifest.routes.dynamic.map(({ page }) => page));
  const pagesStaticAPIRoutes = Object.keys(PagesManifest).filter((route) => route.startsWith("/api/") && !dynamicRoutePages.has(route)).map(createRouteDefinition);
  const appPathsStaticAPIRoutes = Object.values(AppPathRoutesManifest).filter((route) => (route.startsWith("/api/") || route === "/api") && !dynamicRoutePages.has(route)).map(createRouteDefinition);
  return [...pagesStaticAPIRoutes, ...appPathsStaticAPIRoutes];
}

// ../../node_modules/@opennextjs/aws/dist/core/routing/matcher.js
var routeHasMatcher = (headers, cookies, query) => (redirect) => {
  switch (redirect.type) {
    case "header":
      return !!headers?.[redirect.key.toLowerCase()] && new RegExp(redirect.value ?? "").test(headers[redirect.key.toLowerCase()] ?? "");
    case "cookie":
      return !!cookies?.[redirect.key] && new RegExp(redirect.value ?? "").test(cookies[redirect.key] ?? "");
    case "query":
      return query[redirect.key] && Array.isArray(redirect.value) ? redirect.value.reduce((prev, current) => prev || new RegExp(current).test(query[redirect.key]), false) : new RegExp(redirect.value ?? "").test(query[redirect.key] ?? "");
    case "host":
      return headers?.host !== "" && new RegExp(redirect.value ?? "").test(headers.host);
    default:
      return false;
  }
};
function checkHas(matcher, has, inverted = false) {
  return has ? has.reduce((acc, cur) => {
    if (acc === false)
      return false;
    return inverted ? !matcher(cur) : matcher(cur);
  }, true) : true;
}
var getParamsFromSource = (source) => (value) => {
  debug("value", value);
  const _match = source(value);
  return _match ? _match.params : {};
};
var computeParamHas = (headers, cookies, query) => (has) => {
  if (!has.value)
    return {};
  const matcher = new RegExp(`^${has.value}$`);
  const fromSource = (value) => {
    const matches = value.match(matcher);
    return matches?.groups ?? {};
  };
  switch (has.type) {
    case "header":
      return fromSource(headers[has.key.toLowerCase()] ?? "");
    case "cookie":
      return fromSource(cookies[has.key] ?? "");
    case "query":
      return Array.isArray(query[has.key]) ? fromSource(query[has.key].join(",")) : fromSource(query[has.key] ?? "");
    case "host":
      return fromSource(headers.host ?? "");
  }
};
function convertMatch(match2, toDestination, destination) {
  if (!match2) {
    return destination;
  }
  const { params } = match2;
  const isUsingParams = Object.keys(params).length > 0;
  return isUsingParams ? toDestination(params) : destination;
}
function getNextConfigHeaders(event, configHeaders) {
  if (!configHeaders) {
    return {};
  }
  const matcher = routeHasMatcher(event.headers, event.cookies, event.query);
  const requestHeaders = {};
  const localizedRawPath = localizePath(event);
  for (const { headers, has, missing, regex, source, locale } of configHeaders) {
    const path3 = locale === false ? event.rawPath : localizedRawPath;
    if (new RegExp(regex).test(path3) && checkHas(matcher, has) && checkHas(matcher, missing, true)) {
      const fromSource = match(source);
      const _match = fromSource(path3);
      headers.forEach((h) => {
        try {
          const key = convertMatch(_match, compile(h.key), h.key);
          const value = convertMatch(_match, compile(h.value), h.value);
          requestHeaders[key] = value;
        } catch {
          debug(`Error matching header ${h.key} with value ${h.value}`);
          requestHeaders[h.key] = h.value;
        }
      });
    }
  }
  return requestHeaders;
}
function handleRewrites(event, rewrites) {
  const { rawPath, headers, query, cookies, url } = event;
  const localizedRawPath = localizePath(event);
  const matcher = routeHasMatcher(headers, cookies, query);
  const computeHas = computeParamHas(headers, cookies, query);
  const rewrite = rewrites.find((route) => {
    const path3 = route.locale === false ? rawPath : localizedRawPath;
    return new RegExp(route.regex).test(path3) && checkHas(matcher, route.has) && checkHas(matcher, route.missing, true);
  });
  let finalQuery = query;
  let rewrittenUrl = url;
  const isExternalRewrite = isExternal(rewrite?.destination);
  debug("isExternalRewrite", isExternalRewrite);
  if (rewrite) {
    const { pathname, protocol, hostname, queryString } = getUrlParts(rewrite.destination, isExternalRewrite);
    const pathToUse = rewrite.locale === false ? rawPath : localizedRawPath;
    debug("urlParts", { pathname, protocol, hostname, queryString });
    const toDestinationPath = compile(escapeRegex(pathname, { isPath: true }));
    const toDestinationHost = compile(escapeRegex(hostname));
    const toDestinationQuery = compile(escapeRegex(queryString));
    const params = {
      // params for the source
      ...getParamsFromSource(match(escapeRegex(rewrite.source, { isPath: true })))(pathToUse),
      // params for the has
      ...rewrite.has?.reduce((acc, cur) => {
        return Object.assign(acc, computeHas(cur));
      }, {}),
      // params for the missing
      ...rewrite.missing?.reduce((acc, cur) => {
        return Object.assign(acc, computeHas(cur));
      }, {})
    };
    const isUsingParams = Object.keys(params).length > 0;
    let rewrittenQuery = queryString;
    let rewrittenHost = hostname;
    let rewrittenPath = pathname;
    if (isUsingParams) {
      rewrittenPath = unescapeRegex(toDestinationPath(params));
      rewrittenHost = unescapeRegex(toDestinationHost(params));
      rewrittenQuery = unescapeRegex(toDestinationQuery(params));
    }
    if (NextConfig.i18n && !isExternalRewrite) {
      const strippedPathLocale = rewrittenPath.replace(new RegExp(`^/(${NextConfig.i18n.locales.join("|")})`), "");
      if (strippedPathLocale.startsWith("/api/")) {
        rewrittenPath = strippedPathLocale;
      }
    }
    rewrittenUrl = isExternalRewrite ? `${protocol}//${rewrittenHost}${rewrittenPath}` : new URL(rewrittenPath, event.url).href;
    finalQuery = {
      ...query,
      ...convertFromQueryString(rewrittenQuery)
    };
    rewrittenUrl += convertToQueryString(finalQuery);
    debug("rewrittenUrl", { rewrittenUrl, finalQuery, isUsingParams });
  }
  return {
    internalEvent: {
      ...event,
      query: finalQuery,
      rawPath: new URL(rewrittenUrl).pathname,
      url: rewrittenUrl
    },
    __rewrite: rewrite,
    isExternalRewrite
  };
}
function handleRepeatedSlashRedirect(event) {
  if (event.rawPath.match(/(\\|\/\/)/)) {
    return {
      type: event.type,
      statusCode: 308,
      headers: {
        Location: normalizeRepeatedSlashes(new URL(event.url))
      },
      body: emptyReadableStream(),
      isBase64Encoded: false
    };
  }
  return false;
}
function handleTrailingSlashRedirect(event) {
  const url = new URL(event.rawPath, "http://localhost");
  if (
    // Someone is trying to redirect to a different origin, let's not do that
    url.host !== "localhost" || NextConfig.skipTrailingSlashRedirect || // We should not apply trailing slash redirect to API routes
    event.rawPath.startsWith("/api/")
  ) {
    return false;
  }
  const emptyBody = emptyReadableStream();
  if (NextConfig.trailingSlash && !event.headers["x-nextjs-data"] && !event.rawPath.endsWith("/") && !event.rawPath.match(/[\w-]+\.[\w]+$/g)) {
    const headersLocation = event.url.split("?");
    return {
      type: event.type,
      statusCode: 308,
      headers: {
        Location: `${headersLocation[0]}/${headersLocation[1] ? `?${headersLocation[1]}` : ""}`
      },
      body: emptyBody,
      isBase64Encoded: false
    };
  }
  if (!NextConfig.trailingSlash && event.rawPath.endsWith("/") && event.rawPath !== "/") {
    const headersLocation = event.url.split("?");
    return {
      type: event.type,
      statusCode: 308,
      headers: {
        Location: `${headersLocation[0].replace(/\/$/, "")}${headersLocation[1] ? `?${headersLocation[1]}` : ""}`
      },
      body: emptyBody,
      isBase64Encoded: false
    };
  }
  return false;
}
function handleRedirects(event, redirects) {
  const repeatedSlashRedirect = handleRepeatedSlashRedirect(event);
  if (repeatedSlashRedirect)
    return repeatedSlashRedirect;
  const trailingSlashRedirect = handleTrailingSlashRedirect(event);
  if (trailingSlashRedirect)
    return trailingSlashRedirect;
  const localeRedirect = handleLocaleRedirect(event);
  if (localeRedirect)
    return localeRedirect;
  const { internalEvent, __rewrite } = handleRewrites(event, redirects.filter((r) => !r.internal));
  if (__rewrite && !__rewrite.internal) {
    return {
      type: event.type,
      statusCode: __rewrite.statusCode ?? 308,
      headers: {
        Location: internalEvent.url
      },
      body: emptyReadableStream(),
      isBase64Encoded: false
    };
  }
}
function fixDataPage(internalEvent, buildId) {
  const { rawPath, query } = internalEvent;
  const basePath = NextConfig.basePath ?? "";
  const dataPattern = `${basePath}/_next/data/${buildId}`;
  if (rawPath.startsWith("/_next/data") && !rawPath.startsWith(dataPattern)) {
    return {
      type: internalEvent.type,
      statusCode: 404,
      body: toReadableStream("{}"),
      headers: {
        "Content-Type": "application/json"
      },
      isBase64Encoded: false
    };
  }
  if (rawPath.startsWith(dataPattern) && rawPath.endsWith(".json")) {
    const newPath = `${basePath}${rawPath.slice(dataPattern.length, -".json".length).replace(/^\/index$/, "/")}`;
    query.__nextDataReq = "1";
    return {
      ...internalEvent,
      rawPath: newPath,
      query,
      url: new URL(`${newPath}${convertToQueryString(query)}`, internalEvent.url).href
    };
  }
  return internalEvent;
}
function handleFallbackFalse(internalEvent, prerenderManifest) {
  const { rawPath } = internalEvent;
  const { dynamicRoutes = {}, routes = {} } = prerenderManifest ?? {};
  const prerenderedFallbackRoutes = Object.entries(dynamicRoutes).filter(([, { fallback }]) => fallback === false);
  const routeFallback = prerenderedFallbackRoutes.some(([, { routeRegex }]) => {
    const routeRegexExp = new RegExp(routeRegex);
    return routeRegexExp.test(rawPath);
  });
  const locales = NextConfig.i18n?.locales;
  const routesAlreadyHaveLocale = locales?.includes(rawPath.split("/")[1]) || // If we don't use locales, we don't need to add the default locale
  locales === void 0;
  let localizedPath = routesAlreadyHaveLocale ? rawPath : `/${NextConfig.i18n?.defaultLocale}${rawPath}`;
  if (
    // Not if localizedPath is "/" tho, because that would not make it find `isPregenerated` below since it would be try to match an empty string.
    localizedPath !== "/" && NextConfig.trailingSlash && localizedPath.endsWith("/")
  ) {
    localizedPath = localizedPath.slice(0, -1);
  }
  const matchedStaticRoute = staticRouteMatcher(localizedPath);
  const prerenderedFallbackRoutesName = prerenderedFallbackRoutes.map(([name]) => name);
  const matchedDynamicRoute = dynamicRouteMatcher(localizedPath).filter(({ route }) => !prerenderedFallbackRoutesName.includes(route));
  const isPregenerated = Object.keys(routes).includes(localizedPath);
  if (routeFallback && !isPregenerated && matchedStaticRoute.length === 0 && matchedDynamicRoute.length === 0) {
    return {
      event: {
        ...internalEvent,
        rawPath: "/404",
        url: constructNextUrl(internalEvent.url, "/404"),
        headers: {
          ...internalEvent.headers,
          "x-invoke-status": "404"
        }
      },
      isISR: false
    };
  }
  return {
    event: internalEvent,
    isISR: routeFallback || isPregenerated
  };
}

// ../../node_modules/@opennextjs/aws/dist/core/routing/middleware.js
init_stream();
init_utils();
var middlewareManifest = MiddlewareManifest;
var functionsConfigManifest = FunctionsConfigManifest;
var middleMatch = getMiddlewareMatch(middlewareManifest, functionsConfigManifest);
var REDIRECTS = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
function defaultMiddlewareLoader() {
  return Promise.resolve().then(() => (init_edgeFunctionHandler(), edgeFunctionHandler_exports));
}
async function handleMiddleware(internalEvent, initialSearch, middlewareLoader = defaultMiddlewareLoader) {
  const headers = internalEvent.headers;
  if (headers["x-isr"] && headers["x-prerender-revalidate"] === PrerenderManifest?.preview?.previewModeId)
    return internalEvent;
  const normalizedPath = localizePath(internalEvent);
  const hasMatch = middleMatch.some((r) => r.test(normalizedPath));
  if (!hasMatch)
    return internalEvent;
  const initialUrl = new URL(normalizedPath, internalEvent.url);
  initialUrl.search = initialSearch;
  const url = initialUrl.href;
  const middleware = await middlewareLoader();
  const result = await middleware.default({
    // `geo` is pre Next 15.
    geo: {
      // The city name is percent-encoded.
      // See https://github.com/vercel/vercel/blob/4cb6143/packages/functions/src/headers.ts#L94C19-L94C37
      city: decodeURIComponent(headers["x-open-next-city"]),
      country: headers["x-open-next-country"],
      region: headers["x-open-next-region"],
      latitude: headers["x-open-next-latitude"],
      longitude: headers["x-open-next-longitude"]
    },
    headers,
    method: internalEvent.method || "GET",
    nextConfig: {
      basePath: NextConfig.basePath,
      i18n: NextConfig.i18n,
      trailingSlash: NextConfig.trailingSlash
    },
    url,
    body: convertBodyToReadableStream(internalEvent.method, internalEvent.body)
  });
  const statusCode = result.status;
  const responseHeaders = result.headers;
  const reqHeaders = {};
  const resHeaders = {};
  const filteredHeaders = [
    "x-middleware-override-headers",
    "x-middleware-next",
    "x-middleware-rewrite",
    // We need to drop `content-encoding` because it will be decoded
    "content-encoding"
  ];
  const xMiddlewareKey = "x-middleware-request-";
  responseHeaders.forEach((value, key) => {
    if (key.startsWith(xMiddlewareKey)) {
      const k = key.substring(xMiddlewareKey.length);
      reqHeaders[k] = value;
    } else {
      if (filteredHeaders.includes(key.toLowerCase()))
        return;
      if (key.toLowerCase() === "set-cookie") {
        resHeaders[key] = resHeaders[key] ? [...resHeaders[key], value] : [value];
      } else if (REDIRECTS.has(statusCode) && key.toLowerCase() === "location") {
        resHeaders[key] = normalizeLocationHeader(value, internalEvent.url);
      } else {
        resHeaders[key] = value;
      }
    }
  });
  const rewriteUrl = responseHeaders.get("x-middleware-rewrite");
  let isExternalRewrite = false;
  let middlewareQuery = internalEvent.query;
  let newUrl = internalEvent.url;
  if (rewriteUrl) {
    newUrl = rewriteUrl;
    if (isExternal(newUrl, internalEvent.headers.host)) {
      isExternalRewrite = true;
    } else {
      const rewriteUrlObject = new URL(rewriteUrl);
      middlewareQuery = getQueryFromSearchParams(rewriteUrlObject.searchParams);
      if ("__nextDataReq" in internalEvent.query) {
        middlewareQuery.__nextDataReq = internalEvent.query.__nextDataReq;
      }
    }
  }
  if (!rewriteUrl && !responseHeaders.get("x-middleware-next")) {
    const body = result.body ?? emptyReadableStream();
    return {
      type: internalEvent.type,
      statusCode,
      headers: resHeaders,
      body,
      isBase64Encoded: false
    };
  }
  return {
    responseHeaders: resHeaders,
    url: newUrl,
    rawPath: new URL(newUrl).pathname,
    type: internalEvent.type,
    headers: { ...internalEvent.headers, ...reqHeaders },
    body: internalEvent.body,
    method: internalEvent.method,
    query: middlewareQuery,
    cookies: internalEvent.cookies,
    remoteAddress: internalEvent.remoteAddress,
    isExternalRewrite,
    rewriteStatusCode: rewriteUrl && !isExternalRewrite ? statusCode : void 0
  };
}

// ../../node_modules/@opennextjs/aws/dist/core/routingHandler.js
var MIDDLEWARE_HEADER_PREFIX = "x-middleware-response-";
var MIDDLEWARE_HEADER_PREFIX_LEN = MIDDLEWARE_HEADER_PREFIX.length;
var INTERNAL_HEADER_PREFIX = "x-opennext-";
var INTERNAL_HEADER_INITIAL_URL = `${INTERNAL_HEADER_PREFIX}initial-url`;
var INTERNAL_HEADER_LOCALE = `${INTERNAL_HEADER_PREFIX}locale`;
var INTERNAL_HEADER_RESOLVED_ROUTES = `${INTERNAL_HEADER_PREFIX}resolved-routes`;
var INTERNAL_HEADER_REWRITE_STATUS_CODE = `${INTERNAL_HEADER_PREFIX}rewrite-status-code`;
var INTERNAL_EVENT_REQUEST_ID = `${INTERNAL_HEADER_PREFIX}request-id`;
var geoHeaderToNextHeader = {
  "x-open-next-city": "x-vercel-ip-city",
  "x-open-next-country": "x-vercel-ip-country",
  "x-open-next-region": "x-vercel-ip-country-region",
  "x-open-next-latitude": "x-vercel-ip-latitude",
  "x-open-next-longitude": "x-vercel-ip-longitude"
};
function applyMiddlewareHeaders(eventOrResult, middlewareHeaders) {
  const isResult = isInternalResult(eventOrResult);
  const headers = eventOrResult.headers;
  const keyPrefix = isResult ? "" : MIDDLEWARE_HEADER_PREFIX;
  Object.entries(middlewareHeaders).forEach(([key, value]) => {
    if (value) {
      headers[keyPrefix + key] = Array.isArray(value) ? value.join(",") : value;
    }
  });
}
async function routingHandler(event, { assetResolver }) {
  try {
    for (const [openNextGeoName, nextGeoName] of Object.entries(geoHeaderToNextHeader)) {
      const value = event.headers[openNextGeoName];
      if (value) {
        event.headers[nextGeoName] = value;
      }
    }
    for (const key of Object.keys(event.headers)) {
      if (key.startsWith(INTERNAL_HEADER_PREFIX) || key.startsWith(MIDDLEWARE_HEADER_PREFIX)) {
        delete event.headers[key];
      }
    }
    let headers = getNextConfigHeaders(event, ConfigHeaders);
    let eventOrResult = fixDataPage(event, BuildId);
    if (isInternalResult(eventOrResult)) {
      return eventOrResult;
    }
    const redirect = handleRedirects(eventOrResult, RoutesManifest.redirects);
    if (redirect) {
      redirect.headers.Location = normalizeLocationHeader(redirect.headers.Location, event.url, true);
      debug("redirect", redirect);
      return redirect;
    }
    const middlewareEventOrResult = await handleMiddleware(
      eventOrResult,
      // We need to pass the initial search without any decoding
      // TODO: we'd need to refactor InternalEvent to include the initial querystring directly
      // Should be done in another PR because it is a breaking change
      new URL(event.url).search
    );
    if (isInternalResult(middlewareEventOrResult)) {
      return middlewareEventOrResult;
    }
    const middlewareHeadersPrioritized = globalThis.openNextConfig.dangerous?.middlewareHeadersOverrideNextConfigHeaders ?? false;
    if (middlewareHeadersPrioritized) {
      headers = {
        ...headers,
        ...middlewareEventOrResult.responseHeaders
      };
    } else {
      headers = {
        ...middlewareEventOrResult.responseHeaders,
        ...headers
      };
    }
    let isExternalRewrite = middlewareEventOrResult.isExternalRewrite ?? false;
    eventOrResult = middlewareEventOrResult;
    if (!isExternalRewrite) {
      const beforeRewrite = handleRewrites(eventOrResult, RoutesManifest.rewrites.beforeFiles);
      eventOrResult = beforeRewrite.internalEvent;
      isExternalRewrite = beforeRewrite.isExternalRewrite;
      if (!isExternalRewrite) {
        const assetResult = await assetResolver?.maybeGetAssetResult?.(eventOrResult);
        if (assetResult) {
          applyMiddlewareHeaders(assetResult, headers);
          return assetResult;
        }
      }
    }
    const foundStaticRoute = staticRouteMatcher(eventOrResult.rawPath);
    const isStaticRoute = !isExternalRewrite && foundStaticRoute.length > 0;
    if (!(isStaticRoute || isExternalRewrite)) {
      const afterRewrite = handleRewrites(eventOrResult, RoutesManifest.rewrites.afterFiles);
      eventOrResult = afterRewrite.internalEvent;
      isExternalRewrite = afterRewrite.isExternalRewrite;
    }
    let isISR = false;
    if (!isExternalRewrite) {
      const fallbackResult = handleFallbackFalse(eventOrResult, PrerenderManifest);
      eventOrResult = fallbackResult.event;
      isISR = fallbackResult.isISR;
    }
    const foundDynamicRoute = dynamicRouteMatcher(eventOrResult.rawPath);
    const isDynamicRoute = !isExternalRewrite && foundDynamicRoute.length > 0;
    if (!(isDynamicRoute || isStaticRoute || isExternalRewrite)) {
      const fallbackRewrites = handleRewrites(eventOrResult, RoutesManifest.rewrites.fallback);
      eventOrResult = fallbackRewrites.internalEvent;
      isExternalRewrite = fallbackRewrites.isExternalRewrite;
    }
    const isNextImageRoute = eventOrResult.rawPath.startsWith("/_next/image");
    const isRouteFoundBeforeAllRewrites = isStaticRoute || isDynamicRoute || isExternalRewrite;
    if (!(isRouteFoundBeforeAllRewrites || isNextImageRoute || // We need to check again once all rewrites have been applied
    staticRouteMatcher(eventOrResult.rawPath).length > 0 || dynamicRouteMatcher(eventOrResult.rawPath).length > 0)) {
      eventOrResult = {
        ...eventOrResult,
        rawPath: "/404",
        url: constructNextUrl(eventOrResult.url, "/404"),
        headers: {
          ...eventOrResult.headers,
          "x-middleware-response-cache-control": "private, no-cache, no-store, max-age=0, must-revalidate"
        }
      };
    }
    if (globalThis.openNextConfig.dangerous?.enableCacheInterception && !isInternalResult(eventOrResult)) {
      debug("Cache interception enabled");
      eventOrResult = await cacheInterceptor(eventOrResult);
      if (isInternalResult(eventOrResult)) {
        applyMiddlewareHeaders(eventOrResult, headers);
        return eventOrResult;
      }
    }
    applyMiddlewareHeaders(eventOrResult, headers);
    const resolvedRoutes = [
      ...foundStaticRoute,
      ...foundDynamicRoute
    ];
    debug("resolvedRoutes", resolvedRoutes);
    return {
      internalEvent: eventOrResult,
      isExternalRewrite,
      origin: false,
      isISR,
      resolvedRoutes,
      initialURL: event.url,
      locale: NextConfig.i18n ? detectLocale(eventOrResult, NextConfig.i18n) : void 0,
      rewriteStatusCode: middlewareEventOrResult.rewriteStatusCode
    };
  } catch (e) {
    error("Error in routingHandler", e);
    return {
      internalEvent: {
        type: "core",
        method: "GET",
        rawPath: "/500",
        url: constructNextUrl(event.url, "/500"),
        headers: {
          ...event.headers
        },
        query: event.query,
        cookies: event.cookies,
        remoteAddress: event.remoteAddress
      },
      isExternalRewrite: false,
      origin: false,
      isISR: false,
      resolvedRoutes: [],
      initialURL: event.url,
      locale: NextConfig.i18n ? detectLocale(event, NextConfig.i18n) : void 0
    };
  }
}
function isInternalResult(eventOrResult) {
  return eventOrResult != null && "statusCode" in eventOrResult;
}

// ../../node_modules/@opennextjs/aws/dist/adapters/middleware.js
globalThis.internalFetch = fetch;
globalThis.__openNextAls = new AsyncLocalStorage();
var defaultHandler = async (internalEvent, options) => {
  const middlewareConfig = globalThis.openNextConfig.middleware;
  const originResolver = await resolveOriginResolver(middlewareConfig?.originResolver);
  const externalRequestProxy = await resolveProxyRequest(middlewareConfig?.override?.proxyExternalRequest);
  const assetResolver = await resolveAssetResolver(middlewareConfig?.assetResolver);
  const requestId = Math.random().toString(36);
  return runWithOpenNextRequestContext({
    isISRRevalidation: internalEvent.headers["x-isr"] === "1",
    waitUntil: options?.waitUntil,
    requestId
  }, async () => {
    const result = await routingHandler(internalEvent, { assetResolver });
    if ("internalEvent" in result) {
      debug("Middleware intercepted event", internalEvent);
      if (!result.isExternalRewrite) {
        const origin = await originResolver.resolve(result.internalEvent.rawPath);
        return {
          type: "middleware",
          internalEvent: {
            ...result.internalEvent,
            headers: {
              ...result.internalEvent.headers,
              [INTERNAL_HEADER_INITIAL_URL]: internalEvent.url,
              [INTERNAL_HEADER_RESOLVED_ROUTES]: JSON.stringify(result.resolvedRoutes),
              [INTERNAL_EVENT_REQUEST_ID]: requestId,
              [INTERNAL_HEADER_REWRITE_STATUS_CODE]: String(result.rewriteStatusCode)
            }
          },
          isExternalRewrite: result.isExternalRewrite,
          origin,
          isISR: result.isISR,
          initialURL: result.initialURL,
          resolvedRoutes: result.resolvedRoutes
        };
      }
      try {
        return externalRequestProxy.proxy(result.internalEvent);
      } catch (e) {
        error("External request failed.", e);
        return {
          type: "middleware",
          internalEvent: {
            ...result.internalEvent,
            headers: {
              ...result.internalEvent.headers,
              [INTERNAL_EVENT_REQUEST_ID]: requestId
            },
            rawPath: "/500",
            url: constructNextUrl(result.internalEvent.url, "/500"),
            method: "GET"
          },
          // On error we need to rewrite to the 500 page which is an internal rewrite
          isExternalRewrite: false,
          origin: false,
          isISR: result.isISR,
          initialURL: result.internalEvent.url,
          resolvedRoutes: [{ route: "/500", type: "page" }]
        };
      }
    }
    if (process.env.OPEN_NEXT_REQUEST_ID_HEADER || globalThis.openNextDebug) {
      result.headers[INTERNAL_EVENT_REQUEST_ID] = requestId;
    }
    debug("Middleware response", result);
    return result;
  });
};
var handler2 = await createGenericHandler({
  handler: defaultHandler,
  type: "middleware"
});
var middleware_default = {
  fetch: handler2
};
export {
  middleware_default as default,
  handler2 as handler
};
