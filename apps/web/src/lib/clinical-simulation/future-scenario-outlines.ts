import type { ClinicalScenario } from "./schema";

export type FutureScenarioOutline = {
  id: string;
  title: string;
  unit: ClinicalScenario["unit"];
  focus: string;
  candidateDifficulty: ClinicalScenario["difficulty"];
  requiredCapabilities: string[];
  preferredSourceOrganizations: string[];
  status: "outline";
  clinicalReviewStatus: "not-started";
  playable: false;
};

const plannedTitles: Record<ClinicalScenario["unit"], string[]> = {
  "medical-surgical": [
    "Sepsis recognition", "Opioid-induced respiratory depression", "Hypoglycemia", "Hyperglycemia",
    "Blood transfusion reaction", "Delirium", "Fall with possible injury", "Acute kidney injury",
    "Electrolyte abnormalities", "Urinary retention", "Bowel obstruction", "Postoperative ileus",
    "Wound dehiscence", "Surgical-site infection", "DVT recognition", "Pulmonary embolism recognition",
    "Aspiration", "Enteral feeding complication", "C. difficile precautions", "Pressure injury prevention",
    "Acute pain management", "Difficult discharge education",
  ],
  telemetry: [
    "Atrial fibrillation with rapid ventricular response", "Supraventricular tachycardia", "Symptomatic bradycardia",
    "Heart block", "Prolonged QT", "Ventricular tachycardia with a pulse", "Pulseless ventricular tachycardia",
    "Acute heart-failure exacerbation", "Hypertensive emergency", "Syncope", "Pacemaker malfunction",
    "Electrolyte-related dysrhythmia", "Post-PCI complication", "Anticoagulation-related bleeding",
  ],
  "step-down": [
    "Acute pulmonary edema", "BiPAP deterioration", "Tracheostomy obstruction", "GI bleed",
    "Diabetic ketoacidosis", "Hyperosmolar hyperglycemic state", "Alcohol withdrawal", "Stroke progression",
    "Post-thrombolytic monitoring", "Post-thrombectomy deterioration", "Seizure", "High-flow oxygen deterioration",
    "Acute kidney injury with fluid overload", "Complex insulin infusion", "Postoperative respiratory failure",
  ],
  "intensive-care": [
    "ARDS and ventilator management", "Ventilator alarm troubleshooting", "Accidental extubation",
    "Sedation and analgesia management", "Spontaneous awakening and breathing trials", "Central-line complication",
    "Arterial-line troubleshooting", "Massive transfusion", "Hemorrhagic shock", "Cardiogenic shock",
    "Neurogenic shock", "Intracranial pressure crisis", "Status epilepticus", "Targeted temperature management",
    "CRRT complication", "Severe electrolyte emergency", "DKA with potassium shifts", "Code blue",
    "Post-cardiac-arrest care", "End-of-life and goals-of-care communication",
    "Organ-donation coordination concepts",
  ],
  procedural: [
    "Preoperative checklist failure", "Wrong-site prevention", "Contrast reaction", "Anaphylaxis",
    "Malignant hyperthermia recognition", "Local anesthetic systemic toxicity", "Post-anesthesia airway obstruction",
    "Post-procedure hemorrhage", "Delayed recovery", "Aspiration", "Procedural hypoglycemia",
    "Anticoagulation and procedure safety", "Endoscopy complication", "Interventional radiology complication",
    "Cardiac catheterization complication", "Procedural consent and capacity issue",
  ],
  psychiatric: [
    "Active suicide plan", "Self-harm behavior", "Acute psychosis", "Mania", "Severe depression", "Panic attack",
    "Alcohol withdrawal", "Opioid withdrawal", "Stimulant intoxication", "Delirium versus psychiatric illness",
    "Medication-induced movement disorder", "Serotonin syndrome recognition", "Neuroleptic malignant syndrome recognition",
    "Elopement risk", "Violence risk", "Trauma-informed care", "Capacity and consent", "Restraint and seclusion",
    "Behavioral emergency", "Therapeutic boundary challenge", "Refusal of medication",
    "Eating-disorder medical instability",
  ],
};

const unitCapabilities: Record<ClinicalScenario["unit"], string[]> = {
  "medical-surgical": ["focused assessment", "medication safety", "escalation", "patient education", "reassessment"],
  telemetry: ["rhythm interpretation", "hemodynamic assessment", "time-sensitive escalation", "medication review", "reassessment"],
  "step-down": ["advanced oxygen support", "trend recognition", "infusion safety", "interprofessional communication", "transfer escalation"],
  "intensive-care": ["invasive monitoring", "titrated therapy", "device management", "critical-care escalation", "family communication"],
  procedural: ["verification and consent", "procedural monitoring", "airway rescue", "recovery assessment", "documentation"],
  psychiatric: ["risk assessment", "therapeutic communication", "environmental safety", "least-restrictive care", "behavioral reassessment"],
};

const sourceTargets: Record<ClinicalScenario["unit"], string[]> = {
  "medical-surgical": ["AHRQ", "CDC", "ISMP", "professional nursing standards"],
  telemetry: ["American Heart Association", "American College of Cardiology", "ISMP"],
  "step-down": ["American Thoracic Society", "GOLD", "American Heart Association", "SCCM"],
  "intensive-care": ["SCCM", "American Association of Critical-Care Nurses", "American Heart Association"],
  procedural: ["American Society of Anesthesiologists", "AORN", "Joint Commission"],
  psychiatric: ["SAMHSA", "American Psychiatric Association", "Joint Commission"],
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function candidateDifficulty(title: string): ClinicalScenario["difficulty"] {
  return /pulseless|shock|ventilator|extubation|intracranial|massive|status|malignant|toxicity|crrt|code blue|post-cardiac|thrombectomy|tracheostomy/i.test(title)
    ? "advanced"
    : /education|prevention|precautions|pain management|panic attack|boundary/i.test(title)
      ? "novice"
      : "intermediate";
}

export const futureScenarioOutlines: FutureScenarioOutline[] = Object.entries(plannedTitles).flatMap(([unit, titles]) =>
  titles.map((title) => ({
    id: `outline-${unit}-${slugify(title)}`,
    title,
    unit: unit as ClinicalScenario["unit"],
    focus: `Recognition and nursing management of ${title.toLowerCase()} within a controlled educational patient state.`,
    candidateDifficulty: candidateDifficulty(title),
    requiredCapabilities: unitCapabilities[unit as ClinicalScenario["unit"]],
    preferredSourceOrganizations: sourceTargets[unit as ClinicalScenario["unit"]],
    status: "outline" as const,
    clinicalReviewStatus: "not-started" as const,
    playable: false as const,
  })),
);
