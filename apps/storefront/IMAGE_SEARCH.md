# Photo search

Customers can upload a JPG, PNG or WebP (up to 5 MB / 25 megapixels) at `/search`.
The server removes metadata and resizes the image, asks Gemini to shortlist
products from the current sales channel, then compares the uploaded photo with
up to eight real catalog photos. Only existing catalog IDs with a visual match
score of at least 0.85 become suggestions. Scores are model judgments, not
calibrated probabilities; the UI deliberately calls results possible matches.

No match, service errors and empty text searches offer WhatsApp support at
`+84 82 800 8881`. The customer must attach their photo in WhatsApp themselves;
the chat link only pre-fills a message. Uploaded photos are not written to disk.
They are sent to Gemini; the upload UI discloses this before submission.

## Railway setup

Set these **runtime** variables on the **frontend** service, then redeploy:

```text
GEMINI_API_KEY=<your Google AI Studio Gemini API key>
GEMINI_IMAGE_SEARCH_MODEL=gemini-3.5-flash-lite
IMAGE_SEARCH_PER_IP_MINUTE=3
IMAGE_SEARCH_PER_IP_DAY=10
IMAGE_SEARCH_DAILY_LIMIT=100
```

Do not use a `NEXT_PUBLIC_` prefix for either variable. Do not commit a key.
Without a key, the endpoint returns 503 with a customer-friendly message and
the UI offers WhatsApp. Keys for Vertex AI/OAuth are not interchangeable with
Google AI Studio API keys for this endpoint.

The integration uses the Gemini generateContent REST endpoint with inline
images and JSON schema output:
- https://ai.google.dev/gemini-api/docs/image-understanding
- https://ai.google.dev/gemini-api/docs/structured-output

## Limits and operations

- Up to two Gemini requests per search; a 75-second overall search timeout.
- Default model: Gemini 3.5 Flash-Lite, with at most 1,024 output tokens per call.
  If Railway already sets `GEMINI_IMAGE_SEARCH_MODEL`, set it to
  `gemini-3.5-flash-lite`; environment variables override the code default.
- Per process: 2 concurrent searches, 3 requests/minute/IP, 10 requests/day/IP,
  100 requests/day across all visitors. Daily windows reset at midnight UTC
  (07:00 Vietnam time). Accepted attempts count even if the upload or AI fails;
  rejected requests do not consume quota. One attempt can make two AI calls.
  Counters are reserved before asynchronous work to prevent concurrent overruns.
  Daily limits also reset on restart. Use a shared rate limiter and trusted proxy IP
  configuration before scaling beyond the current single Railway instance.
  Configure Gemini project quotas separately to cap provider usage.
- Catalog pagination is scoped by the storefront publishable key, up to 2,000
  products. Catalog failures return an error instead of pretending no match.
- Catalog photos can come from `public/`, the configured Medusa origin, or
  the existing Unsplash/Medusa public image origins. Redirects are not followed.
  Add a trusted media origin in `lib/image-search.ts` when moving to a new CDN.
- A metadata shortlist can miss a product with sparse catalog information.
  Photos from very different angles can also be missed. WhatsApp remains
  available even when suggestions are returned.

## Verification

Run `npm exec tsc -- --noEmit`, `npm run lint`, and `npm run build` in this app.
Then run `npm exec playwright -- test --config playwright.image-search.config.ts`
for mocked provider tests and desktop/mobile upload flows (no paid AI calls).
After configuring a valid key, upload a catalog photo, a phone-camera photo,
an unrelated image and an invalid file. Check suggestions link to real products,
and verify the WhatsApp recipient and pre-filled message on a phone.
