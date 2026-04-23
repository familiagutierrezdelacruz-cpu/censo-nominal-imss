var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fs from "fs";
import webpush from "web-push";
// Push Notifications Setup (VAPID Keys)
try {
    webpush.setVapidDetails("mailto:soporte@tuapp.com", "BDx2N8k0yjgG_kBeRuTJ8sPtBGLqVXN0N4ZEoXNWCz9UQt5Tt1uL1kxwrV7XrtIWPBY88NyDt79OaH8dNFmO04s", "oJnLMJNjlI_LiTtaxyKcf0Gx-F70UB9yPHtdsAHYqTo");
}
catch (err) {
    console.error("[NOTIFICATIONS ERROR] Failed to set VAPID details:", err);
}
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
// In Railway, we'll use a 'data' folder in the root, which the volume should be mounted to.
var DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
var DB_PATH = path.join(DATA_DIR, "census.db");
var db = new Database(DB_PATH);
var JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-123";
var BACKUP_DIR = path.join(DATA_DIR, "backups");
// Automatic Backup System
function performBackup() {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }
        var timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
        var backupPath = path.join(BACKUP_DIR, "census_backup_".concat(timestamp, ".db"));
        // Only backup if not already backed up today
        if (!fs.existsSync(backupPath)) {
            fs.copyFileSync(DB_PATH, backupPath);
            console.log("[BACKUP] Database backed up to: ".concat(backupPath));
            // Clean up old backups (keep last 30)
            var files = fs.readdirSync(BACKUP_DIR)
                .filter(function (f) { return f.startsWith("census_backup_"); })
                .sort(function (a, b) { return fs.statSync(path.join(BACKUP_DIR, b)).mtime.getTime() - fs.statSync(path.join(BACKUP_DIR, a)).mtime.getTime(); });
            if (files.length > 30) {
                files.slice(30).forEach(function (f) {
                    fs.unlinkSync(path.join(BACKUP_DIR, f));
                    console.log("[BACKUP] Deleted old backup: ".concat(f));
                });
            }
        }
    }
    catch (err) {
        console.error("[BACKUP ERROR]:", err);
    }
}
// Run backup on start and every 24 hours
performBackup();
setInterval(performBackup, 24 * 60 * 60 * 1000);
// Initialize Hierarchical Database
db.exec("\n  CREATE TABLE IF NOT EXISTS estados (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    nombre TEXT UNIQUE NOT NULL\n  )\n");
db.exec("\n  CREATE TABLE IF NOT EXISTS regiones (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    nombre TEXT NOT NULL,\n    estado_id INTEGER NOT NULL,\n    FOREIGN KEY(estado_id) REFERENCES estados(id),\n    UNIQUE(nombre, estado_id)\n  )\n");
db.exec("\n  CREATE TABLE IF NOT EXISTS zonas (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    nombre TEXT NOT NULL,\n    region_id INTEGER NOT NULL,\n    FOREIGN KEY(region_id) REFERENCES regiones(id),\n    UNIQUE(nombre, region_id)\n  )\n");
db.exec("\n  CREATE TABLE IF NOT EXISTS health_units (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    nombre TEXT UNIQUE,\n    clues TEXT UNIQUE,\n    zona_id INTEGER,\n    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n    FOREIGN KEY(zona_id) REFERENCES zonas(id)\n  )\n");
db.exec("\n  CREATE TABLE IF NOT EXISTS users (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    username TEXT UNIQUE,\n    password TEXT,\n    role TEXT DEFAULT 'UNIT_USER', -- 'ADMIN', 'ESTATAL', 'REGIONAL', 'ZONAL', 'UNIT_USER'\n    health_unit_id INTEGER,\n    estado_id INTEGER,\n    region_id INTEGER,\n    zona_id INTEGER,\n    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n    FOREIGN KEY(health_unit_id) REFERENCES health_units(id),\n    FOREIGN KEY(estado_id) REFERENCES estados(id),\n    FOREIGN KEY(region_id) REFERENCES regiones(id),\n    FOREIGN KEY(zona_id) REFERENCES zonas(id)\n  )\n");
db.exec("\n  CREATE TABLE IF NOT EXISTS push_subscriptions (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    user_id INTEGER NOT NULL,\n    subscription TEXT NOT NULL,\n    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n    FOREIGN KEY(user_id) REFERENCES users(id)\n  )\n");
db.exec("\n  CREATE TABLE IF NOT EXISTS census (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    health_unit_id INTEGER,\n    folio TEXT UNIQUE,\n    nombre TEXT,\n    curp TEXT,\n    telefono TEXT,\n    domicilio TEXT,\n    reporte_mp TEXT,\n    folio_intransferible TEXT,\n    tipo_localidad TEXT,\n    derechohabiencia TEXT,\n    fecha_nacimiento TEXT,\n    condicion TEXT,\n    gestas INTEGER,\n    cesareas INTEGER,\n    fecha_ultima_cesarea TEXT,\n    partos INTEGER,\n    abortos INTEGER,\n    fecha_ultimo_aborto TEXT,\n    fum TEXT,\n    riesgo_obstetrico TEXT,\n    factores_riesgo TEXT,\n    riesgo_social TEXT,\n    salud_mental_fecha TEXT,\n    salud_mental_puntaje INTEGER,\n    tas INTEGER,\n    tad INTEGER,\n    td_fecha_1ra TEXT,\n    td_fecha_2da TEXT,\n    td_fecha_3ra TEXT,\n    tdpa_fecha TEXT,\n    influenza_fecha TEXT,\n    tamiz_dm TEXT,\n    bh_hb TEXT,\n    tipo_sangre TEXT,\n    rh TEXT,\n    vih_resultado TEXT,\n    vih_fecha TEXT,\n    sifilis_resultado TEXT,\n    sifilis_fecha TEXT,\n    ego_resultado TEXT,\n    ego_fecha TEXT,\n    acido_folico TEXT,\n    fumarato_ferroso TEXT,\n    aas TEXT,\n    calcio TEXT,\n    estado_salud_actual TEXT,\n    plan_seguridad TEXT,\n    plan_seguridad_fecha TEXT,\n    plan_manejo TEXT,\n    ref_mater_hospital TEXT,\n    ref_mater_acudio TEXT,\n    ref_mater_resultado TEXT,\n    ref_urgencias_hospital TEXT,\n    ref_urgencias_acudio TEXT,\n    ref_urgencias_resultado TEXT,\n    derivacion_plataforma_comunitaria TEXT,\n    control_parteria_tradicional TEXT,\n    nombre_partera TEXT,\n    conclusion_embarazo TEXT,\n    sdg_nacimiento INTEGER,\n    fecha_atencion_evento TEXT,\n    lugar_atencion_evento TEXT,\n    estado_salud_materna_puerperio TEXT,\n    rn_estado TEXT,\n    rn_genero TEXT,\n    rn_salud TEXT,\n    tamiz_metabolico_fecha TEXT,\n    tamiz_metabolico_sospechoso TEXT,\n    tamiz_auditivo_fecha TEXT,\n    tamiz_auditivo_sospechoso TEXT,\n    mpf_eleccion TEXT,\n    mpf_aplicado TEXT,\n    motivo_rechazo_mpf TEXT,\n    diagnostico_especifico TEXT,\n    club_embarazadas TEXT,\n    seguimiento_ts TEXT,\n    fecha_actualizacion_ts TEXT,\n    fecha_ultima_consulta TEXT,\n    fecha_proxima_cita TEXT,\n    medico_nombre TEXT,\n    medico_cedula TEXT,\n    medico_atencion TEXT,\n    nucleo_nombre TEXT,\n    observaciones_generales TEXT,\n    is_historical INTEGER DEFAULT 0,\n    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n    FOREIGN KEY(health_unit_id) REFERENCES health_units(id)\n  )\n");
// Initial database check
console.log("[DB] Initializing database at: ".concat(DB_PATH));
var tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("[DB] Found tables: ".concat(tables.map(function (t) { return t.name; }).join(", ")));
db.exec("\n  CREATE TABLE IF NOT EXISTS nucleos (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    health_unit_id INTEGER,\n    nombre TEXT,\n    medico_nombre TEXT,\n    medico_cedula TEXT,\n    FOREIGN KEY(health_unit_id) REFERENCES health_units(id),\n    UNIQUE(health_unit_id, nombre)\n  )\n");
// Migration: Add new columns if they don't exist
var columns = db.prepare("PRAGMA table_info(census)").all();
var columnNames = columns.map(function (c) { return c.name; });
console.log('[DB] Current census table columns:', columnNames.length);
var validColumns = [
    "health_unit_id", "folio", "nombre", "curp", "telefono", "domicilio", "reporte_mp", "folio_intransferible", "tipo_localidad", "derechohabiencia",
    "fecha_nacimiento", "condicion", "gestas", "cesareas", "fecha_ultima_cesarea",
    "partos", "abortos", "fecha_ultimo_aborto", "fum", "riesgo_obstetrico",
    "factores_riesgo", "riesgo_social", "salud_mental_fecha", "salud_mental_puntaje",
    "tas", "tad", "td_fecha_1ra", "td_fecha_2da", "td_fecha_3ra", "tdpa_fecha", "influenza_fecha", "tamiz_dm", "bh_hb", "tipo_sangre", "rh", "vih_resultado", "vih_fecha",
    "sifilis_resultado", "sifilis_fecha", "ego_resultado", "ego_fecha",
    "acido_folico", "fumarato_ferroso", "aas", "calcio", "estado_salud_actual",
    "plan_seguridad", "plan_seguridad_fecha", "plan_manejo", "ref_mater_hospital",
    "ref_mater_acudio", "ref_mater_resultado", "ref_urgencias_hospital",
    "ref_urgencias_acudio", "ref_urgencias_resultado",
    "derivacion_plataforma_comunitaria", "control_parteria_tradicional", "nombre_partera",
    "conclusion_embarazo",
    "sdg_nacimiento", "fecha_atencion_evento", "lugar_atencion_evento",
    "estado_salud_materna_puerperio", "rn_estado", "rn_genero", "rn_salud",
    "tamiz_metabolico_fecha", "tamiz_metabolico_sospechoso", "tamiz_auditivo_fecha", "tamiz_auditivo_sospechoso", "mpf_eleccion",
    "mpf_aplicado", "motivo_rechazo_mpf", "diagnostico_especifico", "plan_manejo_puerperio",
    "club_embarazadas", "seguimiento_ts", "fecha_actualizacion_ts",
    "fecha_ultima_consulta", "fecha_proxima_cita", "medico_nombre", "medico_cedula", "medico_atencion", "nucleo_nombre",
    "fecha_usg_reciente", "conclusiones_usg",
    "observaciones_generales",
    "is_historical"
];
db.transaction(function () {
    for (var _i = 0, validColumns_1 = validColumns; _i < validColumns_1.length; _i++) {
        var col = validColumns_1[_i];
        if (!columnNames.includes(col)) {
            console.log("[DB] Adding missing column: ".concat(col));
            try {
                var type = col === 'is_historical' ? 'INTEGER DEFAULT 0' : 'TEXT';
                db.exec("ALTER TABLE census ADD COLUMN ".concat(col, " ").concat(type));
            }
            catch (err) {
                console.error("[DB ERROR] Failed to add column ".concat(col, ":"), err);
            }
        }
    }
    // Ensure all records have a value for is_historical
    db.exec("UPDATE census SET is_historical = 0 WHERE is_historical IS NULL");
})();
console.log('[DB] Database migration check completed.');
// Auth Middleware
var authenticateToken = function (req, res, next) {
    var authHeader = req.headers['authorization'];
    var token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return res.status(401).json({ error: "No autorizado" });
    jwt.verify(token, JWT_SECRET, function (err, user) {
        if (err)
            return res.status(403).json({ error: "Token inválido" });
        req.user = user;
        next();
    });
};
var isAdmin = function (req, res, next) {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'ADMIN') {
        return res.status(403).json({ error: "Requiere privilegios de administrador" });
    }
    next();
};
/**
 * Returns a filter object for SQL queries based on the user's hierarchy level.
 * @param user The authenticated user object from the request.
 * @returns An object with the WHERE condition and the parameters.
 */
function getHierarchyFilter(user) {
    var role = user.role, health_unit_id = user.health_unit_id, zona_id = user.zona_id, region_id = user.region_id, estado_id = user.estado_id;
    if (role === 'ADMIN') {
        return { condition: "1=1", params: [] };
    }
    if (role === 'ESTATAL') {
        return {
            condition: "health_unit_id IN (\n        SELECT hu.id FROM health_units hu\n        JOIN zonas z ON hu.zona_id = z.id\n        JOIN regiones r ON z.region_id = r.id\n        WHERE r.estado_id = ?\n      )",
            params: [estado_id]
        };
    }
    if (role === 'REGIONAL') {
        return {
            condition: "health_unit_id IN (\n        SELECT hu.id FROM health_units hu\n        JOIN zonas z ON hu.zona_id = z.id\n        WHERE z.region_id = ?\n      )",
            params: [region_id]
        };
    }
    if (role === 'ZONAL') {
        return {
            condition: "health_unit_id IN (\n        SELECT id FROM health_units WHERE zona_id = ?\n      )",
            params: [zona_id]
        };
    }
    // DEFAULT: UNIT_USER (Local)
    return {
        condition: "health_unit_id = ?",
        params: [health_unit_id]
    };
}
// Create default admin if not exists
var adminExists = db.prepare("SELECT * FROM users WHERE role = 'ADMIN'").get();
if (!adminExists) {
    var hashedPassword = bcrypt.hashSync("admin123", 10);
    db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("admin", hashedPassword, "ADMIN");
    console.log("Default admin created: admin / admin123");
}
// Check for alerts and send notifications
function checkAndSendAlerts() {
    return __awaiter(this, void 0, void 0, function () {
        var today, census, _i, census_1, p, lastVisit, diffTime, diffDays, needsAlert, subRows, payload, _a, subRows_1, row, sub, err_1, err_2;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log("[NOTIFICATIONS] Running health check for patients needing follow-up...");
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 10, , 11]);
                    today = new Date();
                    census = db.prepare("\n      SELECT c.id, c.nombre, c.folio, c.condicion, c.fecha_ultima_consulta, c.medico_nombre, c.health_unit_id \n      FROM census c \n      WHERE COALESCE(c.is_historical, 0) = 0 \n      AND c.fecha_ultima_consulta IS NOT NULL\n      AND c.fecha_ultima_consulta != ''\n    ").all();
                    _i = 0, census_1 = census;
                    _d.label = 2;
                case 2:
                    if (!(_i < census_1.length)) return [3 /*break*/, 9];
                    p = census_1[_i];
                    lastVisit = new Date(p.fecha_ultima_consulta);
                    diffTime = Math.abs(today.getTime() - lastVisit.getTime());
                    diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    needsAlert = false;
                    if (((_b = p.condicion) === null || _b === void 0 ? void 0 : _b.startsWith('EMBARAZADA')) && diffDays >= 30) {
                        needsAlert = true;
                    }
                    else if (((_c = p.condicion) === null || _c === void 0 ? void 0 : _c.startsWith('PUERPERA')) && diffDays >= 7) {
                        needsAlert = true;
                    }
                    if (!needsAlert) return [3 /*break*/, 8];
                    subRows = db.prepare("\n          SELECT s.subscription \n          FROM push_subscriptions s\n          JOIN users u ON s.user_id = u.id\n          WHERE u.health_unit_id = ?\n        ").all(p.health_unit_id);
                    payload = JSON.stringify({
                        title: "⚠️ Alerta de Seguimiento: Paciente sin actualización",
                        body: "Estimado/a Dr/a. ".concat(p.medico_nombre || 'Médico', ", se ha detectado que la paciente ").concat(p.nombre, " tiene ").concat(diffDays, " d\u00EDas o m\u00E1s sin registrar datos en el censo. Se recomienda contactarla para verificar su estado de salud."),
                        data: { patientId: p.id }
                    });
                    _a = 0, subRows_1 = subRows;
                    _d.label = 3;
                case 3:
                    if (!(_a < subRows_1.length)) return [3 /*break*/, 8];
                    row = subRows_1[_a];
                    _d.label = 4;
                case 4:
                    _d.trys.push([4, 6, , 7]);
                    sub = JSON.parse(row.subscription);
                    return [4 /*yield*/, webpush.sendNotification(sub, payload)];
                case 5:
                    _d.sent();
                    console.log("[NOTIFICATIONS] Sent alert to a doctor for patient ".concat(p.nombre));
                    return [3 /*break*/, 7];
                case 6:
                    err_1 = _d.sent();
                    if (err_1.statusCode === 410 || err_1.statusCode === 404) {
                        // Expired subscription
                        db.prepare("DELETE FROM push_subscriptions WHERE subscription = ?").run(row.subscription);
                    }
                    return [3 /*break*/, 7];
                case 7:
                    _a++;
                    return [3 /*break*/, 3];
                case 8:
                    _i++;
                    return [3 /*break*/, 2];
                case 9: return [3 /*break*/, 11];
                case 10:
                    err_2 = _d.sent();
                    console.error("[NOTIFICATIONS ERROR]:", err_2);
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
}
// Run notification check every 12 hours (first run after 30s to let server stabilize)
setTimeout(checkAndSendAlerts, 30000);
setInterval(checkAndSendAlerts, 12 * 60 * 60 * 1000);
// Create a default health unit if none exists
var unitExists = db.prepare("SELECT * FROM health_units LIMIT 1").get();
if (!unitExists) {
    db.prepare("INSERT INTO health_units (nombre, clues) VALUES (?, ?)").run("Unidad de Salud Central", "CENTRAL001");
    console.log("Default health unit created: Unidad de Salud Central");
}
function startServer() {
    return __awaiter(this, void 0, void 0, function () {
        var app, PORT, vite, distPath_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    app = express();
                    PORT = Number(process.env.PORT) || 3000;
                    app.use(express.json());
                    // Auth Routes
                    app.post("/api/auth/login", function (req, res) {
                        var _a = req.body, username = _a.username, password = _a.password;
                        var user = db.prepare("\n      SELECT u.*, h.nombre as health_unit_name, h.clues, e.nombre as estado_name, r.nombre as region_name, z.nombre as zona_name\n      FROM users u \n      LEFT JOIN health_units h ON u.health_unit_id = h.id \n      LEFT JOIN estados e ON u.estado_id = e.id\n      LEFT JOIN regiones r ON u.region_id = r.id\n      LEFT JOIN zonas z ON u.zona_id = z.id\n      WHERE u.username = ?\n    ").get(username);
                        if (!user || !bcrypt.compareSync(password, user.password)) {
                            return res.status(401).json({ error: "Credenciales inválidas" });
                        }
                        var token = jwt.sign({
                            id: user.id,
                            username: user.username,
                            role: user.role,
                            health_unit_id: user.health_unit_id,
                            health_unit_name: user.health_unit_name,
                            health_unit_clues: user.clues,
                            estado_id: user.estado_id,
                            estado_name: user.estado_name,
                            region_id: user.region_id,
                            region_name: user.region_name,
                            zona_id: user.zona_id,
                            zona_name: user.zona_name
                        }, JWT_SECRET, { expiresIn: '24h' });
                        res.json({
                            token: token,
                            user: {
                                id: user.id,
                                username: user.username,
                                role: user.role,
                                health_unit_id: user.health_unit_id,
                                health_unit_name: user.health_unit_name,
                                health_unit_clues: user.clues,
                                estado_id: user.estado_id,
                                estado_name: user.estado_name,
                                region_id: user.region_id,
                                region_name: user.region_name,
                                zona_id: user.zona_id,
                                zona_name: user.zona_name
                            }
                        });
                    });
                    // Admin Routes (Unit Management)
                    app.get("/api/admin/units", authenticateToken, function (req, res) {
                        var _a;
                        var _b;
                        try {
                            var _c = getHierarchyFilter(req.user), condition = _c.condition, params = _c.params;
                            var units = (_a = db.prepare("SELECT * FROM health_units WHERE ".concat(condition, " OR ? = 'ADMIN'"))).all.apply(_a, __spreadArray(__spreadArray([], params, false), [(_b = req.user) === null || _b === void 0 ? void 0 : _b.role], false));
                            res.json(units);
                        }
                        catch (error) {
                            res.status(500).json({ error: error.message });
                        }
                    });
                    app.put("/api/admin/units/:id", authenticateToken, isAdmin, function (req, res) {
                        try {
                            var id = req.params.id;
                            var _a = req.body, nombre = _a.nombre, clues = _a.clues, zona_id = _a.zona_id;
                            db.prepare("UPDATE health_units SET nombre = ?, clues = ?, zona_id = ? WHERE id = ?")
                                .run(nombre, clues, zona_id ? parseInt(zona_id) : null, id);
                            res.json({ success: true });
                        }
                        catch (error) {
                            res.status(500).json({ error: error.message });
                        }
                    });
                    app.delete("/api/admin/units/:id", authenticateToken, isAdmin, function (req, res) {
                        try {
                            var id = req.params.id;
                            // Check if unit has census records
                            var hasRecords = db.prepare("SELECT 1 FROM census WHERE health_unit_id = ? LIMIT 1").get(id);
                            if (hasRecords) {
                                return res.status(400).json({ error: "No se puede eliminar una unidad con registros activos" });
                            }
                            db.prepare("DELETE FROM health_units WHERE id = ?").run(id);
                            res.json({ success: true });
                        }
                        catch (error) {
                            res.status(500).json({ error: error.message });
                        }
                    });
                    app.post("/api/admin/units", authenticateToken, isAdmin, function (req, res) {
                        try {
                            var _a = req.body, nombre = _a.nombre, clues = _a.clues, zona_id = _a.zona_id;
                            var info = db.prepare("INSERT INTO health_units (nombre, clues, zona_id) VALUES (?, ?, ?)")
                                .run(nombre, clues, zona_id ? parseInt(zona_id) : null);
                            res.json({ success: true, id: info.lastInsertRowid });
                        }
                        catch (error) {
                            res.status(500).json({ error: error.message });
                        }
                    });
                    app.get("/api/admin/users", authenticateToken, function (req, res) {
                        var _a;
                        try {
                            var _b = req.user, role = _b.role, estado_id = _b.estado_id, region_id = _b.region_id, zona_id = _b.zona_id, userId = _b.id;
                            var query = "\n        SELECT u.id, u.username, u.role, u.health_unit_id, u.estado_id, u.region_id, u.zona_id, h.nombre as health_unit_name \n        FROM users u \n        LEFT JOIN health_units h ON u.health_unit_id = h.id\n      ";
                            var params = [];
                            if (role === 'ADMIN') {
                                // sees everything
                            }
                            else if (role === 'ESTATAL') {
                                query += " WHERE u.estado_id = ? OR u.role = 'UNIT_USER' AND u.health_unit_id IN (SELECT id FROM health_units WHERE zona_id IN (SELECT id FROM zonas WHERE region_id IN (SELECT id FROM regiones WHERE estado_id = ?)))";
                                params = [estado_id, estado_id];
                            }
                            else if (role === 'REGIONAL') {
                                query += " WHERE u.region_id = ? OR u.role = 'UNIT_USER' AND u.health_unit_id IN (SELECT id FROM health_units WHERE zona_id IN (SELECT id FROM zonas WHERE region_id = ?))";
                                params = [region_id, region_id];
                            }
                            else if (role === 'ZONAL') {
                                query += " WHERE u.zona_id = ? OR u.role = 'UNIT_USER' AND u.health_unit_id IN (SELECT id FROM health_units WHERE zona_id = ?)";
                                params = [zona_id, zona_id];
                            }
                            else {
                                query += " WHERE u.id = ?";
                                params = [userId];
                            }
                            query += " ORDER BY u.role ASC, u.username ASC";
                            var users = (_a = db.prepare(query)).all.apply(_a, params);
                            res.json(users);
                        }
                        catch (error) {
                            res.status(500).json({ error: error.message });
                        }
                    });
                    app.post("/api/admin/users", authenticateToken, isAdmin, function (req, res) {
                        try {
                            var _a = req.body, username = _a.username, password = _a.password, role = _a.role, health_unit_id = _a.health_unit_id, estado_id = _a.estado_id, region_id = _a.region_id, zona_id = _a.zona_id;
                            var hashedPassword = bcrypt.hashSync(password, 10);
                            var info = db.prepare("INSERT INTO users (username, password, role, health_unit_id, estado_id, region_id, zona_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
                                .run(username, hashedPassword, role || 'UNIT_USER', health_unit_id ? parseInt(health_unit_id) : null, estado_id ? parseInt(estado_id) : null, region_id ? parseInt(region_id) : null, zona_id ? parseInt(zona_id) : null);
                            res.json({ success: true, id: info.lastInsertRowid });
                        }
                        catch (error) {
                            res.status(500).json({ error: error.message });
                        }
                    });
                    app.put("/api/admin/users/:id", authenticateToken, isAdmin, function (req, res) {
                        try {
                            var id = req.params.id;
                            var _a = req.body, username = _a.username, password = _a.password, role = _a.role, health_unit_id = _a.health_unit_id, estado_id = _a.estado_id, region_id = _a.region_id, zona_id = _a.zona_id;
                            if (password) {
                                var hashedPassword = bcrypt.hashSync(password, 10);
                                db.prepare("UPDATE users SET username = ?, password = ?, role = ?, health_unit_id = ?, estado_id = ?, region_id = ?, zona_id = ? WHERE id = ?")
                                    .run(username, hashedPassword, role, health_unit_id ? parseInt(health_unit_id) : null, estado_id ? parseInt(estado_id) : null, region_id ? parseInt(region_id) : null, zona_id ? parseInt(zona_id) : null, id);
                            }
                            else {
                                db.prepare("UPDATE users SET username = ?, role = ?, health_unit_id = ?, estado_id = ?, region_id = ?, zona_id = ? WHERE id = ?")
                                    .run(username, role, health_unit_id ? parseInt(health_unit_id) : null, estado_id ? parseInt(estado_id) : null, region_id ? parseInt(region_id) : null, zona_id ? parseInt(zona_id) : null, id);
                            }
                            res.json({ success: true });
                        }
                        catch (error) {
                            res.status(500).json({ error: error.message });
                        }
                    });
                    app.delete("/api/admin/users/:id", authenticateToken, isAdmin, function (req, res) {
                        var _a;
                        try {
                            var id = req.params.id;
                            // Prevent deleting self
                            var userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                            if (Number(id) === userId) {
                                return res.status(400).json({ error: "No puedes eliminar tu propio usuario" });
                            }
                            db.prepare("DELETE FROM users WHERE id = ?").run(id);
                            res.json({ success: true });
                        }
                        catch (error) {
                            res.status(500).json({ error: error.message });
                        }
                    });
                    app.post("/api/census/bulk", authenticateToken, function (req, res) {
                        var _a, _b;
                        var records = req.body;
                        if (!Array.isArray(records))
                            return res.status(400).json({ error: "Se esperaba un arreglo de registros" });
                        var health_unit_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.health_unit_id;
                        if (!health_unit_id && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'ADMIN') {
                            return res.status(403).json({ error: "No tiene una unidad de salud asignada" });
                        }
                        var year = new Date().getFullYear();
                        var lastRecord = db.prepare("SELECT id FROM census ORDER BY id DESC LIMIT 1").get();
                        var nextId = ((lastRecord === null || lastRecord === void 0 ? void 0 : lastRecord.id) || 0) + 1;
                        var importedCount = 0;
                        var updatedCount = 0;
                        var upsert = db.transaction(function (rows) {
                            var _a;
                            var _loop_1 = function (row) {
                                var _b, _c;
                                var curp = (_a = row.curp) === null || _a === void 0 ? void 0 : _a.toString().toUpperCase().trim();
                                var unitId = row.health_unit_id || health_unit_id;
                                var existing = null;
                                if (curp) {
                                    existing = db.prepare("SELECT id, folio FROM census WHERE curp = ? AND health_unit_id = ?").get(curp, unitId);
                                }
                                var data = __assign(__assign({}, row), { curp: curp, health_unit_id: unitId });
                                var recordToInsert = {};
                                for (var _d = 0, validColumns_2 = validColumns; _d < validColumns_2.length; _d++) {
                                    var col = validColumns_2[_d];
                                    if (col === 'is_historical') {
                                        recordToInsert[col] = data[col] !== undefined ? data[col] : 0;
                                    }
                                    else if (col === 'folio') {
                                        recordToInsert[col] = existing ? existing.folio : (data.folio || "CENSO-".concat(year, "-").concat(String(nextId++).padStart(3, "0")));
                                    }
                                    else {
                                        recordToInsert[col] = data[col] !== undefined ? data[col] : null;
                                    }
                                }
                                if (existing) {
                                    var columns_1 = Object.keys(recordToInsert);
                                    var sets = columns_1.map(function (col) { return "".concat(col, " = ?"); }).join(", ");
                                    var values = columns_1.map(function (col) { return recordToInsert[col]; });
                                    values.push(existing.id);
                                    (_b = db.prepare("UPDATE census SET ".concat(sets, " WHERE id = ?"))).run.apply(_b, values);
                                    updatedCount++;
                                }
                                else {
                                    var columns_2 = Object.keys(recordToInsert).join(", ");
                                    var placeholders = Object.keys(recordToInsert).map(function () { return "?"; }).join(", ");
                                    var values = Object.values(recordToInsert);
                                    (_c = db.prepare("INSERT INTO census (".concat(columns_2, ") VALUES (").concat(placeholders, ")"))).run.apply(_c, values);
                                    importedCount++;
                                }
                            };
                            for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                                var row = rows_1[_i];
                                _loop_1(row);
                            }
                        });
                        try {
                            upsert(records);
                            res.json({
                                success: true,
                                count: importedCount + updatedCount,
                                imported: importedCount,
                                updated: updatedCount
                            });
                        }
                        catch (error) {
                            console.error("Bulk insert error:", error);
                            res.status(500).json({ error: error.message });
                        }
                    });
                    // API Routes
                    app.get("/api/census", authenticateToken, function (req, res) {
                        var _a;
                        try {
                            var includeHistorical = req.query.historical === 'true';
                            var _b = getHierarchyFilter(req.user), condition = _b.condition, params = _b.params;
                            var query = "\n        SELECT c.*, \n               h.nombre as health_unit_name,\n               z.nombre as zona_name,\n               r.nombre as region_name,\n               e.nombre as estado_name,\n               z.id as zona_id,\n               r.id as region_id,\n               e.id as estado_id,\n               h.clues as health_unit_clues\n        FROM census c \n        LEFT JOIN health_units h ON c.health_unit_id = h.id \n        LEFT JOIN zonas z ON h.zona_id = z.id\n        LEFT JOIN regiones r ON z.region_id = r.id\n        LEFT JOIN estados e ON r.estado_id = e.id\n        WHERE (".concat(condition, ") \n        AND (").concat(includeHistorical ? '1=1' : 'COALESCE(c.is_historical, 0) = 0', ")\n        ORDER BY c.created_at DESC\n      ");
                            var data = (_a = db.prepare(query)).all.apply(_a, params);
                            res.json(data);
                        }
                        catch (error) {
                            console.error("Error fetching census:", error);
                            res.status(500).json({ error: error.message });
                        }
                    });
                    // Archive a record
                    app.post("/api/census/:id/archive", authenticateToken, function (req, res) {
                        var _a;
                        try {
                            var id = req.params.id;
                            var _b = req.user, role = _b.role, health_unit_id = _b.health_unit_id;
                            console.log("Archiving record ".concat(id, " for user ").concat((_a = req.user) === null || _a === void 0 ? void 0 : _a.username));
                            var record = db.prepare("SELECT * FROM census WHERE id = ?").get(id);
                            if (!record)
                                return res.status(404).json({ error: "Registro no encontrado" });
                            if (role === 'UNIT_USER' && record.health_unit_id !== health_unit_id) {
                                return res.status(403).json({ error: "Acceso denegado" });
                            }
                            var result = db.prepare("UPDATE census SET is_historical = 1 WHERE id = ?").run(id);
                            var updated = db.prepare("SELECT id, nombre, is_historical FROM census WHERE id = ?").get(id);
                            console.log("Archive result: ".concat(result.changes, " rows updated. New state:"), updated);
                            res.json({ success: true, record: updated });
                        }
                        catch (error) {
                            console.error("Archive error:", error);
                            res.status(500).json({ error: error.message });
                        }
                    });
                    // Restore a record from archive
                    app.post("/api/census/:id/restore", authenticateToken, function (req, res) {
                        var _a;
                        try {
                            var id = req.params.id;
                            var _b = req.user, role = _b.role, health_unit_id = _b.health_unit_id;
                            console.log("Restoring record ".concat(id, " for user ").concat((_a = req.user) === null || _a === void 0 ? void 0 : _a.username));
                            var record = db.prepare("SELECT * FROM census WHERE id = ?").get(id);
                            if (!record)
                                return res.status(404).json({ error: "Registro no encontrado" });
                            if (role === 'UNIT_USER' && record.health_unit_id !== health_unit_id) {
                                return res.status(403).json({ error: "Acceso denegado" });
                            }
                            var result = db.prepare("UPDATE census SET is_historical = 0 WHERE id = ?").run(id);
                            var updated = db.prepare("SELECT id, nombre, is_historical FROM census WHERE id = ?").get(id);
                            console.log("Restore result: ".concat(result.changes, " rows updated. New state:"), updated);
                            res.json({ success: true, record: updated });
                        }
                        catch (error) {
                            console.error("Restore error:", error);
                            res.status(500).json({ error: error.message });
                        }
                    });
                    app.post("/api/census", authenticateToken, function (req, res) {
                        var _a;
                        try {
                            var _b = req.user, role = _b.role, userUnitId = _b.health_unit_id;
                            var bodyUnitId = req.body.health_unit_id;
                            // For ADMIN, we need a unit ID from either the body or the user profile
                            var effectiveUnitId = role === 'ADMIN' ? (bodyUnitId || userUnitId) : userUnitId;
                            if (!effectiveUnitId) {
                                return res.status(400).json({ error: "Debe especificar una unidad de salud" });
                            }
                            var year = new Date().getFullYear();
                            var lastRecord = db.prepare("SELECT id FROM census ORDER BY id DESC LIMIT 1").get();
                            var nextId = ((lastRecord === null || lastRecord === void 0 ? void 0 : lastRecord.id) || 0) + 1;
                            var folio = "CENSO-".concat(year, "-").concat(String(nextId).padStart(3, "0"));
                            var data = { folio: folio, health_unit_id: effectiveUnitId };
                            // Filter and sanitize input data
                            for (var _i = 0, validColumns_3 = validColumns; _i < validColumns_3.length; _i++) {
                                var col = validColumns_3[_i];
                                if (col === 'folio' || col === 'health_unit_id')
                                    continue;
                                var val = req.body[col];
                                if (val === undefined) {
                                    data[col] = col === 'is_historical' ? 0 : null;
                                }
                                else {
                                    data[col] = val;
                                }
                            }
                            var columns_3 = Object.keys(data).join(", ");
                            var placeholders = Object.keys(data).map(function () { return "?"; }).join(", ");
                            var values = Object.values(data);
                            var info = (_a = db.prepare("INSERT INTO census (".concat(columns_3, ") VALUES (").concat(placeholders, ")"))).run.apply(_a, values);
                            res.json({
                                success: true,
                                id: info.lastInsertRowid,
                                folio: folio
                            });
                        }
                        catch (error) {
                            console.error("Error in POST /api/census:", error);
                            res.status(500).json({
                                success: false,
                                error: error.message || "Error al guardar el registro en la base de datos."
                            });
                        }
                    });
                    // Delete a record
                    app.delete("/api/census/:id", authenticateToken, function (req, res) {
                        try {
                            var id = req.params.id;
                            var _a = req.user, role = _a.role, health_unit_id = _a.health_unit_id;
                            var record = db.prepare("SELECT * FROM census WHERE id = ?").get(id);
                            if (!record)
                                return res.status(404).json({ error: "Registro no encontrado" });
                            if (role === 'UNIT_USER' && record.health_unit_id !== health_unit_id) {
                                return res.status(403).json({ error: "Acceso denegado" });
                            }
                            db.prepare("DELETE FROM census WHERE id = ?").run(id);
                            res.json({ success: true });
                        }
                        catch (error) {
                            console.error("Delete error:", error);
                            res.status(500).json({ error: error.message });
                        }
                    });
                    app.get("/api/census/:id", authenticateToken, function (req, res) {
                        var _a, _b;
                        var row = db.prepare("SELECT * FROM census WHERE id = ?").get(req.params.id);
                        if (!row)
                            return res.status(404).json({ error: "Registro no encontrado" });
                        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'ADMIN' && row.health_unit_id !== ((_b = req.user) === null || _b === void 0 ? void 0 : _b.health_unit_id)) {
                            return res.status(403).json({ error: "No tiene permiso para ver este registro" });
                        }
                        res.json(row);
                    });
                    app.put("/api/census/:id", authenticateToken, function (req, res) {
                        var _a;
                        var _b, _c, _d;
                        try {
                            var id = req.params.id;
                            var existing = db.prepare("SELECT health_unit_id FROM census WHERE id = ?").get(id);
                            if (!existing)
                                return res.status(404).json({ error: "Registro no encontrado" });
                            if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'ADMIN' && existing.health_unit_id !== ((_c = req.user) === null || _c === void 0 ? void 0 : _c.health_unit_id)) {
                                return res.status(403).json({ error: "No tiene permiso para editar este registro" });
                            }
                            var data = {};
                            // Filter and sanitize input data
                            for (var _i = 0, validColumns_4 = validColumns; _i < validColumns_4.length; _i++) {
                                var col = validColumns_4[_i];
                                if (col === 'id' || col === 'folio' || col === 'created_at')
                                    continue;
                                // Only ADMIN can change health_unit_id
                                if (col === 'health_unit_id' && ((_d = req.user) === null || _d === void 0 ? void 0 : _d.role) !== 'ADMIN')
                                    continue;
                                var val = req.body[col];
                                if (val === undefined) {
                                    if (col === 'is_historical')
                                        continue;
                                    data[col] = null;
                                }
                                else {
                                    data[col] = val;
                                }
                            }
                            var sets = Object.keys(data).map(function (col) { return "".concat(col, " = ?"); }).join(", ");
                            var values = Object.values(data);
                            values.push(id);
                            var info = (_a = db.prepare("UPDATE census SET ".concat(sets, " WHERE id = ?"))).run.apply(_a, values);
                            if (info.changes > 0) {
                                res.json({ success: true });
                            }
                            else {
                                res.status(404).json({ success: false, error: "Registro no encontrado" });
                            }
                        }
                        catch (error) {
                            console.error("Error in PUT /api/census:", error);
                            res.status(500).json({
                                success: false,
                                error: error.message || "Error al actualizar el registro."
                            });
                        }
                    });
                    // Hierarchy APIs
                    app.get("/api/admin/estados", authenticateToken, function (req, res) {
                        var rows = db.prepare("SELECT * FROM estados ORDER BY nombre ASC").all();
                        res.json(rows);
                    });
                    app.post("/api/admin/estados", authenticateToken, isAdmin, function (req, res) {
                        try {
                            var nombre = req.body.nombre;
                            var info = db.prepare("INSERT INTO estados (nombre) VALUES (?)").run(nombre);
                            res.json({ success: true, id: info.lastInsertRowid });
                        }
                        catch (error) {
                            res.status(500).json({ error: error.message });
                        }
                    });
                    app.get("/api/admin/regiones", authenticateToken, function (req, res) {
                        var _a = req.user, role = _a.role, estado_id = _a.estado_id;
                        var rows;
                        if (role === 'ADMIN') {
                            rows = db.prepare("SELECT r.*, e.nombre as estado_nombre FROM regiones r JOIN estados e ON r.estado_id = e.id ORDER BY r.nombre ASC").all();
                        }
                        else {
                            rows = db.prepare("SELECT r.*, e.nombre as estado_nombre FROM regiones r JOIN estados e ON r.estado_id = e.id WHERE r.estado_id = ? ORDER BY r.nombre ASC").all(estado_id);
                        }
                        res.json(rows);
                    });
                    app.post("/api/admin/regiones", authenticateToken, function (req, res) {
                        try {
                            var _a = req.user, role = _a.role, userEstadoId = _a.estado_id;
                            var _b = req.body, nombre = _b.nombre, estado_id = _b.estado_id;
                            var effectiveEstadoId = role === 'ADMIN' ? estado_id : userEstadoId;
                            if (!effectiveEstadoId)
                                return res.status(400).json({ error: "Estado es requerido" });
                            var info = db.prepare("INSERT INTO regiones (nombre, estado_id) VALUES (?, ?)").run(nombre, effectiveEstadoId);
                            res.json({ success: true, id: info.lastInsertRowid });
                        }
                        catch (error) {
                            res.status(500).json({ error: error.message });
                        }
                    });
                    app.get("/api/admin/zonas", authenticateToken, function (req, res) {
                        var _a;
                        var _b = req.user, role = _b.role, region_id = _b.region_id, estado_id = _b.estado_id;
                        var query = "SELECT z.*, r.nombre as region_nombre FROM zonas z JOIN regiones r ON z.region_id = r.id";
                        var params = [];
                        if (role === 'ADMIN') {
                            // everything
                        }
                        else if (role === 'ESTATAL') {
                            query += " WHERE r.estado_id = ?";
                            params = [estado_id];
                        }
                        else if (role === 'REGIONAL') {
                            query += " WHERE z.region_id = ?";
                            params = [region_id];
                        }
                        else {
                            query += " WHERE 1=0"; // Users and Zonal cannot see all zones? actually Zonal sees their own zone usually, handled in specific unit fetches.
                        }
                        query += " ORDER BY z.nombre ASC";
                        var rows = (_a = db.prepare(query)).all.apply(_a, params);
                        res.json(rows);
                    });
                    app.post("/api/admin/zonas", authenticateToken, function (req, res) {
                        try {
                            var _a = req.user, role = _a.role, userRegionId = _a.region_id;
                            var _b = req.body, nombre = _b.nombre, region_id = _b.region_id;
                            var effectiveRegionId = role === 'ADMIN' || role === 'ESTATAL' ? region_id : userRegionId;
                            if (!effectiveRegionId)
                                return res.status(400).json({ error: "Región es requerida" });
                            var info = db.prepare("INSERT INTO zonas (nombre, region_id) VALUES (?, ?)").run(nombre, effectiveRegionId);
                            res.json({ success: true, id: info.lastInsertRowid });
                        }
                        catch (error) {
                            res.status(500).json({ error: error.message });
                        }
                    });
                    // Nucleos API
                    app.get("/api/nucleos", authenticateToken, function (req, res) {
                        var _a, _b;
                        var rows;
                        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'ADMIN') {
                            rows = db.prepare("SELECT * FROM nucleos ORDER BY nombre ASC").all();
                        }
                        else {
                            rows = db.prepare("SELECT * FROM nucleos WHERE health_unit_id = ? ORDER BY nombre ASC").all((_b = req.user) === null || _b === void 0 ? void 0 : _b.health_unit_id);
                        }
                        res.json(rows);
                    });
                    app.post("/api/nucleos", authenticateToken, function (req, res) {
                        var _a;
                        try {
                            var _b = req.body, nombre = _b.nombre, medico_nombre = _b.medico_nombre, medico_cedula = _b.medico_cedula;
                            var health_unit_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.health_unit_id;
                            var info = db.prepare("INSERT INTO nucleos (health_unit_id, nombre, medico_nombre, medico_cedula) VALUES (?, ?, ?, ?)")
                                .run(health_unit_id, nombre, medico_nombre, medico_cedula);
                            res.json({ success: true, id: info.lastInsertRowid });
                        }
                        catch (error) {
                            res.status(500).json({ success: false, error: error.message });
                        }
                    });
                    app.put("/api/nucleos/:id", authenticateToken, function (req, res) {
                        var _a, _b;
                        try {
                            var id = req.params.id;
                            var _c = req.body, nombre = _c.nombre, medico_nombre = _c.medico_nombre, medico_cedula = _c.medico_cedula;
                            var existing = db.prepare("SELECT health_unit_id FROM nucleos WHERE id = ?").get(id);
                            if (!existing)
                                return res.status(404).json({ error: "Núcleo no encontrado" });
                            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'ADMIN' && existing.health_unit_id !== ((_b = req.user) === null || _b === void 0 ? void 0 : _b.health_unit_id)) {
                                return res.status(403).json({ error: "Acceso denegado" });
                            }
                            db.prepare("UPDATE nucleos SET nombre = ?, medico_nombre = ?, medico_cedula = ? WHERE id = ?").run(nombre, medico_nombre, medico_cedula, id);
                            res.json({ success: true });
                        }
                        catch (error) {
                            res.status(500).json({ success: false, error: error.message });
                        }
                    });
                    app.delete("/api/nucleos/:id", authenticateToken, function (req, res) {
                        var _a, _b;
                        try {
                            var id = req.params.id;
                            var existing = db.prepare("SELECT health_unit_id FROM nucleos WHERE id = ?").get(id);
                            if (!existing)
                                return res.status(404).json({ error: "Núcleo no encontrado" });
                            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'ADMIN' && existing.health_unit_id !== ((_b = req.user) === null || _b === void 0 ? void 0 : _b.health_unit_id)) {
                                return res.status(403).json({ error: "Acceso denegado" });
                            }
                            db.prepare("DELETE FROM census WHERE nucleo_nombre = (SELECT nombre FROM nucleos WHERE id = ?)").run(id); // Important: clean up census or handle as needed
                            db.prepare("DELETE FROM nucleos WHERE id = ?").run(id);
                            res.json({ success: true });
                        }
                        catch (error) {
                            res.status(500).json({ success: false, error: error.message });
                        }
                    });
                    // Push Subscription APIs
                    app.post("/api/push/subscribe", authenticateToken, function (req, res) {
                        var _a;
                        try {
                            var subscription = req.body.subscription;
                            var user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                            var subStr = JSON.stringify(subscription);
                            // Check if exists
                            var existing = db.prepare("SELECT id FROM push_subscriptions WHERE user_id = ? AND subscription = ?").get(user_id, subStr);
                            if (!existing) {
                                db.prepare("INSERT INTO push_subscriptions (user_id, subscription) VALUES (?, ?)").run(user_id, subStr);
                            }
                            res.json({ success: true });
                        }
                        catch (err) {
                            res.status(500).json({ error: err.message });
                        }
                    });
                    app.post("/api/push/unsubscribe", authenticateToken, function (req, res) {
                        var _a;
                        try {
                            var endpoint = req.body.endpoint;
                            db.prepare("DELETE FROM push_subscriptions WHERE user_id = ? AND subscription LIKE ?").run((_a = req.user) === null || _a === void 0 ? void 0 : _a.id, "%".concat(endpoint, "%"));
                            res.json({ success: true });
                        }
                        catch (err) {
                            res.status(500).json({ error: err.message });
                        }
                    });
                    app.get("/api/push/publicKey", function (req, res) {
                        res.json({ publicKey: "BDx2N8k0yjgG_kBeRuTJ8sPtBGLqVXN0N4ZEoXNWCz9UQt5Tt1uL1kxwrV7XrtIWPBY88NyDt79OaH8dNFmO04s" });
                    });
                    if (!(process.env.NODE_ENV !== "production")) return [3 /*break*/, 2];
                    return [4 /*yield*/, createViteServer({
                            server: {
                                middlewareMode: true,
                                allowedHosts: true,
                                host: true
                            },
                            appType: "spa",
                        })];
                case 1:
                    vite = _a.sent();
                    app.use(vite.middlewares);
                    return [3 /*break*/, 3];
                case 2:
                    distPath_1 = path.join(process.cwd(), "dist");
                    // Fallback logic for different deployment structures
                    if (!fs.existsSync(distPath_1)) {
                        distPath_1 = path.join(__dirname, "dist");
                        if (!fs.existsSync(distPath_1)) {
                            distPath_1 = path.join(__dirname, "..", "dist");
                        }
                    }
                    console.log("[SERVER] Production mode. Serving static files from: ".concat(distPath_1));
                    if (!fs.existsSync(distPath_1)) {
                        console.error("[SERVER ERROR] static 'dist' folder not found! Path: ".concat(distPath_1));
                    }
                    app.use(express.static(distPath_1));
                    app.get("*", function (req, res) {
                        var indexPath = path.join(distPath_1, "index.html");
                        if (fs.existsSync(indexPath)) {
                            res.sendFile(indexPath);
                        }
                        else {
                            res.status(404).send("Error: index.html not found in dist folder");
                        }
                    });
                    _a.label = 3;
                case 3:
                    console.log("[SERVER] Ready to listen on port ".concat(PORT, "..."));
                    app.listen(PORT, "0.0.0.0", function () {
                        console.log("[SERVER] Success! Running on http://0.0.0.0:".concat(PORT));
                    });
                    return [2 /*return*/];
            }
        });
    });
}
startServer().catch(function (err) {
    console.error("FATAL STARTUP ERROR:", err);
    process.exit(1);
});
