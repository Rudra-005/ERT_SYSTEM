"""
Rule-based Emergency Protocol Detection Engine
Provides sub-50ms clinical decision support based on vital sign thresholds
"""
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum


class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MODERATE = "MODERATE"


class InterventionWindow(str, Enum):
    IMMEDIATE = "0-5 minutes"
    URGENT = "5-15 minutes"


class Protocol:
    def __init__(self, name: str, trigger_reason: str, actions: List[str], 
                 severity: Severity, intervention: InterventionWindow, priority: int):
        self.name = name
        self.trigger_reason = trigger_reason
        self.actions = actions
        self.severity = severity
        self.intervention = intervention
        self.priority = priority

    def to_dict(self) -> Dict[str, Any]:
        return {
            "protocol_name": self.name,
            "trigger_reason": self.trigger_reason,
            "immediate_actions": self.actions,
            "severity": self.severity,
            "intervention_window": self.intervention
        }


class EmergencyProtocolEngine:
    TRAUMA_KEYWORDS = ["accident", "fall", "trauma", "stabbed", "impact", "injury", "collision", "crash"]
    STROKE_SYMPTOMS = ["confusion", "slurred speech", "vision changes"]
    
    def __init__(self):
        pass

    def detect_protocols(self, patient_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Main detection method - returns all triggered protocols in priority order"""
        vitals = patient_data.get("vitals", {})
        allergies = patient_data.get("allergies", [])
        medications = patient_data.get("medications", [])
        symptoms = patient_data.get("symptoms", [])
        onset_time = patient_data.get("onset_time")
        clinical_notes = patient_data.get("clinical_notes", "")
        pain_scale = patient_data.get("pain_scale", 0)
        
        protocols = []
        
        # Check all protocols
        if p := self._check_cardiac_arrest(vitals):
            protocols.append(p)
        if p := self._check_stroke(vitals, symptoms, onset_time):
            protocols.append(p)
        if p := self._check_anaphylaxis(allergies, symptoms, medications, onset_time):
            protocols.append(p)
        if p := self._check_hypertensive_crisis(vitals):
            protocols.append(p)
        if p := self._check_respiratory_failure(vitals):
            protocols.append(p)
        if p := self._check_sepsis(vitals):
            protocols.append(p)
        if p := self._check_trauma(clinical_notes, pain_scale):
            protocols.append(p)
        
        # Sort by priority (lower number = higher priority)
        protocols.sort(key=lambda x: x.priority)
        
        return [p.to_dict() for p in protocols]

    def _check_cardiac_arrest(self, vitals: Dict) -> Optional[Protocol]:
        pulse = vitals.get("pulse_rate")
        spo2 = vitals.get("spo2")
        
        if pulse is None:
            return None
            
        if pulse < 30:
            return Protocol(
                "Cardiac Arrest Protocol",
                f"Pulse rate critically low at {pulse} bpm (threshold: <30 bpm)",
                [
                    "Initiate CPR immediately",
                    "Call code blue",
                    "Prepare defibrillator",
                    "Establish IV access",
                    "Administer epinephrine"
                ],
                Severity.CRITICAL,
                InterventionWindow.IMMEDIATE,
                priority=1
            )
        
        if pulse > 180 and spo2 is not None and spo2 < 85:
            return Protocol(
                "Cardiac Arrest Protocol",
                f"Pulse rate {pulse} bpm (>180) with SpO2 {spo2}% (<85%)",
                [
                    "Initiate CPR immediately",
                    "Call code blue",
                    "Prepare defibrillator",
                    "Establish IV access",
                    "Administer epinephrine"
                ],
                Severity.CRITICAL,
                InterventionWindow.IMMEDIATE,
                priority=1
            )
        
        return None

    def _check_stroke(self, vitals: Dict, symptoms: List[str], onset_time: Optional[str]) -> Optional[Protocol]:
        gcs = vitals.get("gcs_score")
        
        if gcs is not None and gcs < 10:
            return Protocol(
                "Stroke Protocol",
                f"GCS score {gcs} (threshold: <10)",
                [
                    "Activate stroke team",
                    "Perform FAST assessment",
                    "Order immediate CT scan",
                    "Check blood glucose",
                    "Establish IV access"
                ],
                Severity.CRITICAL,
                InterventionWindow.IMMEDIATE,
                priority=2
            )
        
        # Check symptom combination
        symptoms_lower = [s.lower() for s in symptoms]
        stroke_symptom_count = sum(1 for keyword in self.STROKE_SYMPTOMS if any(keyword in s for s in symptoms_lower))
        
        if stroke_symptom_count >= 2 and onset_time:
            hours_since_onset = self._calculate_hours_since_onset(onset_time)
            if hours_since_onset is not None and hours_since_onset <= 4.5:
                return Protocol(
                    "Stroke Protocol",
                    f"Stroke symptoms detected with onset {hours_since_onset:.1f} hours ago (window: <4.5 hours)",
                    [
                        "Activate stroke team",
                        "Perform FAST assessment",
                        "Order immediate CT scan",
                        "Check blood glucose",
                        "Establish IV access"
                    ],
                    Severity.CRITICAL,
                    InterventionWindow.IMMEDIATE,
                    priority=2
                )
        
        return None

    def _check_anaphylaxis(self, allergies: List[str], symptoms: List[str], 
                          medications: List[str], onset_time: Optional[str]) -> Optional[Protocol]:
        if not allergies:
            return None
        
        symptoms_lower = [s.lower() for s in symptoms]
        has_respiratory = any(keyword in s for s in symptoms_lower for keyword in ["wheezing", "difficulty breathing"])
        
        if has_respiratory and onset_time:
            hours_since_onset = self._calculate_hours_since_onset(onset_time)
            if hours_since_onset is not None and hours_since_onset < 1:
                return Protocol(
                    "Anaphylaxis Protocol",
                    f"Allergic reaction with respiratory symptoms (onset: {int(hours_since_onset * 60)} minutes ago)",
                    [
                        "Administer epinephrine IM immediately",
                        "Establish IV access",
                        "Administer antihistamines",
                        "Prepare for intubation",
                        "Monitor vital signs continuously"
                    ],
                    Severity.CRITICAL,
                    InterventionWindow.IMMEDIATE,
                    priority=3
                )
        
        return None

    def _check_hypertensive_crisis(self, vitals: Dict) -> Optional[Protocol]:
        systolic = vitals.get("systolic_bp")
        diastolic = vitals.get("diastolic_bp")
        
        if systolic is not None and systolic > 180:
            return Protocol(
                "Hypertensive Crisis Protocol",
                f"Systolic BP {systolic} mmHg (threshold: >180 mmHg)",
                [
                    "Administer IV antihypertensive",
                    "Monitor BP every 5 minutes",
                    "Assess for end-organ damage",
                    "Order ECG and cardiac markers",
                    "Establish continuous monitoring"
                ],
                Severity.HIGH,
                InterventionWindow.IMMEDIATE,
                priority=4
            )
        
        if diastolic is not None and diastolic > 120:
            return Protocol(
                "Hypertensive Crisis Protocol",
                f"Diastolic BP {diastolic} mmHg (threshold: >120 mmHg)",
                [
                    "Administer IV antihypertensive",
                    "Monitor BP every 5 minutes",
                    "Assess for end-organ damage",
                    "Order ECG and cardiac markers",
                    "Establish continuous monitoring"
                ],
                Severity.HIGH,
                InterventionWindow.IMMEDIATE,
                priority=4
            )
        
        return None

    def _check_respiratory_failure(self, vitals: Dict) -> Optional[Protocol]:
        spo2 = vitals.get("spo2")
        resp_rate = vitals.get("respiratory_rate")
        
        if spo2 is not None and spo2 < 90:
            return Protocol(
                "Respiratory Failure Protocol",
                f"SpO2 {spo2}% (threshold: <90%)",
                [
                    "Administer high-flow oxygen",
                    "Prepare for intubation",
                    "Order arterial blood gas",
                    "Position patient upright",
                    "Monitor respiratory status continuously"
                ],
                Severity.CRITICAL,
                InterventionWindow.IMMEDIATE,
                priority=5
            )
        
        if resp_rate is not None:
            if resp_rate > 30:
                return Protocol(
                    "Respiratory Failure Protocol",
                    f"Respiratory rate {resp_rate} breaths/min (threshold: >30)",
                    [
                        "Administer high-flow oxygen",
                        "Prepare for intubation",
                        "Order arterial blood gas",
                        "Position patient upright",
                        "Monitor respiratory status continuously"
                    ],
                    Severity.CRITICAL,
                    InterventionWindow.IMMEDIATE,
                    priority=5
                )
            elif resp_rate < 8:
                return Protocol(
                    "Respiratory Failure Protocol",
                    f"Respiratory rate {resp_rate} breaths/min (threshold: <8)",
                    [
                        "Administer high-flow oxygen",
                        "Prepare for intubation",
                        "Order arterial blood gas",
                        "Position patient upright",
                        "Monitor respiratory status continuously"
                    ],
                    Severity.CRITICAL,
                    InterventionWindow.IMMEDIATE,
                    priority=5
                )
        
        return None

    def _check_sepsis(self, vitals: Dict) -> Optional[Protocol]:
        temp = vitals.get("temperature")
        pulse = vitals.get("pulse_rate")
        resp_rate = vitals.get("respiratory_rate")
        
        if temp is None or pulse is None or resp_rate is None:
            return None
        
        temp_abnormal = temp > 101.5 or temp < 96.8
        
        if temp_abnormal and pulse > 100 and resp_rate > 20:
            return Protocol(
                "Sepsis Protocol",
                f"Temperature {temp}°F, pulse {pulse} bpm, RR {resp_rate} (sepsis criteria met)",
                [
                    "Draw blood cultures immediately",
                    "Administer broad-spectrum antibiotics",
                    "Start IV fluid resuscitation",
                    "Order lactate and CBC",
                    "Monitor vital signs every 15 minutes"
                ],
                Severity.HIGH,
                InterventionWindow.URGENT,
                priority=6
            )
        
        return None

    def _check_trauma(self, clinical_notes: str, pain_scale: int) -> Optional[Protocol]:
        notes_lower = clinical_notes.lower()
        has_trauma_keyword = any(keyword in notes_lower for keyword in self.TRAUMA_KEYWORDS)
        
        if has_trauma_keyword and pain_scale > 7:
            return Protocol(
                "Trauma Protocol",
                f"Trauma indicators detected with pain scale {pain_scale}/10",
                [
                    "Activate trauma team",
                    "Perform primary survey (ABCDE)",
                    "Establish IV access (two large-bore)",
                    "Order trauma imaging series",
                    "Administer pain management"
                ],
                Severity.HIGH,
                InterventionWindow.IMMEDIATE,
                priority=7
            )
        
        return None

    def _calculate_hours_since_onset(self, onset_time: str) -> Optional[float]:
        """Calculate hours since onset. Accepts ISO format or hours as float"""
        try:
            # Try parsing as float (hours)
            return float(onset_time)
        except ValueError:
            try:
                # Try parsing as ISO datetime
                onset = datetime.fromisoformat(onset_time.replace('Z', '+00:00'))
                now = datetime.now(onset.tzinfo) if onset.tzinfo else datetime.now()
                delta = now - onset
                return delta.total_seconds() / 3600
            except:
                return None


# Singleton instance
engine = EmergencyProtocolEngine()


def detect_emergency_protocols(patient_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Main entry point for protocol detection"""
    return engine.detect_protocols(patient_data)
