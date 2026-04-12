import express, { Request, Response, NextFunction } from "express";
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
  webpush.setVapidDetails(
    "mailto:soporte@tuapp.com",
    "BDx2N8k0yjgG_kBeRuTJ8sPtBGLqVXN0N4ZEoXNWCz9UQt5Tt1uL1kxwrV7XrtIWPBY88NyDt79OaH8dNFmO04s",
    "oJnLMJNjlI_LiTtaxyKcf0Gx-F70UB9yPHtdsAHYqTo"
  );
} catch (err) {
  console.error("[NOTIFICATIONS ERROR] Failed to set VAPID details:", err);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In Railway, we'll use a 'data' folder in the root, which the volume should be mounted to.
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "census.db");
const db = new Database(DB_PATH);
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-123";
const BACKUP_DIR = path.join(DATA_DIR, "backups");

// Automatic Backup System
function performBackup() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
    const backupPath = path.join(BACKUP_DIR, `census_backup_${timestamp}.db`);

    // Only backup if not already backed up today
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(DB_PATH, backupPath);
      console.log(`[BACKUP] Database backed up to: ${backupPath}`);

      // Clean up old backups (keep last 30)
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith("census_backup_"))
        .sort((a, b) => fs.statSync(path.join(BACKUP_DIR, b)).mtime.getTime() - fs.statSync(path.join(BACKUP_DIR, a)).mtime.getTime());

      if (files.length > 30) {
        files.slice(30).forEach(f => {
          fs.unlinkSync(path.join(BACKUP_DIR, f));
          console.log(`[BACKUP] Deleted old backup: ${f}`);
        });
      }
    }
  } catch (err) {
    console.error("[BACKUP ERROR]:", err);
  }
}

// Run backup on start and every 24 hours
performBackup();
setInterval(performBackup, 24 * 60 * 60 * 1000);

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    health_unit_id: number | null;
    estado_id: number | null;
    region_id: number | null;
    zona_id: number | null;
  };
}

// Initialize Hierarchical Database
db.exec(`
  CREATE TABLE IF NOT EXISTS estados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT UNIQUE NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS regiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    estado_id INTEGER NOT NULL,
    FOREIGN KEY(estado_id) REFERENCES estados(id),
    UNIQUE(nombre, estado_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS zonas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    region_id INTEGER NOT NULL,
    FOREIGN KEY(region_id) REFERENCES regiones(id),
    UNIQUE(nombre, region_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS health_units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT UNIQUE,
    clues TEXT UNIQUE,
    zona_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(zona_id) REFERENCES zonas(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'UNIT_USER', -- 'ADMIN', 'ESTATAL', 'REGIONAL', 'ZONAL', 'UNIT_USER'
    health_unit_id INTEGER,
    estado_id INTEGER,
    region_id INTEGER,
    zona_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(health_unit_id) REFERENCES health_units(id),
    FOREIGN KEY(estado_id) REFERENCES estados(id),
    FOREIGN KEY(region_id) REFERENCES regiones(id),
    FOREIGN KEY(zona_id) REFERENCES zonas(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subscription TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS census (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    health_unit_id INTEGER,
    folio TEXT UNIQUE,
    nombre TEXT,
    curp TEXT,
    telefono TEXT,
    domicilio TEXT,
    reporte_mp TEXT,
    folio_intransferible TEXT,
    tipo_localidad TEXT,
    derechohabiencia TEXT,
    fecha_nacimiento TEXT,
    condicion TEXT,
    gestas INTEGER,
    cesareas INTEGER,
    fecha_ultima_cesarea TEXT,
    partos INTEGER,
    abortos INTEGER,
    fecha_ultimo_aborto TEXT,
    fum TEXT,
    riesgo_obstetrico TEXT,
    factores_riesgo TEXT,
    riesgo_social TEXT,
    salud_mental_fecha TEXT,
    salud_mental_puntaje INTEGER,
    tas INTEGER,
    tad INTEGER,
    td_fecha_1ra TEXT,
    td_fecha_2da TEXT,
    td_fecha_3ra TEXT,
    tdpa_fecha TEXT,
    influenza_fecha TEXT,
    tamiz_dm TEXT,
    bh_hb TEXT,
    tipo_sangre TEXT,
    rh TEXT,
    vih_resultado TEXT,
    vih_fecha TEXT,
    sifilis_resultado TEXT,
    sifilis_fecha TEXT,
    ego_resultado TEXT,
    ego_fecha TEXT,
    acido_folico TEXT,
    fumarato_ferroso TEXT,
    aas TEXT,
    calcio TEXT,
    estado_salud_actual TEXT,
    plan_seguridad TEXT,
    plan_seguridad_fecha TEXT,
    plan_manejo TEXT,
    ref_mater_hospital TEXT,
    ref_mater_acudio TEXT,
    ref_mater_resultado TEXT,
    ref_urgencias_hospital TEXT,
    ref_urgencias_acudio TEXT,
    ref_urgencias_resultado TEXT,
    derivacion_plataforma_comunitaria TEXT,
    control_parteria_tradicional TEXT,
    nombre_partera TEXT,
    conclusion_embarazo TEXT,
    sdg_nacimiento INTEGER,
    fecha_atencion_evento TEXT,
    lugar_atencion_evento TEXT,
    estado_salud_materna_puerperio TEXT,
    rn_estado TEXT,
    rn_genero TEXT,
    rn_salud TEXT,
    tamiz_metabolico_fecha TEXT,
    tamiz_metabolico_sospechoso TEXT,
    tamiz_auditivo_fecha TEXT,
    tamiz_auditivo_sospechoso TEXT,
    mpf_eleccion TEXT,
    mpf_aplicado TEXT,
    motivo_rechazo_mpf TEXT,
    diagnostico_especifico TEXT,
    club_embarazadas TEXT,
    seguimiento_ts TEXT,
    fecha_actualizacion_ts TEXT,
    fecha_ultima_consulta TEXT,
    fecha_proxima_cita TEXT,
    medico_nombre TEXT,
    medico_cedula TEXT,
    medico_atencion TEXT,
    nucleo_nombre TEXT,
    observaciones_generales TEXT,
    is_historical INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(health_unit_id) REFERENCES health_units(id)
  )
`);

// Initial database check
console.log(`[DB] Initializing database at: ${DB_PATH}`);
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(`[DB] Found tables: ${tables.map((t: any) => t.name).join(", ")}`);

db.exec(`
  CREATE TABLE IF NOT EXISTS nucleos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    health_unit_id INTEGER,
    nombre TEXT,
    medico_nombre TEXT,
    medico_cedula TEXT,
    FOREIGN KEY(health_unit_id) REFERENCES health_units(id),
    UNIQUE(health_unit_id, nombre)
  )
`);

// Migration: Add new columns if they don't exist
const columns = db.prepare("PRAGMA table_info(census)").all() as any[];
const columnNames = columns.map(c => c.name);
console.log('[DB] Current census table columns:', columnNames.length);

const validColumns = [
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

db.transaction(() => {
  for (const col of validColumns) {
    if (!columnNames.includes(col)) {
      console.log(`[DB] Adding missing column: ${col}`);
      try {
        const type = col === 'is_historical' ? 'INTEGER DEFAULT 0' : 'TEXT';
        db.exec(`ALTER TABLE census ADD COLUMN ${col} ${type}`);
      } catch (err) {
        console.error(`[DB ERROR] Failed to add column ${col}:`, err);
      }
    }
  }
  // Ensure all records have a value for is_historical
  db.exec("UPDATE census SET is_historical = 0 WHERE is_historical IS NULL");
})();
console.log('[DB] Database migration check completed.');

// Auth Middleware
const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "No autorizado" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
};

const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: "Requiere privilegios de administrador" });
  }
  next();
};

/**
 * Returns a filter object for SQL queries based on the user's hierarchy level.
 * @param user The authenticated user object from the request.
 * @returns An object with the WHERE condition and the parameters.
 */
function getHierarchyFilter(user: any) {
  const { role, health_unit_id, zona_id, region_id, estado_id } = user;

  if (role === 'ADMIN') {
    return { condition: "1=1", params: [] };
  }

  if (role === 'ESTATAL') {
    return {
      condition: `health_unit_id IN (
        SELECT hu.id FROM health_units hu
        JOIN zonas z ON hu.zona_id = z.id
        JOIN regiones r ON z.region_id = r.id
        WHERE r.estado_id = ?
      )`,
      params: [estado_id]
    };
  }

  if (role === 'REGIONAL') {
    return {
      condition: `health_unit_id IN (
        SELECT hu.id FROM health_units hu
        JOIN zonas z ON hu.zona_id = z.id
        WHERE z.region_id = ?
      )`,
      params: [region_id]
    };
  }

  if (role === 'ZONAL') {
    return {
      condition: `health_unit_id IN (
        SELECT id FROM health_units WHERE zona_id = ?
      )`,
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
const adminExists = db.prepare("SELECT * FROM users WHERE role = 'ADMIN'").get();
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("admin", hashedPassword, "ADMIN");
  console.log("Default admin created: admin / admin123");
}

// Check for alerts and send notifications
async function checkAndSendAlerts() {
  console.log("[NOTIFICATIONS] Running health check for patients needing follow-up...");
  try {
    const today = new Date();
    
    // Find patients:
    // Pregnant > 30 days
    // Puerperas > 7 days
    const census = db.prepare(`
      SELECT c.id, c.nombre, c.folio, c.condicion, c.fecha_ultima_consulta, c.medico_nombre, c.health_unit_id 
      FROM census c 
      WHERE COALESCE(c.is_historical, 0) = 0 
      AND c.fecha_ultima_consulta IS NOT NULL
      AND c.fecha_ultima_consulta != ''
    `).all() as any[];

    for (const p of census) {
      const lastVisit = new Date(p.fecha_ultima_consulta);
      const diffTime = Math.abs(today.getTime() - lastVisit.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let needsAlert = false;
      if (p.condicion?.startsWith('EMBARAZADA') && diffDays >= 30) {
        needsAlert = true;
      } else if (p.condicion?.startsWith('PUERPERA') && diffDays >= 7) {
        needsAlert = true;
      }

      if (needsAlert) {
        // Find users to notify (all users of the unit)
        const subRows = db.prepare(`
          SELECT s.subscription 
          FROM push_subscriptions s
          JOIN users u ON s.user_id = u.id
          WHERE u.health_unit_id = ?
        `).all(p.health_unit_id) as any[];

        const payload = JSON.stringify({
          title: "⚠️ Alerta de Seguimiento: Paciente sin actualización",
          body: `Estimado/a Dr/a. ${p.medico_nombre || 'Médico'}, se ha detectado que la paciente ${p.nombre} tiene ${diffDays} días o más sin registrar datos en el censo. Se recomienda contactarla para verificar su estado de salud.`,
          data: { patientId: p.id }
        });

        for (const row of subRows) {
          try {
            const sub = JSON.parse(row.subscription);
            await webpush.sendNotification(sub, payload);
            console.log(`[NOTIFICATIONS] Sent alert to a doctor for patient ${p.nombre}`);
          } catch (err: any) {
            if (err.statusCode === 410 || err.statusCode === 404) {
              // Expired subscription
              db.prepare("DELETE FROM push_subscriptions WHERE subscription = ?").run(row.subscription);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("[NOTIFICATIONS ERROR]:", err);
  }
}

// Run notification check every 12 hours (first run after 30s to let server stabilize)
setTimeout(checkAndSendAlerts, 30000);
setInterval(checkAndSendAlerts, 12 * 60 * 60 * 1000);

// Create a default health unit if none exists
const unitExists = db.prepare("SELECT * FROM health_units LIMIT 1").get();
if (!unitExists) {
  db.prepare("INSERT INTO health_units (nombre, clues) VALUES (?, ?)").run("Unidad de Salud Central", "CENTRAL001");
  console.log("Default health unit created: Unidad de Salud Central");
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Auth Routes
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user: any = db.prepare(`
      SELECT u.*, h.nombre as health_unit_name, h.clues, e.nombre as estado_name, r.nombre as region_name, z.nombre as zona_name
      FROM users u 
      LEFT JOIN health_units h ON u.health_unit_id = h.id 
      LEFT JOIN estados e ON u.estado_id = e.id
      LEFT JOIN regiones r ON u.region_id = r.id
      LEFT JOIN zonas z ON u.zona_id = z.id
      WHERE u.username = ?
    `).get(username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      {
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
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
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
  app.get("/api/admin/units", authenticateToken, (req: AuthRequest, res) => {
    try {
      const { condition, params } = getHierarchyFilter(req.user);
      const units = db.prepare(`SELECT * FROM health_units WHERE ${condition} OR ? = 'ADMIN'`).all(...params, req.user?.role);
      res.json(units);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/admin/units/:id", authenticateToken, isAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, clues, zona_id } = req.body;
      db.prepare("UPDATE health_units SET nombre = ?, clues = ?, zona_id = ? WHERE id = ?")
        .run(nombre, clues, zona_id ? parseInt(zona_id as any) : null, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/units/:id", authenticateToken, isAdmin, (req, res) => {
    try {
      const { id } = req.params;
      // Check if unit has census records
      const hasRecords = db.prepare("SELECT 1 FROM census WHERE health_unit_id = ? LIMIT 1").get(id);
      if (hasRecords) {
        return res.status(400).json({ error: "No se puede eliminar una unidad con registros activos" });
      }
      db.prepare("DELETE FROM health_units WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/units", authenticateToken, isAdmin, (req, res) => {
    try {
      const { nombre, clues, zona_id } = req.body;
      const info = db.prepare("INSERT INTO health_units (nombre, clues, zona_id) VALUES (?, ?, ?)")
        .run(nombre, clues, zona_id ? parseInt(zona_id as any) : null);
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/users", authenticateToken, (req: AuthRequest, res) => {
    try {
      const { role, estado_id, region_id, zona_id, id: userId } = req.user!;
      let query = `
        SELECT u.id, u.username, u.role, u.health_unit_id, u.estado_id, u.region_id, u.zona_id, h.nombre as health_unit_name 
        FROM users u 
        LEFT JOIN health_units h ON u.health_unit_id = h.id
      `;
      let params: any[] = [];

      if (role === 'ADMIN') {
        // sees everything
      } else if (role === 'ESTATAL') {
        query += " WHERE u.estado_id = ? OR u.role = 'UNIT_USER' AND u.health_unit_id IN (SELECT id FROM health_units WHERE zona_id IN (SELECT id FROM zonas WHERE region_id IN (SELECT id FROM regiones WHERE estado_id = ?)))";
        params = [estado_id, estado_id];
      } else if (role === 'REGIONAL') {
        query += " WHERE u.region_id = ? OR u.role = 'UNIT_USER' AND u.health_unit_id IN (SELECT id FROM health_units WHERE zona_id IN (SELECT id FROM zonas WHERE region_id = ?))";
        params = [region_id, region_id];
      } else if (role === 'ZONAL') {
        query += " WHERE u.zona_id = ? OR u.role = 'UNIT_USER' AND u.health_unit_id IN (SELECT id FROM health_units WHERE zona_id = ?)";
        params = [zona_id, zona_id];
      } else {
        query += " WHERE u.id = ?";
        params = [userId];
      }

      query += " ORDER BY u.role ASC, u.username ASC";
      const users = db.prepare(query).all(...params);
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/users", authenticateToken, isAdmin, (req, res) => {
    try {
      const { username, password, role, health_unit_id, estado_id, region_id, zona_id } = req.body;
      const hashedPassword = bcrypt.hashSync(password, 10);
      const info = db.prepare("INSERT INTO users (username, password, role, health_unit_id, estado_id, region_id, zona_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(
          username,
          hashedPassword,
          role || 'UNIT_USER',
          health_unit_id ? parseInt(health_unit_id as any) : null,
          estado_id ? parseInt(estado_id as any) : null,
          region_id ? parseInt(region_id as any) : null,
          zona_id ? parseInt(zona_id as any) : null
        );
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/admin/users/:id", authenticateToken, isAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const { username, password, role, health_unit_id, estado_id, region_id, zona_id } = req.body;

      if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.prepare("UPDATE users SET username = ?, password = ?, role = ?, health_unit_id = ?, estado_id = ?, region_id = ?, zona_id = ? WHERE id = ?")
          .run(
            username,
            hashedPassword,
            role,
            health_unit_id ? parseInt(health_unit_id as any) : null,
            estado_id ? parseInt(estado_id as any) : null,
            region_id ? parseInt(region_id as any) : null,
            zona_id ? parseInt(zona_id as any) : null,
            id
          );
      } else {
        db.prepare("UPDATE users SET username = ?, role = ?, health_unit_id = ?, estado_id = ?, region_id = ?, zona_id = ? WHERE id = ?")
          .run(
            username,
            role,
            health_unit_id ? parseInt(health_unit_id as any) : null,
            estado_id ? parseInt(estado_id as any) : null,
            region_id ? parseInt(region_id as any) : null,
            zona_id ? parseInt(zona_id as any) : null,
            id
          );
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, isAdmin, (req, res) => {
    try {
      const { id } = req.params;
      // Prevent deleting self
      const userId = (req as any).user?.id;
      if (Number(id) === userId) {
        return res.status(400).json({ error: "No puedes eliminar tu propio usuario" });
      }
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/census/bulk", authenticateToken, (req: AuthRequest, res) => {
    const records = req.body;
    if (!Array.isArray(records)) return res.status(400).json({ error: "Se esperaba un arreglo de registros" });

    const health_unit_id = req.user?.health_unit_id;
    if (!health_unit_id && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: "No tiene una unidad de salud asignada" });
    }

    const year = new Date().getFullYear();
    const lastRecord = db.prepare("SELECT id FROM census ORDER BY id DESC LIMIT 1").get();
    let nextId = (lastRecord?.id || 0) + 1;

    let importedCount = 0;
    let updatedCount = 0;

    const upsert = db.transaction((rows) => {
      for (const row of rows) {
        const curp = row.curp?.toString().toUpperCase().trim();
        const unitId = row.health_unit_id || health_unit_id;

        let existing: any = null;
        if (curp) {
          existing = db.prepare("SELECT id, folio FROM census WHERE curp = ? AND health_unit_id = ?").get(curp, unitId);
        }

        const data: any = { ...row, curp, health_unit_id: unitId };

        const recordToInsert: any = {};
        for (const col of validColumns) {
          if (col === 'is_historical') {
            recordToInsert[col] = data[col] !== undefined ? data[col] : 0;
          } else if (col === 'folio') {
            recordToInsert[col] = existing ? existing.folio : (data.folio || `CENSO-${year}-${String(nextId++).padStart(3, "0")}`);
          } else {
            recordToInsert[col] = data[col] !== undefined ? data[col] : null;
          }
        }

        if (existing) {
          const columns = Object.keys(recordToInsert);
          const sets = columns.map(col => `${col} = ?`).join(", ");
          const values = columns.map(col => recordToInsert[col]);
          values.push(existing.id);
          db.prepare(`UPDATE census SET ${sets} WHERE id = ?`).run(...values);
          updatedCount++;
        } else {
          const columns = Object.keys(recordToInsert).join(", ");
          const placeholders = Object.keys(recordToInsert).map(() => "?").join(", ");
          const values = Object.values(recordToInsert);
          db.prepare(`INSERT INTO census (${columns}) VALUES (${placeholders})`).run(...values);
          importedCount++;
        }
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
    } catch (error: any) {
      console.error("Bulk insert error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Routes
  app.get("/api/census", authenticateToken, (req: AuthRequest, res) => {
    try {
      const includeHistorical = req.query.historical === 'true';
      const { condition, params } = getHierarchyFilter(req.user);

      const query = `
        SELECT c.*, 
               h.nombre as health_unit_name,
               z.nombre as zona_name,
               r.nombre as region_name,
               e.nombre as estado_name,
               z.id as zona_id,
               r.id as region_id,
               e.id as estado_id,
               h.clues as health_unit_clues
        FROM census c 
        LEFT JOIN health_units h ON c.health_unit_id = h.id 
        LEFT JOIN zonas z ON h.zona_id = z.id
        LEFT JOIN regiones r ON z.region_id = r.id
        LEFT JOIN estados e ON r.estado_id = e.id
        WHERE (${condition}) 
        AND (${includeHistorical ? '1=1' : 'COALESCE(c.is_historical, 0) = 0'})
        ORDER BY c.created_at DESC
      `;

      const data: any[] = db.prepare(query).all(...params);
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching census:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Archive a record
  app.post("/api/census/:id/archive", authenticateToken, (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { role, health_unit_id } = req.user!;

      console.log(`Archiving record ${id} for user ${req.user?.username}`);

      const record: any = db.prepare("SELECT * FROM census WHERE id = ?").get(id);
      if (!record) return res.status(404).json({ error: "Registro no encontrado" });

      if (role === 'UNIT_USER' && record.health_unit_id !== health_unit_id) {
        return res.status(403).json({ error: "Acceso denegado" });
      }

      const result = db.prepare("UPDATE census SET is_historical = 1 WHERE id = ?").run(id);
      const updated: any = db.prepare("SELECT id, nombre, is_historical FROM census WHERE id = ?").get(id);
      console.log(`Archive result: ${result.changes} rows updated. New state:`, updated);
      res.json({ success: true, record: updated });
    } catch (error: any) {
      console.error("Archive error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Restore a record from archive
  app.post("/api/census/:id/restore", authenticateToken, (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { role, health_unit_id } = req.user!;

      console.log(`Restoring record ${id} for user ${req.user?.username}`);

      const record: any = db.prepare("SELECT * FROM census WHERE id = ?").get(id);
      if (!record) return res.status(404).json({ error: "Registro no encontrado" });

      if (role === 'UNIT_USER' && record.health_unit_id !== health_unit_id) {
        return res.status(403).json({ error: "Acceso denegado" });
      }

      const result = db.prepare("UPDATE census SET is_historical = 0 WHERE id = ?").run(id);
      const updated: any = db.prepare("SELECT id, nombre, is_historical FROM census WHERE id = ?").get(id);
      console.log(`Restore result: ${result.changes} rows updated. New state:`, updated);
      res.json({ success: true, record: updated });
    } catch (error: any) {
      console.error("Restore error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/census", authenticateToken, (req: AuthRequest, res) => {
    try {
      const { role, health_unit_id: userUnitId } = req.user!;
      const bodyUnitId = req.body.health_unit_id;

      // For ADMIN, we need a unit ID from either the body or the user profile
      const effectiveUnitId = role === 'ADMIN' ? (bodyUnitId || userUnitId) : userUnitId;

      if (!effectiveUnitId) {
        return res.status(400).json({ error: "Debe especificar una unidad de salud" });
      }

      const year = new Date().getFullYear();
      const lastRecord = db.prepare("SELECT id FROM census ORDER BY id DESC LIMIT 1").get();
      const nextId = (lastRecord?.id || 0) + 1;
      const folio = `CENSO-${year}-${String(nextId).padStart(3, "0")}`;

      const data: any = { folio, health_unit_id: effectiveUnitId };

      // Filter and sanitize input data
      for (const col of validColumns) {
        if (col === 'folio' || col === 'health_unit_id') continue;

        const val = req.body[col];
        if (val === undefined) {
          data[col] = col === 'is_historical' ? 0 : null;
        } else {
          data[col] = val;
        }
      }

      const columns = Object.keys(data).join(", ");
      const placeholders = Object.keys(data).map(() => "?").join(", ");
      const values = Object.values(data);

      const info = db.prepare(`INSERT INTO census (${columns}) VALUES (${placeholders})`).run(...values);

      res.json({
        success: true,
        id: info.lastInsertRowid,
        folio
      });
    } catch (error: any) {
      console.error("Error in POST /api/census:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Error al guardar el registro en la base de datos."
      });
    }
  });

  // Delete a record
  app.delete("/api/census/:id", authenticateToken, (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { role, health_unit_id } = req.user!;

      const record: any = db.prepare("SELECT * FROM census WHERE id = ?").get(id);
      if (!record) return res.status(404).json({ error: "Registro no encontrado" });

      if (role === 'UNIT_USER' && record.health_unit_id !== health_unit_id) {
        return res.status(403).json({ error: "Acceso denegado" });
      }

      db.prepare("DELETE FROM census WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/census/:id", authenticateToken, (req: AuthRequest, res) => {
    const row: any = db.prepare("SELECT * FROM census WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Registro no encontrado" });

    if (req.user?.role !== 'ADMIN' && row.health_unit_id !== req.user?.health_unit_id) {
      return res.status(403).json({ error: "No tiene permiso para ver este registro" });
    }

    res.json(row);
  });

  app.put("/api/census/:id", authenticateToken, (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const existing: any = db.prepare("SELECT health_unit_id FROM census WHERE id = ?").get(id);

      if (!existing) return res.status(404).json({ error: "Registro no encontrado" });
      if (req.user?.role !== 'ADMIN' && existing.health_unit_id !== req.user?.health_unit_id) {
        return res.status(403).json({ error: "No tiene permiso para editar este registro" });
      }

      const data: any = {};

      // Filter and sanitize input data
      for (const col of validColumns) {
        if (col === 'id' || col === 'folio' || col === 'created_at') continue;

        // Only ADMIN can change health_unit_id
        if (col === 'health_unit_id' && req.user?.role !== 'ADMIN') continue;

        const val = req.body[col];
        if (val === undefined) {
          if (col === 'is_historical') continue;
          data[col] = null;
        } else {
          data[col] = val;
        }
      }

      const sets = Object.keys(data).map(col => `${col} = ?`).join(", ");
      const values = Object.values(data);
      values.push(id);

      const info = db.prepare(`UPDATE census SET ${sets} WHERE id = ?`).run(...values);

      if (info.changes > 0) {
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, error: "Registro no encontrado" });
      }
    } catch (error: any) {
      console.error("Error in PUT /api/census:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Error al actualizar el registro."
      });
    }
  });

  // Hierarchy APIs
  app.get("/api/admin/estados", authenticateToken, (req, res) => {
    const rows = db.prepare("SELECT * FROM estados ORDER BY nombre ASC").all();
    res.json(rows);
  });

  app.post("/api/admin/estados", authenticateToken, isAdmin, (req, res) => {
    try {
      const { nombre } = req.body;
      const info = db.prepare("INSERT INTO estados (nombre) VALUES (?)").run(nombre);
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/regiones", authenticateToken, (req: AuthRequest, res) => {
    const { role, estado_id } = req.user!;
    let rows;
    if (role === 'ADMIN') {
      rows = db.prepare("SELECT r.*, e.nombre as estado_nombre FROM regiones r JOIN estados e ON r.estado_id = e.id ORDER BY r.nombre ASC").all();
    } else {
      rows = db.prepare("SELECT r.*, e.nombre as estado_nombre FROM regiones r JOIN estados e ON r.estado_id = e.id WHERE r.estado_id = ? ORDER BY r.nombre ASC").all(estado_id);
    }
    res.json(rows);
  });

  app.post("/api/admin/regiones", authenticateToken, (req: AuthRequest, res) => {
    try {
      const { role, estado_id: userEstadoId } = req.user!;
      const { nombre, estado_id } = req.body;

      const effectiveEstadoId = role === 'ADMIN' ? estado_id : userEstadoId;
      if (!effectiveEstadoId) return res.status(400).json({ error: "Estado es requerido" });

      const info = db.prepare("INSERT INTO regiones (nombre, estado_id) VALUES (?, ?)").run(nombre, effectiveEstadoId);
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/zonas", authenticateToken, (req: AuthRequest, res) => {
    const { role, region_id, estado_id } = req.user!;
    let query = "SELECT z.*, r.nombre as region_nombre FROM zonas z JOIN regiones r ON z.region_id = r.id";
    let params: any[] = [];

    if (role === 'ADMIN') {
      // everything
    } else if (role === 'ESTATAL') {
      query += " WHERE r.estado_id = ?";
      params = [estado_id];
    } else if (role === 'REGIONAL') {
      query += " WHERE z.region_id = ?";
      params = [region_id];
    } else {
      query += " WHERE 1=0"; // Users and Zonal cannot see all zones? actually Zonal sees their own zone usually, handled in specific unit fetches.
    }

    query += " ORDER BY z.nombre ASC";
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  });

  app.post("/api/admin/zonas", authenticateToken, (req: AuthRequest, res) => {
    try {
      const { role, region_id: userRegionId } = req.user!;
      const { nombre, region_id } = req.body;

      const effectiveRegionId = role === 'ADMIN' || role === 'ESTATAL' ? region_id : userRegionId;
      if (!effectiveRegionId) return res.status(400).json({ error: "Región es requerida" });

      const info = db.prepare("INSERT INTO zonas (nombre, region_id) VALUES (?, ?)").run(nombre, effectiveRegionId);
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Nucleos API
  app.get("/api/nucleos", authenticateToken, (req: AuthRequest, res) => {
    let rows;
    if (req.user?.role === 'ADMIN') {
      rows = db.prepare("SELECT * FROM nucleos ORDER BY nombre ASC").all();
    } else {
      rows = db.prepare("SELECT * FROM nucleos WHERE health_unit_id = ? ORDER BY nombre ASC").all(req.user?.health_unit_id);
    }
    res.json(rows);
  });

  app.post("/api/nucleos", authenticateToken, (req: AuthRequest, res) => {
    try {
      const { nombre, medico_nombre, medico_cedula } = req.body;
      const health_unit_id = req.user?.health_unit_id;
      const info = db.prepare("INSERT INTO nucleos (health_unit_id, nombre, medico_nombre, medico_cedula) VALUES (?, ?, ?, ?)")
        .run(health_unit_id, nombre, medico_nombre, medico_cedula);
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.put("/api/nucleos/:id", authenticateToken, (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { nombre, medico_nombre, medico_cedula } = req.body;

      const existing: any = db.prepare("SELECT health_unit_id FROM nucleos WHERE id = ?").get(id);
      if (!existing) return res.status(404).json({ error: "Núcleo no encontrado" });
      if (req.user?.role !== 'ADMIN' && existing.health_unit_id !== req.user?.health_unit_id) {
        return res.status(403).json({ error: "Acceso denegado" });
      }

      db.prepare("UPDATE nucleos SET nombre = ?, medico_nombre = ?, medico_cedula = ? WHERE id = ?").run(nombre, medico_nombre, medico_cedula, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/nucleos/:id", authenticateToken, (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const existing: any = db.prepare("SELECT health_unit_id FROM nucleos WHERE id = ?").get(id);
      if (!existing) return res.status(404).json({ error: "Núcleo no encontrado" });
      if (req.user?.role !== 'ADMIN' && existing.health_unit_id !== req.user?.health_unit_id) {
        return res.status(403).json({ error: "Acceso denegado" });
      }

      db.prepare("DELETE FROM census WHERE nucleo_nombre = (SELECT nombre FROM nucleos WHERE id = ?)").run(id); // Important: clean up census or handle as needed
      db.prepare("DELETE FROM nucleos WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Push Subscription APIs
  app.post("/api/push/subscribe", authenticateToken, (req: AuthRequest, res) => {
    try {
      const { subscription } = req.body;
      const user_id = req.user?.id;
      
      const subStr = JSON.stringify(subscription);
      
      // Check if exists
      const existing = db.prepare("SELECT id FROM push_subscriptions WHERE user_id = ? AND subscription = ?").get(user_id, subStr);
      
      if (!existing) {
        db.prepare("INSERT INTO push_subscriptions (user_id, subscription) VALUES (?, ?)").run(user_id, subStr);
      }
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/push/unsubscribe", authenticateToken, (req: AuthRequest, res) => {
    try {
      const { endpoint } = req.body;
      db.prepare("DELETE FROM push_subscriptions WHERE user_id = ? AND subscription LIKE ?").run(req.user?.id, `%${endpoint}%`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/push/publicKey", (req, res) => {
    res.json({ publicKey: "BDx2N8k0yjgG_kBeRuTJ8sPtBGLqVXN0N4ZEoXNWCz9UQt5Tt1uL1kxwrV7XrtIWPBY88NyDt79OaH8dNFmO04s" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, we assume we are running from the project root
    let distPath = path.join(process.cwd(), "dist");

    // Fallback logic for different deployment structures
    if (!fs.existsSync(distPath)) {
      distPath = path.join(__dirname, "dist");
      if (!fs.existsSync(distPath)) {
        distPath = path.join(__dirname, "..", "dist");
      }
    }

    console.log(`[SERVER] Production mode. Serving static files from: ${distPath}`);
    if (!fs.existsSync(distPath)) {
      console.error(`[SERVER ERROR] static 'dist' folder not found! Path: ${distPath}`);
    }

    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Error: index.html not found in dist folder");
      }
    });
  }

  console.log(`[SERVER] Ready to listen on port ${PORT}...`);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Success! Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("FATAL STARTUP ERROR:", err);
  process.exit(1);
});
