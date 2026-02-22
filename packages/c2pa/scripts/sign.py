import sys
import json
import c2pa
from pathlib import Path
import hashlib

# Certificate paths (0711 certs)
CERT_PATH = Path.home() / "0711" / "certs" / "c2pa_chain.pem"
KEY_PATH = Path.home() / "0711" / "certs" / "c2pa_leaf_key_pkcs8.pem"

def sign_image(input_path, output_path, metadata_path):
    try:
        # Load metadata
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        
        # Load cert and key
        with open(CERT_PATH, "rb") as f:
            cert = f.read()
        with open(KEY_PATH, "rb") as f:
            key = f.read()
        
        # Create signing callback
        def sign_callback(data):
            from cryptography.hazmat.primitives import hashes
            from cryptography.hazmat.primitives.asymmetric import ec
            from cryptography.hazmat.primitives.serialization import load_pem_private_key
            
            private_key = load_pem_private_key(key, password=None)
            signature = private_key.sign(data, ec.ECDSA(hashes.SHA256()))
            return signature
        
        # Create signer using callback (avoids TSA issues)
        signer = c2pa.Signer.from_callback(
            callback=sign_callback,
            alg=c2pa.C2paSigningAlg.ES256,
            certs=cert.decode("utf-8"),
            tsa_url=None
        )
        
        # Build manifest JSON
        manifest_json = {
            "claim_generator": "0711 Studio/1.0.0",
            "claim_generator_info": [{
                "name": "0711 Studio",
                "version": "1.0.0"
            }],
            "assertions": [
                {
                    "label": "c2pa.actions",
                    "data": {
                        "actions": [{
                            "action": "c2pa.created",
                            "digitalSourceType": "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia",
                            "softwareAgent": metadata.get("modelId", "unknown")
                        }]
                    }
                },
                {
                    "label": "stds.schema-org.CreativeWork",
                    "data": {
                        "@context": "https://schema.org",
                        "@type": "CreativeWork",
                        "author": [{
                            "@type": "Organization",
                            "name": "0711 Intelligence"
                        }]
                    }
                }
            ]
        }
        
        # Add 0711 compliance assertion if we have extra metadata
        if metadata.get("contentHash") or metadata.get("blockchainRef") or metadata.get("compliance"):
            prompt_hash = ""
            if metadata.get("prompt"):
                prompt_hash = hashlib.sha256(metadata["prompt"].encode()).hexdigest()[:16] + "..."
            
            manifest_json["assertions"].append({
                "label": "0711.compliance",
                "data": {
                    "version": "1.0",
                    "contentHash": metadata.get("contentHash"),
                    "promptHash": prompt_hash if prompt_hash else None,
                    "modelId": metadata.get("modelId"),
                    "blockchain": metadata.get("blockchainRef"),
                    "compliance": metadata.get("compliance")
                }
            })
        
        # Create builder and sign
        builder = c2pa.Builder(manifest_json)
        result = builder.sign_file(input_path, output_path, signer)
        
        print(json.dumps({"success": True, "manifestId": "signed", "manifestSize": len(result)}))
        
    except Exception as e:
        import traceback
        print(json.dumps({"success": False, "error": str(e), "trace": traceback.format_exc()}))

if __name__ == "__main__":
    sign_image(sys.argv[1], sys.argv[2], sys.argv[3])
