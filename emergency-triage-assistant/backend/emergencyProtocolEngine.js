/**
 * Rule-based Emergency Protocol Detection Engine
 * Provides sub-50ms clinical decision support based on vital sign thresholds
 */

const SEVERITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MODERATE: 'MODERATE'
};

const INTERVENTION_WINDOW = {
  IMMEDIATE: '0-5 minutes',
  URGENT: '5-15 minutes'
};

const TRAUMA_KEYWORDS = ['accident', 'fall', 'trauma', 'stabbed', 'impact', 'injury', 'collision', 'crash'];
const STROKE_SYMPTOMS = ['confusion', 'slurred speech', 'vision changes'];

class Protocol {
  constructor(name, triggerReason, actions, severity, intervention, priority) {
    this.name = name;
    this.triggerReason = triggerReason;
    this.actions = actions;
    this.severity = severity;
    this.intervention = intervention;
    this.priority = priority;
  }

  toJSON() {
    return {
      protocol_name: this.name,
      trigger_reason: this.triggerReason,
      immediate_actions: this.actions,
      severity: this.severity,
      intervention_window: this.intervention
    };
  }
}

class EmergencyProtocolEngine {
  detectProtocols(patientData) {
    const vitals = patientData.vitals || {};
    const allergies = patientData.allergies || [];
    const medications = patientData.medications || [];
    const symptoms = patientData.symptoms || [];
    const onsetTime = patientData.onset_time;
    const clinicalNotes = patientData.clinical_notes || '';
    const painScale = patientData.pain_scale || 0;

    const protocols = [];

    const checks = [
      this._checkCardiacArrest(vitals),
      this._checkStroke(vitals, symptoms, onsetTime),
      this._checkAnaphylaxis(allergies, symptoms, medications, onsetTime),
      this._checkHypertensiveCrisis(vitals),
      this._checkRespiratoryFailure(vitals),
      this._checkSepsis(vitals),
      this._checkTrauma(clinicalNotes, painScale)
    ];

    checks.forEach(protocol => {
      if (protocol) protocols.push(protocol);
    });

    protocols.sort((a, b) => a.priority - b.priority);

    return protocols.map(p => p.toJSON());
  }

  _checkCardiacArrest(vitals) {
    const pulse = vitals.pulse_rate;
    const spo2 = vitals.spo2;

    if (pulse === undefined) return null;

    if (pulse < 30) {
      return new Protocol(
        'Cardiac Arrest Protocol',
        `Pulse rate critically low at ${pulse} bpm (threshold: <30 bpm)`,
        [
          'Initiate CPR immediately',
          'Call code blue',
          'Prepare defibrillator',
          'Establish IV access',
          'Administer epinephrine'
        ],
        SEVERITY.CRITICAL,
        INTERVENTION_WINDOW.IMMEDIATE,
        1
      );
    }

    if (pulse > 180 && spo2 !== undefined && spo2 < 85) {
      return new Protocol(
        'Cardiac Arrest Protocol',
        `Pulse rate ${pulse} bpm (>180) with SpO2 ${spo2}% (<85%)`,
        [
          'Initiate CPR immediately',
          'Call code blue',
          'Prepare defibrillator',
          'Establish IV access',
          'Administer epinephrine'
        ],
        SEVERITY.CRITICAL,
        INTERVENTION_WINDOW.IMMEDIATE,
        1
      );
    }

    return null;
  }

  _checkStroke(vitals, symptoms, onsetTime) {
    const gcs = vitals.gcs_score;

    if (gcs !== undefined && gcs < 10) {
      return new Protocol(
        'Stroke Protocol',
        `GCS score ${gcs} (threshold: <10)`,
        [
          'Activate stroke team',
          'Perform FAST assessment',
          'Order immediate CT scan',
          'Check blood glucose',
          'Establish IV access'
        ],
        SEVERITY.CRITICAL,
        INTERVENTION_WINDOW.IMMEDIATE,
        2
      );
    }

    const symptomsLower = symptoms.map(s => s.toLowerCase());
    const strokeSymptomCount = STROKE_SYMPTOMS.filter(keyword =>
      symptomsLower.some(s => s.includes(keyword))
    ).length;

    if (strokeSymptomCount >= 2 && onsetTime) {
      const hoursSinceOnset = this._calculateHoursSinceOnset(onsetTime);
      if (hoursSinceOnset !== null && hoursSinceOnset <= 4.5) {
        return new Protocol(
          'Stroke Protocol',
          `Stroke symptoms detected with onset ${hoursSinceOnset.toFixed(1)} hours ago (window: <4.5 hours)`,
          [
            'Activate stroke team',
            'Perform FAST assessment',
            'Order immediate CT scan',
            'Check blood glucose',
            'Establish IV access'
          ],
          SEVERITY.CRITICAL,
          INTERVENTION_WINDOW.IMMEDIATE,
          2
        );
      }
    }

    return null;
  }

  _checkAnaphylaxis(allergies, symptoms, medications, onsetTime) {
    if (allergies.length === 0) return null;

    const symptomsLower = symptoms.map(s => s.toLowerCase());
    const hasRespiratory = symptomsLower.some(s =>
      s.includes('wheezing') || s.includes('difficulty breathing')
    );

    if (hasRespiratory && onsetTime) {
      const hoursSinceOnset = this._calculateHoursSinceOnset(onsetTime);
      if (hoursSinceOnset !== null && hoursSinceOnset < 1) {
        return new Protocol(
          'Anaphylaxis Protocol',
          `Allergic reaction with respiratory symptoms (onset: ${Math.floor(hoursSinceOnset * 60)} minutes ago)`,
          [
            'Administer epinephrine IM immediately',
            'Establish IV access',
            'Administer antihistamines',
            'Prepare for intubation',
            'Monitor vital signs continuously'
          ],
          SEVERITY.CRITICAL,
          INTERVENTION_WINDOW.IMMEDIATE,
          3
        );
      }
    }

    return null;
  }

  _checkHypertensiveCrisis(vitals) {
    const systolic = vitals.systolic_bp;
    const diastolic = vitals.diastolic_bp;

    if (systolic !== undefined && systolic > 180) {
      return new Protocol(
        'Hypertensive Crisis Protocol',
        `Systolic BP ${systolic} mmHg (threshold: >180 mmHg)`,
        [
          'Administer IV antihypertensive',
          'Monitor BP every 5 minutes',
          'Assess for end-organ damage',
          'Order ECG and cardiac markers',
          'Establish continuous monitoring'
        ],
        SEVERITY.HIGH,
        INTERVENTION_WINDOW.IMMEDIATE,
        4
      );
    }

    if (diastolic !== undefined && diastolic > 120) {
      return new Protocol(
        'Hypertensive Crisis Protocol',
        `Diastolic BP ${diastolic} mmHg (threshold: >120 mmHg)`,
        [
          'Administer IV antihypertensive',
          'Monitor BP every 5 minutes',
          'Assess for end-organ damage',
          'Order ECG and cardiac markers',
          'Establish continuous monitoring'
        ],
        SEVERITY.HIGH,
        INTERVENTION_WINDOW.IMMEDIATE,
        4
      );
    }

    return null;
  }

  _checkRespiratoryFailure(vitals) {
    const spo2 = vitals.spo2;
    const respRate = vitals.respiratory_rate;

    if (spo2 !== undefined && spo2 < 90) {
      return new Protocol(
        'Respiratory Failure Protocol',
        `SpO2 ${spo2}% (threshold: <90%)`,
        [
          'Administer high-flow oxygen',
          'Prepare for intubation',
          'Order arterial blood gas',
          'Position patient upright',
          'Monitor respiratory status continuously'
        ],
        SEVERITY.CRITICAL,
        INTERVENTION_WINDOW.IMMEDIATE,
        5
      );
    }

    if (respRate !== undefined) {
      if (respRate > 30) {
        return new Protocol(
          'Respiratory Failure Protocol',
          `Respiratory rate ${respRate} breaths/min (threshold: >30)`,
          [
            'Administer high-flow oxygen',
            'Prepare for intubation',
            'Order arterial blood gas',
            'Position patient upright',
            'Monitor respiratory status continuously'
          ],
          SEVERITY.CRITICAL,
          INTERVENTION_WINDOW.IMMEDIATE,
          5
        );
      } else if (respRate < 8) {
        return new Protocol(
          'Respiratory Failure Protocol',
          `Respiratory rate ${respRate} breaths/min (threshold: <8)`,
          [
            'Administer high-flow oxygen',
            'Prepare for intubation',
            'Order arterial blood gas',
            'Position patient upright',
            'Monitor respiratory status continuously'
          ],
          SEVERITY.CRITICAL,
          INTERVENTION_WINDOW.IMMEDIATE,
          5
        );
      }
    }

    return null;
  }

  _checkSepsis(vitals) {
    const temp = vitals.temperature;
    const pulse = vitals.pulse_rate;
    const respRate = vitals.respiratory_rate;

    if (temp === undefined || pulse === undefined || respRate === undefined) {
      return null;
    }

    const tempAbnormal = temp > 101.5 || temp < 96.8;

    if (tempAbnormal && pulse > 100 && respRate > 20) {
      return new Protocol(
        'Sepsis Protocol',
        `Temperature ${temp}°F, pulse ${pulse} bpm, RR ${respRate} (sepsis criteria met)`,
        [
          'Draw blood cultures immediately',
          'Administer broad-spectrum antibiotics',
          'Start IV fluid resuscitation',
          'Order lactate and CBC',
          'Monitor vital signs every 15 minutes'
        ],
        SEVERITY.HIGH,
        INTERVENTION_WINDOW.URGENT,
        6
      );
    }

    return null;
  }

  _checkTrauma(clinicalNotes, painScale) {
    const notesLower = clinicalNotes.toLowerCase();
    const hasTraumaKeyword = TRAUMA_KEYWORDS.some(keyword => notesLower.includes(keyword));

    if (hasTraumaKeyword && painScale > 7) {
      return new Protocol(
        'Trauma Protocol',
        `Trauma indicators detected with pain scale ${painScale}/10`,
        [
          'Activate trauma team',
          'Perform primary survey (ABCDE)',
          'Establish IV access (two large-bore)',
          'Order trauma imaging series',
          'Administer pain management'
        ],
        SEVERITY.HIGH,
        INTERVENTION_WINDOW.IMMEDIATE,
        7
      );
    }

    return null;
  }

  _calculateHoursSinceOnset(onsetTime) {
    try {
      const hours = parseFloat(onsetTime);
      if (!isNaN(hours)) return hours;

      const onset = new Date(onsetTime);
      const now = new Date();
      const delta = now - onset;
      return delta / (1000 * 60 * 60);
    } catch {
      return null;
    }
  }
}

const engine = new EmergencyProtocolEngine();

function detectEmergencyProtocols(patientData) {
  return engine.detectProtocols(patientData);
}

module.exports = {
  EmergencyProtocolEngine,
  detectEmergencyProtocols,
  SEVERITY,
  INTERVENTION_WINDOW
};
