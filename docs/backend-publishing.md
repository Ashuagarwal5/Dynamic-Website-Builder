# Backend publishing

POST /tenants/{tenantId}/sites/{siteId}/publish is integrated. Publish on an unpublished backend website card opens a confirmation dialog in My Websites or Dashboard. The browser calls the matching /api/tenants/.../publish JSON route, with no request body. The server checks the session, request origin, and current active membership before calling publishing.service.js. Backend authorization must enforce the site/tenant relationship and publication eligibility.

Success closes the dialog and refetches GET sites so cards and dashboard counts show authoritative backend status. Rejected requests leave the dialog open with a safe error. Duplicate submissions are locked. Uncertain failures are not retried automatically and advise refreshing to check status. No local storage, local publication snapshots, or full document reloads are used.

Unpublish is now integrated through POST /tenants/{tenantId}/sites/{siteId}/unpublish and the matching browser JSON route. This website publish operation does not send page-publish requests and does not establish how backend site/page status or draft snapshots interact. Public website viewing remains a separate integration. No backend request payload changes are needed for the supplied body-free publish endpoint.

Run npm run test:publishing for transport, membership/origin checks, success JSON mapping, upstream errors, and non-retry behavior.

Published site cards offer Unpublish with a confirmation dialog. It sends a body-free POST through the same server-only transport and fresh membership checks as publishing. Success refetches the website list so status and counts use backend values instead of assuming DRAFT or another unpublished status. Errors remain in the dialog; no local storage, automatic mutation retry, or full document reload is used. The backend remains responsible for public-access behavior and related page publication state. No payload change is needed for the supplied endpoint.

Page publish is integrated: POST /tenants/{tenantId}/sites/{siteId}/pages/{pageId}/publish. Open My Websites > Pages > Publish and confirm. The browser calls the matching /api route without a request body; session, origin and fresh active membership checks protect the server transport. The backend must authorize the full page/site/tenant relationship. Success refetches page status from GET pages. No local storage or automatic retry is used. Page publication does not publish its parent website; public availability remains backend controlled. No payload changes are required.
