import Foundation
import Security

/// Keychain Services wrapper for the GitHub Personal Access Token.
///
/// On iOS/macOS, both the host app and the widget extension enable Keychain
/// Sharing with a shared `accessGroup` so the widget can read the token the
/// app wrote. For unit tests or CLI builds, pass `accessGroup = nil`.
public struct KeychainPAT: Sendable {
    public let service: String
    public let account: String
    public let accessGroup: String?

    public init(
        service: String = "compgit",
        account: String = "github.pat",
        accessGroup: String? = nil
    ) {
        self.service = service
        self.account = account
        self.accessGroup = accessGroup
    }

    public func save(_ token: String) throws {
        guard let data = token.data(using: .utf8) else {
            throw CompgitError.validation(message: "token is not utf-8")
        }
        var query = baseQuery()
        query[kSecValueData as String] = data
        query[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock

        let addStatus = SecItemAdd(query as CFDictionary, nil)
        switch addStatus {
        case errSecSuccess:
            return
        case errSecDuplicateItem:
            let update: [String: Any] = [
                kSecValueData as String: data,
                kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock,
            ]
            let updateStatus = SecItemUpdate(baseQuery() as CFDictionary, update as CFDictionary)
            if updateStatus != errSecSuccess {
                throw CompgitError.network(underlying: "keychain update failed: \(updateStatus)")
            }
        default:
            throw CompgitError.network(underlying: "keychain add failed: \(addStatus)")
        }
    }

    public func load() throws -> String? {
        var query = baseQuery()
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        switch status {
        case errSecSuccess:
            guard let data = result as? Data, let token = String(data: data, encoding: .utf8) else {
                return nil
            }
            return token
        case errSecItemNotFound:
            return nil
        default:
            throw CompgitError.network(underlying: "keychain read failed: \(status)")
        }
    }

    public func clear() throws {
        let status = SecItemDelete(baseQuery() as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw CompgitError.network(underlying: "keychain delete failed: \(status)")
        }
    }

    private func baseQuery() -> [String: Any] {
        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecAttrSynchronizable as String: false,
        ]
        if let accessGroup {
            query[kSecAttrAccessGroup as String] = accessGroup
        }
        return query
    }
}
