import { CalendarDate } from "@internationalized/date";

export const parseCalendarDate = (dateStr?: string): CalendarDate | null => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    return new CalendarDate(year, month, day);
  };
  
  export const parseCalendarDateTimeStamp = (dateStr?: string): CalendarDate | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  };

  export const parseCalendarDateTimeStampNew = (calendarData: any) => {
    if (calendarData && calendarData.year && calendarData.month && calendarData.day) {
      return new Date(calendarData.year, calendarData.month - 1, calendarData.day);
    }
    return null;
  };
  