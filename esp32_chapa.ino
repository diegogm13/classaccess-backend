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

// ─── BACKEND (fijo) ──────────────────────────────────────────
#define BACKEND_URL    "https://classaccess-backend.vercel.app/api/esp32/estado"

// ─── TIMEOUTS ───────────────────────────────────────────────
#define WIFI_CONNECT_TIMEOUT_MS   15000   // 15 s para conectar al WiFi guardado
#define INTERVALO_CONSULTA_MS      5000   // Consulta al backend cada 5 s
#define HTTP_TIMEOUT_MS           15000   // Timeout HTTP (Vercel puede tardar en arrancar)
#define HTTP_REINTENTOS               3   // Reintentos si falla la consulta

// ─── RELAY ──────────────────────────────────────────────────
// true  = HIGH abre la chapa  (relay NO - normalmente abierto)
// false = HIGH cierra la chapa (relay NC - normalmente cerrado)
#define RELAY_HIGH_ABRE  false

// ════════════════════════════════════════════════════════════
//  PÁGINA HTML DEL PORTAL DE CONFIGURACIÓN
// ════════════════════════════════════════════════════════════
const char HTML_PORTAL[] PROGMEM = R"rawhtml(
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>ClassAccess</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:24px 16px 48px}
.logo{margin:20px 0 4px;display:flex;align-items:center;gap:10px}
.logo-icon{width:46px;height:46px;background:linear-gradient(135deg,#e94560,#c62a47);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 4px 16px rgba(233,69,96,.4)}
.logo-text{color:#fff;font-size:22px;font-weight:700}
.logo-sub{color:#718096;font-size:12px;margin-bottom:22px}
.card{background:rgba(255,255,255,.06);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:22px;width:100%;max-width:420px;box-shadow:0 16px 48px rgba(0,0,0,.4)}
.card+.card{margin-top:14px}
.sec{color:#e94560;font-size:10px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:8px}
.sec::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.08)}
label{display:block;color:#a0aec0;font-size:12px;font-weight:600;margin-bottom:6px}
input[type=text],input[type=password],input[type=number]{width:100%;padding:12px 14px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.11);border-radius:10px;color:#fff;font-size:15px;outline:none;transition:border .2s,background .2s}
input:focus{border-color:#e94560;background:rgba(233,69,96,.08)}
input::placeholder{color:rgba(255,255,255,.25)}
.pw-wrap{position:relative}
.pw-wrap input{padding-right:44px}
.eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#718096;font-size:18px;line-height:1;padding:4px}
.pw-row{display:none;margin-top:14px}
.pw-row.show{display:block}
.nets{display:flex;flex-direction:column;gap:8px;max-height:240px;overflow-y:auto;margin-bottom:4px}
.nets::-webkit-scrollbar{width:3px}
.nets::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:3px}
.net{display:flex;align-items:center;gap:10px;padding:11px 13px;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.08);border-radius:11px;cursor:pointer;transition:all .15s;-webkit-tap-highlight-color:transparent}
.net:active,.net.sel{background:rgba(233,69,96,.14);border-color:rgba(233,69,96,.45);box-shadow:0 0 0 2px rgba(233,69,96,.2)}
.net-name{color:#e2e8f0;font-size:14px;font-weight:500;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bars{display:flex;align-items:flex-end;gap:2px;height:16px;flex-shrink:0}
.bars span{width:4px;background:#48c78e;border-radius:1px}
.bars span:nth-child(1){height:5px}
.bars span:nth-child(2){height:9px}
.bars span:nth-child(3){height:14px}
.bars.med span:nth-child(3){background:rgba(255,255,255,.2)}
.bars.low span:nth-child(2),.bars.low span:nth-child(3){background:rgba(255,255,255,.2)}
.bars.med{filter:hue-rotate(30deg)}
.lock{font-size:13px;flex-shrink:0;opacity:.6}
.scanning{display:flex;align-items:center;justify-content:center;gap:8px;padding:18px;color:#718096;font-size:13px}
.spin{display:inline-block;animation:spin .7s linear infinite;font-size:18px}
@keyframes spin{to{transform:rotate(360deg)}}
.rescan{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;margin-top:12px;padding:9px;background:none;border:1px dashed rgba(255,255,255,.15);border-radius:9px;color:#718096;font-size:12px;cursor:pointer;transition:all .2s}
.rescan:hover{border-color:rgba(255,255,255,.3);color:#a0aec0}
.hint{color:#4a5568;font-size:11px;margin-top:7px;line-height:1.5}
.btn{width:100%;padding:15px;background:linear-gradient(135deg,#e94560,#c62a47);border:none;border-radius:12px;color:#fff;font-size:16px;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 4px 18px rgba(233,69,96,.35)}
.btn:active{transform:scale(.98)}
.btn:disabled{opacity:.5;cursor:not-allowed}
.toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%) translateY(120px);background:#1e2235;border:1px solid rgba(255,255,255,.12);color:#e2e8f0;padding:13px 20px;border-radius:12px;font-size:13px;font-weight:500;box-shadow:0 8px 28px rgba(0,0,0,.5);transition:transform .3s cubic-bezier(.34,1.56,.64,1);z-index:999;text-align:center;max-width:88vw}
.toast.show{transform:translateX(-50%) translateY(0)}
.toast.ok{border-color:rgba(72,199,142,.35)}
.toast.err{border-color:rgba(233,69,96,.4)}
</style>
</head>
<body>

<div class="logo">
  <div class="logo-icon">🔐</div>
  <div class="logo-text">ClassAccess</div>
</div>
<div class="logo-sub">Configuración del dispositivo</div>

<!-- WiFi -->
<div class="card">
  <div class="sec">Red WiFi</div>
  <div class="nets" id="nets">
    <div class="scanning"><span class="spin">⟳</span> Buscando redes...</div>
  </div>
  <button class="rescan" id="rescan-btn" onclick="scan()" style="display:none">
    ⟳ &nbsp;Buscar de nuevo
  </button>

  <!-- Contraseña: solo aparece si la red es privada -->
  <div class="pw-row" id="pw-row">
    <label id="pw-label">Contraseña</label>
    <div class="pw-wrap">
      <input type="password" id="pwd" placeholder="Contraseña del WiFi" autocomplete="new-password">
      <button class="eye" onclick="toggleEye()" type="button">👁</button>
    </div>
  </div>
</div>

<!-- Aula -->
<div class="card">
  <div class="sec">Salón</div>
  <label>ID del Aula</label>
  <input type="number" id="aula" placeholder="Ej: 3" min="1" value="__AULA_ID__">
  <p class="hint">Número del salón que controla este dispositivo</p>
</div>

<!-- Guardar -->
<div class="card">
  <button class="btn" id="save-btn" onclick="guardar()">Conectar</button>
</div>

<div class="toast" id="toast"></div>

<script>
const $ = id => document.getElementById(id);
let selectedNet = null;  // {ssid, encrypted}

// ── Escanear al cargar ─────────────────────────────────────────
window.onload = scan;

async function scan() {
  selectedNet = null;
  showPwRow(false);
  $('nets').innerHTML = '<div class="scanning"><span class="spin">⟳</span> Buscando redes...</div>';
  $('rescan-btn').style.display = 'none';

  try {
    const r = await fetch('/scan');
    const nets = await r.json();
    renderNets(nets);
  } catch(e) {
    $('nets').innerHTML = '<div class="scanning" style="color:#e94560">Error al escanear</div>';
  }
  $('rescan-btn').style.display = 'flex';
}

function renderNets(nets) {
  const container = $('nets');
  container.innerHTML = '';
  if (!nets.length) {
    container.innerHTML = '<div class="scanning">No se encontraron redes</div>';
    return;
  }
  nets.forEach(n => {
    const d = document.createElement('div');
    d.className = 'net';
    const quality = n.rssi >= -60 ? 'hi' : n.rssi >= -75 ? 'med' : 'low';
    const barClass = quality === 'hi' ? '' : quality;
    d.innerHTML =
      '<div class="bars ' + barClass + '"><span></span><span></span><span></span></div>' +
      '<span class="net-name">' + esc(n.ssid) + '</span>' +
      (n.encrypted ? '<span class="lock">🔒</span>' : '');
    d.onclick = () => selectNet(n, d);
    container.appendChild(d);
  });
}

function selectNet(net, el) {
  document.querySelectorAll('.net').forEach(e => e.classList.remove('sel'));
  el.classList.add('sel');
  selectedNet = net;
  showPwRow(net.encrypted);
  if (net.encrypted) setTimeout(() => $('pwd').focus(), 100);
}

function showPwRow(show) {
  const row = $('pw-row');
  if (show) { row.classList.add('show'); }
  else       { row.classList.remove('show'); $('pwd').value = ''; }
}

// ── Guardar ────────────────────────────────────────────────────
async function guardar() {
  if (!selectedNet) { toast('Selecciona una red WiFi', 'err'); return; }
  const pwd  = $('pwd').value;
  const aula = $('aula').value.trim();

  if (selectedNet.encrypted && !pwd) { toast('Esta red requiere contraseña', 'err'); return; }
  if (!aula || isNaN(aula) || parseInt(aula) < 1) { toast('Ingresa un ID de aula válido', 'err'); return; }

  const btn = $('save-btn');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  try {
    const r = await fetch('/save', {
      method: 'POST',
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body: 'ssid='     + encodeURIComponent(selectedNet.ssid)
          + '&password='+ encodeURIComponent(pwd)
          + '&aula='    + encodeURIComponent(aula)
    });
    const d = await r.json();
    if (d.ok) {
      toast('Guardado ✅ Reiniciando...', 'ok');
      btn.textContent = 'Reiniciando...';
    } else {
      toast('Error: ' + (d.msg || 'desconocido'), 'err');
      btn.disabled = false;
      btn.textContent = 'Conectar';
    }
  } catch(e) {
    toast('Error de conexión', 'err');
    btn.disabled = false;
    btn.textContent = 'Conectar';
  }
}

function toggleEye() {
  const i = $('pwd');
  i.type = i.type === 'password' ? 'text' : 'password';
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

let tt;
function toast(msg, type) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show ' + (type||'');
  clearTimeout(tt);
  tt = setTimeout(() => t.className = 'toast', 4000);
}
</script>
</body>
</html>
)rawhtml";

// ════════════════════════════════════════════════════════════
//  FORWARD DECLARATIONS
// ════════════════════════════════════════════════════════════
void cargarConfig();
void borrarConfig();
bool intentarConexion();
void iniciarServidor();
void consultarEstadoAula();
void abrirChapaFn();
void cerrarChapa();
void handleRoot();
void handleScan();
void handleSave();
void handleStatus();
void handleNotFound();

// ════════════════════════════════════════════════════════════
//  GLOBALES
// ════════════════════════════════════════════════════════════
WebServer  server(80);
DNSServer  dnsServer;
Preferences prefs;

// Config persistente
String cfgSSID      = "";
String cfgPassword  = "";
int    cfgAulaId    = 0;

// Estado del sistema
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

  // Verificar si el botón BOOT está presionado (borrar config)
  if (digitalRead(PIN_RESET_CFG) == LOW) {
    Serial.println("[CONFIG] Botón BOOT presionado → Borrando config...");
    borrarConfig();
    delay(1000);
  }

  // Siempre iniciar el AP + servidor web (accesible en todo momento)
  iniciarServidor();

  // Si hay WiFi guardado, intentar conectarse
  if (cfgSSID.length() > 0) {
    intentarConexion();
  } else {
    Serial.println("[MODO] Sin config WiFi — esperando configuración en http://192.168.4.1");
  }
}

// ════════════════════════════════════════════════════════════
//  LOOP
// ════════════════════════════════════════════════════════════
void loop() {
  // El portal siempre atiende peticiones
  dnsServer.processNextRequest();
  server.handleClient();

  // Solo consultar backend si hay WiFi y aula configurada
  if (WiFi.status() != WL_CONNECTED || cfgAulaId < 1) return;

  unsigned long ahora = millis();
  if (ahora - ultimaConsulta >= INTERVALO_CONSULTA_MS) {
    ultimaConsulta = ahora;
    consultarEstadoAula();
  }
}

// ════════════════════════════════════════════════════════════
//  PORTAL DE CONFIGURACIÓN
// ════════════════════════════════════════════════════════════
void iniciarServidor() {
  Serial.println("\n[PORTAL] Iniciando AP + servidor web...");

  // Modo AP+STA: mantiene el AP activo siempre aunque se conecte a WiFi
  WiFi.mode(WIFI_AP_STA);

  IPAddress apIP(192, 168, 4, 1);
  WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));
  WiFi.softAP(AP_SSID, strlen(AP_PASSWORD) > 0 ? AP_PASSWORD : nullptr);

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
  Serial.println("[PORTAL] Servidor siempre disponible en http://192.168.4.1");
  Serial.println("[PORTAL] Red: " + String(AP_SSID) + " | Pass: " + String(AP_PASSWORD));
}

// ─── Página principal ────────────────────────────────────────
void handleRoot() {
  String html = String(HTML_PORTAL);
  html.replace("__AULA_ID__", cfgAulaId > 0 ? String(cfgAulaId) : "");
  server.send(200, "text/html; charset=utf-8", html);
}

// ─── Escanear redes WiFi ─────────────────────────────────────
void handleScan() {
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
  if (!server.hasArg("ssid") || !server.hasArg("aula")) {
    server.send(400, "application/json", "{\"ok\":false,\"msg\":\"Faltan parametros\"}");
    return;
  }

  String newSSID    = server.arg("ssid");
  String newPass    = server.arg("password");
  String newAulaStr = server.arg("aula");

  if (newSSID.length() == 0 || newAulaStr.length() == 0) {
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
  prefs.putString("ssid",  newSSID);
  prefs.putString("pass",  newPass);
  prefs.putInt   ("aula",  newAula);
  prefs.end();

  Serial.printf("[CONFIG] Guardado → SSID: %s | Aula: %d\n",
    newSSID.c_str(), newAula);

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
  cfgSSID     = prefs.getString("ssid", "");
  cfgPassword = prefs.getString("pass", "");
  cfgAulaId   = prefs.getInt   ("aula", 0);
  prefs.end();

  Serial.printf("[CONFIG] Cargada → SSID: '%s' | Aula: %d\n",
    cfgSSID.c_str(), cfgAulaId);
}

void borrarConfig() {
  prefs.begin("classaccess", false);
  prefs.clear();
  prefs.end();
  cfgSSID     = "";
  cfgPassword = "";
  cfgAulaId   = 0;
  Serial.println("[CONFIG] Config borrada");
}

// ════════════════════════════════════════════════════════════
//  CONEXIÓN WiFi
// ════════════════════════════════════════════════════════════
bool intentarConexion() {
  if (cfgSSID.length() == 0) return false;

  Serial.printf("[WiFi] Conectando a '%s'", cfgSSID.c_str());
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
  String url = String(BACKEND_URL) + "?aula=" + String(cfgAulaId);

  for (int intento = 1; intento <= HTTP_REINTENTOS; intento++) {
    if (intento > 1) {
      Serial.printf("[HTTP] Reintento %d/%d...\n", intento, HTTP_REINTENTOS);
      delay(1500);
    }

    // Verificar WiFi antes de cada intento
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[HTTP] Sin WiFi, abortando consulta");
      return;
    }

    HTTPClient http;
    http.begin(url);
    http.setTimeout(HTTP_TIMEOUT_MS);

    int httpCode = http.GET();

    if (httpCode == 200) {
      String payload = http.getString();
      http.end();

      StaticJsonDocument<256> doc;
      DeserializationError err = deserializeJson(doc, payload);

      if (err) {
        Serial.printf("[JSON] Error al parsear: %s\n", err.c_str());
        continue;  // reintentar
      }

      bool success    = doc["success"]     | false;
      bool abrirChapa = doc["abrir_chapa"] | false;
      const char* estado = doc["estado"]   | "?";

      if (!success) {
        Serial.println("[HTTP] success=false, reintentando...");
        continue;
      }

      // Respuesta válida — aplicar estado
      Serial.printf("[AULA] %-12s → chapa: %s\n",
        estado, abrirChapa ? "ABIERTA" : "CERRADA");

      if (abrirChapa && !chapaAbierta)      abrirChapaFn();
      else if (!abrirChapa && chapaAbierta) cerrarChapa();

      return;  // éxito, salir del loop

    } else {
      String err = httpCode > 0
        ? "HTTP " + String(httpCode)
        : http.errorToString(httpCode);
      Serial.printf("[HTTP] Error: %s\n", err.c_str());
      http.end();
      // continuar al siguiente intento
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  // Mantenemos el último estado conocido de la chapa (no hacemos nada)
  Serial.println("[HTTP] Todos los intentos fallaron — manteniendo estado actual");
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
