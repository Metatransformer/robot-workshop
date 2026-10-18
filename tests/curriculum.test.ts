import { describe, expect, it } from "vitest";
import { glossaryEntries, modules, projectPaths, tracks } from "../src/lib/curriculum";

const httpUrl = /^https?:\/\/[^\s]+$/;

describe("curriculum content graph invariants", () => {
  it("defines the six tracks and unique, substantive modules", () => {
    expect(tracks).toHaveLength(6);
    expect(new Set(tracks.map(track => track.id)).size).toBe(6);
    expect(tracks.every(track => track.title.trim().length >= 3 && track.description.trim().length >= 20)).toBe(true);

    expect(modules).toHaveLength(48);
    expect(new Set(modules.map(module => module.id)).size).toBe(modules.length);

    const trackIds = new Set(tracks.map(track => track.id));
    for (const module of modules) {
      expect(trackIds.has(module.track), `${module.id} has an unknown track`).toBe(true);
      expect(module.title.trim().length, `${module.id} title`).toBeGreaterThanOrEqual(5);
      expect(module.summary.trim().length, `${module.id} summary`).toBeGreaterThanOrEqual(50);
      expect(module.concepts.trim().length, `${module.id} concepts`).toBeGreaterThanOrEqual(600);
      expect(module.outcomes.length, `${module.id} outcomes`).toBeGreaterThanOrEqual(1);
      expect(module.outcomes.every(outcome => outcome.trim().length >= 35), `${module.id} outcomes are substantive`).toBe(true);

      expect(module.workedExample.problem.trim().length, `${module.id} worked problem`).toBeGreaterThanOrEqual(30);
      expect(module.workedExample.steps.length, `${module.id} worked steps`).toBeGreaterThanOrEqual(2);
      expect(module.workedExample.steps.every(step => step.trim().length >= 15), `${module.id} worked steps are substantive`).toBe(true);
      expect(module.workedExample.result.trim().length, `${module.id} worked result`).toBeGreaterThanOrEqual(20);
      expect(module.workedExample.sanityCheck.trim().length, `${module.id} sanity check`).toBeGreaterThanOrEqual(25);

      expect(module.lab.goal.trim().length, `${module.id} lab goal`).toBeGreaterThanOrEqual(20);
      expect(module.lab.equipment.length, `${module.id} lab equipment`).toBeGreaterThanOrEqual(2);
      expect(module.lab.steps.length, `${module.id} real lab steps`).toBeGreaterThanOrEqual(4);
      expect(module.lab.steps.every(step => step.trim().length >= 20), `${module.id} lab steps are substantive`).toBe(true);
      expect(module.lab.observe.length, `${module.id} observations`).toBeGreaterThanOrEqual(2);
      expect(module.lab.transfer.trim().length, `${module.id} transfer task`).toBeGreaterThanOrEqual(20);
      expect(module.lab.cautions.length, `${module.id} cautions`).toBeGreaterThanOrEqual(1);

      expect(module.exercise.choices.length, `${module.id} answer choices`).toBeGreaterThanOrEqual(2);
      expect(module.exercise.answerIndex, `${module.id} answer index lower bound`).toBeGreaterThanOrEqual(0);
      expect(module.exercise.answerIndex, `${module.id} answer index upper bound`).toBeLessThan(module.exercise.choices.length);
    }
  });

  it("resolves every prerequisite and contains no prerequisite cycle", () => {
    const moduleIds = new Set(modules.map(module => module.id));
    const prerequisites = new Map(modules.map(module => [module.id, module.prerequisites]));

    for (const module of modules) {
      expect(new Set(module.prerequisites).size, `${module.id} duplicate prerequisite`).toBe(module.prerequisites.length);
      for (const prerequisite of module.prerequisites) {
        expect(moduleIds.has(prerequisite), `${module.id} -> missing prerequisite ${prerequisite}`).toBe(true);
        expect(prerequisite, `${module.id} cannot require itself`).not.toBe(module.id);
      }
      expect(new Set(module.relatedStudy ?? []).size, `${module.id} duplicate related study`).toBe(module.relatedStudy?.length ?? 0);
      for (const relatedId of module.relatedStudy ?? []) {
        expect(moduleIds.has(relatedId), `${module.id} -> missing related study ${relatedId}`).toBe(true);
        expect(relatedId, `${module.id} cannot relate to itself`).not.toBe(module.id);
        expect(module.prerequisites, `${module.id} related study duplicates an essential prerequisite`).not.toContain(relatedId);
      }
    }

    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (id: string, path: string[]): void => {
      if (visiting.has(id)) throw new Error(`Prerequisite cycle: ${[...path, id].join(" -> ")}`);
      if (visited.has(id)) return;
      visiting.add(id);
      for (const prerequisite of prerequisites.get(id) ?? []) visit(prerequisite, [...path, id]);
      visiting.delete(id);
      visited.add(id);
    };

    for (const module of modules) visit(module.id, []);
    expect(visited.size).toBe(modules.length);
  });

  it("resolves project paths and keeps required and optional modules disjoint", () => {
    const moduleIds = new Set(modules.map(module => module.id));
    const templateIds = new Set(projectPaths.map(path => path.templateId));

    expect([...templateIds].sort()).toEqual(["blank", "cyberdeck", "desk-robot", "linkage", "sensor", "servo-bench"]);
    expect(templateIds.size).toBe(projectPaths.length);
    for (const path of projectPaths) {
      expect(path.required.length, `${path.templateId} required path`).toBeGreaterThanOrEqual(1);
      expect(new Set(path.required).size, `${path.templateId} duplicate required module`).toBe(path.required.length);
      expect(new Set(path.optional).size, `${path.templateId} duplicate optional module`).toBe(path.optional.length);
      for (const id of [...path.required, ...path.optional]) {
        expect(moduleIds.has(id), `${path.templateId} -> missing module ${id}`).toBe(true);
      }
      expect(path.required.filter(id => path.optional.includes(id)), `${path.templateId} required/optional overlap`).toEqual([]);

      for (const [index, id] of path.required.entries()) {
        const module = modules.find(candidate => candidate.id === id);
        for (const prerequisite of module?.prerequisites ?? []) {
          expect(path.required.indexOf(prerequisite), `${path.templateId} required order: ${prerequisite} before ${id}`).toBeLessThan(index);
        }
      }

      const combined = [...path.required, ...path.optional];
      for (const id of path.optional) {
        const module = modules.find(candidate => candidate.id === id);
        for (const prerequisite of module?.prerequisites ?? []) {
          expect(combined.indexOf(prerequisite), `${path.templateId} optional order: ${prerequisite} before ${id}`).toBeLessThan(combined.indexOf(id));
        }
      }
    }

    for (const module of modules) {
      expect(new Set(module.projectIds).size, `${module.id} duplicate project`).toBe(module.projectIds.length);
      for (const templateId of module.projectIds) {
        expect(templateIds.has(templateId), `${module.id} -> missing project ${templateId}`).toBe(true);
      }
    }
  });

  it("keeps documentation and sensor paths free of advanced navigation and control gates", () => {
    const modulesById = new Map(modules.map(module => [module.id, module]));
    const closure = new Set<string>();
    const visit = (id: string): void => {
      if (closure.has(id)) return;
      closure.add(id);
      for (const prerequisite of modulesById.get(id)?.prerequisites ?? []) visit(prerequisite);
    };
    visit("documentation-sharing");

    const unintended = ["planning-navigation", "localization-odometry", "feedback-pid"];
    for (const id of unintended) expect(closure.has(id), `documentation-sharing closure includes ${id}`).toBe(false);

    const sensorPath = projectPaths.find(path => path.templateId === "sensor");
    expect(sensorPath).toBeDefined();
    for (const id of unintended) expect(sensorPath?.required, `sensor required includes ${id}`).not.toContain(id);
  });

  it("uses valid source URLs and bounded exercise answers", () => {
    for (const module of modules) {
      expect(module.sources.length, `${module.id} sources`).toBeGreaterThanOrEqual(1);
      for (const source of module.sources) {
        expect(source.title.trim().length, `${module.id} source title`).toBeGreaterThanOrEqual(3);
        expect(source.url, `${module.id} source URL`).toMatch(httpUrl);
      }
      expect(Number.isInteger(module.exercise.answerIndex), `${module.id} answer index integer`).toBe(true);
      expect(module.exercise.answerIndex).toBeGreaterThanOrEqual(0);
      expect(module.exercise.answerIndex).toBeLessThan(module.exercise.choices.length);
    }

    for (const entry of glossaryEntries) {
      expect(entry.sources.length, `${entry.id} sources`).toBeGreaterThanOrEqual(1);
      for (const source of entry.sources) expect(source.url, `${entry.id} source URL`).toMatch(httpUrl);
    }
  });

  it("resolves glossary references with unique IDs and exact module backlinks", () => {
    const glossaryIds = new Set(glossaryEntries.map(entry => entry.id));
    expect(glossaryIds.size).toBe(glossaryEntries.length);

    const expectedBacklinks = new Map<string, Set<string>>();
    for (const module of modules) {
      expect(new Set(module.glossary).size, `${module.id} duplicate glossary reference`).toBe(module.glossary.length);
      for (const glossaryId of module.glossary) {
        expect(glossaryIds.has(glossaryId), `${module.id} -> missing glossary ${glossaryId}`).toBe(true);
        const backlinks = expectedBacklinks.get(glossaryId) ?? new Set<string>();
        backlinks.add(module.id);
        expectedBacklinks.set(glossaryId, backlinks);
      }
    }

    for (const entry of glossaryEntries) {
      expect(entry.term.trim().length, `${entry.id} term`).toBeGreaterThanOrEqual(2);
      expect(entry.plain.trim().length, `${entry.id} plain explanation`).toBeGreaterThanOrEqual(25);
      expect(entry.technical.trim().length, `${entry.id} technical explanation`).toBeGreaterThanOrEqual(35);
      expect(entry.example.trim().length, `${entry.id} example`).toBeGreaterThanOrEqual(20);
      expect(entry.misconception.trim().length, `${entry.id} misconception`).toBeGreaterThanOrEqual(25);
      expect(new Set(entry.aliases).size, `${entry.id} duplicate alias`).toBe(entry.aliases.length);
      expect(new Set(entry.relatedModules).size, `${entry.id} duplicate backlink`).toBe(entry.relatedModules.length);
      expect([...entry.relatedModules].sort(), `${entry.id} backlinks`).toEqual(
        [...(expectedBacklinks.get(entry.id) ?? new Set<string>())].sort(),
      );
    }

    expect(glossaryEntries.length).toBe(expectedBacklinks.size);
  });
});
