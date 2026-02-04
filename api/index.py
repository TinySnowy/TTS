from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import requests
import base64
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env.local")

# Import voices
try:
    from .voices import VOICES
except ImportError:
    from voices import VOICES

app = FastAPI()

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
API_URL = "https://voice.ap-southeast-1.bytepluses.com/api/v3/tts/unidirectional"
APP_ID = os.environ.get("BYTEPLUS_APP_ID")
ACCESS_TOKEN = os.environ.get("BYTEPLUS_ACCESS_TOKEN")
RESOURCE_ID = os.environ.get("BYTEPLUS_RESOURCE_ID")

class TTSRequest(BaseModel):
    text: str
    voice_id: str = "zh_female_cancan_mars_bigtts"
    speed: float = 1.0
    pitch: float = 1.0
    loudness: float = 1.0
    emotion: Optional[str] = None
    emotion_intensity: float = 4.0
    language: str = "zh"
    app_id: str
    access_token: str
    resource_id: str

@app.get("/api/get_voices")
async def get_voices():
    return {"voices": VOICES}

@app.get("/api/tts")
async def tts_health():
    return {"status": "ok", "message": "TTS API is ready. Use POST to generate audio."}

@app.post("/api/tts")
async def tts(request: TTSRequest):
    # Prepare headers for BytePlus API
    headers = {
        "X-Api-App-Id": request.app_id,
        "X-Api-Access-Key": request.access_token,
        "X-Api-Resource-Id": request.resource_id,
        "X-Api-App-Key": "aGjiRDfUWi", # Fixed value from docs
        "Content-Type": "application/json",
        "Connection": "keep-alive"
    }

    # Map frontend language code to BytePlus explicit_language
    lang_mapping = {
        "zh": "zh",
        "en": "en",
        "ja": "ja",
        "es": "es-mx",
    }
    explicit_lang = lang_mapping.get(request.language, "zh")

    # Prepare payload
    additions = {
        "disable_markdown_filter": True,
        "enable_language_detector": True,
        "explicit_language": explicit_lang,
        "enable_latex_tn": True,
        "disable_default_bit_rate": True,
        "max_length_to_filter_parenthesis": 0,
        "cache_config": {
            "text_type": 1,
            "use_cache": True
        }
    }

    # Calculate pitch value for additions.post_process.pitch (range -12 to 12)
    # Mapping request.pitch (0.5 to 2.0) to (-12 to 12)
    if request.pitch < 1.0:
        pitch_val = int((request.pitch - 1.0) * 24)
    else:
        pitch_val = int((request.pitch - 1.0) * 12)
    
    # Clamp value to be safe
    pitch_val = max(-12, min(12, pitch_val))
    
    if pitch_val != 0:
        additions["post_process"] = {
            "pitch": pitch_val
        }

    payload = {
        "user": {"uid": "12345"}, # Arbitrary UID
        "req_params": {
            "text": request.text,
            "speaker": request.voice_id,
            "model": "seed-tts-1.1", # Use 1.1 model for better quality
            "additions": json.dumps(additions),
            "audio_params": {
                "format": "mp3",
                "sample_rate": 24000,
                "speech_rate": int((request.speed - 1.0) * 100), # Convert 0.5-2.0 to -50 to 100
                "loudness_rate": int((request.loudness - 1.0) * 100), # Convert 0.5-2.0 to -50 to 100
            }
        }
    }

    if request.emotion and request.emotion != "neutral":
        payload["req_params"]["audio_params"]["emotion"] = request.emotion
        payload["req_params"]["audio_params"]["emotion_scale"] = request.emotion_intensity

    # Debug: Print payload to verify parameters
    print(f"Sending Payload to BytePlus: {json.dumps(payload, ensure_ascii=False)}")

    def generate():
        session = requests.Session()
        try:
            response = session.post(API_URL, headers=headers, json=payload, stream=True)
            
            for chunk in response.iter_lines(decode_unicode=True):
                if not chunk:
                    continue
                
                try:
                    data = json.loads(chunk)
                    
                    if data.get("code", 0) == 0 and "data" in data and data["data"]:
                        # Decode base64 audio chunk
                        audio_chunk = base64.b64decode(data["data"])
                        yield audio_chunk
                        
                    elif data.get("code", 0) == 20000000:
                        # Success / End of Stream
                        break
                    elif data.get("code", 0) > 0:
                        print(f"Error from BytePlus: {data}")
                        # We can't raise HTTP exception inside generator easily, so we log
                        
                except json.JSONDecodeError:
                    continue
        except Exception as e:
            print(f"Error streaming TTS: {e}")
        finally:
            session.close()

    return StreamingResponse(generate(), media_type="audio/mpeg")
