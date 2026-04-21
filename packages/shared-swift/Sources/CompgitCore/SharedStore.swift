import Foundation
import CompgitSchema

/// Thin wrapper over App-Group UserDefaults, matching the storage keys used
/// by the Chrome extension so both platforms read/write the same shape.
///
/// On iOS/macOS, construct with the App Group suite name (e.g. "group.TEAMID.compgit").
/// The host app writes; the widget reads.
public final class SharedStore: @unchecked Sendable {
    public static let authTokenKey = "auth.token"
    public static let meLoginKey = "me.login"
    public static let lastSyncKey = "last-sync"
    public static let contributionsPrefix = "contributions:"

    private let defaults: UserDefaults

    public init(suiteName: String? = nil) {
        if let suiteName, let suite = UserDefaults(suiteName: suiteName) {
            self.defaults = suite
        } else {
            self.defaults = .standard
        }
    }

    // MARK: - Login

    public var meLogin: String? {
        get { defaults.string(forKey: Self.meLoginKey) }
        set {
            if let newValue {
                defaults.set(newValue, forKey: Self.meLoginKey)
            } else {
                defaults.removeObject(forKey: Self.meLoginKey)
            }
        }
    }

    // MARK: - Contributions

    public func contributions(for login: String) -> ContributionsCollection? {
        guard let data = defaults.data(forKey: Self.contributionsPrefix + login) else {
            return nil
        }
        return try? JSONDecoder().decode(ContributionsCollection.self, from: data)
    }

    public func setContributions(_ collection: ContributionsCollection) throws {
        let data = try JSONEncoder().encode(collection)
        defaults.set(data, forKey: Self.contributionsPrefix + collection.login)
    }

    public func clearContributions(for login: String) {
        defaults.removeObject(forKey: Self.contributionsPrefix + login)
    }

    // MARK: - Sync status

    public struct SyncStatus: Codable, Equatable, Sendable {
        public let at: String
        public let ok: Bool
        public let message: String?

        public init(at: String, ok: Bool, message: String? = nil) {
            self.at = at
            self.ok = ok
            self.message = message
        }
    }

    public var lastSync: SyncStatus? {
        get {
            guard let data = defaults.data(forKey: Self.lastSyncKey) else { return nil }
            return try? JSONDecoder().decode(SyncStatus.self, from: data)
        }
        set {
            if let newValue, let data = try? JSONEncoder().encode(newValue) {
                defaults.set(data, forKey: Self.lastSyncKey)
            } else {
                defaults.removeObject(forKey: Self.lastSyncKey)
            }
        }
    }

    public func clearAll() {
        for key in defaults.dictionaryRepresentation().keys {
            if key == Self.lastSyncKey || key == Self.meLoginKey || key.hasPrefix(Self.contributionsPrefix) {
                defaults.removeObject(forKey: key)
            }
        }
    }
}
