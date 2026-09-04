# AI Prompts

The Patient Frontend includes an AI Chat feature (AI Chat + AI History screens, see FRONTEND_SCOPE.md), backed by real endpoints (`POST /api/ai/chat`, `GET/DELETE /api/ai/history*`, see `backend/FRONTEND_API_CONTRACTS.md`). The frontend sends the patient's message and renders whatever the backend returns (AI reply, emergency flag, department/doctor recommendations) — no client-side prompt engineering or prompt text lives in this repository. The backend owns the actual model prompts.

Client-side responsibilities only:
- Display the conversation, emergency flag, and any recommended department/doctors the backend returns.
- Never fabricate a reply locally or fall back to canned text if the backend call fails — surface a normal error state instead (see ERROR_HANDLING.md).
