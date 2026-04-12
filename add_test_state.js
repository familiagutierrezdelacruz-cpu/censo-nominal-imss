
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'census.db');
const db = new Database(dbPath);

try {
    // 1. Get or Insert State
    let estadoId;
    const existingEstado = db.prepare("SELECT id FROM estados WHERE nombre = ?").get("OAXACA");
    if (existingEstado) {
        estadoId = existingEstado.id;
        console.log(`Estado OAXACA ya existe con ID: ${estadoId}`);
    } else {
        const estadoResult = db.prepare("INSERT INTO estados (nombre) VALUES (?)").run("OAXACA");
        estadoId = estadoResult.lastInsertRowid;
        console.log(`Estado OAXACA creado con ID: ${estadoId}`);
    }

    // 2. Insert Region (using generic name)
    const regionResult = db.prepare("INSERT INTO regiones (nombre, estado_id) VALUES (?, ?)").run("VAS-Valles Centrales", estadoId);
    const regionId = regionResult.lastInsertRowid;
    console.log(`Región creada con ID: ${regionId}`);

    // 3. Insert Zona
    const zonaResult = db.prepare("INSERT INTO zonas (nombre, region_id) VALUES (?, ?)").run("Zona 01 Centro", regionId);
    const zonaId = zonaResult.lastInsertRowid;
    console.log(`Zona creada con ID: ${zonaId}`);

    // 4. Insert Health Unit
    const unitResult = db.prepare("INSERT INTO health_units (nombre, clues, zona_id) VALUES (?, ?, ?)").run("C.S. OAXACA CENTRO", "OAX001", zonaId);
    const unitId = unitResult.lastInsertRowid;
    console.log(`Unidad de Salud creada con ID: ${unitId}`);

    // 5. Create User
    const hashedPassword = bcrypt.hashSync("password123", 10);
    db.prepare("DELETE FROM users WHERE username = ?").run("admin_oaxaca"); // Clean up if exists
    db.prepare(`
    INSERT INTO users (username, password, role, estado_id, region_id, zona_id, health_unit_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run("admin_oaxaca", hashedPassword, "ESTATAL", estadoId, null, null, null);

    console.log("Usuario 'admin_oaxaca' creado exitosamente.");
    console.log("Credenciales: admin_oaxaca / password123");

} catch (error) {
    console.error("Error al insertar datos de prueba:", error.message);
} finally {
    db.close();
}
