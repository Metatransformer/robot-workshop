export type TrackId = "foundations" | "electronics" | "mechanics" | "embedded" | "control" | "robotics";
export type SimulationId = "dc-motor" | "rc-transient" | "power-budget" | "gpio-state-machine";
export type TemplateId = "linkage" | "sensor" | "desk-robot" | "cyberdeck" | "blank" | "servo-bench" | "sensor-led";
export type LearningSource = { title: string; url: string };
export type LearningModule = {
  id: string;
  track: TrackId;
  title: string;
  summary: string;
  minutes: number;
  level: "Foundation" | "Practice" | "Advanced";
  prerequisites: string[];
  relatedStudy?: string[];
  outcomes: string[];
  concepts: string;
  workedExample: { problem: string; steps: string[]; result: string; sanityCheck: string };
  exercise: { question: string; choices: string[]; answerIndex: number; explanation: string };
  lab: { goal: string; equipment: string[]; steps: string[]; observe: string[]; transfer: string; cautions: string[] };
  projectIds: TemplateId[];
  glossary: string[];
  sources: LearningSource[];
  simulation?: SimulationId;
};
export type GlossaryEntry = {
  id: string; term: string; aliases: string[]; plain: string; technical: string;
  units?: string; formula?: string; example: string; misconception: string;
  relatedModules: string[]; sources: LearningSource[];
};
export type ModuleProgress = { read: boolean; practiced: boolean; demonstrated: boolean; notes: string; updatedAt: string };
