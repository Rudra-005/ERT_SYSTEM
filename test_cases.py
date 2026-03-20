from triage_system import EmergencyTriageAI

# Test cases showing diverse outputs
test_cases = [
    {
        "name": "Cardiac Emergency",
        "data": {
            "age": 65,
            "gender": "Male",
            "symptoms": "Chest pain, sweating, shortness of breath",
            "heart_rate": 110,
            "blood_pressure": "90/60",
            "temperature": "37.2°C",
            "oxygen_saturation": "94%",
            "history": "Hypertension, smoker",
            "duration": "30 minutes"
        }
    },
    {
        "name": "Respiratory Infection",
        "data": {
            "age": 42,
            "gender": "Female",
            "symptoms": "Fever, productive cough, difficulty breathing",
            "heart_rate": 95,
            "blood_pressure": "125/80",
            "temperature": "39.1°C",
            "oxygen_saturation": "91%",
            "history": "Asthma",
            "duration": "3 days"
        }
    },
    {
        "name": "Head Trauma",
        "data": {
            "age": 28,
            "gender": "Male",
            "symptoms": "Head injury from fall, confusion, vomiting",
            "heart_rate": 88,
            "blood_pressure": "140/90",
            "temperature": "37.0°C",
            "oxygen_saturation": "98%",
            "history": "None",
            "duration": "1 hour"
        }
    },
    {
        "name": "Abdominal Pain",
        "data": {
            "age": 35,
            "gender": "Female",
            "symptoms": "Severe right lower quadrant pain, nausea",
            "heart_rate": 102,
            "blood_pressure": "118/75",
            "temperature": "38.3°C",
            "oxygen_saturation": "99%",
            "history": "None",
            "duration": "6 hours"
        }
    },
    {
        "name": "Pediatric Allergic Reaction",
        "data": {
            "age": 8,
            "gender": "Female",
            "symptoms": "Facial swelling, hives, throat tightness after eating peanuts",
            "heart_rate": 125,
            "blood_pressure": "85/55",
            "temperature": "37.1°C",
            "oxygen_saturation": "96%",
            "history": "Known peanut allergy",
            "duration": "15 minutes"
        }
    }
]

# Expected diverse outputs (examples)
expected_behaviors = {
    "Cardiac Emergency": {
        "immediateAction": "ECG, cardiac enzymes, aspirin, oxygen, IV access",
        "riskLevel": "Critical",
        "differentialDiagnosis": ["Acute MI", "Unstable angina", "Aortic dissection"]
    },
    "Respiratory Infection": {
        "immediateAction": "Chest X-ray, oxygen therapy, blood cultures, antibiotics",
        "riskLevel": "High",
        "differentialDiagnosis": ["Pneumonia", "Acute asthma exacerbation", "Bronchitis"]
    },
    "Head Trauma": {
        "immediateAction": "CT head, cervical spine precautions, neurological monitoring",
        "riskLevel": "High",
        "differentialDiagnosis": ["Concussion", "Intracranial hemorrhage", "Skull fracture"]
    },
    "Abdominal Pain": {
        "immediateAction": "CBC, abdominal ultrasound, surgical consult",
        "riskLevel": "High",
        "differentialDiagnosis": ["Appendicitis", "Ovarian torsion", "Ectopic pregnancy"]
    },
    "Pediatric Allergic Reaction": {
        "immediateAction": "Epinephrine IM, antihistamines, airway monitoring",
        "riskLevel": "Critical",
        "differentialDiagnosis": ["Anaphylaxis", "Severe allergic reaction"]
    }
}
