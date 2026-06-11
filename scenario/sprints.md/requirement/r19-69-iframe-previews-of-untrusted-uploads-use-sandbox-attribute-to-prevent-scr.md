### R19.69: Iframe previews of untrusted uploads use sandbox attribute to prevent script execution.

<details><summary>Tron directive</summary>

> SECURITY: when rendering file previews in iframes (R19.64 — href/HTML content loaded via iframe), the iframe MUST carry a sandbox attribute that prevents script execution, form submission, and top-level navigation from the loaded content. Recommended: sandbox='allow-same-origin' (allows CSS/images but blocks scripts). This prevents XSS/phishing from malicious uploaded HTML files or dropped URLs. Applies to the generic previewer (R19.65) iframe render path.

</details>