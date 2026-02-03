import requests
import json
import base64
import os

# python Version：==3.11

# -------------customer needs to fill in the parameters----------------
appID = ""
accessKey = ""
resourceID = ""
text = "This is a test text used to test the effect of ByteDance's large model speech synthesis HTTP unidirectional streaming interface"
# ---------------request url----------------------
url = "https://voice.ap-southeast-1.bytepluses.com/api/v3/tts/unidirectional"

def tts_http_stream():
    headers = {
        "X-Api-App-Id": appID,
        "X-Api-Access-Key": accessKey,
        "X-Api-Resource-Id": resourceID,
        "X-Api-App-Key": "aGjiRDfUWi",
        "Content-Type": "application/json",
        "Connection": "keep-alive"
    }

    additions = {
        "disable_markdown_filter": True,
        "enable_language_detector": True,
        "enable_latex_tn": True,
        "disable_default_bit_rate": True,
        "max_length_to_filter_parenthesis": 0,
        "cache_config": {
            "text_type": 1,
            "use_cache": True
        }
    }

    additions_json = json.dumps(additions)

    payload = {
        "user": {"uid": "12345"},
        "req_params": {
            "text": text,
            "speaker": "zh_female_cancan_mars_bigtts",
            "additions": additions_json,
            "audio_params": {
                "format": "mp3",
                "sample_rate": 24000
            }
        }
    }
    session = requests.Session()
    response = None
    try:
        response = session.post(url, headers=headers, json=payload, stream=True)
        # print response headers
        # print(f"code: {response.status_code} header: {response.headers}")

        # used to save audio data
        audio_data = bytearray()
        total_audio_size = 0
        for chunk in response.iter_lines(decode_unicode=True):
            if not chunk:
                continue
            data = json.loads(chunk)
            print(f"json data:{data}")
            if data.get("code", 0) == 0 and "data" in data and data["data"]:
                chunk_audio = base64.b64decode(data["data"])
                audio_size = len(chunk_audio)
                total_audio_size += audio_size
                audio_data.extend(chunk_audio)
            if data.get("code", 0) == 20000000:
                break
            if data.get("code", 0) > 0:
                print(f"error response:{data}")
                break

        # save audio data to local file
        if audio_data:
            if not os.path.exists("tts"):
                os.makedirs("tts")
            output_file = os.path.join("tts/", f"tts_test.mp3")
            with open(output_file, "wb") as f:
                f.write(audio_data)
            print(f"file size: {len(audio_data) / 1024:.2f} KB")
            # ensure that the generated audio file has the correct access permissions
            os.chmod(output_file, 0o644)

    except Exception as e:
        print(f"request error: {e}")
    finally:
        if response:
            response.close()
        session.close()


if __name__ == "__main__":
    tts_http_stream()
