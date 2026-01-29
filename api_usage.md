# OpenAI-Compatible API Usage Guide

This guide describes the OpenAI-compatible API shape used by this project when calling OpenAI-compatible endpoints (custom base URL).

## API Standard
The API follows the **OpenAI Chat Completions API standard**.

## Connection Details
- **Base URL**: `{your_base_url}/chat/completions` (base URL typically ends with `/v1`)
- **Authentication**: `Authorization: Bearer {api_key}`

## Request Examples

### 1. Gemini-3-Flash-Preview (Text Only)
Use this for general text-based queries.

**Endpoint**: `POST /v1/chat/completions`

**Body**:
```json
{
  "model": "gemini-3-flash-preview",
  "messages": [
    { "role": "user", "content": "What is the capital of France?" }
  ],
  "stream": false
}
```

### 2. Gemini-3-Pro-Image-Preview (Vision/Multimodal)
Use this model for tasks involving images. It supports the OpenAI content list format.

**Endpoint**: `POST /v1/chat/completions`

**Body**:
```json
{
  "model": "gemini-3-pro-image-preview",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "What is in this image?" },
        {
          "type": "image_url",
          "image_url": { 
            "url": "data:image/jpeg;base64,...(base64 encoded image strings)..." 
          }
        }
      ]
    }
  ]
}
```

## Response Format
The API returns a standard OpenAI-compatible response:

```json
{
  "id": "...",
  "object": "chat.completion",
  "created": 1769854945,
  "model": "gemini-3-flash",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Paris is the capital of France."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 7,
    "total_tokens": 17
  }
}
```

## Troubleshooting
- **Missing API key**: Ensure the `Authorization` header is present.
- **Connection refused**: Verify the base URL is reachable and ends with `/v1` (typical), and that your network allows outbound requests.
