# WC Toolkit - Changelog

A utility for detecting changes between different versions of Custom Elements Manifest (CEM) files, helping library authors and consumers understand breaking changes and new features between releases.

## Features

- Detect added, removed, and modified web components
- Identify breaking changes vs. new features
- Analyze property, method, event, CSS variable, and CSS part changes
- Configurable behavior for handling type changes and default value changes
- Comprehensive change reports organized by component

## Use Cases

- Automatically generate changelogs between library versions
- Validate changes before publishing to ensure semantic versioning compliance
- Help consumers understand the impact of updating to a new version
- Document API changes in a structured format


## Installation

```bash
npm install @wc-toolkit/changelog
```

## Usage

```typescript
import { CemChangelog } from "@wc-toolkit/changelog";
import oldManifest from "./path-to-old-manifest.json";
import newManifest from "./path-to-new-manifest.json";

// Create a changelog detector with default settings
const detector = new CemChangelog();

// Compare two manifests
const changes = detector.compareManifests(oldManifest, newManifest);

// The changes object contains two main sections:
console.log(changes.breakingChanges); // Breaking changes by component
console.log(changes.featureChanges); // New features by component
```

## Configuration Options

You can customize the behavior of the change detector by passing configuration options:

```typescript
const detector = new CemChangelog({
  // Treat type changes as features instead of breaking changes
  typeChangesAsNonBreaking: true,

  // Treat default value changes as features instead of breaking changes
  defaultValuesAsNonBreaking: true,

  // Include deprecation messages in the output
  includeDeprecationMessages: true,
});
```

## What Changes Are Detected?

### Component Level Changes

- Added components (feature)
- Removed components (breaking)

### Property Changes

- Added properties (feature)
- Removed properties (breaking)
- Type changes (breaking by default, configurable)
- Default value changes (breaking by default, configurable)
- Deprecation status changes (feature, include more info when configured)

### Method Changes

- Added methods (feature)
- Removed methods (breaking)
- Changes in method signature

### CSS-Related Changes

- Added CSS variables (feature)
- Removed CSS variables (breaking)
- CSS variable default value changes (breaking)
- Added CSS parts (feature)
- Removed CSS parts (breaking)
- Added CSS states (features)
- Removed CSS states (breaking)

### Event Changes

- Added events (feature)
- Removed events (breaking)
- Event type changes (breaking)

## Example Output

```javascript
{
  breakingChanges: {
    "my-component": [
      "The following properties have been removed: `oldProp`",
      "The type for \"prop\" has changed from `string` to `number`",
      "The following methods have been removed: `oldMethod`"
    ],
    "removed-component": [
      "This component has been removed in the new manifest"
    ]
  },
  featureChanges: {
    "my-component": [
      "The following properties have been added: `newProp`",
      "The following methods have been added: `newMethod`"
    ],
    "new-component": [
      "This component has been added in the new manifest"
    ]
  }
}
```
