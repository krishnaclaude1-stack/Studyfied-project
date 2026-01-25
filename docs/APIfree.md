Nano Banana PRO
google/nano-banana-pro

Nano Banana Pro is a professional AI image generation model that delivers 4K HD output, supports multi-language text rendering and 14 reference image blending, with precise creative controls.

1. Authentication
The API uses API Key authentication. Set your API key as an environment variable or include it in the request header.

Get API Key

Get an existing API key or create a new one from the API Keys management page

Setup API Key:

export API_KEY="YOUR_API_KEY"

Authorization Header:

All requests must include the API key in the Authorization header:

Authorization: Bearer YOUR_API_KEY

2. Quick Start
This is an asynchronous API. The workflow consists of two steps:

Submit a request → receive request_id
Get result using the request_id
Complete Example:

Step 1: Submit request
curl -X POST "https://api.apifree.ai/v1/image/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d @- <<'JSON'
{
  "aspect_ratio": "1:1",
  "model": "google/nano-banana-pro",
  "prompt": "A close-up photo of a rustic wooden chalkboard standing on a table in a cozy coffee shop. Written on the board in elegant white chalk text are the words: Hello API Free. Next to the board is a latte with intricate foam art and a freshly baked croissant. Soft morning sunlight, depth of field, photorealistic.",
  "resolution": "1K"
}
JSON

# Response: {"resp_data": {"request_id": "abc123"}}

Step 2: Get result (use the request_id from step 1)
curl -X GET "https://api.apifree.ai/v1/image/{request_id}/result" \
  -H "Authorization: Bearer $API_KEY"

Python Script Example:

This script submits the request, polls for completion, and downloads the result automatically.

import json
import time
import requests

# Configuration
API_KEY = "YOUR_API_KEY"
BASE_URL = "https://api.apifree.ai"

def call_apifree():
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    # 1. Submit Request
    payload = json.loads('''
{
  "aspect_ratio": "1:1",
  "model": "google/nano-banana-pro",
  "prompt": "A close-up photo of a rustic wooden chalkboard standing on a table in a cozy coffee shop. Written on the board in elegant white chalk text are the words: Hello API Free. Next to the board is a latte with intricate foam art and a freshly baked croissant. Soft morning sunlight, depth of field, photorealistic.",
  "resolution": "1K"
}
''')

    print("Submitting request...")
    resp = requests.post(f"{BASE_URL}/v1/image/submit", headers=headers, json=payload)
    if resp.status_code != 200:
        print(f"Submission failed: {resp.text}")
        return

    data = resp.json()
    if data.get("code") != 200:
        print(f"API Error: {data.get('error')}")
        return

    request_id = data["resp_data"]["request_id"]
    print(f"Task submitted. Request ID: {request_id}")

    # 2. Poll for Result
    while True:
        time.sleep(2) # Wait 2 seconds between checks
        
        check_url = f"{BASE_URL}/v1/image/{request_id}/result"
        print(f"Checking status...")
        
        check_resp = requests.get(check_url, headers=headers)
        check_data = check_resp.json()
        
        if check_data.get("code") != 200:
            print(f"Check failed: {check_data.get('code_msg')}")
            break
            
        status = check_data["resp_data"]["status"]
        
        if status == "success":
            print("Generation completed!")
            # 3. Download Images
            for i, img_url in enumerate(check_data["resp_data"]["image_list"]):
                print(f"Downloading image {i+1}...")
                img_content = requests.get(img_url).content
                filename = f"result_{request_id}_{i+1}.png"
                with open(filename, "wb") as f:
                    f.write(img_content)
                print(f"Saved: {filename}")
            break
            
        elif status == "error" or status == "failed":
            print(f"Task failed: {check_data['resp_data'].get('error')}")
            break
            
        print(f"Status: {status}. Waiting...")

if __name__ == "__main__":
    call_apifree()

⚠️ Important: Save the request_id from the submit response. You need it to retrieve the result.

3. API Endpoints
3.1 Submit Request
Submit an image generation request to the queue.

Endpoint: POST /v1/image/submit

Headers:

Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
Request Body:

{
  "aspect_ratio": "1:1",
  "model": "google/nano-banana-pro",
  "prompt": "A close-up photo of a rustic wooden chalkboard standing on a table in a cozy coffee shop. Written on the board in elegant white chalk text are the words: Hello API Free. Next to the board is a latte with intricate foam art and a freshly baked croissant. Soft morning sunlight, depth of field, photorealistic.",
  "resolution": "1K"
}

Example:

curl -X POST "https://api.apifree.ai/v1/image/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d @- <<'JSON'
{
  "aspect_ratio": "1:1",
  "model": "google/nano-banana-pro",
  "prompt": "A close-up photo of a rustic wooden chalkboard standing on a table in a cozy coffee shop. Written on the board in elegant white chalk text are the words: Hello API Free. Next to the board is a latte with intricate foam art and a freshly baked croissant. Soft morning sunlight, depth of field, photorealistic.",
  "resolution": "1K"
}
JSON

Response:

{
    "code": 200,
    "code_msg": "Success",
    "trace_id": "89f94f9f335ceac6",
    "resp_data": {
        "request_id": "{request_id}",
        "time": null
    }
}

3.2 Get Result
Retrieve the generated image using the request_id from the submit response.

Endpoint: GET /v1/image/{request_id}/result

Headers:

Authorization: Bearer YOUR_API_KEY
Path Parameters:

request_id (string, required): The request ID returned from the submit endpoint
Example:

curl -X GET "https://api.apifree.ai/v1/image/{request_id}/result" \
  -H "Authorization: Bearer $API_KEY"

Response:

{
    "code": 200,
    "code_msg": "Success",
    "trace_id": "...",
    "resp_data": {
        "request_id": "{request_id}",
        "status": "success",
        "image_list": [
            "https://example.com/image.png"
        ],
        "usage": {
            "cost": 0.024
        }
    }
}

Response Fields:

request_id: The request identifier
status: Request status (processing, success, error)
image_list: Array of generated images with URLs and dimensions
usage: Cost information
error: Error message (if any)
4. Schema
Input
prompt
Type: string | Required: ✓

The text prompt to generate an image from.

Constraints:

Min Length: 1
Default value: "A close-up photo of a rustic wooden chalkboard standing on a table in a cozy coffee shop. Written on the board in elegant white chalk text are the words: Hello API Free. Next to the board is a latte with intricate foam art and a freshly baked croissant. Soft morning sunlight, depth of field, photorealistic."

aspect_ratio
Type: string

The aspect ratio of the generated image. Default value: "1:1"

Constraints:

Enum: [1:1 2:3 3:2 3:4 4:3 4:5 5:4 9:16 16:9 21:9]
Default value: "1:1"

Possible values: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9

resolution
Type: string

Resolution of the generated image.

Constraints:

Enum: [1K 2K 4K]
Default value: "1K"

Possible values: 1K, 2K, 4K

cache_key
Type: string

A user-defined identifier for cached content. Requests with the same key may reuse cached context and be billed at cache pricing. To prevent collisions, we recommend using a UUID or a clearly versioned key.

Default value: ""

Example input:

{
  "aspect_ratio": "1:1",
  "cache_key": "",
  "prompt": "A close-up photo of a rustic wooden chalkboard standing on a table in a cozy coffee shop. Written on the board in elegant white chalk text are the words: Hello API Free. Next to the board is a latte with intricate foam art and a freshly baked croissant. Soft morning sunlight, depth of field, photorealistic.",
  "resolution": "1K"
}

Output
The API returns a standard response format:

Response Structure:

code
Type: integer | Required: ✓

HTTP status code. 200 indicates success.

code_msg
Type: string | Required: ✓

Status message. Returns error description when an error occurs.

trace_id
Type: string | Required: ✓

Unique trace ID for debugging and support purposes.

resp_data
Type: object | Required: ✓

The actual response data containing request results.

Properties:

request_id (string): The request identifier
status (string): Request status - queuing, processing, completed, or failed
image_list (array): List of generated image URLs
usage (object): Usage and cost information
cost (float): Cost for this request
error (string, optional): Error message if the request failed
Example Response:

{
    "code": 200,
    "code_msg": "Success",
    "trace_id": "89f94f9f335ceac6",
    "resp_data": {
        "request_id": "abc123",
        "status": "success",
        "image_list": [
            "https://example.com/image.png"
        ],
        "usage": {
            "cost": 0.024
        }
    }
}