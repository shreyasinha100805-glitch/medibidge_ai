const formatterCache = new Map();
const validationCache = new Map();
const offsetCache = new Map();

export function normalizeTimeZone(value) {
  if (typeof value !== 'string') return null;
  const timeZone = value.trim();
  if (!timeZone || timeZone.length > 100) return null;
  if (validationCache.has(timeZone)) return validationCache.get(timeZone);

  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    validationCache.set(timeZone, timeZone);
    return timeZone;
  } catch {
    validationCache.set(timeZone, null);
    return null;
  }
}

function getFormatter(timeZone) {
  const normalizedTimeZone = normalizeTimeZone(timeZone) || 'UTC';
  if (!formatterCache.has(normalizedTimeZone)) {
    formatterCache.set(
      normalizedTimeZone,
      new Intl.DateTimeFormat('en-US', {
        timeZone: normalizedTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      })
    );
  }
  return formatterCache.get(normalizedTimeZone);
}

function getDateParts(date, timeZone) {
  const parts = Object.fromEntries(
    getFormatter(timeZone)
      .formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)])
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

export function getCalendarDateKey(date, timeZone = 'UTC') {
  const parts = getDateParts(new Date(date), timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export function getStoredDateKey(date, timeZone = 'UTC') {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;

  // Date-only form values are stored as UTC midnight. Preserve their calendar date.
  if (
    parsed.getUTCHours() === 0 &&
    parsed.getUTCMinutes() === 0 &&
    parsed.getUTCSeconds() === 0 &&
    parsed.getUTCMilliseconds() === 0
  ) {
    return parsed.toISOString().slice(0, 10);
  }

  return getCalendarDateKey(parsed, timeZone);
}

export function addCalendarDays(dateKey, days) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function getDateKeyParts(dateKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) throw new RangeError('Date must be in YYYY-MM-DD format.');
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function getPossibleOffsets(targetMs, timeZone, dateKey) {
  const cacheKey = `${timeZone}:${dateKey}`;
  if (offsetCache.has(cacheKey)) return offsetCache.get(cacheKey);

  const offsets = new Set();
  const windowMs = 36 * 60 * 60 * 1000;

  for (let delta = -windowMs; delta <= windowMs; delta += 3 * 60 * 60 * 1000) {
    const probeMs = targetMs + delta;
    const local = getDateParts(new Date(probeMs), timeZone);
    const representedAsUtc = Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second
    );
    offsets.add(representedAsUtc - Math.floor(probeMs / 1000) * 1000);
  }

  const result = [...offsets];
  offsetCache.set(cacheKey, result);
  return result;
}

function findExactInstant(targetParts, timeZone, offsets) {
  const targetMs = Date.UTC(
    targetParts.year,
    targetParts.month - 1,
    targetParts.day,
    targetParts.hour,
    targetParts.minute
  );
  const candidates = offsets
    .map((offsetMs) => targetMs - offsetMs)
    .filter((candidateMs) => {
      const actual = getDateParts(new Date(candidateMs), timeZone);
      return (
        actual.year === targetParts.year &&
        actual.month === targetParts.month &&
        actual.day === targetParts.day &&
        actual.hour === targetParts.hour &&
        actual.minute === targetParts.minute
      );
    })
    .sort((left, right) => left - right);

  return candidates[0] ?? null;
}

export function getZonedDateTime(dateKey, time, timeZone = 'UTC') {
  const normalizedTimeZone = normalizeTimeZone(timeZone) || 'UTC';
  const dateParts = getDateKeyParts(dateKey);
  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!timeMatch) throw new RangeError('Time must be in HH:mm format.');

  const targetParts = {
    ...dateParts,
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
  };
  const targetMs = Date.UTC(
    targetParts.year,
    targetParts.month - 1,
    targetParts.day,
    targetParts.hour,
    targetParts.minute
  );
  const offsets = getPossibleOffsets(targetMs, normalizedTimeZone, dateKey);
  let result = findExactInstant(targetParts, normalizedTimeZone, offsets);

  // A wall time can be skipped by a daylight-saving transition. Move to the
  // first valid local minute on that date instead of silently using server time.
  for (let minuteOffset = 1; result === null && minuteOffset <= 180; minuteOffset += 1) {
    const shifted = new Date(targetMs + minuteOffset * 60 * 1000);
    const shiftedParts = {
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
      hour: shifted.getUTCHours(),
      minute: shifted.getUTCMinutes(),
    };
    if (
      shiftedParts.year !== dateParts.year ||
      shiftedParts.month !== dateParts.month ||
      shiftedParts.day !== dateParts.day
    ) {
      break;
    }
    result = findExactInstant(shiftedParts, normalizedTimeZone, offsets);
  }

  if (result === null) throw new RangeError('Could not resolve the scheduled time in this time zone.');
  return new Date(result);
}

export function getZonedDayBounds(referenceDate = new Date(), timeZone = 'UTC') {
  const dateKey = getCalendarDateKey(referenceDate, timeZone);
  const start = getZonedDateTime(dateKey, '00:00', timeZone);
  const endExclusive = getZonedDateTime(addCalendarDays(dateKey, 1), '00:00', timeZone);
  return { dateKey, start, endExclusive };
}

export function getRollingDateRange(referenceDate = new Date(), days = 1, timeZone = 'UTC') {
  const { dateKey, endExclusive } = getZonedDayBounds(referenceDate, timeZone);
  const startDateKey = addCalendarDays(dateKey, -(days - 1));
  return {
    startDateKey,
    endDateKey: dateKey,
    start: getZonedDateTime(startDateKey, '00:00', timeZone),
    end: new Date(endExclusive.getTime() - 1),
    endExclusive,
  };
}

export function calendarDaysBetween(startDateKey, endDateKey) {
  const [startYear, startMonth, startDay] = startDateKey.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDateKey.split('-').map(Number);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.round((end - start) / 86400000);
}
