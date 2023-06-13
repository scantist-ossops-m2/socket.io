import * as XMLHttpRequestModule from "xmlhttprequest-ssl";

export const XHR = XMLHttpRequestModule.default || XMLHttpRequestModule;

export function createCookieJar() {
  return new CookieJar();
}

interface Cookie {
  name: string;
  value: string;
  expires?: Date;
}

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
 */
export function parse(setCookieString: string): Cookie {
  const parts = setCookieString.split("; ");
  const i = parts[0].indexOf("=");

  if (i === -1) {
    return;
  }

  const name = parts[0].substring(0, i).trim();

  if (!name.length) {
    return;
  }

  let value = parts[0].substring(i + 1).trim();

  if (value.charCodeAt(0) === 0x22) {
    // remove double quotes
    value = value.slice(1, -1);
  }

  const cookie: Cookie = {
    name,
    value,
  };

  for (let j = 1; j < parts.length; j++) {
    const subParts = parts[j].split("=");
    if (subParts.length !== 2) {
      continue;
    }
    const key = subParts[0].trim();
    const value = subParts[1].trim();
    switch (key) {
      case "Expires":
        cookie.expires = new Date(value);
        break;
      case "Max-Age":
        const expiration = new Date();
        expiration.setUTCSeconds(
          expiration.getUTCSeconds() + parseInt(value, 10)
        );
        cookie.expires = expiration;
        break;
      default:
      // ignore other keys
    }
  }

  return cookie;
}

export class CookieJar {
  private cookies = new Map<string, Cookie>();

  public parseCookies(xhr: any) {
    const values = xhr.getResponseHeader("set-cookie");
    if (!values) {
      return;
    }
    values.forEach((value) => {
      const parsed = parse(value);
      if (parsed) {
        this.cookies.set(parsed.name, parsed);
      }
    });
  }

  public addCookies(xhr: any) {
    const cookies = [];

    this.cookies.forEach((cookie, name) => {
      if (cookie.expires?.getTime() < Date.now()) {
        this.cookies.delete(name);
      } else {
        cookies.push(`${name}=${cookie.value}`);
      }
    });

    if (cookies.length) {
      xhr.setDisableHeaderCheck(true);
      xhr.setRequestHeader("cookie", cookies.join("; "));
    }
  }
}
