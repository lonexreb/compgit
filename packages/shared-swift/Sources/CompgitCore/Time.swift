import Foundation

/// ISO-8601 calendar-date helpers mirroring `packages/shared-ts/src/time.ts`.
/// Keep the API surface aligned so a bug fixed on one side is easy to port.

public enum CompgitTime {
    public static func todayISODate(now: Date = Date(), timeZone: TimeZone = .init(identifier: "UTC")!) -> String {
        return formatYMD(now, timeZone: timeZone)
    }

    public static func daysAgoISODate(_ n: Int, now: Date = Date(), timeZone: TimeZone = .init(identifier: "UTC")!) -> String {
        let shifted = now.addingTimeInterval(-Double(n) * 86_400)
        return formatYMD(shifted, timeZone: timeZone)
    }

    public static func rangeDates(from: String, to: String) -> [String] {
        guard let start = Self.parse(from), let end = Self.parse(to), start <= end else {
            return []
        }
        var out: [String] = []
        var cursor = start
        while cursor <= end {
            out.append(formatYMD(cursor, timeZone: .init(identifier: "UTC")!))
            cursor = cursor.addingTimeInterval(86_400)
        }
        return out
    }

    public static func monthKey(_ date: String) -> String {
        return String(date.prefix(7))
    }

    public static func yearKey(_ date: String) -> Int {
        return Int(date.prefix(4)) ?? 1970
    }

    /// ISO week key (YYYY-Www). Week starts Monday per ISO 8601.
    public static func isoWeekKey(_ date: String) -> String {
        guard let d = parse(date) else { return "1970-W01" }
        var cal = Calendar(identifier: .iso8601)
        cal.timeZone = TimeZone(identifier: "UTC")!
        let components = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: d)
        let year = components.yearForWeekOfYear ?? 1970
        let week = components.weekOfYear ?? 1
        return String(format: "%04d-W%02d", year, week)
    }

    private static func formatYMD(_ date: Date, timeZone: TimeZone) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = timeZone
        formatter.locale = Locale(identifier: "en_US_POSIX")
        return formatter.string(from: date)
    }

    private static func parse(_ ymd: String) -> Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: "UTC")
        formatter.locale = Locale(identifier: "en_US_POSIX")
        return formatter.date(from: ymd)
    }
}
