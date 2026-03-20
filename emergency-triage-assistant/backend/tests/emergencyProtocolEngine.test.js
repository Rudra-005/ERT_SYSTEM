/**
 * Unit tests for Emergency Protocol Detection Engine
 * Tests all 8 protocol triggers and multi-protocol priority ordering
 */

const { detectEmergencyProtocols } = require('../emergencyProtocolEngine');

describe('Cardiac Arrest Protocol', () => {
  test('low pulse triggers cardiac arrest', () => {
    const data = { vitals: { pulse_rate: 25 } };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(1);
    expect(protocols[0].protocol_name).toBe('Cardiac Arrest Protocol');
    expect(protocols[0].trigger_reason).toContain('25 bpm');
    expect(protocols[0].severity).toBe('CRITICAL');
    expect(protocols[0].intervention_window).toBe('0-5 minutes');
  });

  test('high pulse with low SpO2 triggers cardiac arrest', () => {
    const data = { vitals: { pulse_rate: 185, spo2: 82 } };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(1);
    expect(protocols[0].protocol_name).toBe('Cardiac Arrest Protocol');
    expect(protocols[0].trigger_reason).toContain('185 bpm');
    expect(protocols[0].trigger_reason).toContain('82%');
  });

  test('high pulse with normal SpO2 does not trigger', () => {
    const data = { vitals: { pulse_rate: 185, spo2: 95 } };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(0);
  });
});

describe('Stroke Protocol', () => {
  test('low GCS triggers stroke', () => {
    const data = { vitals: { gcs_score: 8 } };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(1);
    expect(protocols[0].protocol_name).toBe('Stroke Protocol');
    expect(protocols[0].trigger_reason).toContain('GCS score 8');
  });

  test('stroke symptoms within window triggers', () => {
    const data = {
      vitals: {},
      symptoms: ['confusion', 'slurred speech'],
      onset_time: '3.0'
    };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(1);
    expect(protocols[0].protocol_name).toBe('Stroke Protocol');
    expect(protocols[0].trigger_reason).toContain('3.0 hours');
  });

  test('stroke symptoms outside window does not trigger', () => {
    const data = {
      vitals: {},
      symptoms: ['confusion', 'slurred speech'],
      onset_time: '5.0'
    };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(0);
  });

  test('single stroke symptom does not trigger', () => {
    const data = {
      vitals: {},
      symptoms: ['confusion'],
      onset_time: '2.0'
    };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(0);
  });
});

describe('Anaphylaxis Protocol', () => {
  test('allergy with respiratory symptoms triggers', () => {
    const data = {
      vitals: {},
      allergies: ['penicillin'],
      symptoms: ['wheezing', 'difficulty breathing'],
      medications: ['amoxicillin'],
      onset_time: '0.5'
    };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(1);
    expect(protocols[0].protocol_name).toBe('Anaphylaxis Protocol');
    expect(protocols[0].trigger_reason).toContain('30 minutes');
  });

  test('no allergies does not trigger', () => {
    const data = {
      vitals: {},
      allergies: [],
      symptoms: ['wheezing'],
      onset_time: '0.5'
    };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(0);
  });

  test('allergy symptoms outside window does not trigger', () => {
    const data = {
      vitals: {},
      allergies: ['penicillin'],
      symptoms: ['wheezing'],
      onset_time: '2.0'
    };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(0);
  });
});

describe('Hypertensive Crisis Protocol', () => {
  test('high systolic triggers hypertensive crisis', () => {
    const data = { vitals: { systolic_bp: 195 } };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(1);
    expect(protocols[0].protocol_name).toBe('Hypertensive Crisis Protocol');
    expect(protocols[0].trigger_reason).toContain('195 mmHg');
  });

  test('high diastolic triggers hypertensive crisis', () => {
    const data = { vitals: { diastolic_bp: 125 } };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(1);
    expect(protocols[0].protocol_name).toBe('Hypertensive Crisis Protocol');
    expect(protocols[0].trigger_reason).toContain('125 mmHg');
  });

  test('borderline BP does not trigger', () => {
    const data = { vitals: { systolic_bp: 180, diastolic_bp: 120 } };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(0);
  });
});

describe('Respiratory Failure Protocol', () => {
  test('low SpO2 triggers respiratory failure', () => {
    const data = { vitals: { spo2: 85 } };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(1);
    expect(protocols[0].protocol_name).toBe('Respiratory Failure Protocol');
    expect(protocols[0].trigger_reason).toContain('85%');
  });

  test('high respiratory rate triggers', () => {
    const data = { vitals: { respiratory_rate: 35 } };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(1);
    expect(protocols[0].protocol_name).toBe('Respiratory Failure Protocol');
    expect(protocols[0].trigger_reason).toContain('35 breaths/min');
  });

  test('low respiratory rate triggers', () => {
    const data = { vitals: { respiratory_rate: 6 } };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(1);
    expect(protocols[0].protocol_name).toBe('Respiratory Failure Protocol');
    expect(protocols[0].trigger_reason).toContain('6 breaths/min');
  });
});

describe('Sepsis Protocol', () => {
  test('sepsis criteria met triggers', () => {
    const data = {
      vitals: {
        temperature: 103.0,
        pulse_rate: 110,
        respiratory_rate: 25
      }
    };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(1);
    expect(protocols[0].protocol_name).toBe('Sepsis Protocol');
    expect(protocols[0].trigger_reason).toContain('103.0°F');
    expect(protocols[0].intervention_window).toBe('5-15 minutes');
  });

  test('hypothermia sepsis triggers', () => {
    const data = {
      vitals: {
        temperature: 96.0,
        pulse_rate: 105,
        respiratory_rate: 22
      }
    };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(1);
    expect(protocols[0].protocol_name).toBe('Sepsis Protocol');
  });

  test('incomplete sepsis criteria does not trigger', () => {
    const data = {
      vitals: {
        temperature: 103.0,
        pulse_rate: 95,
        respiratory_rate: 25
      }
    };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(0);
  });
});

describe('Trauma Protocol', () => {
  test('trauma with high pain triggers', () => {
    const data = {
      vitals: {},
      clinical_notes: 'Patient fell from ladder, complaining of severe pain',
      pain_scale: 9
    };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(1);
    expect(protocols[0].protocol_name).toBe('Trauma Protocol');
    expect(protocols[0].trigger_reason).toContain('pain scale 9');
  });

  test('trauma keyword variations trigger', () => {
    const keywords = ['accident', 'stabbed', 'impact', 'trauma'];
    keywords.forEach(keyword => {
      const data = {
        vitals: {},
        clinical_notes: `Patient involved in ${keyword}`,
        pain_scale: 8
      };
      const protocols = detectEmergencyProtocols(data);
      expect(protocols).toHaveLength(1);
      expect(protocols[0].protocol_name).toBe('Trauma Protocol');
    });
  });

  test('trauma with low pain does not trigger', () => {
    const data = {
      vitals: {},
      clinical_notes: 'Patient fell from chair',
      pain_scale: 5
    };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols).toHaveLength(0);
  });
});

describe('Multi-Protocol Priority', () => {
  test('cardiac arrest has highest priority', () => {
    const data = {
      vitals: {
        pulse_rate: 25,
        spo2: 85,
        systolic_bp: 190,
        respiratory_rate: 35
      }
    };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols.length).toBe(3);
    expect(protocols[0].protocol_name).toBe('Cardiac Arrest Protocol');
    expect(protocols[1].protocol_name).toBe('Hypertensive Crisis Protocol');
    expect(protocols[2].protocol_name).toBe('Respiratory Failure Protocol');
  });

  test('multiple protocols in correct order', () => {
    const data = {
      vitals: {
        gcs_score: 8,
        systolic_bp: 195,
        spo2: 88,
        temperature: 103.0,
        pulse_rate: 110,
        respiratory_rate: 25
      },
      clinical_notes: 'Patient fell and hit head',
      pain_scale: 9
    };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols.length).toBeGreaterThanOrEqual(4);
    
    const protocolNames = protocols.map(p => p.protocol_name);
    const strokeIdx = protocolNames.indexOf('Stroke Protocol');
    const hypertensiveIdx = protocolNames.indexOf('Hypertensive Crisis Protocol');
    const respiratoryIdx = protocolNames.indexOf('Respiratory Failure Protocol');
    const sepsisIdx = protocolNames.indexOf('Sepsis Protocol');
    const traumaIdx = protocolNames.indexOf('Trauma Protocol');
    
    expect(strokeIdx).toBeLessThan(hypertensiveIdx);
    expect(hypertensiveIdx).toBeLessThan(respiratoryIdx);
    expect(respiratoryIdx).toBeLessThan(sepsisIdx);
    expect(sepsisIdx).toBeLessThan(traumaIdx);
  });

  test('all protocols simultaneously', () => {
    const data = {
      vitals: {
        pulse_rate: 25,
        gcs_score: 8,
        systolic_bp: 195,
        spo2: 85,
        temperature: 103.0,
        respiratory_rate: 35
      },
      allergies: ['penicillin'],
      symptoms: ['wheezing', 'confusion', 'slurred speech'],
      medications: ['amoxicillin'],
      onset_time: '0.5',
      clinical_notes: 'Patient involved in car accident',
      pain_scale: 9
    };
    const protocols = detectEmergencyProtocols(data);
    expect(protocols.length).toBeGreaterThanOrEqual(6);
    expect(protocols[0].protocol_name).toBe('Cardiac Arrest Protocol');
  });
});

describe('Performance', () => {
  test('detection completes under 50ms', () => {
    const data = {
      vitals: {
        pulse_rate: 75,
        spo2: 98,
        systolic_bp: 120,
        diastolic_bp: 80,
        temperature: 98.6,
        respiratory_rate: 16,
        gcs_score: 15
      },
      allergies: [],
      symptoms: [],
      medications: [],
      clinical_notes: 'Regular checkup',
      pain_scale: 0
    };

    const iterations = 100;
    const start = Date.now();
    for (let i = 0; i < iterations; i++) {
      detectEmergencyProtocols(data);
    }
    const elapsed = Date.now() - start;
    const avgTimeMs = elapsed / iterations;

    expect(avgTimeMs).toBeLessThan(50);
  });
});
