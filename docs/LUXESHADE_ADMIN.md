# LuxeShade Admin catalogue

## View only eyewear

Open the Medusa Admin, then select **Products by Shop** in the left navigation.
The page opens on the **Eyewear** sales channel when it exists, and its tab shows
only products assigned to LuxeShade. Use the search box to narrow this list by
product title or handle.

The standard **Products** page also supports this without the custom page:
**Add filter** > **Sales Channel** > **Eyewear**.

## Product images

Older LuxeShade imports store their media as relative paths such as
`/images/eyewear/sun-prada-pr-17ws.jpg`. The Admin is served from the backend
domain, so those paths previously resolved to the wrong host and appeared
broken. The shop-products API now expands them to the LuxeShade storefront
origin before sending them to the Admin.

Set `LUXESHADE_STOREFRONT_URL` on the Railway **Web-sale** service to the
public LuxeShade storefront origin (no trailing path). Its default is
`https://luxshade.up.railway.app`.

If an image still shows **No image**, either the product has no thumbnail or
the corresponding static file is missing from the deployed storefront. Verify
the final image URL directly in a browser, deploy the storefront with that
file, then refresh Admin.

## Visitor analytics

Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` on Railway's **frontend** service to the
GA4 web measurement ID (`G-...`), then redeploy. LuxeShade sends page views to
GA4; view traffic in the Google Analytics dashboard, not Medusa Admin.

## Storefront search

The text search starts automatically 300 ms after a visitor stops typing two
or more characters. Pressing Enter remains available to immediately open the
same full results page. Photo search stays an explicit action after upload so
an accidental file selection does not consume Gemini search quota.

## Verification for each change

Run these from the repository root before deploying:

```powershell
npm --workspace @dtc/backend run lint
npm --workspace @dtc/backend run test:shop-products
```

The backend test commands use `cross-env`, so they run on Windows, macOS, and
Linux. Run the integration suites too when a local Postgres instance is up:

```powershell
npm --workspace @dtc/backend run test:integration:modules
npm --workspace @dtc/backend run test:integration:http
```

After Railway deploys both services, open **Products by Shop** and confirm the
Eyewear tab count, a product thumbnail, and search filtering. Also confirm one
image URL returns HTTP 200 from the configured LuxeShade domain.
