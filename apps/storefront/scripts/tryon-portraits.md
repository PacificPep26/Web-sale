# Portrait replacement workflow

Fendi model portraits use built-in ImageGen, with one call per person and pose.
The product page resolves replacements through `lib/tryon-portraits.json`.
Original JPGs remain available for comparison and rollback.

## Prompt

Use case: identity-preserve. Image 1 is the original model photo; image 2 is
the exact eyewear reference. Recompose as one photorealistic vertical 4:5
portrait, 1024x1280. Preserve the exact person, hairstyle, expression and head
angle, black shirt and neutral taupe studio background. Preserve the sunglasses
shape, color, lenses and temple details. Show the entire head with margin above
the hair, neck, shoulders and upper chest. Center the person. Require a natural
jawline, chin separated from the neck, continuous cheek-to-ear contour and
normal neck. No displaced skin, duplicate cheek, smeared facial regions,
stretching, collage, added text or watermark. Glasses arms run backward over
the ears and must not appear as floating shapes in front of the eyes.

## Save and resume

Inspect every result before importing. Run imports sequentially:

```powershell
node scripts/save-tryon-portrait.mjs 'C:\path\generated.png' 'worn-victor/sun-fendi-fe40168i-front.jpg'
node scripts/audit-tryon-portraits.mjs
```

Use `worn-victor-male` for the male model. Product references are in
`public/images/eyewear`. The importer validates 4:5 and minimum 800x1000,
decodes the JPEG, then publishes the file and manifest via temporary files.
Stopping generation leaves the existing gallery working. Resume only entries
absent from the manifest. Never publish an unfinished or visually defective
image. Final files are siblings ending in `-portrait.jpg` in both model folders.

The audit checks dimensions, not visual anatomy or product fidelity; those
require manual inspection. A portrait can retain a source pose even if its
legacy filename does not accurately describe the head direction.
