from http.server import BaseHTTPRequestHandler
import json
import os
import requests
import base64

# Configuration
API_URL = "https://voice.ap-southeast-1.bytepluses.com/api/v3/tts/unidirectional"
APP_ID = os.environ.get("BYTEPLUS_APP_ID")
ACCESS_TOKEN = os.environ.get("BYTEPLUS_ACCESS_TOKEN")
RESOURCE_ID = os.environ.get("BYTEPLUS_RESOURCE_ID")

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "ok", "message": "TTS API is ready. Use POST to generate audio."}).encode('utf-8'))

    def do_POST(self):
        # Check environment variables
        if not APP_ID or not ACCESS_TOKEN or not RESOURCE_ID:
            self.send_error(500, "Missing Environment Variables (APP_ID, ACCESS_TOKEN, RESOURCE_ID)")
            return

        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_error(400, "Missing Content-Length")
                return
            
            post_data = self.rfile.read(content_length)
        except Exception as e:
            self.send_error(400, f"Invalid Request: {e}")
            return
        
        try:
            request_data = json.loads(post_data.decode('utf-8'))
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            return

        text = request_data.get("text")
        voice_id = request_data.get("voice_id", "zh_female_cancan_mars_bigtts")
        speed = request_data.get("speed", 1.0)
        pitch = request_data.get("pitch", 1.0)
        language = request_data.get("language", "zh")
        
        if not text:
            self.send_error(400, "Missing 'text' field")
            return

        # Prepare headers for BytePlus API
        headers = {
            "X-Api-App-Id": APP_ID,
            "X-Api-Access-Key": ACCESS_TOKEN,
            "X-Api-Resource-Id": RESOURCE_ID,
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
        explicit_lang = lang_mapping.get(language, "zh")

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

        payload = {
            "user": {"uid": "12345"}, # Arbitrary UID
            "req_params": {
                "text": text,
                "speaker": voice_id,
                "additions": json.dumps(additions),
                "audio_params": {
                    "format": "mp3",
                    "sample_rate": 24000,
                    "speech_rate": int((speed - 1.0) * 100), # Convert 0.5-2.0 to -50 to 100
                    "pitch_rate": int((pitch - 1.0) * 100)   # Convert 0.5-2.0 to -50 to 100
                }
            }
        }

        try:
            # Stream response to client
            self.send_response(200)
            self.send_header('Content-Type', 'audio/mpeg')
            self.send_header('Transfer-Encoding', 'chunked')
            self.end_headers()

            session = requests.Session()
            response = session.post(API_URL, headers=headers, json=payload, stream=True)

            for chunk in response.iter_lines(decode_unicode=True):
                if not chunk:
                    continue
                
                try:
                    data = json.loads(chunk)
                    
                    if data.get("code", 0) == 0 and "data" in data and data["data"]:
                        # Decode base64 audio chunk
                        audio_chunk = base64.b64decode(data["data"])
                        
                        # Write chunk length (hex) + CRLF
                        self.wfile.write(f"{len(audio_chunk):X}\r\n".encode('utf-8'))
                        # Write chunk data + CRLF
                        self.wfile.write(audio_chunk)
                        self.wfile.write(b"\r\n")
                        
                    elif data.get("code", 0) == 20000000:
                        # Success / End of Stream
                        break
                    elif data.get("code", 0) > 0:
                        print(f"Error from BytePlus: {data}")
                        # We might want to send an error, but we've already started the 200 stream.
                        # Logging is the best we can do here without breaking the stream protocol mid-way.

                except json.JSONDecodeError:
                    print(f"Failed to parse chunk: {chunk}")
                    continue

            # End of stream (0 chunk)
            self.wfile.write(b"0\r\n\r\n")
            session.close()

        except Exception as e:
            print(f"Error during proxy: {e}")
            # If headers haven't been sent yet, send 500
            try:
                self.send_error(500, f"Internal Server Error: {str(e)}")
            except:
                # Headers might have been sent already
                pass
