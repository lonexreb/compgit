// swift-tools-version: 5.10
import PackageDescription

let package = Package(
  name: "CompgitShared",
  platforms: [
    .iOS(.v17),
    .macOS(.v14),
  ],
  products: [
    .library(name: "CompgitSchema", targets: ["CompgitSchema"]),
    .library(name: "CompgitCore", targets: ["CompgitCore"]),
  ],
  dependencies: [],
  targets: [
    .target(
      name: "CompgitSchema",
      path: "Sources/CompgitSchema"
    ),
    .target(
      name: "CompgitCore",
      dependencies: ["CompgitSchema"],
      path: "Sources/CompgitCore"
    ),
  ]
)
