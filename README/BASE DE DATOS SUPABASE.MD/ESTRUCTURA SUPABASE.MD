-- Creación de la tabla 'usuarios'
CREATE TABLE IF NOT EXISTS usuarios (
    userId VARCHAR(255) PRIMARY KEY, -- ID único del usuario (ej. UID de Firebase Auth)
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(50) NOT NULL, -- Valores esperados: 'profesional', 'administrativo'
    esAdmin BOOLEAN DEFAULT FALSE, -- Indica si el usuario tiene rol de administrador
    telefono VARCHAR(50),
    direccion TEXT,
    fotoPerfil VARCHAR(500), -- URL de la foto de perfil
    fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Creación de la tabla 'solicitudRegistro'
CREATE TABLE IF NOT EXISTS solicitudRegistro (
    solicitudId VARCHAR(255) PRIMARY KEY, -- ID único de la solicitud de registro
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    rolSolicitado VARCHAR(50) NOT NULL, -- Rol deseado: 'profesional', 'administrativo'
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente', -- Valores: 'pendiente', 'aprobada', 'rechazada'
    fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Creación de la tabla 'pacientes'
CREATE TABLE IF NOT EXISTS pacientes (
    pacienteId VARCHAR(255) PRIMARY KEY, -- ID único del paciente
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    rut VARCHAR(50) UNIQUE NOT NULL, -- Número de identificación único del paciente
    email VARCHAR(255),
    telefono VARCHAR(50),
    fechaNacimiento DATE,
    fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Creación de la tabla 'citas'
CREATE TABLE IF NOT EXISTS citas (
    citaId VARCHAR(255) PRIMARY KEY, -- ID único de la cita
    profesionalId VARCHAR(255) NOT NULL, -- Referencia al profesional asignado
    pacienteId VARCHAR(255) NOT NULL,   -- Referencia al paciente
    fecha TIMESTAMP NOT NULL, -- Fecha y hora exacta de la cita
    duracionMinutos INT, -- Duración de la cita en minutos
    estado VARCHAR(50) NOT NULL DEFAULT 'agendada', -- 'agendada', 'confirmada', 'cancelada', 'completada'
    motivo TEXT, -- Descripción o motivo breve de la cita
    observaciones TEXT,
    tipoCita VARCHAR(100),
    FOREIGN KEY (profesionalId) REFERENCES usuarios(userId),
    FOREIGN KEY (pacienteId) REFERENCES pacientes(pacienteId)
);

-- Creación de la tabla 'modulos'
CREATE TABLE IF NOT EXISTS modulos (
    moduloId VARCHAR(255) PRIMARY KEY, -- ID único del módulo
    profesionalId VARCHAR(255) NOT NULL, -- Referencia al profesional/administrativo que creó o posee el módulo
    fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    configuracion JSON, -- Almacena la estructura flexible de configuración del módulo
    FOREIGN KEY (profesionalId) REFERENCES usuarios(userId)
);

-- Creación de la tabla 'plantillas'
CREATE TABLE IF NOT EXISTS plantillas (
    plantillaId VARCHAR(255) PRIMARY KEY, -- ID único de la plantilla
    profesionalId VARCHAR(255), -- Referencia al profesional propietario de la plantilla (puede ser NULL si es de admin)
    createdBy VARCHAR(255) NOT NULL, -- Referencia al usuario que creó la plantilla
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(100), -- Tipo de plantilla (ej. 'cita', 'modulo')
    contenido JSON, -- Almacena la estructura flexible del contenido de la plantilla
    FOREIGN KEY (profesionalId) REFERENCES usuarios(userId),
    FOREIGN KEY (createdBy) REFERENCES usuarios(userId)
);

-- Creación de la tabla 'moduloDefinitions'
CREATE TABLE IF NOT EXISTS moduloDefinitions (
    moduloDefId VARCHAR(255) PRIMARY KEY, -- ID único de la definición de módulo
    profesionalId VARCHAR(255), -- Referencia al profesional propietario (si es una definición personalizada)
    createdBy VARCHAR(255) NOT NULL, -- Referencia al usuario que creó la definición
    nombre VARCHAR(255) NOT NULL,
    estamento VARCHAR(100), -- Categoría o especialidad a la que aplica
    configuracionBase JSON, -- Almacena la configuración predeterminada para el módulo
    FOREIGN KEY (profesionalId) REFERENCES usuarios(userId),
    FOREIGN KEY (createdBy) REFERENCES usuarios(userId)
);

-- Creación de la tabla 'config'
CREATE TABLE IF NOT EXISTS config (
    configKey VARCHAR(255) PRIMARY KEY, -- Clave/nombre de la configuración (ej. 'globalSettings', 'featureFlags')
    configValue TEXT -- Valor de la configuración, puede ser un JSON string para datos complejos
);
