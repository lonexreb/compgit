import Foundation

/// Mirror of `apps/chrome/styles/tokens.css` — the single source of truth for
/// Compgit's "Terminal Editorial" design direction. Values are stored as raw
/// OKLCH triples so this module stays platform-free (no SwiftUI / AppKit /
/// UIKit imports). Host apps and widget extensions extend `Color` in their
/// own target to convert these triples into a native colour.
///
/// Convention: every member is `let` and the namespace is `enum`-as-namespace
/// (Swift's idiomatic way to express "no instances, just constants"). Names
/// match the CSS custom properties verbatim — `colorBg` ↔ `--color-bg`,
/// `textDisplayMd` ↔ `--text-display-md`, etc.
public enum CompgitTokens {
    /// OKLCH lightness (0...1) / chroma / hue triple. CSS uses percentages
    /// (`oklch(72% 0.19 142)`); this mirror keeps numerical values byte-for-byte
    /// with the source — `0.72`, `0.19`, `142.0`.
    public struct OKLCH: Sendable, Equatable {
        public let l: Double
        public let c: Double
        public let h: Double

        public init(_ l: Double, _ c: Double, _ h: Double) {
            self.l = l
            self.c = c
            self.h = h
        }
    }

    public enum Color {
        public enum Dark {
            public static let bg = OKLCH(0.17, 0.0, 0.0)
            public static let surface = OKLCH(0.22, 0.0, 0.0)
            public static let surfaceHover = OKLCH(0.26, 0.0, 0.0)
            public static let border = OKLCH(0.30, 0.0, 0.0)
            public static let text = OKLCH(0.92, 0.0, 0.0)
            public static let textMuted = OKLCH(0.62, 0.0, 0.0)
            public static let textFaint = OKLCH(0.42, 0.0, 0.0)
            public static let accent = OKLCH(0.72, 0.19, 142.0)
            public static let accentDim = OKLCH(0.52, 0.14, 142.0)
            public static let danger = OKLCH(0.65, 0.22, 25.0)

            public static let level0 = OKLCH(0.24, 0.0, 0.0)
            public static let level1 = OKLCH(0.40, 0.08, 142.0)
            public static let level2 = OKLCH(0.52, 0.14, 142.0)
            public static let level3 = OKLCH(0.64, 0.17, 142.0)
            public static let level4 = OKLCH(0.72, 0.19, 142.0)
        }

        public enum Light {
            public static let bg = OKLCH(0.98, 0.0, 0.0)
            public static let surface = OKLCH(0.96, 0.0, 0.0)
            public static let surfaceHover = OKLCH(0.93, 0.0, 0.0)
            public static let border = OKLCH(0.86, 0.0, 0.0)
            public static let text = OKLCH(0.18, 0.0, 0.0)
            public static let textMuted = OKLCH(0.42, 0.0, 0.0)
            public static let textFaint = OKLCH(0.62, 0.0, 0.0)
            public static let accent = OKLCH(0.58, 0.18, 142.0)
            public static let accentDim = OKLCH(0.78, 0.10, 142.0)

            public static let level0 = OKLCH(0.92, 0.0, 0.0)
            public static let level1 = OKLCH(0.82, 0.08, 142.0)
            public static let level2 = OKLCH(0.72, 0.14, 142.0)
            public static let level3 = OKLCH(0.62, 0.17, 142.0)
            public static let level4 = OKLCH(0.52, 0.20, 142.0)
        }
    }

    public enum Typography {
        /// Font family stacks. The host app should register the `.ttf`/`.woff2`
        /// files under these names; if loading fails the fallbacks listed in
        /// CSS apply (Times New Roman / Menlo).
        public static let displayFamily = "Fraunces"
        public static let monoFamily = "JetBrainsMono"

        // Sizes in points — 1pt == 1/72 inch, but on 1x displays SwiftUI
        // treats them roughly as CSS pixels at the default text size of 16pt.
        // CSS rem is 16px, so multiply CSS rem by 16 to land in points.
        public static let xs: Double = 12.0          // 0.75rem
        public static let sm: Double = 13.0          // 0.8125rem
        public static let base: Double = 14.0        // 0.875rem
        public static let lg: Double = 16.0          // 1rem
        public static let xl: Double = 20.0          // 1.25rem
        public static let xxl: Double = 28.0         // 1.75rem
        public static let displaySm: Double = 44.0   // 2.75rem
        public static let displayMd: Double = 64.0   // 4rem — popup hero numeral
        public static let displayLg: Double = 88.0   // 5.5rem

        public static let leadingTight: Double = 1.05
        public static let leadingNormal: Double = 1.45
    }

    /// 4-pt rhythm. Identical scale to the CSS `--space-*` tokens.
    public enum Space {
        public static let s1: Double = 4.0
        public static let s2: Double = 8.0
        public static let s3: Double = 12.0
        public static let s4: Double = 16.0
        public static let s6: Double = 24.0
        public static let s8: Double = 32.0
        public static let s12: Double = 48.0
    }

    public enum Motion {
        /// Durations in seconds (SwiftUI's preferred unit). CSS values were ms.
        public static let fast: Double = 0.150
        public static let normal: Double = 0.200

        /// `cubic-bezier(0.16, 1, 0.3, 1)` from the CSS — host apps can build a
        /// `UnitCurve(controlPoint1:controlPoint2:)` (iOS 17+) from this tuple.
        public static let easeOut: (x1: Double, y1: Double, x2: Double, y2: Double) =
            (0.16, 1.0, 0.30, 1.0)
    }

    /// Surface dimensions for the popup-style host views. Widgets ignore.
    public enum Surface {
        public static let popupWidth: Double = 320.0
        public static let popupHeight: Double = 400.0
    }
}
