-- init_database_schema.sql
-- Esquema completo de Agenda_Vercel con nombres de columnas en minúsculas
-- Ejecutar este script en Postgres para crear/ajustar todas las tablas

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    userid VARCHAR(255) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(50) NOT NULL,
    esadmin BOOLEAN DEFAULT FALSE,
    telefono VARCHAR(50),
    direccion TEXT,
    fotoperfil VARCHAR(500),
    fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    profesional BOOLEAN DEFAULT FALSE,
    profesion TEXT,
    estamento TEXT  -- DEPRECATED: Use 'profesion' field instead
);

-- Tabla: solicitudRegistro
CREATE TABLE IF NOT EXISTS solicitudregistro (
    solicitudid VARCHAR(255) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    rolsolicitado VARCHAR(50) NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: pacientes
CREATE TABLE IF NOT EXISTS pacientes (
    pacienteid VARCHAR(255) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    rut VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(50),
    fechanacimiento DATE,
    fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: citas
CREATE TABLE IF NOT EXISTS citas (
    citaid VARCHAR(255) PRIMARY KEY,
    profesionalid VARCHAR(255) NOT NULL,
    pacienteid VARCHAR(255) NOT NULL,
    fecha TIMESTAMP NOT NULL,
    duracionminutos INT,
    estado VARCHAR(50) NOT NULL DEFAULT 'agendada',
    motivo TEXT,
    observaciones TEXT,
    tipocita VARCHAR(100),
    CONSTRAINT fk_citas_profesional FOREIGN KEY (profesionalid) REFERENCES usuarios(userid) ON DELETE CASCADE,
    CONSTRAINT fk_citas_paciente FOREIGN KEY (pacienteid) REFERENCES pacientes(pacienteid) ON DELETE CASCADE
);

-- Tabla: modulos
CREATE TABLE IF NOT EXISTS modulos (
    moduloid VARCHAR(255) PRIMARY KEY,
    profesionalid VARCHAR(255) NOT NULL,
    fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    configuracion JSONB,
    CONSTRAINT fk_modulos_profesional FOREIGN KEY (profesionalid) REFERENCES usuarios(userid) ON DELETE CASCADE
);

-- Tabla: plantillas
CREATE TABLE IF NOT EXISTS plantillas (
    plantillaid VARCHAR(255) PRIMARY KEY,
    profesionalid VARCHAR(255),
    createdby VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(100),
    contenido JSONB,
    CONSTRAINT fk_plantillas_profesional FOREIGN KEY (profesionalid) REFERENCES usuarios(userid) ON DELETE CASCADE,
    CONSTRAINT fk_plantillas_createdby FOREIGN KEY (createdby) REFERENCES usuarios(userid) ON DELETE CASCADE
);

-- Tabla: modulodefinitions
CREATE TABLE IF NOT EXISTS modulodefinitions (
    modulodefid VARCHAR(255) PRIMARY KEY,
    profesionalid VARCHAR(255),
    createdby VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    profesion VARCHAR(100),  -- DEPRECATED: Use 'profesion' field in usuarios table
    configuracionbase JSONB,
    CONSTRAINT fk_modulodefinitions_profesional FOREIGN KEY (profesionalid) REFERENCES usuarios(userid) ON DELETE CASCADE,
    CONSTRAINT fk_modulodefinitions_createdby FOREIGN KEY (createdby) REFERENCES usuarios(userid) ON DELETE CASCADE
);

-- Tabla: config
CREATE TABLE IF NOT EXISTS config (
    configkey VARCHAR(255) PRIMARY KEY,
    configvalue TEXT
);

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_profesional ON usuarios(profesional);
CREATE INDEX IF NOT EXISTS idx_solicitudregistro_estado ON solicitudregistro(estado);
CREATE INDEX IF NOT EXISTS idx_pacientes_rut ON pacientes(rut);
CREATE INDEX IF NOT EXISTS idx_citas_profesionalid ON citas(profesionalid);
CREATE INDEX IF NOT EXISTS idx_citas_pacienteid ON citas(pacienteid);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha);
CREATE INDEX IF NOT EXISTS idx_modulos_profesionalid ON modulos(profesionalid);
CREATE INDEX IF NOT EXISTS idx_plantillas_profesionalid ON plantillas(profesionalid);
CREATE INDEX IF NOT EXISTS idx_plantillas_createdby ON plantillas(createdby);
CREATE INDEX IF NOT EXISTS idx_modulodefinitions_profesionalid ON modulodefinitions(profesionalid);
