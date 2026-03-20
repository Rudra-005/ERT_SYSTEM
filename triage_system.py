import json
import random
from typing import Dict, List

class EmergencyTriageAI:
    SYSTEM_PROMPT = """You are an experienced emergency room doctor.

Analyze each patient independently based ONLY on the provided data.

Rules:
* NEVER reuse previous outputs
* NEVER give generic responses like 'clinical evaluation needed'
* ALWAYS provide specific diagnosis possibilities
* ALWAYS vary recommendations based on symptoms
* ALWAYS justify decisions with patient data

Output Format (STRICT JSON):
{
"immediateAction": "...specific action...",
"differentialDiagnosis": ["...", "..."],
"riskLevel": "Low | Medium | High | Critical",
"confidence": number (50-100),
"summary": "...case-specific summary...",
"supportingEvidence": "...based on symptoms..."
}"""

    def __init__(self, llm_client, temperature=0.8, top_p=0.9):
        self.llm_client = llm_client
        self.temperature = temperature
        self.top_p = top_p
        self.previous_outputs = []

    def triage_patient(self, patient_data: Dict) -> Dict:
        prompt = self._build_patient_prompt(patient_data)
        
        for attempt in range(3):
            response = self._call_llm(prompt)
            
            if self._is_valid_response(response):
                return response
            
            prompt += f"\n\nREGENERATE: Previous response was too generic. Be MORE SPECIFIC to this patient's symptoms."
        
        raise ValueError("Failed to generate valid triage response")

    def _build_patient_prompt(self, data: Dict) -> str:
        return f"""Patient Case:
- Age: {data.get('age', 'Unknown')}
- Gender: {data.get('gender', 'Unknown')}
- Chief Complaint: {data.get('symptoms', 'Not specified')}
- Vital Signs: HR {data.get('heart_rate', 'N/A')}, BP {data.get('blood_pressure', 'N/A')}, Temp {data.get('temperature', 'N/A')}, SpO2 {data.get('oxygen_saturation', 'N/A')}
- Medical History: {data.get('history', 'None reported')}
- Duration: {data.get('duration', 'Unknown')}

Analyze this specific patient and provide your triage assessment."""

    def _call_llm(self, prompt: str) -> Dict:
        # Replace with actual LLM API call
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
        
        response = self.llm_client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=self.temperature,
            top_p=self.top_p,
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)

    def _is_valid_response(self, response: Dict) -> bool:
        generic_phrases = [
            "clinical evaluation needed",
            "manual bedside triage",
            "further assessment required",
            "consult physician",
            "standard protocol"
        ]
        
        response_text = json.dumps(response).lower()
        
        if any(phrase in response_text for phrase in generic_phrases):
            return False
        
        if not response.get('differentialDiagnosis') or len(response['differentialDiagnosis']) < 2:
            return False
        
        if response.get('confidence', 0) < 50:
            return False
        
        if response in self.previous_outputs:
            return False
        
        self.previous_outputs.append(response)
        return True


# Example Usage
if __name__ == "__main__":
    # Mock LLM client for demonstration
    class MockLLM:
        def __init__(self):
            self.chat = self
            self.completions = self
        
        def create(self, **kwargs):
            class Response:
                def __init__(self):
                    self.choices = [type('obj', (object,), {
                        'message': type('obj', (object,), {
                            'content': json.dumps({
                                "immediateAction": "ECG and cardiac enzyme panel stat",
                                "differentialDiagnosis": ["Acute myocardial infarction", "Unstable angina", "Aortic dissection"],
                                "riskLevel": "Critical",
                                "confidence": 85,
                                "summary": "65yo male presenting with classic cardiac symptoms requiring immediate intervention",
                                "supportingEvidence": "Chest pain with diaphoresis and hypotension (BP 90/60) are red flags for acute coronary syndrome"
                            })
                        })()
                    })()]
            return Response()
    
    triage_ai = EmergencyTriageAI(MockLLM())
    
    # Test Case 1: Cardiac Emergency
    patient1 = {
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
    
    result = triage_ai.triage_patient(patient1)
    print(json.dumps(result, indent=2))
