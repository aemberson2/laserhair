const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export type DayName = (typeof DAYS)[number];

export type DayHours = {
  day: DayName;
  text: string | null;
};

export function parseWorkingHours(raw: unknown): DayHours[] {
  const map = new Map<string, string>();

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      map.set(k.toLowerCase(), formatHoursValue(v));
    }
  } else if (Array.isArray(raw)) {
    for (const entry of raw as unknown[]) {
      if (entry && typeof entry === 'object') {
        for (const [k, v] of Object.entries(entry as Record<string, unknown>)) {
          map.set(k.toLowerCase(), formatHoursValue(v));
        }
      }
    }
  }

  return DAYS.map((day) => ({
    day,
    text: map.get(day.toLowerCase()) ?? null,
  }));
}

function formatHoursValue(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map(String).join(', ');
  return String(v);
}

export type OpenState = 'open' | 'closed' | 'unknown';

export function currentDayInTimezone(timezone: string | null): DayName {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone ?? 'UTC',
      weekday: 'long',
    });
    const name = fmt.format(new Date());
    if ((DAYS as readonly string[]).includes(name)) return name as DayName;
  } catch {
    // fall through
  }
  const utc = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  return ((DAYS as readonly string[]).includes(utc) ? utc : 'Monday') as DayName;
}

export function isOpenNow(
  todayText: string | null,
  timezone: string | null,
): OpenState {
  if (!todayText) return 'unknown';
  const text = todayText.trim();
  if (/^closed$/i.test(text)) return 'closed';
  if (/24\s*hours|open\s*24/i.test(text)) return 'open';

  const range = text.match(
    /(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)\s*[–\-—to]+\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)/,
  );
  if (!range) return 'unknown';

  const startMin = toMinutes(range[1], range[2], range[3]);
  const endMin = toMinutes(range[4], range[5], range[6]);
  if (startMin === null || endMin === null) return 'unknown';

  let nowMin: number;
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone ?? 'UTC',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = fmt.formatToParts(new Date());
    const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    nowMin = (h % 24) * 60 + m;
  } catch {
    return 'unknown';
  }

  const effectiveEnd = endMin <= startMin ? endMin + 24 * 60 : endMin;
  const effectiveNow = nowMin < startMin && endMin <= startMin ? nowMin + 24 * 60 : nowMin;
  return effectiveNow >= startMin && effectiveNow < effectiveEnd ? 'open' : 'closed';
}

function toMinutes(h: string, m: string | undefined, ampm: string): number | null {
  let hour = parseInt(h, 10);
  const minute = m ? parseInt(m, 10) : 0;
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  const upper = ampm.toUpperCase();
  if (upper === 'PM' && hour !== 12) hour += 12;
  if (upper === 'AM' && hour === 12) hour = 0;
  return hour * 60 + minute;
}
