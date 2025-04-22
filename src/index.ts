/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Component,
  getAllComponents,
  getComponentEventsWithType,
  getComponentPublicMethods,
  getComponentPublicProperties,
} from "@wc-toolkit/cem-utilities";

export type CemChangelogConfig = {
  logResults?: boolean;
  defaultValuesAsNonBreaking?: ChangeLevel;
  typeChangesAsNonBreaking?: ChangeLevel;
  includeDeprecationMessages?: boolean;
  typeSrc?: string;
};

export type ChangeLevel = "breaking" | "feature" | "patch" | "none";

export type ChangeMetadata = {
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
  oldValue?: any;
  newValue?: any;
};

export type NaturalLanguageChangeList = {
  breakingChanges: Record<string, string[]>;
  featureChanges: Record<string, string[]>;
};

export type RawDataChangeList = {
  breakingChanges: Record<string, ChangeMetadata[]>;
  featureChanges: Record<string, ChangeMetadata[]>;
};

const defaultConfig: CemChangelogConfig = {
  typeSrc: "parsedType",
};

export class CemChangelog {
  private oldComponents: Map<string, Component> = new Map();
  private newComponents: Map<string, Component> = new Map();
  private breakingChanges: Record<string, string[]> = {};
  private featureChanges: Record<string, string[]> = {};
  private config: CemChangelogConfig = defaultConfig;
  private jsonChanges: RawDataChangeList = {
    breakingChanges: {},
    featureChanges: {},
  };

  private _changes = {
    breaking: false,
    feature: false,
  };

  constructor(config: CemChangelogConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  public compareManifests(oldManifest: unknown, newManifest: unknown) {
    if (!oldManifest || !newManifest) {
      throw new Error("Both old and new manifests must be provided.");
    }
    this.setComponents(oldManifest, newManifest);
    this.checkDiff();
    this.cleanupEmptyChangeLists();

    return {
      changelog: {
        breakingChanges: this.breakingChanges,
        featureChanges: this.featureChanges,
      },
      rawData: this.jsonChanges,
    };
  }

  private cleanupEmptyChangeLists(): void {
    [this.breakingChanges, this.featureChanges].forEach((changeList) => {
      Object.keys(changeList).forEach((componentTag) => {
        if (changeList[componentTag].length === 0) {
          delete changeList[componentTag];
        }
      });
    });
    Object.keys(this.jsonChanges.breakingChanges).forEach((componentTag) => {
      if (this.jsonChanges.breakingChanges[componentTag].length === 0) {
        delete this.jsonChanges.breakingChanges[componentTag];
      }
    });
    Object.keys(this.jsonChanges.featureChanges).forEach((componentTag) => {
      if (this.jsonChanges.featureChanges[componentTag].length === 0) {
        delete this.jsonChanges.featureChanges[componentTag];
      }
    });
  }

  private setComponents(oldManifest: unknown, newManifest: unknown): void {
    const oldComponentsList = getAllComponents(oldManifest);
    const newComponentsList = getAllComponents(newManifest);

    if (!oldComponentsList?.length || !newComponentsList?.length) {
      throw new Error("Both old and new manifests must have components.");
    }

    this.oldComponents = new Map(
      oldComponentsList.map((component) => [component.tagName!, component])
    );
    this.newComponents = new Map(
      newComponentsList.map((component) => [component.tagName!, component])
    );
  }

  private checkDiff(): void {
    this.checkForMissingComponents();
    this.checkForAddedComponents();
    this.compareComponents();
  }

  private getTypeDiffLevel(isBreaking = false) {
    return this.config.typeChangesAsNonBreaking && !isBreaking
      ? this.featureChanges
      : this.breakingChanges;
  }

  private getDefaultValueDiffLevel() {
    return this.config.defaultValuesAsNonBreaking
      ? this.featureChanges
      : this.breakingChanges;
  }

  private getChangeList(
    changeType: "type" | "defaultValue"
  ): Record<string, string[]> {
    const config = {
      type: this.config.typeChangesAsNonBreaking,
      defaultValue: this.config.defaultValuesAsNonBreaking,
    };

    return config[changeType] ? this.featureChanges : this.breakingChanges;
  }

  private getDeprecationMessage(deprecated?: boolean | string) {
    return this.config.includeDeprecationMessages &&
      typeof deprecated === "string"
      ? " " + deprecated
      : "";
  }

  private compareComponents(): void {
    const commonComponentTags = Array.from(this.newComponents.keys()).filter(
      (tagName) => this.oldComponents.has(tagName)
    );
    for (const tagName of commonComponentTags) {
      const oldComponent = this.oldComponents.get(tagName);
      const newComponent = this.newComponents.get(tagName);
      this.breakingChanges[tagName] = [];
      this.featureChanges[tagName] = [];
      this.jsonChanges.breakingChanges[tagName] = [];
      this.jsonChanges.featureChanges[tagName] = [];

      this.checkComponentLevelChanges(oldComponent, newComponent);
      this.checkCssVariables(oldComponent, newComponent);
      this.checkCssStates(oldComponent, newComponent);
      this.checkCssParts(oldComponent, newComponent);
      this.checkAttributes(oldComponent, newComponent);
      this.checkEvents(oldComponent, newComponent);
      this.checkMethods(oldComponent, newComponent);
      this.checkProperties(oldComponent, newComponent);
      this.checkSlots(oldComponent, newComponent);
    }
  }

  private checkForMissingComponents(): void {
    const missingComponents =
      Array.from(this.oldComponents.keys()).filter(
        (tagName) => !this.newComponents.has(tagName)
      ) || [];

    missingComponents.forEach((tagName) => {
      if (!this.breakingChanges[tagName]) {
        this.breakingChanges[tagName] = [];
      }
      this.breakingChanges[tagName].push(
        `This component has been removed in the new manifest.`
      );
      if (!this.jsonChanges.breakingChanges[tagName]) {
        this.jsonChanges.breakingChanges[tagName] = [];
      }
      this.jsonChanges.breakingChanges[tagName].push({
        api: "component",
        changeType: "removed",
        name: this.oldComponents.get(tagName)?.name,
      });
      this._changes.breaking = true;
    });
  }

  private checkForAddedComponents(): void {
    const addedComponents = Array.from(this.newComponents.keys()).filter(
      (tagName) => !this.oldComponents.has(tagName)
    );
    addedComponents.forEach((tagName) => {
      if (!this.featureChanges[tagName]) {
        this.featureChanges[tagName] = [];
      }
      this.featureChanges[tagName].push(
        `This component has been added in the new manifest.`
      );
      if (!this.jsonChanges.featureChanges[tagName]) {
        this.jsonChanges.featureChanges[tagName] = [];
      }
      this.jsonChanges.featureChanges[tagName].push({
        api: "component",
        changeType: "added",
        name: this.newComponents.get(tagName)?.name,
      });
      this._changes.feature = true;
    });
  }

  private checkComponentLevelChanges(
    oldComponent?: Component,
    newComponent?: Component
  ): void {
    if (!oldComponent || !newComponent) {
      return;
    }

    if (oldComponent.name !== newComponent.name) {
      this.breakingChanges[newComponent.tagName || "MissingTag"].push(
        `The class name has changed from \`${oldComponent.name}\` to \`${newComponent.name}\`.`
      );
      this.jsonChanges.breakingChanges[
        newComponent.tagName || "MissingTag"
      ].push({
        api: "component",
        changeType: "name",
        name: newComponent.tagName || "MissingTag",
        oldValue: oldComponent.name,
        newValue: newComponent.name,
      });
      this._changes.breaking = true;
    }

    if (oldComponent.modulePath !== newComponent.modulePath) {
      this.breakingChanges[newComponent.tagName || "MissingTag"].push(
        `The module path has changed to "${newComponent.modulePath}".`
      );
      this.jsonChanges.breakingChanges[
        newComponent.tagName || "MissingTag"
      ].push({
        api: "component",
        changeType: "modulePath",
        name: newComponent.tagName || "MissingTag",
        oldValue: oldComponent.modulePath,
        newValue: newComponent.modulePath,
      });
      this._changes.breaking = true;
    }

    if (oldComponent.definitionPath !== newComponent.definitionPath) {
      this.breakingChanges[newComponent.tagName || "MissingTag"].push(
        `The definition path where this is defined has changed to "${newComponent.definitionPath}".`
      );
      this.jsonChanges.breakingChanges[
        newComponent.tagName || "MissingTag"
      ].push({
        api: "component",
        changeType: "definitionPath",
        name: newComponent.tagName || "MissingTag",
        oldValue: oldComponent.definitionPath,
        newValue: newComponent.definitionPath,
      });
      this._changes.breaking = true;
    }

    if (oldComponent.typeDefinitionPath !== newComponent.typeDefinitionPath) {
      this.breakingChanges[newComponent.tagName || "MissingTag"].push(
        `The type path has changed to "${newComponent.typeDefinitionPath}".`
      );
      this.jsonChanges.breakingChanges[
        newComponent.tagName || "MissingTag"
      ].push({
        api: "component",
        changeType: "typeDefinitionPath",
        name: newComponent.tagName || "MissingTag",
        oldValue: oldComponent.typeDefinitionPath,
        newValue: newComponent.typeDefinitionPath,
      });
      this._changes.breaking = true;
    }

    if (oldComponent.deprecated !== newComponent.deprecated) {
      const componentTag = newComponent.tagName || "MissingTag";
      this.featureChanges[componentTag].push(
        `The deprecation statues has changed.${this.getDeprecationMessage(newComponent.deprecated)}`
      );
      this.jsonChanges.featureChanges[componentTag].push({
        api: "component",
        changeType: "deprecation",
        name: componentTag,
        oldValue: oldComponent.deprecated,
        newValue: newComponent.deprecated,
      });
      this._changes.feature = true;
    }
  }

  private checkCssVariables(
    oldComponent?: Component,
    newComponent?: Component
  ): void {
    if (!oldComponent || !newComponent) {
      return;
    }

    const oldCssVariables = oldComponent.cssProperties || [];
    const newCssVariables = newComponent.cssProperties || [];

    this.compareCollections(
      oldCssVariables,
      newCssVariables,
      newComponent.tagName || "MissingTag",
      "CSS variables"
    );
  }

  private checkCssStates(
    oldComponent?: Component,
    newComponent?: Component
  ): void {
    if (!oldComponent || !newComponent) {
      return;
    }
    const oldCssStates = oldComponent.cssStates || [];
    const newCssStates = newComponent.cssStates || [];

    this.compareCollections(
      oldCssStates,
      newCssStates,
      newComponent.tagName || "MissingTag",
      "CSS states"
    );
  }

  private checkCssParts(
    oldComponent?: Component,
    newComponent?: Component
  ): void {
    if (!oldComponent || !newComponent) {
      return;
    }

    const oldCssParts = oldComponent.cssParts || [];
    const newCssParts = newComponent.cssParts || [];

    this.compareCollections(
      oldCssParts,
      newCssParts,
      newComponent.tagName || "MissingTag",
      "CSS parts"
    );
  }

  private checkAttributes(
    oldComponent?: Component,
    newComponent?: Component
  ): void {
    if (!oldComponent || !newComponent) {
      return;
    }

    const oldAttributes = oldComponent.attributes || [];
    const newAttributes = newComponent.attributes || [];

    this.compareCollections(
      oldAttributes,
      newAttributes,
      newComponent.tagName || "MissingTag",
      "attributes"
    );
  }

  private checkEvents(
    oldComponent?: Component,
    newComponent?: Component
  ): void {
    if (!oldComponent || !newComponent) {
      return;
    }

    const oldEvents = getComponentEventsWithType(oldComponent) || [];
    const newEvents = getComponentEventsWithType(newComponent) || [];

    this.compareCollections(
      oldEvents,
      newEvents,
      newComponent.tagName || "MissingTag",
      "events"
    );
  }

  private checkMethods(
    oldComponent?: Component,
    newComponent?: Component
  ): void {
    if (!oldComponent || !newComponent) {
      return;
    }

    const oldMethods = getComponentPublicMethods(oldComponent) || [];
    const newMethods = getComponentPublicMethods(newComponent) || [];

    this.compareCollections(
      oldMethods,
      newMethods,
      newComponent.tagName || "MissingTag",
      "methods"
    );
  }

  private checkProperties(
    oldComponent?: Component,
    newComponent?: Component
  ): void {
    if (!oldComponent || !newComponent) {
      return;
    }

    const oldProperties = getComponentPublicProperties(oldComponent) || [];
    const newProperties = getComponentPublicProperties(newComponent) || [];

    this.compareCollections(
      oldProperties,
      newProperties,
      newComponent.tagName || "MissingTag",
      "properties"
    );
  }

  private checkSlots(oldComponent?: Component, newComponent?: Component): void {
    if (!oldComponent || !newComponent) return;

    const componentTag = newComponent.tagName || "MissingTag";
    const oldSlots = oldComponent.slots || [];
    const newSlots = newComponent.slots || [];

    this.compareCollections(oldSlots, newSlots, componentTag, "slots");
  }

  private compareCollections<
    T extends {
      fieldName?: any;
      type?: any;
      default?: any;
      deprecated?: any;
      description?: any;
      name?: string;
    },
  >(
    oldItems: T[],
    newItems: T[],
    componentTag: string = "MissingTag",
    itemType: string
  ): void {
    const oldItemNames = new Set(oldItems.map((item) => item.name));
    const newItemNames = new Set(newItems.map((item) => item.name));
    const addedItems = newItems.filter((item) => !oldItemNames.has(item.name));
    const removedItems = oldItems.filter(
      (item) => !newItemNames.has(item.name)
    );

    // Process additions and removals
    if (addedItems.length > 0) {
      this.featureChanges[componentTag].push(
        `The following ${itemType} have been added: ${addedItems
          .map((item) => `\`${item.name}\``)
          .join(", ")}`
      );
      addedItems.forEach((item) => {
        this.jsonChanges.featureChanges[componentTag].push({
          api: itemType,
          changeType: "added",
          name: item.name,
        });
      });
      this._changes.feature = true;
    }

    if (removedItems.length > 0) {
      this.breakingChanges[componentTag].push(
        `The following ${itemType} have been removed: ${removedItems
          .map((item) => `\`${item.name}\``)
          .join(", ")}`
      );
      removedItems.forEach((item) => {
        this.jsonChanges.breakingChanges[componentTag].push({
          api: itemType,
          changeType: "removed",
          name: item.name,
        });
      });
      this._changes.breaking = true;
    }

    newItems.forEach((newItem) => {
      const oldItem = oldItems.find((item) => item.name === newItem.name);
      if (!oldItem) {
        return;
      }

      const oldType = this.getTypeText(oldItem);
      const newType = this.getTypeText(newItem);

      if (oldItem.deprecated !== newItem.deprecated) {
        this.featureChanges[componentTag].push(
          `The deprecation status for ${itemType} "${newItem.name}" has changed.${this.getDeprecationMessage(newItem.deprecated)}`
        );
        this.jsonChanges.featureChanges[componentTag].push({
          api: itemType,
          changeType: "deprecation",
          name: newItem.name,
          oldValue: oldItem.deprecated,
          newValue: newItem.deprecated,
        });
        this._changes.feature = true;
      }
      if (oldItem.default !== newItem.default) {
        this.getDefaultValueDiffLevel()[componentTag].push(
          `The default value for ${itemType} "${newItem.name}" has changed from \`${oldItem.default}\` to \`${newItem.default}\`.`
        );
        this.jsonChanges.breakingChanges[componentTag].push({
          api: itemType,
          changeType: "defaultValue",
          name: newItem.name,
          oldValue: oldItem.default,
          newValue: newItem.default,
        });
        this._changes.breaking = true;
      }
      if (oldType !== newType) {
        this.getTypeDiffLevel(itemType === "methods")[componentTag].push(
          `The type for "${newItem.name}" has changed from \`${oldType}\` to \`${newType}\`.`
        );
        this.jsonChanges.breakingChanges[componentTag].push({
          api: itemType,
          changeType: "type",
          name: newItem.name,
          oldValue: oldType,
          newValue: newType,
        });
        this._changes.breaking = true;
      }
      if (oldItem.fieldName !== newItem.fieldName) {
        this.breakingChanges[componentTag].push(
          `The field name for ${itemType} "${newItem.name}" has changed from \`${oldItem.fieldName}\` to \`${newItem.fieldName}\`.`
        );
        this.jsonChanges.breakingChanges[componentTag].push({
          api: itemType,
          changeType: "name",
          name: newItem.name,
          oldValue: oldItem.fieldName,
          newValue: newItem.fieldName,
        });
        this._changes.breaking = true;
      }
    });

    // if (checkSpecificFields) {
    //   const oldItemMap = new Map(oldItems.map((item) => [item.name, item]));

    //   newItems.forEach((newItem) => {
    //     const oldItem = oldItemMap.get(newItem.name);
    //     if (oldItem) {
    //       checkSpecificFields(oldItem, newItem);
    //     }
    //   });
    // }
  }

  private getTypeText(item: any): string {
    return item[this.config.typeSrc!]?.text || item.type?.text || "";
  }
}
