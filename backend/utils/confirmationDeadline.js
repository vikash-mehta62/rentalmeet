const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_MINUTE = 60 * 1000;
const DEFAULT_TIMEZONE_OFFSET_MINUTES = 330;

const configuredOffsetMinutes = Number(process.env.CONFIRMATION_TIMEZONE_OFFSET_MINUTES);
const SCHEDULE_OFFSET_MS = (
  Number.isFinite(configuredOffsetMinutes)
    ? configuredOffsetMinutes
    : DEFAULT_TIMEZONE_OFFSET_MINUTES
) * MS_PER_MINUTE;

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

const clampConfirmationHours = (hours) => {
  const parsed = Number(hours);
  if (!Number.isFinite(parsed)) return 3;
  return Math.min(Math.max(parsed, 1), 3);
};

const parseTimeToMinutes = (value) => {
  if (typeof value !== 'string') return null;

  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = match[3]?.toUpperCase();

  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
    return null;
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    hours = hours % 12;
    if (meridiem === 'PM') hours += 12;
  } else if (hours < 0 || hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
};

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
};

const addDays = (date, days) => new Date(date.getTime() + days * MS_PER_DAY);

const dateAtMinutes = (date, minutes) => {
  const copy = startOfDay(date);
  copy.setUTCMinutes(minutes);
  return copy;
};

const buildInterval = (date, startMinutes, endMinutes) => {
  const start = dateAtMinutes(date, startMinutes);
  const end = endMinutes === startMinutes
    ? new Date(start.getTime() + MS_PER_DAY)
    : dateAtMinutes(date, endMinutes);

  if (endMinutes < startMinutes) {
    end.setUTCDate(end.getUTCDate() + 1);
  }

  return { start, end };
};

const createVenueSchedule = (availability = {}) => {
  const startMinutes = parseTimeToMinutes(availability.openingTime);
  const endMinutes = parseTimeToMinutes(availability.closingTime);

  if (startMinutes === null || endMinutes === null) return null;

  const availableDays = Array.isArray(availability.availableDays)
    ? availability.availableDays.map((day) => String(day).toLowerCase())
    : [];

  return {
    getWindowForDay(date) {
      const dayName = DAY_NAMES[date.getUTCDay()].toLowerCase();
      if (availableDays.length > 0 && !availableDays.includes(dayName)) return null;
      return { startMinutes, endMinutes };
    }
  };
};

const createServiceSchedule = (service = {}) => {
  if (!Array.isArray(service.availability) || service.availability.length === 0) {
    return null;
  }

  const availabilityByDay = new Map();

  for (const dayAvailability of service.availability) {
    if (!dayAvailability?.day || dayAvailability.isAvailable === false) continue;

    const startMinutes = parseTimeToMinutes(dayAvailability.startTime);
    const endMinutes = parseTimeToMinutes(dayAvailability.endTime);
    if (startMinutes === null || endMinutes === null) continue;

    availabilityByDay.set(String(dayAvailability.day).toLowerCase(), {
      startMinutes,
      endMinutes
    });
  }

  if (availabilityByDay.size === 0) return null;

  return {
    getWindowForDay(date) {
      return availabilityByDay.get(DAY_NAMES[date.getUTCDay()].toLowerCase()) || null;
    }
  };
};

const toScheduleTime = (date) => new Date(date.getTime() + SCHEDULE_OFFSET_MS);
const fromScheduleTime = (date) => new Date(date.getTime() - SCHEDULE_OFFSET_MS);

const findCurrentOrNextInterval = (cursor, schedule) => {
  const scanStart = startOfDay(cursor);

  for (let dayOffset = -1; dayOffset <= 370; dayOffset += 1) {
    const date = addDays(scanStart, dayOffset);
    const window = schedule.getWindowForDay(date);
    if (!window) continue;

    const interval = buildInterval(date, window.startMinutes, window.endMinutes);
    if (interval.end <= cursor) continue;

    return {
      start: interval.start > cursor ? interval.start : new Date(cursor),
      end: interval.end
    };
  }

  return null;
};

const addWorkingHours = (from, hours, schedule) => {
  const confirmationHours = clampConfirmationHours(hours);
  const fallbackDeadline = new Date(from.getTime() + confirmationHours * MS_PER_HOUR);

  if (!schedule) return fallbackDeadline;

  let cursor = toScheduleTime(from);
  let remainingMs = confirmationHours * MS_PER_HOUR;

  while (remainingMs > 0) {
    const interval = findCurrentOrNextInterval(cursor, schedule);
    if (!interval) return fallbackDeadline;

    const availableMs = interval.end.getTime() - interval.start.getTime();
    if (availableMs >= remainingMs) {
      return fromScheduleTime(new Date(interval.start.getTime() + remainingMs));
    }

    remainingMs -= availableMs;
    cursor = interval.end;
  }

  return fromScheduleTime(cursor);
};

const calculateVenueConfirmationDeadline = (availability, confirmationHours, from = new Date()) => {
  return addWorkingHours(from, confirmationHours, createVenueSchedule(availability));
};

const calculateServiceConfirmationDeadline = (service, confirmationHours, from = new Date()) => {
  return addWorkingHours(from, confirmationHours, createServiceSchedule(service));
};

module.exports = {
  addWorkingHours,
  calculateVenueConfirmationDeadline,
  calculateServiceConfirmationDeadline,
  createVenueSchedule,
  createServiceSchedule
};
