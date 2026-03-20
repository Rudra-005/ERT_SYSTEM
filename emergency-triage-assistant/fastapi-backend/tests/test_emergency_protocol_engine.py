"""
Unit tests for Emergency Protocol Detection Engine
Tests all 8 protocol triggers and multi-protocol priority ordering
"""
import pytest
from app.emergency_protocol_engine import EmergencyProtocolEngine, detect_emergency_protocols


class TestCardiacArrestProtocol:
    def test_low_pulse_triggers_cardiac_arrest(self):
        data = {"vitals": {"pulse_rate": 25}}
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 1
        assert protocols[0]["protocol_name"] == "Cardiac Arrest Protocol"
        assert "25 bpm" in protocols[0]["trigger_reason"]
        assert protocols[0]["severity"] == "CRITICAL"
        assert protocols[0]["intervention_window"] == "0-5 minutes"

    def test_high_pulse_low_spo2_triggers_cardiac_arrest(self):
        data = {"vitals": {"pulse_rate": 185, "spo2": 82}}
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 1
        assert protocols[0]["protocol_name"] == "Cardiac Arrest Protocol"
        assert "185 bpm" in protocols[0]["trigger_reason"]
        assert "82%" in protocols[0]["trigger_reason"]

    def test_high_pulse_normal_spo2_no_trigger(self):
        data = {"vitals": {"pulse_rate": 185, "spo2": 95}}
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 0


class TestStrokeProtocol:
    def test_low_gcs_triggers_stroke(self):
        data = {"vitals": {"gcs_score": 8}}
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 1
        assert protocols[0]["protocol_name"] == "Stroke Protocol"
        assert "GCS score 8" in protocols[0]["trigger_reason"]

    def test_stroke_symptoms_within_window(self):
        data = {
            "vitals": {},
            "symptoms": ["confusion", "slurred speech"],
            "onset_time": "3.0"
        }
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 1
        assert protocols[0]["protocol_name"] == "Stroke Protocol"
        assert "3.0 hours" in protocols[0]["trigger_reason"]

    def test_stroke_symptoms_outside_window(self):
        data = {
            "vitals": {},
            "symptoms": ["confusion", "slurred speech"],
            "onset_time": "5.0"
        }
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 0

    def test_single_stroke_symptom_no_trigger(self):
        data = {
            "vitals": {},
            "symptoms": ["confusion"],
            "onset_time": "2.0"
        }
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 0


class TestAnaphylaxisProtocol:
    def test_allergy_with_respiratory_symptoms(self):
        data = {
            "vitals": {},
            "allergies": ["penicillin"],
            "symptoms": ["wheezing", "difficulty breathing"],
            "medications": ["amoxicillin"],
            "onset_time": "0.5"
        }
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 1
        assert protocols[0]["protocol_name"] == "Anaphylaxis Protocol"
        assert "30 minutes" in protocols[0]["trigger_reason"]

    def test_no_allergies_no_trigger(self):
        data = {
            "vitals": {},
            "allergies": [],
            "symptoms": ["wheezing"],
            "onset_time": "0.5"
        }
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 0

    def test_allergy_symptoms_outside_window(self):
        data = {
            "vitals": {},
            "allergies": ["penicillin"],
            "symptoms": ["wheezing"],
            "onset_time": "2.0"
        }
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 0


class TestHypertensiveCrisisProtocol:
    def test_high_systolic_triggers_hypertensive_crisis(self):
        data = {"vitals": {"systolic_bp": 195}}
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 1
        assert protocols[0]["protocol_name"] == "Hypertensive Crisis Protocol"
        assert "195 mmHg" in protocols[0]["trigger_reason"]

    def test_high_diastolic_triggers_hypertensive_crisis(self):
        data = {"vitals": {"diastolic_bp": 125}}
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 1
        assert protocols[0]["protocol_name"] == "Hypertensive Crisis Protocol"
        assert "125 mmHg" in protocols[0]["trigger_reason"]

    def test_borderline_bp_no_trigger(self):
        data = {"vitals": {"systolic_bp": 180, "diastolic_bp": 120}}
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 0


class TestRespiratoryFailureProtocol:
    def test_low_spo2_triggers_respiratory_failure(self):
        data = {"vitals": {"spo2": 85}}
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 1
        assert protocols[0]["protocol_name"] == "Respiratory Failure Protocol"
        assert "85%" in protocols[0]["trigger_reason"]

    def test_high_respiratory_rate_triggers(self):
        data = {"vitals": {"respiratory_rate": 35}}
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 1
        assert protocols[0]["protocol_name"] == "Respiratory Failure Protocol"
        assert "35 breaths/min" in protocols[0]["trigger_reason"]

    def test_low_respiratory_rate_triggers(self):
        data = {"vitals": {"respiratory_rate": 6}}
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 1
        assert protocols[0]["protocol_name"] == "Respiratory Failure Protocol"
        assert "6 breaths/min" in protocols[0]["trigger_reason"]


class TestSepsisProtocol:
    def test_sepsis_criteria_met(self):
        data = {
            "vitals": {
                "temperature": 103.0,
                "pulse_rate": 110,
                "respiratory_rate": 25
            }
        }
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 1
        assert protocols[0]["protocol_name"] == "Sepsis Protocol"
        assert "103.0°F" in protocols[0]["trigger_reason"]
        assert protocols[0]["intervention_window"] == "5-15 minutes"

    def test_hypothermia_sepsis(self):
        data = {
            "vitals": {
                "temperature": 96.0,
                "pulse_rate": 105,
                "respiratory_rate": 22
            }
        }
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 1
        assert protocols[0]["protocol_name"] == "Sepsis Protocol"

    def test_incomplete_sepsis_criteria(self):
        data = {
            "vitals": {
                "temperature": 103.0,
                "pulse_rate": 95,
                "respiratory_rate": 25
            }
        }
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 0


class TestTraumaProtocol:
    def test_trauma_with_high_pain(self):
        data = {
            "vitals": {},
            "clinical_notes": "Patient fell from ladder, complaining of severe pain",
            "pain_scale": 9
        }
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 1
        assert protocols[0]["protocol_name"] == "Trauma Protocol"
        assert "pain scale 9" in protocols[0]["trigger_reason"]

    def test_trauma_keyword_variations(self):
        keywords = ["accident", "stabbed", "impact", "trauma"]
        for keyword in keywords:
            data = {
                "vitals": {},
                "clinical_notes": f"Patient involved in {keyword}",
                "pain_scale": 8
            }
            protocols = detect_emergency_protocols(data)
            assert len(protocols) == 1
            assert protocols[0]["protocol_name"] == "Trauma Protocol"

    def test_trauma_low_pain_no_trigger(self):
        data = {
            "vitals": {},
            "clinical_notes": "Patient fell from chair",
            "pain_scale": 5
        }
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 0


class TestMultiProtocolPriority:
    def test_cardiac_arrest_highest_priority(self):
        data = {
            "vitals": {
                "pulse_rate": 25,
                "spo2": 85,
                "systolic_bp": 190,
                "respiratory_rate": 35
            }
        }
        protocols = detect_emergency_protocols(data)
        assert len(protocols) == 3
        assert protocols[0]["protocol_name"] == "Cardiac Arrest Protocol"
        assert protocols[1]["protocol_name"] == "Hypertensive Crisis Protocol"
        assert protocols[2]["protocol_name"] == "Respiratory Failure Protocol"

    def test_multiple_protocols_correct_order(self):
        data = {
            "vitals": {
                "gcs_score": 8,
                "systolic_bp": 195,
                "spo2": 88,
                "temperature": 103.0,
                "pulse_rate": 110,
                "respiratory_rate": 25
            },
            "clinical_notes": "Patient fell and hit head",
            "pain_scale": 9
        }
        protocols = detect_emergency_protocols(data)
        assert len(protocols) >= 4
        protocol_names = [p["protocol_name"] for p in protocols]
        stroke_idx = protocol_names.index("Stroke Protocol")
        hypertensive_idx = protocol_names.index("Hypertensive Crisis Protocol")
        respiratory_idx = protocol_names.index("Respiratory Failure Protocol")
        sepsis_idx = protocol_names.index("Sepsis Protocol")
        trauma_idx = protocol_names.index("Trauma Protocol")
        
        assert stroke_idx < hypertensive_idx < respiratory_idx < sepsis_idx < trauma_idx

    def test_all_protocols_simultaneously(self):
        data = {
            "vitals": {
                "pulse_rate": 25,
                "gcs_score": 8,
                "systolic_bp": 195,
                "spo2": 85,
                "temperature": 103.0,
                "respiratory_rate": 35
            },
            "allergies": ["penicillin"],
            "symptoms": ["wheezing", "confusion", "slurred speech"],
            "medications": ["amoxicillin"],
            "onset_time": "0.5",
            "clinical_notes": "Patient involved in car accident",
            "pain_scale": 9
        }
        protocols = detect_emergency_protocols(data)
        assert len(protocols) >= 6
        assert protocols[0]["protocol_name"] == "Cardiac Arrest Protocol"


class TestPerformance:
    def test_detection_speed(self):
        import time
        data = {
            "vitals": {
                "pulse_rate": 75,
                "spo2": 98,
                "systolic_bp": 120,
                "diastolic_bp": 80,
                "temperature": 98.6,
                "respiratory_rate": 16,
                "gcs_score": 15
            },
            "allergies": [],
            "symptoms": [],
            "medications": [],
            "clinical_notes": "Regular checkup",
            "pain_scale": 0
        }
        
        start = time.time()
        for _ in range(100):
            detect_emergency_protocols(data)
        elapsed = time.time() - start
        
        avg_time_ms = (elapsed / 100) * 1000
        assert avg_time_ms < 50, f"Average detection time {avg_time_ms:.2f}ms exceeds 50ms threshold"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
