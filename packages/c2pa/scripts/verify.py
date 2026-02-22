import sys
import json
import c2pa

def verify_image(input_path):
    try:
        # Create reader from file path
        with c2pa.Reader(input_path) as reader:
            # Get manifest store JSON
            manifest_store = reader.json()
            store = json.loads(manifest_store) if isinstance(manifest_store, str) else manifest_store
            
            # Get active manifest
            active_label = store.get("active_manifest")
            manifests = store.get("manifests", {})
            manifest = manifests.get(active_label, {}) if active_label else {}
            
            assertions = []
            compliance = None
            ai_generated = False
            
            if manifest:
                for assertion in manifest.get("assertions", []):
                    label = assertion.get("label", "")
                    assertions.append(label)
                    
                    if label == "0711.compliance":
                        compliance = assertion.get("data")
                    
                    if label.startswith("c2pa.actions"):
                        data = assertion.get("data", {})
                        for action in data.get("actions", []):
                            if "trainedAlgorithmicMedia" in str(action.get("digitalSourceType", "")):
                                ai_generated = True
            
            result = {
                "success": True,
                "valid": True,
                "hasC2PA": True,
                "manifest": {
                    "claimGenerator": manifest.get("claim_generator", "unknown") if manifest else "unknown",
                    "title": manifest.get("title") if manifest else None,
                    "assertions": assertions
                },
                "compliance": compliance,
                "aiGenerated": ai_generated
            }
            
            print(json.dumps(result))
        
    except c2pa.C2paError as e:
        # Check if it's a "no manifest" error
        if "no manifest" in str(e).lower() or "not found" in str(e).lower():
            print(json.dumps({
                "success": True,
                "valid": False,
                "hasC2PA": False,
                "aiGenerated": False
            }))
        else:
            print(json.dumps({
                "success": False,
                "valid": False,
                "hasC2PA": False,
                "aiGenerated": False,
                "error": str(e)
            }))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "valid": False,
            "hasC2PA": False,
            "aiGenerated": False,
            "error": str(e)
        }))

if __name__ == "__main__":
    verify_image(sys.argv[1])
