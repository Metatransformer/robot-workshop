import { foundationsElectronicsModules } from "./foundations-electronics";
import { mechanicsControlModules } from "./mechanics-control";
import { embeddedRoboticsModules } from "./embedded-robotics";
import { advancedGlossary } from "./glossary";
import type { LearningModule, TemplateId, TrackId } from "./types";
export type * from "./types";

export const tracks: { id: TrackId; title: string; description: string }[] = [
  { id: "foundations", title: "Think & measure", description: "Estimate, measure, experiment, and keep evidence you can trust." },
  { id: "electronics", title: "Electricity & power", description: "Follow energy through circuits, supplies, sensors, and drivers." },
  { id: "mechanics", title: "Forces & mechanisms", description: "Turn loads and motion into parts that fit and work together." },
  { id: "embedded", title: "Code & microcontrollers", description: "Give physical devices predictable behavior and diagnose firmware." },
  { id: "control", title: "Feedback & motion", description: "Model change, measure error, and control a real moving system." },
  { id: "robotics", title: "Systems & robots", description: "Integrate sensing, computation, and mechanics into a testable machine." },
];
const authoredModules = [...foundationsElectronicsModules, ...mechanicsControlModules, ...embeddedRoboticsModules];
export const modules: LearningModule[] = tracks.flatMap(track => authoredModules.filter(module => module.track === track.id));
export const glossaryEntries = advancedGlossary;
export const getModule = (id: string) => modules.find(module => module.id === id);

const projectPathTargets: { templateId: TemplateId; title: string; description: string; required: string[]; optional: string[] }[] = [
  {
    templateId: "sensor", title: "Read the physical world", description: "Wire the Pico/BME280, read measurements, diagnose a disconnected sensor, and record evidence.",
    required: ["units-estimation", "voltage-current-resistance", "measurement-instruments", "programming-state", "mcu-gpio", "communications-protocols", "firmware-debugging"],
    optional: ["probability-uncertainty", "adc-sampling", "filtering-estimation", "feedback-pid"],
  },
  {
    templateId: "linkage", title: "Make a mechanism move", description: "Build a card linkage first; understand geometry, load, clearance, and measurements before fabrication.",
    required: ["units-estimation", "algebra-trig", "forces-free-body", "torque-gearing", "mechanisms-kinematics", "experimental-method"],
    optional: ["materials-stress", "tolerances-fits", "cad-fabrication", "fasteners-bearings"],
  },
  {
    templateId: "desk-robot", title: "Give a mechanism behavior", description: "Complete the servo design worksheet by joining power, motion limits, timing, and fault handling.",
    required: ["voltage-current-resistance", "power-regulation", "torque-gearing", "mechanisms-kinematics", "mcu-gpio", "timers-pwm", "programming-state", "reliability-faults"],
    optional: ["feedback-pid", "trajectories-motion", "robot-architecture", "system-integration"],
  },
  {
    templateId: "cyberdeck", title: "Build a personal computer", description: "Complete an integration plan for power, thermal paths, connectors, software and an enclosure.",
    required: ["engineering-workflow", "power-regulation", "batteries-protection", "digital-interfaces", "tolerances-fits", "cad-fabrication", "system-integration"],
    optional: ["data-structures", "communications-protocols", "reliability-faults", "documentation-sharing"],
  },
  {
    templateId: "blank", title: "Design your own thing", description: "Turn an everyday observation into measurable requirements, a small experiment and a reproducible build record.",
    required: ["units-estimation", "measurement-instruments", "experimental-method", "engineering-workflow", "robot-architecture", "documentation-sharing"],
    optional: ["forces-free-body", "voltage-current-resistance", "programming-state", "system-integration"],
  },
  {
    templateId: "servo-bench", title: "Command a servo deliberately", description: "Plan and verify disarmed startup, release and timeout behavior, and supply measurements on the unloaded FS90 bench.",
    required: ["voltage-current-resistance", "power-regulation", "torque-gearing", "mcu-gpio", "timers-pwm", "programming-state", "reliability-faults"],
    optional: ["measurement-instruments", "experimental-method"],
  },
];

const modulesById = new Map(modules.map(module => [module.id, module]));

const prerequisiteClosure = (targetIds: string[], excludedIds = new Set<string>()): string[] => {
  const ordered: string[] = [];
  const visited = new Set(excludedIds);
  const visiting = new Set<string>();

  const visit = (id: string, path: string[]): void => {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error(`Curriculum prerequisite cycle: ${[...path, id].join(" -> ")}`);

    const module = modulesById.get(id);
    if (!module) throw new Error(`Missing curriculum module in prerequisite path: ${[...path, id].join(" -> ")}`);

    visiting.add(id);
    for (const prerequisite of module.prerequisites) visit(prerequisite, [...path, id]);
    visiting.delete(id);
    visited.add(id);
    ordered.push(id);
  };

  for (const id of targetIds) visit(id, []);
  return ordered;
};

export const projectPaths: { templateId: TemplateId; title: string; description: string; required: string[]; optional: string[] }[] = projectPathTargets.map(path => {
  const required = prerequisiteClosure(path.required);
  const optional = prerequisiteClosure(path.optional, new Set(required));
  return { ...path, required, optional };
});
