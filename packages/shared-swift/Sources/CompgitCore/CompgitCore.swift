import Foundation
import CompgitSchema

/// Namespaced version string + any cross-cutting helpers that don't deserve their own file.
/// Real work lives in:
/// - GitHubClient.swift — GraphQL over URLSession
/// - SharedStore.swift  — App-Group UserDefaults store
/// - KeychainPAT.swift   — Keychain Services wrapper
/// - Aggregate.swift     — pure contribution aggregation
/// - Time.swift          — calendar-date helpers
/// - Errors.swift        — CompgitError
public enum CompgitCore {
    public static let version = "0.0.1"
}
