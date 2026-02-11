/**
 * Conexión a MySQL (PHPMyAdmin en hosting)
 * Base de datos: winston_general
 * Tabla: alumno
 */

import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function getMySQLPool() {
  if (!pool) {
    const host = process.env.MYSQL_HOST
    const user = process.env.MYSQL_USER
    const password = process.env.MYSQL_PASSWORD
    const database = process.env.MYSQL_DATABASE

    if (!host || !user || !password || !database) {
      console.error('[MySQL] Faltan variables de entorno de MySQL')
      throw new Error('MySQL credentials not configured')
    }

    pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })
  }
  return pool
}

export type AlumnoData = {
  alumno_app: string // Del app (ej: "maternal_a", "primaria_1")
  alumno_apm: string // Apellido paterno
  alumno_nombre: string // Nombre completo
  alumno_nivel: string // 1= Maternal, 2= Kinder, 3= Primaria, 4= Secundaria
  alumno_grado: string // Grado dentro del nivel
  alumno_grupo?: string // Grupo (vacío por defecto)
  alumno_status: string // 0= Baja General, 1= Activo, 2= Inactivo, 3= Baja Temporal Administrativa, 4= Bloqueado por Psicología
  alumno_nuevo_ingreso: string // 0= Reingreso, 1= Nuevo Ingreso de Agenda
  alumno_ciclo_escolar: string // Ej: "2015 - 2016"
  alumno_registro?: string // Fecha de alta (se pone automáticamente)
  alumno_alta?: string // Fecha de alta de inscripción
}

/**
 * Obtiene el siguiente alumno_ref disponible (último + 1)
 */
export async function getNextAlumnoRef(): Promise<number> {
  const pool = getMySQLPool()
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    'SELECT MAX(alumno_ref) as max_ref FROM alumno'
  )
  const maxRef = rows[0]?.max_ref || 0
  return maxRef + 1
}

/**
 * Crea un nuevo alumno en la tabla MySQL
 * Retorna el alumno_ref asignado
 */
export async function createAlumnoInMySQL(data: AlumnoData): Promise<number> {
  const pool = getMySQLPool()
  const alumno_ref = await getNextAlumnoRef()

  const insertData = {
    alumno_ref,
    alumno_app: data.alumno_app || '',
    alumno_apm: data.alumno_apm || '',
    alumno_nombre: data.alumno_nombre || '',
    alumno_nivel: data.alumno_nivel || '',
    alumno_grado: data.alumno_grado || '',
    alumno_grupo: data.alumno_grupo || '',
    alumno_status: data.alumno_status || '1', // Activo por defecto
    alumno_nuevo_ingreso: data.alumno_nuevo_ingreso || '1', // Nuevo ingreso por defecto
    alumno_ciclo_escolar: data.alumno_ciclo_escolar || '',
    alumno_registro: new Date(),
    alumno_alta: data.alumno_alta || new Date(),
  }

  await pool.query('INSERT INTO alumno SET ?', [insertData])

  console.log('[MySQL] Alumno creado con ref:', alumno_ref)
  return alumno_ref
}

/**
 * Verifica si un alumno ya existe por nombre y apellido
 */
export async function checkAlumnoExists(nombre: string, apellido: string): Promise<number | null> {
  const pool = getMySQLPool()
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    'SELECT alumno_ref FROM alumno WHERE alumno_nombre = ? AND alumno_apm = ? LIMIT 1',
    [nombre, apellido]
  )
  return rows[0]?.alumno_ref || null
}
