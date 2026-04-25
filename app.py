import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from google import genai
import requests
import base64
from dotenv import load_dotenv

load_dotenv()

# Serve files from the SAME folder as app.py
root_dir = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)
CORS(app)

@app.route("/")
def serve_index():
    return send_from_directory(root_dir, "index.html")

@app.route("/<path:path>")
def serve_static(path):
    # If the path is an API route, don't serve it as a file
    if path in ["search-destination", "generate-audio-guide"]:
        return None
    return send_from_directory(root_dir, path)

@app.route("/search-destination", methods=["POST"])
def search_destination():
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    query = request.json.get("query")
    try:
        prompt = f"Provide JSON for destination '{query}': name, summary, imageUrl (loremflickr format), isPlace (bool). Respond ONLY JSON."
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt, config={"response_mime_type": "application/json"})
        import json
        return jsonify(json.loads(response.text))
    except Exception:
        return jsonify({"name": query, "summary": "Explore this place.", "imageUrl": f"https://loremflickr.com/800/600/{query}", "isPlace": True})

@app.route("/generate-audio-guide", methods=["POST"])
def generate_audio_guide():
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    data = request.json
    try:
        prompt = f"You are a professional tourist guide. Provide a {data['answerType']} guide for {data['place']} in {data['language']}. Respond ONLY in {data['language']}."
        desc_response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        text_description = desc_response.text

        url = "https://global.api.murf.ai/v1/speech/stream"
        headers = {"api-key": os.getenv("MURF_API_KEY"), "Content-Type": "application/json"}
        payload = {
            "voiceId": data["voiceId"],
            "text": text_description,
            "locale": data["locale"],
            "modelId": "FALCON",
            "format": "MP3",
            "sampleRate": 24000,
            "channelType": "MONO"
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        if response.status_code == 200:
            encoded_audio = base64.b64encode(response.content).decode("utf-8")
            return {"description": text_description, "audioBase64": encoded_audio}
        return jsonify({"error": f"Murf Error {response.status_code}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
