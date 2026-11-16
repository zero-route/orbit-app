const HTTPS = /^https:\/\/([^\s/?#@:]+)(?::\d{1,5})?(?:[/?#]|$)/i;

export function isHttps(value: unknown): value is string {
  return typeof value === "string" && HTTPS.test(value);
}

export function hostOf(value: string) {
  const match = HTTPS.exec(value);

  return match ? match[1].toLowerCase() : null;
}

export function hostMatches(host: string, domain: string) {
  return host === domain || host.endsWith(`.${domain}`);
}

const EMBED_DOMAINS = ["youtube.com", "youtube-nocookie.com", "spotify.com"];

export function isTrustedEmbed(value: string) {
  const host = hostOf(value);

  return host !== null && EMBED_DOMAINS.some((domain) => hostMatches(host, domain));
}

export function safeExternal(value?: string) {
  return value && isHttps(value) ? value : undefined;
}
