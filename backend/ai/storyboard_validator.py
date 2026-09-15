import uuid
from typing import Dict, Any

SUPPORTED_SCENE_TYPES = {'concept', 'circuit', 'bloch', 'simulation', 'state', 'comparison', 'quiz', 'summary'}
SUPPORTED_GATES = {'H', 'X', 'Y', 'Z', 'S', 'T', 'CNOT', 'CX', 'SWAP', 'CCNOT', 'CCX', 'TOFFOLI'}

def validate_storyboard(storyboard: Dict) -> tuple[bool, Dict, list[str]]:
    errors = []
    
    if not isinstance(storyboard.get("scenes"), list):
        errors.append("Scenes must be a list")
        return False, storyboard, errors
        
    if len(storyboard.get("scenes", [])) < 3:
        errors.append("Must have at least 3 scenes")
    
    cleaned_storyboard = dict(storyboard)
    cleaned_scenes = []
    
    for i, scene in enumerate(storyboard.get("scenes", [])):
        if not isinstance(scene, dict):
            errors.append(f"Scene {i+1} is not a dict")
            continue
            
        c_scene = dict(scene)
        
        if "id" not in c_scene:
            c_scene["id"] = f"scene-{i+1}"
            
        if "title" not in c_scene:
            errors.append(f"Scene {c_scene['id']} missing title")
            
        if "narration" not in c_scene:
            if c_scene.get("type") != "quiz":
                errors.append(f"Scene {c_scene['id']} missing narration")
            
        scene_type = c_scene.get("type")
        if scene_type not in SUPPORTED_SCENE_TYPES:
            c_scene["type"] = "concept"
            # warning would be logged here
            
        if c_scene["type"] == 'circuit' and "circuit" in c_scene:
            circuit = c_scene["circuit"]
            qubits = circuit.get("qubits", 0)
            valid_ops = []
            for op in circuit.get("operations", []):
                gate = str(op.get("gate", "")).upper()
                qubit_idx = op.get("qubit", -1)
                
                valid = True
                if gate not in SUPPORTED_GATES:
                    valid = False
                    errors.append(f"Invalid gate '{gate}' removed from {c_scene['id']}")
                if qubit_idx < 0 or qubit_idx >= qubits:
                    valid = False
                    errors.append(f"Invalid qubit index {qubit_idx} in {c_scene['id']}")
                    
                if gate in ("CNOT", "CX", "SWAP"):
                    control = op.get("control", -1)
                    target = op.get("target", -1)
                    if control < 0 or control >= qubits or target < 0 or target >= qubits:
                        valid = False
                        errors.append(f"Invalid control/target in {gate} in {c_scene['id']}")
                        
                if valid:
                    valid_ops.append(op)
            c_scene["circuit"]["operations"] = valid_ops
            
        if c_scene["type"] == 'simulation' and "simulationData" in c_scene:
            sim_data = c_scene["simulationData"]
            probs = sim_data.get("probabilities", {})
            total_prob = sum(probs.values())
            if abs(total_prob - 1.0) > 0.1:
                pass # just a check
                
        if c_scene["type"] == 'quiz':
            if "question" not in c_scene:
                errors.append(f"Quiz scene {c_scene['id']} missing question")
            options = c_scene.get("options", [])
            if not isinstance(options, list) or len(options) < 2:
                errors.append(f"Quiz scene {c_scene['id']} options invalid")
            correct_idx = c_scene.get("correctIndex")
            if not isinstance(correct_idx, int) or correct_idx < 0 or correct_idx >= len(options):
                errors.append(f"Quiz scene {c_scene['id']} correctIndex invalid")
                
        cleaned_scenes.append(c_scene)
        
    cleaned_storyboard["scenes"] = cleaned_scenes
    
    if len(errors) > 5:
        return False, storyboard, errors
        
    return True, cleaned_storyboard, errors
