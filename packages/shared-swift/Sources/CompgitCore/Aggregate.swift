import Foundation
import CompgitSchema

/// Pure aggregation helpers over ContributionDay[].
/// Mirrors `packages/shared-ts/src/aggregate.ts`.

public struct Bucket: Equatable, Sendable {
    public let key: String
    public let total: Int

    public init(key: String, total: Int) {
        self.key = key
        self.total = total
    }
}

public enum CompgitAggregate {
    public static func totalInWindow(_ days: [ContributionDay], from: String, to: String) -> Int {
        var sum = 0
        for day in days where day.date >= from && day.date <= to {
            sum += day.contributionCount
        }
        return sum
    }

    /// Last `n` days, chronological, left-padded with zeros if the history is shorter.
    public static func sparklineSeries(_ days: [ContributionDay], n: Int) -> [Int] {
        guard n > 0 else { return [] }
        let sorted = days.sorted { $0.date < $1.date }
        let tail = sorted.suffix(n).map(\.contributionCount)
        if tail.count >= n { return Array(tail) }
        return Array(repeating: 0, count: n - tail.count) + tail
    }

    /// Current consecutive-day commit streak. A zero-contribution anchor day does
    /// NOT reset the streak — it resumes from the previous day.
    public static func streak(_ days: [ContributionDay], today: String? = nil) -> Int {
        guard !days.isEmpty else { return 0 }
        var byDate: [String: Int] = [:]
        for d in days { byDate[d.date] = d.contributionCount }
        let sortedDates = byDate.keys.sorted()
        let anchor = today ?? sortedDates.last!
        var cursor = anchor
        var count = 0
        var allowSkipToday = true
        while let contributions = byDate[cursor] {
            if contributions > 0 {
                count += 1
                allowSkipToday = false
            } else if allowSkipToday && cursor == anchor {
                allowSkipToday = false
            } else {
                break
            }
            cursor = previousDate(cursor) ?? ""
        }
        return count
    }

    public static func byWeek(_ days: [ContributionDay]) -> [Bucket] {
        return bucket(days, keyOf: CompgitTime.isoWeekKey)
    }

    public static func byMonth(_ days: [ContributionDay]) -> [Bucket] {
        return bucket(days, keyOf: CompgitTime.monthKey)
    }

    public static func byYear(_ days: [ContributionDay]) -> [Bucket] {
        return bucket(days, keyOf: { String(CompgitTime.yearKey($0)) })
    }

    private static func bucket(
        _ days: [ContributionDay],
        keyOf: (String) -> String
    ) -> [Bucket] {
        var totals: [String: Int] = [:]
        for day in days {
            let key = keyOf(day.date)
            totals[key, default: 0] += day.contributionCount
        }
        return totals
            .map { Bucket(key: $0.key, total: $0.value) }
            .sorted { $0.key < $1.key }
    }

    private static func previousDate(_ ymd: String) -> String? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: "UTC")
        formatter.locale = Locale(identifier: "en_US_POSIX")
        guard let date = formatter.date(from: ymd) else { return nil }
        let prior = date.addingTimeInterval(-86_400)
        return formatter.string(from: prior)
    }
}
