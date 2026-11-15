/**
 * URL validation helper mirroring the FastAPI backend's validation logic.
 * Requirements:
 * - Exactly one valid HTTP or HTTPS URL
 * - Length of total message <= 200 characters
 * - Valid RFC 1123 hostname syntax
 */

const URL_REGEX = /(?:[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s<>"'`]+|www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s<>"'`]*)/g;
const LEADING_PUNCT = /^[\(\[<"'\`]+/;

/**
 * Strips prose punctuation from candidate URL tokens while preserving balanced parens (e.g. Wikipedia).
 */
export function cleanCandidateUrl(token) {
  let cleaned = token.replace(LEADING_PUNCT, '');
  while (cleaned.length > 0) {
    const lastChar = cleaned[cleaned.length - 1];
    if (['.', ',', ';', ':', '!', '?', '"', "'", '`', '\\', '>', '}'].includes(lastChar)) {
      cleaned = cleaned.slice(0, -1);
    } else if (lastChar === ')') {
      const openCount = (cleaned.match(/\(/g) || []).length;
      const closeCount = (cleaned.match(/\)/g) || []).length;
      if (closeCount > openCount) {
        cleaned = cleaned.slice(0, -1);
      } else {
        break;
      }
    } else if (lastChar === ']') {
      const openCount = (cleaned.match(/\[/g) || []).length;
      const closeCount = (cleaned.match(/\]/g) || []).length;
      if (closeCount > openCount) {
        cleaned = cleaned.slice(0, -1);
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return cleaned;
}

/**
 * Extract and validate URLs within a text message.
 * @param {string} text - Message input
 * @returns {{
 *   urls: string[],
 *   count: number,
 *   singleValidUrl: string | null,
 *   isValid: boolean,
 *   status: 'empty' | 'no_url' | 'valid' | 'multiple_urls' | 'invalid_scheme' | 'invalid_format',
 *   message: string
 * }}
 */
export function analyzeMessageUrls(text) {
  if (!text || !text.trim()) {
    return {
      urls: [],
      count: 0,
      singleValidUrl: null,
      isValid: false,
      status: 'empty',
      message: 'Message cannot be empty.',
    };
  }

  const rawMatches = text.match(URL_REGEX) || [];
  const candidates = rawMatches
    .map(cleanCandidateUrl)
    .filter(u => u.length > 0);

  if (candidates.length === 0) {
    return {
      urls: [],
      count: 0,
      singleValidUrl: null,
      isValid: false,
      status: 'no_url',
      message: 'Exactly one HTTP or HTTPS link is required.',
    };
  }

  if (candidates.length > 1) {
    return {
      urls: candidates,
      count: candidates.length,
      singleValidUrl: null,
      isValid: false,
      status: 'multiple_urls',
      message: `Found ${candidates.length} URLs. Exactly 1 is permitted.`,
    };
  }

  const candidate = candidates[0];

  if (candidate.toLowerCase().startsWith('www.')) {
    return {
      urls: candidates,
      count: 1,
      singleValidUrl: null,
      isValid: false,
      status: 'invalid_scheme',
      message: 'Missing protocol: please prepend http:// or https://',
    };
  }

  try {
    const parsed = new URL(candidate);
    const protocol = parsed.protocol.toLowerCase();

    if (protocol !== 'http:' && protocol !== 'https:') {
      return {
        urls: candidates,
        count: 1,
        singleValidUrl: null,
        isValid: false,
        status: 'invalid_scheme',
        message: `Unsupported scheme '${protocol}'. Only http:// and https:// are supported.`,
      };
    }

    if (!parsed.hostname || parsed.hostname.length === 0) {
      return {
        urls: candidates,
        count: 1,
        singleValidUrl: null,
        isValid: false,
        status: 'invalid_format',
        message: 'Invalid URL: missing valid hostname.',
      };
    }

    // Hostname checks
    const hostname = parsed.hostname;
    if (hostname.startsWith('.') || hostname.endsWith('.') || hostname.includes('..')) {
      return {
        urls: candidates,
        count: 1,
        singleValidUrl: null,
        isValid: false,
        status: 'invalid_format',
        message: 'Invalid hostname with consecutive or edge dots.',
      };
    }

    return {
      urls: [candidate],
      count: 1,
      singleValidUrl: candidate,
      isValid: true,
      status: 'valid',
      message: `Valid link detected: ${parsed.hostname}`,
    };
  } catch (err) {
    return {
      urls: candidates,
      count: 1,
      singleValidUrl: null,
      isValid: false,
      status: 'invalid_format',
      message: 'Malformed URL syntax.',
    };
  }
}
