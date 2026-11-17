const DEFAULT_PRODUCTION_API_URL = 'https://medibridge-backend-nq9w.onrender.com/api';

const normalizeApiPath = (path) => {
  const normalized = path.replace(/\/+$/, '');
  if (!normalized || normalized === '/') return '/api';
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

export const resolveApiBaseUrl = (configuredUrl, isProduction) => {
  const fallback = isProduction ? DEFAULT_PRODUCTION_API_URL : '/api';
  if (typeof configuredUrl !== 'string' || !configuredUrl.trim()) return fallback;

  const candidate = configuredUrl.trim();
  const isTemplateValue = /<[^>]*>|\byour[_ -].*(?:url|backend|render|api)\b|example\.com/i.test(candidate);
  if (isTemplateValue) return fallback;

  if (candidate.startsWith('/')) {
    return normalizeApiPath(candidate);
  }

  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol)) return fallback;
    if (isProduction && url.protocol !== 'https:') return fallback;
    url.pathname = normalizeApiPath(url.pathname);
    url.search = '';
    url.hash = '';
    return `${url.origin}${url.pathname}`;
  } catch {
    return fallback;
  }
};
