import Foundation
import CompgitSchema

/// Namespaced version string + any cross-cutting helpers that don't deserve their own file.
/// Real work lives in:
/// - GitHubClient.swift — GraphQL over URLSession (now accepts a baseURL)
/// - SharedStore.swift  — App-Group UserDefaults store
/// - KeychainPAT.swift   — Keychain Services wrapper
/// - Aggregate.swift     — pure contribution aggregation
/// - Time.swift          — calendar-date helpers
/// - Errors.swift        — CompgitError
/// - Tokens.swift        — design tokens mirroring apps/chrome/styles/tokens.css
public enum CompgitCore {
    public static let version = "0.0.1"
}
