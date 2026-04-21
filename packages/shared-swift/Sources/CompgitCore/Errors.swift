import Foundation

public enum CompgitError: Error, Sendable {
    case auth(message: String)
    case rateLimited(resetAt: Date)
    case network(underlying: String)
    case validation(message: String)
    case notAuthenticated

    public var description: String {
        switch self {
        case .auth(let message):
            return "auth error: \(message)"
        case .rateLimited(let resetAt):
            let f = ISO8601DateFormatter()
            return "rate limited; resets \(f.string(from: resetAt))"
        case .network(let underlying):
            return "network error: \(underlying)"
        case .validation(let message):
            return "validation error: \(message)"
        case .notAuthenticated:
            return "no token"
        }
    }
}
