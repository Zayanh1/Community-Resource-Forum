import { addMinutes } from "date-fns";
import { datetime } from "rrule";

export const WeekdayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const ISOWeekdayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function toFixedLength(number: number, length: number) {
  let s = String(number);

  while (s.length < length) {
    s = "0" + s;
  }

  return s;
}

export class Time {
  public static from(date: Date) {
    return new Time(date.getHours(), date.getMinutes());
  }

  public static parse(str: string) {
    const [hour, minute] = str.split(":").map((s) => parseInt(s));

    if (hour === undefined || minute === undefined) {
      throw new Error("Invalid time");
    }

    return new Time(hour, minute);
  }

  constructor(
    private hour: number,
    private minute: number,
  ) {}

  public getHour() {
    return this.hour;
  }

  public getMinute() {
    return this.minute;
  }

  public equals(other: Time) {
    return this.hour === other.hour && this.minute === other.minute;
  }

  public toString() {
    return `${toFixedLength(this.hour, 2)}:${toFixedLength(this.minute, 2)}`;
  }

  public toText() {
    return `${toFixedLength(this.hour % 12 === 0 ? 12 : this.hour % 12, 2)}:${toFixedLength(
      this.minute,
      2,
    )} ${this.hour < 12 ? "AM" : "PM"}`;
  }
}

export class Day {
  public static fromLocal(datetime: Date) {
    return new Day(
      datetime.getFullYear(),
      datetime.getMonth() + 1,
      datetime.getDate(),
    );
  }

  public static fromUTC(datetime: Date) {
    return this.fromLocal(this.utcToLocal(datetime));
  }

  public static localToUTC(datetime: Date) {
    return addMinutes(datetime, datetime.getTimezoneOffset() * -1);
  }

  public static utcToLocal(datetime: Date) {
    return addMinutes(datetime, datetime.getTimezoneOffset());
  }

  constructor(
    private year: number,
    private month: number,
    private date: number,
  ) {}

  public getYear() {
    return this.year;
  }

  public getMonth() {
    return this.month;
  }

  public getDate() {
    return this.date;
  }

  public with(overwrite: { year?: number; month?: number; date?: number }) {
    return new Day(
      overwrite.year ?? this.year,
      overwrite.month ?? this.month,
      overwrite.date ?? this.date,
    );
  }

  public toUTCDatetime(time?: Time) {
    return datetime(
      this.year,
      this.month,
      this.date,
      time?.getHour(),
      time?.getMinute(),
    );
  }

  public toLocalDatetime(time?: Time) {
    if (time) {
      return new Date(
        this.year,
        this.month - 1,
        this.date,
        time.getHour(),
        time.getMinute(),
      );
    }

    return new Date(this.year, this.month - 1, this.date);
  }

  public map<MapFn extends (date: Date, ...options: never[]) => Date>(
    fn: MapFn,
    ...options: MapFn extends (date: Date, ...options: infer Opts) => Date
      ? Opts
      : []
  ): Day {
    return Day.fromLocal(fn(this.toLocalDatetime(), ...options));
  }

  public toString() {
    return `${toFixedLength(this.year, 4)}-${toFixedLength(this.month, 2)}-${toFixedLength(this.date, 2)}`;
  }

  public equals(other: Day) {
    return (
      this.year === other.year &&
      this.month === other.month &&
      this.date === other.date
    );
  }
}
