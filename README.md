<div align="center">
  
![workbench with tools, html, css, javascript, and download icon](https://raw.githubusercontent.com/wc-toolkit/cem-validator/refs/heads/main/assets/wc-toolkit_cem-validator.png)

</div>

# WC Toolkit - Changelog

A utility for detecting changes between different versions of Custom Elements Manifest (CEM) files, helping library authors and consumers understand breaking changes and new features between releases.

## Features

- Detect added, removed, and modified web components
- Identify breaking changes vs. new features
- Analyze property, method, event, CSS variable, and CSS part changes
- Configurable behavior for handling type changes and default value changes
- Comprehensive change reports organized by component
- Provides human readable output and raw data for custom usage

## Use Cases

- Automatically generate changelogs between library versions
- Validate changes before publishing to ensure semantic versioning compliance
- Help consumers understand the impact of updating to a new version
- Document API changes in a structured format

## Installation

```bash
npm install -D @wc-toolkit/changelog
```

## Usage

The package provides results in two formats:

- In a human readable format
- As a JSON object

```typescript
import { CemChangelog } from "@wc-toolkit/changelog";
import oldManifest from "./path-to-old-manifest.json";
import newManifest from "./path-to-new-manifest.json";

// Create a changelog detector with default settings
const detector = new CemChangelog();

// Compare two manifests
const changes = detector.compareManifests(oldManifest, newManifest);

// The changes object contains two main sections - `changelog` and `rawData`

// Displays the changes in a human readable format
console.log(changes.changelog.breakingChanges); // Breaking changes by component
console.log(changes.changelog.featureChanges); // New features by component

// Displays the changes in JSON format
console.log(changes.rawData.breakingChanges); // Breaking changes by component
console.log(changes.rawData.featureChanges); // New features by component
```

## Example Output

Changelog output

```json
{
  "breakingChanges": {
    "my-component": [
      "The following properties have been removed: `oldProp`",
      "The type for \"prop\" has changed from `string` to `number`",
      "The following methods have been removed: `oldMethod1`, `oldMethod2`"
    ],
    "old-component": ["This component has been removed in the new manifest"]
  },
  "featureChanges": {
    "my-component": [
      "The following properties have been added: `newProp`",
      "The following methods have been added: `newMethod`"
    ],
    "new-component": ["This component has been added in the new manifest"]
  }
}
```

Raw data output:

```json
{
  "breakingChanges": {
    "my-component": [
      {
        "api": "properties",
        "changeType": "type",
        "name": "prop",
        "oldValue": "string",
        "newValue": "number"
      },
      {
        "api": "methods",
        "changeType": "removed",
        "name": "oldMethod"
      },
      {
        "api": "CSS variables",
        "changeType": "removed",
        "name": "--color"
      }
    ],
    "old-component": [
      {
        "api": "component",
        "changeType": "removed",
        "name": "OldComponent"
      }
    ]
  },
  "featureChanges": {
    "my-component": [
      {
        "api": "properties",
        "changeType": "added",
        "name": "newProp"
      },
      {
        "api": "methods",
        "changeType": "added",
        "name": "newMethod"
      },
      {
        "api": "CSS states",
        "changeType": "added",
        "name": "invalid"
      }
    ],
    "new-component": [
      {
        "api": "component",
        "changeType": "added",
        "name": "NewComponent"
      }
    ]
  }
}
```

The response will be returned based on the following types:

```ts
type CemChangelogResult = {
  changelog: NaturalLanguageChangeList;
  rawData: RawDataChangeList;
};

type NaturalLanguageChangeList = {
  breakingChanges: Record<string, string[]>;
  featureChanges: Record<string, string[]>;
};

type RawDataChangeList = {
  breakingChanges: Record<string, ChangeMetadata[]>;
  featureChanges: Record<string, ChangeMetadata[]>;
};

type ChangeMetadata = {
  api: string;
  changeType:
    | "type"
    | "defaultValue"
    | "deprecation"
    | "name"
    | "modulePath"
    | "definitionPath"
    | "typeDefinitionPath"
    | "added"
    | "removed";
  name?: string;
  oldValue?: string | boolean;
  newValue?: string | boolean;
};
```

## Configuration Options

You can customize the behavior of the change detector by passing configuration options:

```typescript
const detector = new CemChangelog({
  // Treat type changes as features instead of breaking changes
  typeChangesAsNonBreaking: true,

  // Treat default value changes as features instead of breaking changes
  defaultValuesAsNonBreaking: true,

  // Include deprecation messages in the output message
  includeDeprecationMessages: true,

  // Specify what property your types can be found in
  typeSrc: "paredType",
});
```

## What Changes Are Detected?

### Component Level Changes

- Added components (feature)
- Removed components (breaking)
- Changes in module path (breaking)
- Changes in definition path (breaking)
- Changes in type definition path (breaking)

### Property Changes

- Added properties (feature)
- Removed properties (breaking)
- Type changes (breaking by default, configurable)
- Default value changes (breaking by default, configurable)
- Deprecation status changes (feature, includes more info when configured)

### Method Changes

- Added methods (feature)
- Removed methods (breaking)
- Changes in method signature (breaking)

### CSS-Related Changes

- Added CSS variables (feature)
- Removed CSS variables (breaking)
- CSS variable default value changes (breaking by default, configurable)
- Added CSS parts (feature)
- Removed CSS parts (breaking)
- Added CSS states (features)
- Removed CSS states (breaking)

### Event Changes

- Added events (feature)
- Removed events (breaking)
- Event type changes (breaking by default, configurable)
