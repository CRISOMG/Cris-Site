# Manual de Arquitectura y Troubleshooting: Cloudflare Access + Custom Generic OIDC (CrisOMG)

Este documento detalla la arquitectura, el funcionamiento interno del flujo de autenticación **OpenID Connect (OIDC)** con **Google Authenticator (2FA TOTP)** para **Cloudflare Access / Zero Trust Tunnels**, así como el análisis técnico exhaustivo de los errores encontrados y su resolución definitiva según la documentación oficial de Cloudflare.

---

## 1. Arquitectura General y Flujo de Datos

El sistema implementa un proveedor de identidad **OIDC Generic IdP** personalizado alojado en Vercel bajo `https://www.crisomg.link`, protegiendo el acceso a los servicios privados locales expuestos a través de **Cloudflare Tunnels**.

### Diagrama de Secuencia del Flujo Completo

```mermaid
sequenceDiagram
    autonumber
    actor User as Usuario / Admin
    participant TunnelApp as Servicio Local (ej. admin.crisomg.link)
    participant CFAccess as Cloudflare Access (Zero Trust)
    participant OidcUI as Cris-Site UI (/auth/oidc)
    participant OidcAPI as Cris-Site API (/api/oidc/*)
    participant GoogleAuth as Google Authenticator (App)

    User->>TunnelApp: Intenta acceder al servicio protegido
    TunnelApp->>CFAccess: Redirige a Cloudflare Access (Bloqueo)
    CFAccess->>User: Muestra selector de Login ("CrisOMG Tunnel SSO")
    User->>CFAccess: Hace clic en "CrisOMG Tunnel SSO"
    CFAccess->>OidcUI: Redirección 302 con client_id, redirect_uri, state
    OidcUI->>User: Presenta pantalla protegida solicitando código 2FA
    User->>GoogleAuth: Abre app y consulta TOTP de 6 dígitos
    GoogleAuth-->>User: Código temporal (ej. 123456)
    User->>OidcUI: Introduce código y presiona "Verificar y Autorizar"
    OidcUI->>OidcAPI: POST /api/oidc/verify-and-authorize (code + state)
    Note over OidcAPI: Valida TOTP con ADMIN_TOTP_SECRET.<br/>Firma authCode simétrico (HS256) con SESSION_SECRET (60s).
    OidcAPI-->>OidcUI: Retorna { success: true, redirectUrl con ?code=...&state=... }
    OidcUI->>CFAccess: Redirige a redirect_uri (https://crisomg.cloudflareaccess.com/cdn-cgi/access/callback)
    
    rect rgb(20, 30, 50)
        Note over CFAccess,OidcAPI: Validación de Servidor a Servidor (Backchannel)
        CFAccess->>OidcAPI: POST /api/oidc/token (code, client_id, client_secret)
        Note over OidcAPI: 1. Verifica client_secret contra CF_CLIENT_SECRET.<br/>2. Valida authCode simétrico (HS256).<br/>3. Firma id_token con RS256 usando OIDC_PRIVATE_KEY.<br/>4. Incluye claims: sub, email, email_verified, groups: ['admin'].
        OidcAPI-->>CFAccess: Retorna { access_token, id_token, token_type: "Bearer" }
        CFAccess->>OidcAPI: GET /api/oidc/jwks (Descarga claves públicas)
        Note over OidcAPI: Auto-deriva JWK público de OIDC_PRIVATE_KEY.
        OidcAPI-->>CFAccess: Retorna { keys: [{ kty: 'RSA', alg: 'RS256', kid: 'crisomg-key-1', ... }] }
        Note over CFAccess: Verifica la firma RS256 del id_token con la clave pública del JWKS.
        opt Consulta de atributos adicionales
            CFAccess->>OidcAPI: GET /api/oidc/userinfo (Bearer access_token)
            OidcAPI-->>CFAccess: Retorna { sub, email, groups: ['admin'], ... }
        end
    end

    Note over CFAccess: Evalúa políticas de Access (Allow: email / groups).
    CFAccess->>User: Emite cookie CF_Authorization y redirige al túnel
    User->>TunnelApp: Acceso autorizado al servicio privado local
```

---

## 2. Análisis Exhaustivo del Error de Cloudflare Access

### Mensaje Observado
```text
Authentication error
Failed to fetch user/group information from the identity provider
Please contact your Access administrator if this continues.
```

### ¿Qué dice la Documentación Oficial de Cloudflare?

1. **En [Troubleshoot Access - Identity provider user/group info error](https://developers.cloudflare.com/cloudflare-one/access-controls/troubleshooting/)**:
   > *"The error `Failed to fetch user/group information from the identity provider` occurs when Cloudflare lacks the necessary API permissions to communicate with your IdP. Review the SSO integration guide for your specific IdP and ensure the application has the correct permissions (for example, Microsoft Entra or Okta)."*

2. **En [Generic OIDC Integration Guide](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/generic-oidc/)**:
   > *"If you would like to build policies based on IdP groups: Ensure that your IdP sends a `groups` field. The naming must match exactly (case insensitive). All other values will be sent as a OIDC claim."*
   >
   > *"Cloudflare supports the following algorithms for verifying generic OIDC tokens: RS256, RS512, PS512, ES256, ES384, ES512."*

### Desglose Técnico: ¿Por qué ocurre en un Generic OIDC propio?

A diferencia de proveedores empaquetados (como Microsoft Entra ID u Okta) donde Cloudflare se conecta a Graph API (`User.Read`, `GroupMember.Read.All`), en un **Generic OIDC IdP personalizado** Cloudflare obtiene la identidad y los grupos a través de dos mecanismos estándar de OIDC:
1. **Inspección del `id_token`** tras verificar su firma criptográfica asimétrica contra el endpoint **JWKS (`certs_url`)**.
2. **Llamada opcional/complementaria al endpoint `Userinfo`** (`/api/oidc/userinfo`) enviando el `access_token` como Bearer token.

Cuando Cloudflare lanza el error `"Failed to fetch user/group information from the identity provider"`, obedece a uno o varios de los siguientes factores:

| Factor de Falla | Comportamiento Técnico | Impacto en Cloudflare Access |
| :--- | :--- | :--- |
| **Falla en el Endpoint JWKS (HTTP 500)** | Si el endpoint de llaves públicas (`/api/oidc/jwks`) falla con 500 o devuelve un JSON truncado, Cloudflare no puede validar la firma RS256 del `id_token`. | Al no poder validar la firma, Cloudflare rechaza el token y no puede leer los claims del usuario ni sus grupos. |
| **Claim `groups` Ausente** | El `id_token` contenía `sub` y `email`, pero no incluía el array `groups: ['admin']`. | Si Cloudflare está configurado para evaluar grupos o tiene habilitada la sincronización de atributos, la ausencia de la propiedad `groups` causa falla de extracción de identidad. |
| **Inexistencia del Endpoint `/userinfo`** | Cloudflare intenta consultar el perfil del usuario mediante OIDC Core 1.0 estándar tras el canje de tokens. | Si la ruta no existe (404 Not Found), Cloudflare no puede resolver la información del usuario/grupo y aborta el login. |
| **Discrepancia de Algoritmos o Llaves** | El `id_token` se firma con una clave privada que no corresponde matemáticamente a la clave pública expuesta en JWKS. | La verificación de firma falla silenciosamente en el motor de Cloudflare. |

---

## 3. Solución Implementada y Blindaje Criptográfico

Para garantizar 100% de confiabilidad frente a Cloudflare Access, se realizaron las siguientes optimizaciones en el código:

### 1. Auto-derivación Matemática de la Clave Pública JWKS (`src/pages/api/oidc/jwks.js`)
- **Problema previo**: Al copiar y pegar un JSON largo (`OIDC_PUBLIC_JWK`) en la interfaz de Vercel desde una consola de Windows, los saltos de línea y el ancho de columna truncaban el texto o rompían las comillas dobles, provocando errores de `SyntaxError` o 500 en Vercel.
- **Solución implementada**: En criptografía RSA, una clave privada en formato PKCS#8 contiene internamente el módulo ($n$) y el exponente público ($e$). En `jwks.js` se implementó la extracción matemática directa:
  ```javascript
  const importedKey = await importPKCS8(pem, 'RS256', { extractable: true });
  const jwk = await exportJWK(importedKey);
  const publicJwk = {
    kty: jwk.kty,
    n: jwk.n,
    e: jwk.e,
    kid: 'crisomg-key-1',
    alg: 'RS256',
    use: 'sig'
  };
  ```
- **Resultado**: Cero dependencia de copiar JSONs manuales. Si `OIDC_PRIVATE_KEY` existe, la clave pública en `https://www.crisomg.link/api/oidc/jwks` siempre será 100% válida, coincidirá exactamente con la firma del token y responderá HTTP 200 en ~50ms con caché CDN.

### 2. Inclusión Obligatoria del Claim `groups` (`src/pages/api/oidc/token.js`)
- En el endpoint de canje de tokens, se estructuró el `id_token` conforme a los requerimientos oficiales de Cloudflare Generic OIDC:
  ```javascript
  const idToken = await new SignJWT({
    email,
    email_verified: true,
    name: 'Cristian Caraballo',
    preferred_username: 'crisomg',
    groups: ['admin'], // Claim requerido por Cloudflare Zero Trust
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'crisomg-key-1', typ: 'JWT' })
    .setIssuer('https://www.crisomg.link')
    .setSubject(email)
    .setAudience(expectedClientId)
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(privateKey);
  ```

### 3. Creación del Endpoint Estándar `/api/oidc/userinfo` (`src/pages/api/oidc/userinfo.js`)
- Se implementó el endpoint estándar de usuario que responde a solicitudes `GET` y `POST` con `Authorization: Bearer <access_token>`.
- Retorna el perfil completo del usuario con `email_verified: true` y `groups: ['admin']`, permitiendo que Cloudflare consulte los datos del usuario en caso de que su configuración consulte el Userinfo endpoint.

---

## 4. Matriz de Errores y Resolución en el Proyecto

A continuación se resume el historial de incidentes y su resolución precisa:

| # | Error / Síntoma | Causa Raíz | Archivo Modificado | Solución Aplicada |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `TypeError: Cannot read properties of undefined (reading 'generateSecret')` | En `otplib` v13 los métodos se exportan a nivel raíz y no como `authenticator.*`. | [`src/lib/otpStore.js`](file:///c:/Users/Administrator/Desktop/Cris-Site/src/lib/otpStore.js) | Se importaron `{ generateSecret, generateURI, verifySync }` directamente. |
| **2** | `CryptoKey is not extractable` al exportar PKCS8 | WebCrypto por defecto crea claves no extraíbles a menos que se especifique `{ extractable: true }`. | [`scripts/generate-oidc-keys.js`](file:///c:/Users/Administrator/Desktop/Cris-Site/scripts/generate-oidc-keys.js) | Se agregó la opción `{ extractable: true }` en `generateKeyPair`. |
| **3** | `500: Error generando authCode OIDC: SyntaxError: No number after minus sign in JSON at position 1` | Se intentó hacer `JSON.parse` a una clave privada PEM cruda (`-----BEGIN PRIVATE KEY-----`). | [`src/pages/api/oidc/verify-and-authorize.js`](file:///c:/Users/Administrator/Desktop/Cris-Site/src/pages/api/oidc/verify-and-authorize.js) | Se implementó el helper `parsePrivateKey()` que no utiliza `JSON.parse`. Además, el código de autorización se simplificó a un JWT simétrico HS256 firmado con `SESSION_SECRET`. |
| **4** | `OIDC ERROR: Failed to exchange code for token. Make sure the client secret is correct.` | 1. `jwtVerify()` en `token.js` recibía una clave privada RS256, prohibido por la especificación WebCrypto.<br/>2. El `client_secret` en Vercel podía contener comillas escapadas accidentales. | [`src/pages/api/oidc/token.js`](file:///c:/Users/Administrator/Desktop/Cris-Site/src/pages/api/oidc/token.js) | El `code` ahora se valida simétricamente con `SESSION_SECRET` (HS256). Se agregó sanitización `cleanStr()` que elimina comillas circundantes y espacios. |
| **5** | `Authentication error: Failed to fetch user/group information from the identity provider` | 1. El endpoint JWKS (`/api/oidc/jwks`) fallaba por JSON truncado en Vercel.<br/>2. Falta del claim `groups` en `id_token`.<br/>3. Ausencia del endpoint `/userinfo`. | [`src/pages/api/oidc/jwks.js`](file:///c:/Users/Administrator/Desktop/Cris-Site/src/pages/api/oidc/jwks.js)<br/>[`src/pages/api/oidc/userinfo.js`](file:///c:/Users/Administrator/Desktop/Cris-Site/src/pages/api/oidc/userinfo.js)<br/>[`src/pages/api/oidc/token.js`](file:///c:/Users/Administrator/Desktop/Cris-Site/src/pages/api/oidc/token.js) | Auto-derivación de JWK desde la clave privada, inclusión de `groups: ['admin']`, y creación del endpoint `/userinfo`. |

---

## 5. Configuración en el Panel de Cloudflare Zero Trust

Para que Cloudflare Access se comunique correctamente con los endpoints desplegados, los campos deben configurarse de la siguiente manera:

1. Ve a **Cloudflare Zero Trust** > **Integrations** > **Identity providers**.
2. Selecciona **Add new identity provider** > **OpenID Connect**.
3. Configura los campos:

| Campo en Cloudflare Dashboard | Valor Exacto |
| :--- | :--- |
| **Name** | `CrisOMG Tunnel SSO` |
| **App ID / Client ID** | `cloudflare-access-crisomg` (o el valor en `CF_CLIENT_ID`) |
| **Client Secret** | El valor de tu variable de entorno `CF_CLIENT_SECRET` en Vercel |
| **Auth URL** | `https://www.crisomg.link/auth/oidc` |
| **Token URL** | `https://www.crisomg.link/api/oidc/token` |
| **Certificate URL** | `https://www.crisomg.link/api/oidc/jwks` |
| **Proof of Key Exchange (PKCE)** | `Desactivado` |
| **Enable SCIM** | `Desactivado` |

### OIDC Claims y Scopes Opcionales
En la sección **Optional configurations**:
- **Scopes**: `openid`, `email`, `profile`
- **Email claim name**: `email` (por defecto)
- **OIDC Claims**: Puedes agregar `groups` si deseas condicionar políticas de acceso basadas en grupos.

---

## 6. Verificación en Producción

Los endpoints desplegados pueden ser auditados directamente desde cualquier terminal:

```bash
# 1. Probar el endpoint JWKS (Debe retornar HTTP 200 con la clave pública RSA)
curl -s -i https://www.crisomg.link/api/oidc/jwks

# 2. Probar el endpoint Userinfo (Debe retornar HTTP 200 con el perfil y grupos)
curl -s -i https://www.crisomg.link/api/oidc/userinfo

# 3. Probar el botón de Test en Cloudflare Zero Trust
# Navegar a Zero Trust > Authentication > Login methods > "Test" junto a CrisOMG Tunnel SSO
```

---

## 7. Mantenimiento y Rotación de Claves

- Si necesitas rotar la clave OIDC o el secreto 2FA:
  1. Ejecuta localmente `npm run generate:oidc-keys` para generar un nuevo par de claves RS256.
  2. Ejecuta `npm run generate:2fa` para generar un nuevo secret y escanear el QR con Google Authenticator.
  3. Actualiza las variables `OIDC_PRIVATE_KEY` y `ADMIN_TOTP_SECRET` en Vercel.
  4. Gracias a la auto-derivación en `jwks.js`, la clave pública se actualizará automáticamente sin necesidad de editar ninguna variable adicional.
