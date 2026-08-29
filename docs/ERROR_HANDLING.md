# Error Handling — Patient Frontend

No custom exception hierarchy. TanStack Query's error state + a small set of typed error cases is sufficient.

| Case | Handling |
|---|---|
| API/network failure | TanStack Query retry (default) then surface a retry-able inline error state; no silent failure. |
| Auth expired (401 from any authenticated call) | Clear SecureStore token + query cache, redirect to Login. |
| Validation failure (Zod, before submit) | Inline field errors via React Hook Form; request is not sent. |
| Validation failure (backend 400, after submit) | Map `message` to a form-level or field-level error; do not show raw backend text if it's not user-appropriate. |
| GPS permission denied | Fall back to manual city search on Find Hospital; show a non-blocking notice, do not block the screen. |
| GPS unavailable/timeout | Same fallback as denied; distinguish only in logs, not in UI copy. |
| Manual location/city input invalid or no match | Empty-state message + suggestion to try a different city. |
| No search results (hospital/doctor/department) | Empty state, not an error state. |
| No available time slots for a doctor/date | Empty state on the slot picker; suggest another date. |
| Appointment slot no longer available (race on booking) | Backend returns 400 on `POST /api/appointments`; show "This slot was just taken" and refresh the slot list. |
| Image load failure (hospital logo/cover, profile picture) | `expo-image` fallback/placeholder, never a broken-image icon. |
| Malformed/missing route params (e.g. `hospital/[id]` with bad id) | Redirect to the parent list screen (Find Hospital) rather than a crash or blank screen. |
| Temporary mock adapter failure (Find Doctor / Find Department) | Treated identically to a real API failure by the ViewModel — the View never knows which one it is. |
| Unexpected/unhandled error | Generic fallback error boundary screen with a "try again" action; error is logged, not shown raw. |
