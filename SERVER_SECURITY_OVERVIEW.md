### Server Security – Kurz erklärt (für Hostinger VPS mit Coolify/Traefik)

#### 1. Firewall (ufw)
**Ziel**: Nur nötigen Traffic von außen nach innen erlauben.
- Von **Internet → VPS (srv1250496.hstgr.cloud)**: Nur Ports wie `80/443` (HTTP/HTTPS) und einen verwalteten SSH-Port offen lassen, Rest per `ufw deny`.
- Von **VPS → Außen**: Nur was nötig ist (z.B. Package-Updates, Webhooks); Standard ist meist ausreichend.

#### 2. SSH absichern
**Ziel**: Direkten Root- und Passwort-Zugang verhindern.
- Von **deinem Rechner → VPS:22 (oder eigener Port)**:
  - Login nur mit SSH-Keys (`PasswordAuthentication no`).
  - `PermitRootLogin no`, stattdessen normaler User mit `sudo`.
  - Optional Fail2ban für SSH-Logins.

#### 3. Fail2ban
**Ziel**: Brute-Force-Angriffe blocken.
- Überwacht Logfiles (z.B. SSH, Nginx, Traefik) **auf dem VPS**.
- Sperrt IPs per `iptables/ufw`, wenn zu viele Fehlversuche von **derselben externen IP → VPS** kommen.

#### 4. SSL/HTTPS
**Ziel**: Verschlüsselter Traffic zwischen Browser und deiner Domain.
- Von **Browser der User → `aavegotchidao.cloud` (Traefik auf VPS)**:
  - Nur HTTPS zulassen (HTTP→HTTPS Redirect).
  - Gültige Let’s-Encrypt-Zertifikate, automatische Erneuerung.
  - Kein Plain-HTTP für Produktions-Apps.

#### 5. App-Level Security
**Ziel**: Schutz *innerhalb* der App, hinter Traefik.
- Von **Browser/Admin → App-Container (über Traefik)**:
  - Rate Limiting (z.B. pro IP) gegen Abuse.
  - Auth + Rollen für Admin-Endpoints (kein offenes `/admin` oder `/metrics`).
  - Input-Validierung, CSRF/XSS-Schutz, sichere Session/JWT-Konfiguration.

#### 6. Coolify-/Traefik-spezifisch
**Ziel**: Reverse Proxy und Deploy-Plattform absichern.
- Von **Internet → Traefik → Container**:
  - Nur notwendige Dienste nach außen publishen; interne Services nur intern (Docker-Netzwerk) erreichbar.
  - Traefik: HTTPS, HSTS, ggf. Rate Limits / Middleware aktivieren.
- Von **Browser/Admin → Coolify UI**:
  - Starke Auth (starkes Passwort, 2FA falls möglich), nur über HTTPS.
  - UI nur für dich freigeben (z.B. IP-Restriktion oder VPN).

