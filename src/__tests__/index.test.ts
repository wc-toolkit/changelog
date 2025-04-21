import { describe, expect, test } from "vitest";
import { CemChangelog } from "../index";
import oldCem from "./manifests/old-cem.json";
import newCem from "./manifests/new-cem.json";
import shoelaceStable from "./manifests/shoelace-2.20.1.json";

describe("CemChangelog", () => {
  describe("basic functionality", () => {
    const checker = new CemChangelog();

    test("should return no changes when comparing identical manifests", () => {
      const differences = checker.compareManifests(
        shoelaceStable,
        shoelaceStable
      );
      console.log(JSON.stringify(differences));

      expect(Object.keys(differences.breakingChanges).length).toBe(0);
      expect(Object.keys(differences.featureChanges).length).toBe(0);
    });

    test("should throw error for missing manifests", () => {
      expect(() => checker.compareManifests(null, newCem)).toThrow(
        "Both old and new manifests must be provided"
      );
      expect(() => checker.compareManifests(oldCem, null)).toThrow(
        "Both old and new manifests must be provided"
      );
    });

    test("should throw error for manifests without components", () => {
      const emptyManifest = { schemas: {}, modules: [] };
      expect(() => checker.compareManifests(emptyManifest, newCem)).toThrow(
        "Both old and new manifests must have components"
      );
    });
  });

  describe("component changes", () => {
    const checker = new CemChangelog();

    test("should detect added components", () => {
      // Create manifests with different components
      const oldManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
              },
            ],
          },
        ],
      };

      const newManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
              },
              {
                kind: "class",
                name: "NewComponent",
                tagName: "new-component",
                customElement: true,
              },
            ],
          },
        ],
      };

      const differences = checker.compareManifests(oldManifest, newManifest);

      expect(differences.featureChanges).toHaveProperty("new-component");
      expect(
        differences.featureChanges["new-component"].some((x) =>
          x.includes("has been added")
        )
      ).toBeTruthy();
    });

    test("should detect removed components", () => {
      // Create manifests with different components
      const oldManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
              },
              {
                kind: "class",
                name: "OldComponent",
                tagName: "old-component",
                customElement: true,
              },
            ],
          },
        ],
      };

      const newManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
              },
            ],
          },
        ],
      };

      const differences = checker.compareManifests(oldManifest, newManifest);

      expect(differences.breakingChanges).toHaveProperty("old-component");
      expect(
        differences.breakingChanges["old-component"].some((x) =>
          x.includes("has been removed")
        )
      ).toBeTruthy();
    });
  });

  describe("property changes", () => {
    const checker = new CemChangelog();

    test("should detect added properties", () => {
      const oldManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                members: [
                  {
                    kind: "field",
                    name: "existingProp",
                    type: { text: "string" },
                  },
                ],
              },
            ],
          },
        ],
      };

      const newManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                members: [
                  {
                    kind: "field",
                    name: "existingProp",
                    type: { text: "string" },
                  },
                  { kind: "field", name: "newProp", type: { text: "number" } },
                ],
              },
            ],
          },
        ],
      };

      const differences = checker.compareManifests(oldManifest, newManifest);

      expect(differences.featureChanges).toHaveProperty("test-component");
      expect(
        differences.featureChanges["test-component"].some((x) =>
          x.includes("properties have been added")
        )
      ).toBeTruthy();
      expect(
        differences.featureChanges["test-component"][0].includes("newProp")
      ).toBeTruthy();
    });

    test("should detect removed properties", () => {
      const oldManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                members: [
                  {
                    kind: "field",
                    name: "existingProp",
                    type: { text: "string" },
                  },
                  { kind: "field", name: "oldProp", type: { text: "number" } },
                ],
              },
            ],
          },
        ],
      };

      const newManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                members: [
                  {
                    kind: "field",
                    name: "existingProp",
                    type: { text: "string" },
                  },
                ],
              },
            ],
          },
        ],
      };

      const differences = checker.compareManifests(oldManifest, newManifest);

      expect(differences.breakingChanges).toHaveProperty("test-component");
      expect(
        differences.breakingChanges["test-component"].some((x) =>
          x.includes("properties have been removed")
        )
      ).toBeTruthy();
      expect(
        differences.breakingChanges["test-component"].some((x) =>
          x.includes("oldProp")
        )
      ).toBeTruthy();
    });

    test("should detect type changes in properties", () => {
      const oldManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                members: [
                  { kind: "field", name: "prop", type: { text: "string" } },
                ],
              },
            ],
          },
        ],
      };

      const newManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                members: [
                  { kind: "field", name: "prop", type: { text: "number" } },
                ],
              },
            ],
          },
        ],
      };

      const differences = checker.compareManifests(oldManifest, newManifest);

      expect(differences.breakingChanges).toHaveProperty("test-component");
      expect(
        differences.breakingChanges["test-component"].some((x) =>
          x.includes("The type for \"prop\" has changed from")
        )
      ).toBeTruthy();
    });
  });

  describe("method changes", () => {
    const checker = new CemChangelog();

    test("should detect added methods", () => {
      const oldManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                members: [{ kind: "method", name: "existingMethod" }],
              },
            ],
          },
        ],
      };

      const newManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                members: [
                  { kind: "method", name: "existingMethod" },
                  { kind: "method", name: "newMethod" },
                ],
              },
            ],
          },
        ],
      };

      const differences = checker.compareManifests(oldManifest, newManifest);

      expect(differences.featureChanges).toHaveProperty("test-component");
      expect(
        differences.featureChanges["test-component"].some((x) =>
          x.includes("methods have been added")
        )
      ).toBeTruthy();
      expect(
        differences.featureChanges["test-component"].some((x) =>
          x.includes("newMethod")
        )
      ).toBeTruthy();
    });

    test("should detect removed methods", () => {
      const oldManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                members: [
                  { kind: "method", name: "existingMethod" },
                  { kind: "method", name: "oldMethod" },
                ],
              },
            ],
          },
        ],
      };

      const newManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                members: [{ kind: "method", name: "existingMethod" }],
              },
            ],
          },
        ],
      };

      const differences = checker.compareManifests(oldManifest, newManifest);

      expect(differences.breakingChanges).toHaveProperty("test-component");
      expect(
        differences.breakingChanges["test-component"].some((x) =>
          x.includes("methods have been removed")
        )
      ).toBeTruthy();
      expect(
        differences.breakingChanges["test-component"].some((x) =>
          x.includes("oldMethod")
        )
      ).toBeTruthy();
    });

    test("should detect type changes in methods", () => {
      const oldManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                members: [
                  { 
                    kind: "method", 
                    name: "testMethod",
                    return: { type: { text: "string" } },
                    parameters: [
                      { name: "param", type: { text: "number" } }
                    ]
                  },
                ],
              },
            ],
          },
        ],
      };

      const newManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                members: [
                  { 
                    kind: "method", 
                    name: "testMethod",
                    return: { type: { text: "number" } },
                    parameters: [
                      { name: "param", type: { text: "string" } }
                    ]
                  },
                ],
              },
            ],
          },
        ],
      };

      const differences = checker.compareManifests(oldManifest, newManifest);

      expect(differences.breakingChanges).toHaveProperty("test-component");
      expect(
        differences.breakingChanges["test-component"].some((x) =>
          x.includes("The type for \"testMethod\" has changed from ")
        )
      ).toBeTruthy();
    });
  });

  describe("configuration options", () => {
    test("should treat type changes as non-breaking when configured", () => {
      const checker = new CemChangelog({
        typeChangesAsNonBreaking: "feature",
      });

      const oldManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                members: [
                  { kind: "field", name: "prop", type: { text: "string" } },
                ],
              },
            ],
          },
        ],
      };

      const newManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                members: [
                  { kind: "field", name: "prop", type: { text: "number" } },
                ],
              },
            ],
          },
        ],
      };

      const differences = checker.compareManifests(oldManifest, newManifest);

      expect(differences.breakingChanges).not.toHaveProperty("test-component");
      expect(differences.featureChanges).toHaveProperty("test-component");
      expect(
        differences.featureChanges["test-component"].some((x) =>
          x.includes("The type for \"prop\" has changed from")
        )
      ).toBeTruthy();
    });

    test("should treat default value changes as non-breaking when configured", () => {
      const checker = new CemChangelog({
        defaultValuesAsNonBreaking: "feature",
      });

      const oldManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                members: [
                  { kind: "field", name: "prop", default: "old-value" },
                ],
              },
            ],
          },
        ],
      };

      const newManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                members: [
                  { kind: "field", name: "prop", default: "new-value" },
                ],
              },
            ],
          },
        ],
      };

      const differences = checker.compareManifests(oldManifest, newManifest);

      expect(differences.breakingChanges).not.toHaveProperty("test-component");
      expect(differences.featureChanges).toHaveProperty("test-component");
      expect(
        differences.featureChanges["test-component"].some((x) =>
          x.includes("The default value for properties \"prop\" has changed")
        )
      ).toBeTruthy();
    });

    test("should include deprecation messages when configured", () => {
      const checker = new CemChangelog({
        includeDeprecationMessages: true,
      });

      const oldManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                members: [{ kind: "field", name: "prop", deprecated: false }],
              },
            ],
          },
        ],
      };

      const newManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                members: [
                  {
                    kind: "field",
                    name: "prop",
                    deprecated: "Use newProp instead",
                  },
                ],
              },
            ],
          },
        ],
      };

      const differences = checker.compareManifests(oldManifest, newManifest);

      expect(differences.featureChanges).toHaveProperty("test-component");
      expect(
        differences.featureChanges["test-component"].some((x) =>
          x.includes("Use newProp instead")
        )
      ).toBeTruthy();
    });
  });

  describe("CSS-related changes", () => {
    const checker = new CemChangelog();

    test("should detect CSS variable changes", () => {
      const oldManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                cssProperties: [{ name: "--color", default: "blue" }],
              },
            ],
          },
        ],
      };

      const newManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                cssProperties: [
                  { name: "--color", default: "red" },
                  { name: "--size", default: "1rem" },
                ],
              },
            ],
          },
        ],
      };

      const differences = checker.compareManifests(oldManifest, newManifest);

      expect(differences.breakingChanges).toHaveProperty("test-component");
      expect(differences.featureChanges).toHaveProperty("test-component");

      // Check default value change

      expect(
        differences.breakingChanges["test-component"].some((x) =>
          x.includes('The default value for CSS variables "--color" has changed')
        )
      ).toBeTruthy();

      // Check added variable
      expect(
        differences.featureChanges["test-component"].some((x) =>
          x.includes("The following CSS variables have been added: `--size`")
        )
      ).toBeTruthy();
    });

    test("should detect CSS part changes", () => {
      const oldManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                cssParts: [{ name: "button", description: "The button part" }],
              },
            ],
          },
        ],
      };

      const newManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                cssParts: [
                  { name: "container", description: "The container part" },
                ],
              },
            ],
          },
        ],
      };

      const differences = checker.compareManifests(oldManifest, newManifest);

      expect(differences.breakingChanges).toHaveProperty("test-component");
      expect(differences.featureChanges).toHaveProperty("test-component");

      // Check removed part
      expect(
        differences.breakingChanges["test-component"].some((x) =>
          x.includes("CSS parts have been removed")
        )
      ).toBeTruthy();
      expect(
        differences.breakingChanges["test-component"].some((x) =>
          x.includes("button")
        )
      ).toBeTruthy();

      // Check added part
      expect(
        differences.featureChanges["test-component"].some((x) =>
          x.includes("CSS parts have been added")
        )
      ).toBeTruthy();
      expect(
        differences.featureChanges["test-component"].some((x) =>
          x.includes("container")
        )
      ).toBeTruthy();
    });
  });

  describe("event changes", () => {
    const checker = new CemChangelog();

    test("should detect event type changes", () => {
      const oldManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                events: [
                  { name: "change", type: { text: "CustomEvent<string>" } },
                ],
              },
            ],
          },
        ],
      };

      const newManifest = {
        modules: [
          {
            path: "test",
            declarations: [
              {
                kind: "class",
                name: "TestComponent",
                tagName: "test-component",
                customElement: true,
                events: [
                  { name: "change", type: { text: "CustomEvent<number>" } },
                ],
              },
            ],
          },
        ],
      };

      const differences = checker.compareManifests(oldManifest, newManifest);

      expect(differences.breakingChanges).toHaveProperty("test-component");
      expect(
        differences.breakingChanges["test-component"].some((x) =>
          x.includes('The type for "change" has changed from')
        )
      ).toBeTruthy();
    });
  });
});
