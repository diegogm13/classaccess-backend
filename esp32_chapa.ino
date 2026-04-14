/*
  ╔══════════════════════════════════════════════════════════╗
  ║       ClassAccess ESP32 — Control de Chapa v2.0          ║
  ║  Portal de configuración WiFi + control de relay pin 18  ║
  ╚══════════════════════════════════════════════════════════╝

  Flujo:
    1. Enciende el ESP32
    2. Si NO hay config guardada (o falla la conexión):
       → Crea un punto de acceso "ClassAccess-Config"
       → Conecta tu celular a esa red
       → Se abre automáticamente la página de configuración
         (o entra manualmente a http://192.168.4.1)
    3. Selecciona tu WiFi, pon la contraseña, el ID del aula y la URL del backend
    4. Guarda → el ESP32 reinicia y se conecta a tu red
    5. Cada 10 segundos consulta el backend y abre/cierra la chapa

  Para RESETEAR la config (volver al portal):
    → Manten presionado el botón BOOT (GPIO 0) por 3 segundos al encender

  Librerías (instalar desde Arduino IDE → Library Manager):
    ✅ WiFi.h         — incluida en core ESP32
    ✅ WebServer.h    — incluida en core ESP32
    ✅ DNSServer.h    — incluida en core ESP32
    ✅ Preferences.h  — incluida en core ESP32
    ✅ HTTPClient.h   — incluida en core ESP32
    ⬇️ ArduinoJson    — buscar "ArduinoJson" by Benoit Blanchon e instalar
*/

#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ─── PINES ──────────────────────────────────────────────────
#define PIN_CHAPA      18    // Pin del relay/chapa
#define PIN_RESET_CFG   0    // Botón BOOT para resetear config (GPIO 0)

// ─── CONFIG DEL PORTAL AP ───────────────────────────────────
#define AP_SSID        "ClassAccess-Config"
#define AP_PASSWORD    "classaccess"        // Deja "" para red abierta
#define AP_IP          "192.168.4.1"

// ─── TIMEOUTS ───────────────────────────────────────────────
#define WIFI_CONNECT_TIMEOUT_MS   15000   // 15 s para conectar al WiFi guardado
#define INTERVALO_CONSULTA_MS     10000   // Consulta al backend cada 10 s
#define HTTP_TIMEOUT_MS            8000   // Timeout HTTP

// ─── RELAY ──────────────────────────────────────────────────
// true  = HIGH abre la chapa  (relay NO - normalmente abierto)
// false = HIGH cierra la chapa (relay NC - normalmente cerrado)
#define RELAY_HIGH_ABRE  true

// ════════════════════════════════════════════════════════════
//  PÁGINA HTML DEL PORTAL DE CONFIGURACIÓN
// ════════════════════════════════════════════════════════════
const char HTML_PORTAL[] PROGMEM = R"rawhtml(
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>ClassAccess — Configuración</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',system-ui,sans-serif;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:20px 16px 40px}
  .logo{margin:24px 0 8px;display:flex;align-items:center;gap:10px}
  .logo-icon{width:44px;height:44px;background:linear-gradient(135deg,#e94560,#c62a47);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 15px rgba(233,69,96,.4)}
  .logo-text{color:#fff;font-size:22px;font-weight:700;letter-spacing:.5px}
  .logo-sub{color:#a0aec0;font-size:12px;text-align:center;margin-bottom:24px}
  .card{background:rgba(255,255,255,.05);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:24px;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.4)}
  .card+.card{margin-top:16px}
  .section-title{color:#e94560;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:8px}
  .section-title::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.1)}
  label{display:block;color:#a0aec0;font-size:12px;font-weight:600;margin-bottom:6px;letter-spacing:.5px}
  input{width:100%;padding:12px 14px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:10px;color:#fff;font-size:15px;outline:none;transition:all .2s}
  input:focus{border-color:#e94560;background:rgba(233,69,96,.08);box-shadow:0 0 0 3px rgba(233,69,96,.15)}
  input::placeholder{color:rgba(255,255,255,.3)}
  .input-wrap{position:relative;margin-bottom:16px}
  .eye-btn{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#a0aec0;font-size:18px;padding:4px;line-height:1}
  .networks-list{display:flex;flex-direction:column;gap:8px;margin-bottom:16px;max-height:220px;overflow-y:auto;padding-right:2px}
  .networks-list::-webkit-scrollbar{width:4px}
  .networks-list::-webkit-scrollbar-track{background:transparent}
  .networks-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:4px}
  .net-item{display:flex;align-items:center;gap:10px;padding:11px 13px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);border-radius:10px;cursor:pointer;transition:all .15s;user-select:none}
  .net-item:hover,.net-item.selected{background:rgba(233,69,96,.15);border-color:rgba(233,69,96,.4)}
  .net-item.selected{box-shadow:0 0 0 2px rgba(233,69,96,.3)}
  .net-icon{font-size:20px;flex-shrink:0}
  .net-name{color:#e2e8f0;font-size:14px;font-weight:500;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .net-rssi{font-size:11px;color:#a0aec0;flex-shrink:0}
  .net-lock{font-size:13px;flex-shrink:0;color:#a0aec0}
  .scan-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:11px;background:rgba(255,255,255,.07);border:1px dashed rgba(255,255,255,.2);border-radius:10px;color:#a0aec0;font-size:13px;cursor:pointer;transition:all .2s;margin-bottom:16px}
  .scan-btn:hover{background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.35)}
  .spin{display:inline-block;animation:spin .8s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .save-btn{width:100%;padding:15px;background:linear-gradient(135deg,#e94560,#c62a47);border:none;border-radius:12px;color:#fff;font-size:16px;font-weight:700;cursor:pointer;transition:all .2s;letter-spacing:.5px;box-shadow:0 4px 20px rgba(233,69,96,.35)}
  .save-btn:hover{transform:translateY(-1px);box-shadow:0 6px 25px rgba(233,69,96,.5)}
  .save-btn:active{transform:translateY(0)}
  .save-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
  .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(100px);background:#1a1a2e;border:1px solid rgba(255,255,255,.15);color:#fff;padding:14px 22px;border-radius:12px;font-size:14px;font-weight:500;box-shadow:0 8px 32px rgba(0,0,0,.5);transition:transform .35s cubic-bezier(.34,1.56,.64,1);z-index:999;white-space:nowrap;max-width:90vw;text-align:center}
  .toast.show{transform:translateX(-50%) translateY(0)}
  .toast.ok{border-color:rgba(72,199,142,.4);background:rgba(72,199,142,.15)}
  .toast.err{border-color:rgba(233,69,96,.4);background:rgba(233,69,96,.15)}
  .status-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}
  .status-dot.green{background:#48c78e;box-shadow:0 0 6px #48c78e}
  .status-dot.red{background:#e94560;box-shadow:0 0 6px #e94560}
  .status-dot.yellow{background:#ffdd57;box-shadow:0 0 6px #ffdd57}
  .current-status{color:#a0aec0;font-size:13px;margin-bottom:16px;padding:10px 13px;background:rgba(255,255,255,.05);border-radius:8px}
  .hint{color:rgba(160,174,192,.6);font-size:11px;margin-top:6px;line-height:1.5}
  .divider{height:1px;background:rgba(255,255,255,.07);margin:4px 0 16px}
  #ssid-input-wrap{margin-top:4px}
</style>
</head>
<body>

<div class="logo">
  <div class="logo-icon">🔐</div>
  <div class="logo-text">ClassAccess</div>
</div>
<div class="logo-sub">Configuración del dispositivo de acceso</div>

<!-- Estado actual -->
<div class="card">
  <div class="section-title">Estado actual</div>
  <div class="current-status" id="cur-status">
    <span class="status-dot yellow" id="dot"></span>
    <span id="status-text">Cargando...</span>
  </div>
</div>

<!-- Config WiFi -->
<div class="card">
  <div class="section-title">Red WiFi</div>

  <button class="scan-btn" id="scan-btn" onclick="scanNetworks()">
    <span>📡</span> Buscar redes disponibles
  </button>

  <div class="networks-list" id="networks-list" style="display:none"></div>

  <label>Nombre de la red (SSID)</label>
  <div class="input-wrap" id="ssid-input-wrap">
    <input type="text" id="ssid" placeholder="Nombre del WiFi" autocomplete="off" spellcheck="false">
  </div>

  <label>Contraseña</label>
  <div class="input-wrap">
    <input type="password" id="password" placeholder="Contraseña del WiFi" autocomplete="new-password">
    <button class="eye-btn" onclick="togglePwd()" type="button" id="eye">👁</button>
  </div>
</div>

<!-- Config del dispositivo -->
<div class="card">
  <div class="section-title">Dispositivo</div>

  <label>ID del Aula</label>
  <div class="input-wrap">
    <input type="number" id="aula-id" placeholder="Ej: 1" min="1" value="__AULA_ID__">
  </div>
  <p class="hint" style="margin-top:-10px;margin-bottom:16px">ID numérico del salón en el sistema ClassAccess</p>

  <label>URL del Backend</label>
  <div class="input-wrap">
    <input type="url" id="backend-url" placeholder="https://tu-proyecto.vercel.app/api/esp32/estado" value="__BACKEND_URL__">
  </div>
  <p class="hint" style="margin-top:-10px;margin-bottom:0">URL completa del endpoint ESP32 en tu servidor</p>
</div>

<!-- Guardar -->
<div class="card">
  <button class="save-btn" id="save-btn" onclick="guardar()">
    💾 Guardar y Conectar
  </button>
  <p class="hint" style="margin-top:12px;text-align:center">El dispositivo se reiniciará y se conectará a la red seleccionada</p>
</div>

<div class="toast" id="toast"></div>

<script>
const $ = id => document.getElementById(id);

// ── Cargar estado actual ──────────────────────────────────────
async function loadStatus() {
  try {
    const r = await fetch('/status');
    const d = await r.json();
    const dot = $('dot');
    const txt = $('status-text');
    if (d.connected) {
      dot.className = 'status-dot green';
      txt.textContent = 'Conectado a ' + d.ssid + ' (' + d.ip + ')';
    } else {
      dot.className = 'status-dot red';
      txt.textContent = 'Sin conexión WiFi — modo configuración';
    }
  } catch(e) {
    $('status-text').textContent = 'Modo configuración activo';
    $('dot').className = 'status-dot yellow';
  }
}
loadStatus();

// ── Escanear redes ────────────────────────────────────────────
async function scanNetworks() {
  const btn = $('scan-btn');
  const list = $('networks-list');
  btn.innerHTML = '<span class="spin">⟳</span> Escaneando...';
  btn.disabled = true;
  list.style.display = 'none';

  try {
    const r = await fetch('/scan');
    const nets = await r.json();
    list.innerHTML = '';

    if (!nets.length) {
      list.innerHTML = '<div style="color:#a0aec0;font-size:13px;text-align:center;padding:12px">No se encontraron redes</div>';
    } else {
      nets.forEach(n => {
        const item = document.createElement('div');
        item.className = 'net-item';
        item.onclick = () => selectNet(n.ssid, item);
        const rssi = n.rssi >= -60 ? '●●●' : n.rssi >= -75 ? '●●○' : '●○○';
        const rssiColor = n.rssi >= -60 ? '#48c78e' : n.rssi >= -75 ? '#ffdd57' : '#e94560';
        item.innerHTML =
          '<span class="net-icon">📶</span>' +
          '<span class="net-name">' + escHtml(n.ssid) + '</span>' +
          '<span class="net-rssi" style="color:' + rssiColor + '">' + rssi + '</span>' +
          (n.encrypted ? '<span class="net-lock">🔒</span>' : '');
        list.appendChild(item);
      });
    }
    list.style.display = 'flex';
  } catch(e) {
    toast('Error al escanear redes', 'err');
  }

  btn.innerHTML = '<span>📡</span> Buscar de nuevo';
  btn.disabled = false;
}

function selectNet(ssid, el) {
  document.querySelectorAll('.net-item').forEach(i => i.classList.remove('selected'));
  el.classList.add('selected');
  $('ssid').value = ssid;
  $('password').focus();
}

// ── Guardar config ────────────────────────────────────────────
async function guardar() {
  const ssid = $('ssid').value.trim();
  const pwd  = $('password').value;
  const url  = $('backend-url').value.trim();
  const aula = $('aula-id').value.trim();

  if (!ssid) { toast('Ingresa el nombre de la red WiFi', 'err'); return; }
  if (!url)  { toast('Ingresa la URL del backend', 'err'); return; }
  if (!aula || isNaN(aula) || parseInt(aula) < 1) { toast('Ingresa un ID de aula válido', 'err'); return; }

  const btn = $('save-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Guardando...';

  try {
    const r = await fetch('/save', {
      method: 'POST',
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body: 'ssid=' + encodeURIComponent(ssid)
          + '&password=' + encodeURIComponent(pwd)
          + '&url=' + encodeURIComponent(url)
          + '&aula=' + encodeURIComponent(aula)
    });
    const d = await r.json();
    if (d.ok) {
      toast('✅ Guardado. El dispositivo se reiniciará en 3 segundos...', 'ok');
      setTimeout(() => { btn.textContent = '🔄 Reiniciando...'; }, 1000);
    } else {
      toast('Error: ' + (d.msg || 'desconocido'), 'err');
      btn.disabled = false;
      btn.textContent = '💾 Guardar y Conectar';
    }
  } catch(e) {
    toast('Error de conexión', 'err');
    btn.disabled = false;
    btn.textContent = '💾 Guardar y Conectar';
  }
}

// ── Utilidades ────────────────────────────────────────────────
function togglePwd() {
  const i = $('password');
  i.type = i.type === 'password' ? 'text' : 'password';
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

let toastTimer;
function toast(msg, type) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show ' + (type || '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 4000);
}
</script>
</body>
</html>
)rawhtml";

// ════════════════════════════════════════════════════════════
//  GLOBALES
// ════════════════════════════════════════════════════════════
WebServer  server(80);
DNSServer  dnsServer;
Preferences prefs;

// Config persistente
String cfgSSID        = "";
String cfgPassword    = "";
String cfgBackendURL  = "";
int    cfgAulaId      = 1;

// Estado del sistema
bool   modoPortal     = false;
bool   chapaAbierta   = false;
unsigned long ultimaConsulta = 0;

// ════════════════════════════════════════════════════════════
//  SETUP
// ════════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n╔══════════════════════════════════════╗");
  Serial.println("║  ClassAccess ESP32 - Chapa v2.0      ║");
  Serial.println("╚══════════════════════════════════════╝");

  // Pin de la chapa — cerrada por seguridad al arrancar
  pinMode(PIN_CHAPA, OUTPUT);
  cerrarChapa();

  // Botón de reset de configuración
  pinMode(PIN_RESET_CFG, INPUT_PULLUP);

  // Cargar config guardada
  cargarConfig();

  // Verificar si el botón BOOT está presionado (reset config)
  if (digitalRead(PIN_RESET_CFG) == LOW) {
    Serial.println("[CONFIG] Botón BOOT presionado → Borrando config...");
    borrarConfig();
    delay(1000);
  }

  // Intentar conectar al WiFi guardado
  if (cfgSSID.length() > 0 && intentarConexion()) {
    // Conexión exitosa → modo normal
    modoPortal = false;
    Serial.println("[MODO] Operacion normal — consultando backend");
  } else {
    // Sin config o falla → modo portal
    modoPortal = true;
    iniciarPortal();
  }
}

// ════════════════════════════════════════════════════════════
//  LOOP
// ════════════════════════════════════════════════════════════
void loop() {
  if (modoPortal) {
    dnsServer.processNextRequest();
    server.handleClient();
    return;
  }

  // Modo normal: consultar backend periódicamente
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Conexión perdida. Reconectando...");
    if (!intentarConexion()) {
      Serial.println("[WiFi] No se pudo reconectar → abriendo portal");
      modoPortal = true;
      iniciarPortal();
    }
    return;
  }

  unsigned long ahora = millis();
  if (ahora - ultimaConsulta >= INTERVALO_CONSULTA_MS) {
    ultimaConsulta = ahora;
    consultarEstadoAula();
  }
}

// ════════════════════════════════════════════════════════════
//  PORTAL DE CONFIGURACIÓN
// ════════════════════════════════════════════════════════════
void iniciarPortal() {
  Serial.println("\n[PORTAL] Iniciando modo configuración AP...");

  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, strlen(AP_PASSWORD) > 0 ? AP_PASSWORD : nullptr);

  IPAddress apIP(192, 168, 4, 1);
  WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));

  Serial.printf("[PORTAL] AP: %s | Pass: %s | IP: %s\n",
    AP_SSID,
    strlen(AP_PASSWORD) > 0 ? AP_PASSWORD : "(abierta)",
    WiFi.softAPIP().toString().c_str()
  );

  // DNS → redirige todo a 192.168.4.1 (captive portal)
  dnsServer.start(53, "*", apIP);

  // Rutas del servidor web
  server.on("/",        HTTP_GET,  handleRoot);
  server.on("/scan",    HTTP_GET,  handleScan);
  server.on("/save",    HTTP_POST, handleSave);
  server.on("/status",  HTTP_GET,  handleStatus);
  server.onNotFound(handleNotFound);

  server.begin();
  Serial.println("[PORTAL] Servidor web iniciado en http://192.168.4.1");
  Serial.println("[PORTAL] Conecta tu celular a la red: " + String(AP_SSID));
}

// ─── Página principal ────────────────────────────────────────
void handleRoot() {
  String html = String(HTML_PORTAL);
  html.replace("__AULA_ID__",     String(cfgAulaId));
  html.replace("__BACKEND_URL__", cfgBackendURL);
  server.send(200, "text/html; charset=utf-8", html);
}

// ─── Escanear redes WiFi ─────────────────────────────────────
void handleScan() {
  WiFi.mode(WIFI_AP_STA);   // Necesario para escanear en modo AP
  int n = WiFi.scanNetworks(false, false);

  String json = "[";
  // Ordenar por RSSI (más fuerte primero) — burbuja simple
  for (int i = 0; i < n - 1; i++) {
    for (int j = i + 1; j < n; j++) {
      if (WiFi.RSSI(j) > WiFi.RSSI(i)) {
        // Swap (WiFi lib no tiene swap directo — usamos índice manual)
        String tmpSSID = WiFi.SSID(i);
        // Solo reorganizamos el JSON, los datos del scan no se mueven
        // Guardamos índices ordenados
      }
    }
  }

  // Crear JSON de redes únicas
  std::vector<int> indices;
  for (int i = 0; i < n; i++) indices.push_back(i);
  // Ordenar por RSSI
  for (int i = 0; i < (int)indices.size() - 1; i++)
    for (int j = i + 1; j < (int)indices.size(); j++)
      if (WiFi.RSSI(indices[j]) > WiFi.RSSI(indices[i]))
        std::swap(indices[i], indices[j]);

  bool first = true;
  String lastSSID = "";
  for (int idx : indices) {
    String ssid = WiFi.SSID(idx);
    if (ssid.length() == 0 || ssid == lastSSID) continue;
    lastSSID = ssid;
    if (!first) json += ",";
    first = false;
    // Escapar comillas en el SSID
    ssid.replace("\"", "\\\"");
    json += "{\"ssid\":\"" + ssid + "\",";
    json += "\"rssi\":" + String(WiFi.RSSI(idx)) + ",";
    json += "\"encrypted\":" + String(WiFi.encryptionType(idx) != WIFI_AUTH_OPEN ? "true" : "false") + "}";
  }
  json += "]";

  WiFi.scanDelete();
  server.send(200, "application/json", json);
}

// ─── Guardar configuración ───────────────────────────────────
void handleSave() {
  if (!server.hasArg("ssid") || !server.hasArg("url") || !server.hasArg("aula")) {
    server.send(400, "application/json", "{\"ok\":false,\"msg\":\"Faltan parametros\"}");
    return;
  }

  String newSSID    = server.arg("ssid");
  String newPass    = server.arg("password");
  String newURL     = server.arg("url");
  String newAulaStr = server.arg("aula");

  if (newSSID.length() == 0 || newURL.length() == 0 || newAulaStr.length() == 0) {
    server.send(400, "application/json", "{\"ok\":false,\"msg\":\"Campos vacios\"}");
    return;
  }

  int newAula = newAulaStr.toInt();
  if (newAula < 1) {
    server.send(400, "application/json", "{\"ok\":false,\"msg\":\"ID de aula invalido\"}");
    return;
  }

  // Guardar en Preferences (NVS flash)
  prefs.begin("classaccess", false);
  prefs.putString("ssid",    newSSID);
  prefs.putString("pass",    newPass);
  prefs.putString("url",     newURL);
  prefs.putInt   ("aula",    newAula);
  prefs.end();

  Serial.printf("[CONFIG] Guardado → SSID: %s | Aula: %d | URL: %s\n",
    newSSID.c_str(), newAula, newURL.c_str());

  server.send(200, "application/json", "{\"ok\":true}");

  delay(3000);   // Tiempo para que el cliente reciba la respuesta
  ESP.restart();
}

// ─── Estado actual de conexión ───────────────────────────────
void handleStatus() {
  String json = "{";
  if (WiFi.status() == WL_CONNECTED) {
    json += "\"connected\":true,";
    json += "\"ssid\":\"" + WiFi.SSID() + "\",";
    json += "\"ip\":\"" + WiFi.localIP().toString() + "\"";
  } else {
    json += "\"connected\":false";
  }
  json += "}";
  server.send(200, "application/json", json);
}

// ─── Captive portal: redirigir todo a la config ──────────────
void handleNotFound() {
  server.sendHeader("Location", "http://192.168.4.1", true);
  server.send(302, "text/plain", "");
}

// ════════════════════════════════════════════════════════════
//  CONFIGURACIÓN PERSISTENTE
// ════════════════════════════════════════════════════════════
void cargarConfig() {
  prefs.begin("classaccess", true);   // read-only
  cfgSSID       = prefs.getString("ssid",  "");
  cfgPassword   = prefs.getString("pass",  "");
  cfgBackendURL = prefs.getString("url",   "");
  cfgAulaId     = prefs.getInt   ("aula",  1);
  prefs.end();

  Serial.printf("[CONFIG] Cargada → SSID: '%s' | Aula: %d\n",
    cfgSSID.c_str(), cfgAulaId);
}

void borrarConfig() {
  prefs.begin("classaccess", false);
  prefs.clear();
  prefs.end();
  cfgSSID = "";
  cfgPassword = "";
  cfgBackendURL = "";
  cfgAulaId = 1;
  Serial.println("[CONFIG] Config borrada");
}

// ════════════════════════════════════════════════════════════
//  CONEXIÓN WiFi
// ════════════════════════════════════════════════════════════
bool intentarConexion() {
  if (cfgSSID.length() == 0) return false;

  Serial.printf("[WiFi] Conectando a '%s'", cfgSSID.c_str());
  WiFi.mode(WIFI_STA);
  WiFi.begin(cfgSSID.c_str(), cfgPassword.c_str());

  unsigned long t = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - t > WIFI_CONNECT_TIMEOUT_MS) {
      Serial.println("\n[WiFi] Timeout de conexión");
      return false;
    }
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n[WiFi] Conectado!");
  Serial.printf("[WiFi] IP: %s\n", WiFi.localIP().toString().c_str());
  return true;
}

// ════════════════════════════════════════════════════════════
//  CONSULTA AL BACKEND
// ════════════════════════════════════════════════════════════
void consultarEstadoAula() {
  if (cfgBackendURL.length() == 0) {
    Serial.println("[HTTP] Sin URL de backend configurada");
    return;
  }

  HTTPClient http;
  String url = cfgBackendURL + "?aula=" + String(cfgAulaId);
  Serial.printf("[HTTP] GET %s\n", url.c_str());

  http.begin(url);
  http.setTimeout(HTTP_TIMEOUT_MS);

  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();
    Serial.printf("[HTTP] %s\n", payload.c_str());

    StaticJsonDocument<256> doc;
    DeserializationError err = deserializeJson(doc, payload);

    if (err) {
      Serial.printf("[JSON] Error: %s\n", err.c_str());
      http.end();
      return;
    }

    bool   success    = doc["success"]    | false;
    bool   abrirChapa = doc["abrir_chapa"] | false;
    const char* estado = doc["estado"]    | "desconocido";

    if (success) {
      Serial.printf("[AULA] Estado: %-12s | Chapa: %s\n",
        estado, abrirChapa ? "ABRIR" : "CERRAR");

      if (abrirChapa && !chapaAbierta)        abrirChapaFn();
      else if (!abrirChapa && chapaAbierta)   cerrarChapa();

    } else {
      Serial.println("[HTTP] success=false");
    }

  } else if (httpCode > 0) {
    Serial.printf("[HTTP] Error %d\n", httpCode);
  } else {
    Serial.printf("[HTTP] Error de red: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

// ════════════════════════════════════════════════════════════
//  CONTROL DE LA CHAPA
// ════════════════════════════════════════════════════════════
void abrirChapaFn() {
  Serial.println("[CHAPA] ▶ ABRIENDO");
  digitalWrite(PIN_CHAPA, RELAY_HIGH_ABRE ? HIGH : LOW);
  chapaAbierta = true;
}

void cerrarChapa() {
  Serial.println("[CHAPA] ■ CERRANDO");
  digitalWrite(PIN_CHAPA, RELAY_HIGH_ABRE ? LOW : HIGH);
  chapaAbierta = false;
}
