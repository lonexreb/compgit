import Foundation
import CompgitSchema

/// URLSession-backed GraphQL client for api.github.com.
/// Mirrors `packages/shared-ts/src/github/graphql.ts`.
public actor GitHubClient {
    private let session: URLSession
    private let now: @Sendable () -> Date
    private static let endpoint = URL(string: "https://api.github.com/graphql")!
    private static let userAgent = "compgit/0.0.0"

    public init(
        session: URLSession = .shared,
        now: @escaping @Sendable () -> Date = { Date() }
    ) {
        self.session = session
        self.now = now
    }

    public func fetchContributionsCollection(
        login: String,
        from: String,
        to: String,
        token: String
    ) async throws -> ContributionsCollection {
        let body: [String: Any] = [
            "query": Self.contributionsQuery,
            "variables": ["login": login, "from": from, "to": to],
        ]
        let data = try await postGraphQL(body: body, token: token)
        let decoded = try decode(ContributionsResponse.self, from: data)
        try Self.raiseIfError(decoded.errors)
        guard let payload = decoded.data else {
            throw CompgitError.validation(message: "GraphQL response missing data")
        }
        let calendar = payload.user.contributionsCollection.contributionCalendar
        let days = calendar.weeks.flatMap { $0.contributionDays }.sorted { $0.date < $1.date }
        let fetchedAt = ISO8601DateFormatter.compgit.string(from: now())
        return ContributionsCollection(
            days: days,
            fetchedAt: fetchedAt,
            from: from,
            login: login,
            to: to,
            totalContributions: payload.user.contributionsCollection.totalContributions
        )
    }

    public func fetchViewerLogin(token: String) async throws -> String {
        let body: [String: Any] = ["query": Self.viewerQuery]
        let data = try await postGraphQL(body: body, token: token)
        let decoded = try decode(ViewerResponse.self, from: data)
        if let errors = decoded.errors, !errors.isEmpty {
            throw CompgitError.auth(message: errors.map(\.message).joined(separator: "; "))
        }
        guard let payload = decoded.data else {
            throw CompgitError.auth(message: "GraphQL response missing viewer")
        }
        return payload.viewer.login
    }

    // MARK: - Private

    private func postGraphQL(body: [String: Any], token: String) async throws -> Data {
        var request = URLRequest(url: Self.endpoint)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
        request.setValue(Self.userAgent, forHTTPHeaderField: "User-Agent")
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        } catch {
            throw CompgitError.validation(message: "could not encode GraphQL body: \(error)")
        }

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw CompgitError.network(underlying: String(describing: error))
        }

        guard let http = response as? HTTPURLResponse else {
            throw CompgitError.network(underlying: "non-HTTP response")
        }

        switch http.statusCode {
        case 200..<300:
            return data
        case 401:
            throw CompgitError.auth(message: "GitHub rejected the token (401 Unauthorized)")
        case 403, 429:
            let resetAt = Self.parseRateLimitReset(from: http) ?? Date().addingTimeInterval(60)
            throw CompgitError.rateLimited(resetAt: resetAt)
        default:
            throw CompgitError.network(underlying: "HTTP \(http.statusCode)")
        }
    }

    private func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        do {
            return try JSONDecoder().decode(type, from: data)
        } catch {
            throw CompgitError.validation(message: "could not decode \(type): \(error)")
        }
    }

    private static func raiseIfError(_ errors: [GraphQLError]?) throws {
        guard let errors, !errors.isEmpty else { return }
        throw CompgitError.validation(message: errors.map(\.message).joined(separator: "; "))
    }

    private static func parseRateLimitReset(from response: HTTPURLResponse) -> Date? {
        guard let header = response.value(forHTTPHeaderField: "X-RateLimit-Reset"),
              let unix = TimeInterval(header) else {
            return nil
        }
        return Date(timeIntervalSince1970: unix)
    }

    private static let contributionsQuery = """
    query GetContributionCalendar($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          totalContributions
          contributionCalendar {
            totalWeeks
            weeks {
              contributionDays {
                contributionCount
                date
                contributionLevel
              }
            }
          }
        }
      }
    }
    """

    private static let viewerQuery = """
    query { viewer { login } }
    """

    // MARK: - Decodable payloads

    private struct ContributionsResponse: Decodable {
        let data: Payload?
        let errors: [GraphQLError]?

        struct Payload: Decodable {
            let user: UserPayload
        }

        struct UserPayload: Decodable {
            let contributionsCollection: CollectionPayload
        }

        struct CollectionPayload: Decodable {
            let totalContributions: Int
            let contributionCalendar: CalendarPayload
        }

        struct CalendarPayload: Decodable {
            let weeks: [WeekPayload]
        }

        struct WeekPayload: Decodable {
            let contributionDays: [ContributionDay]
        }
    }

    private struct ViewerResponse: Decodable {
        let data: ViewerPayload?
        let errors: [GraphQLError]?

        struct ViewerPayload: Decodable {
            let viewer: ViewerInner
        }

        struct ViewerInner: Decodable {
            let login: String
        }
    }

    private struct GraphQLError: Decodable {
        let message: String
    }
}

extension ISO8601DateFormatter {
    static let compgit: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
}
