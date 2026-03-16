-- SQL for Supabase SQL Editor

-- Table: categoria
CREATE TABLE IF NOT EXISTS categoria (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    nombre TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: establecimientos
CREATE TABLE IF NOT EXISTS establecimientos (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    nombre TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: gastos
CREATE TABLE IF NOT EXISTS gastos (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    categoria TEXT NOT NULL,
    establecimiento TEXT NOT NULL,
    metodo_pago TEXT CHECK (metodo_pago IN ('Liquidez', 'Tarjeta')),
    tipo_gasto TEXT CHECK (tipo_gasto IN ('Fijo', 'Variable')),
    monto DECIMAL(10, 2) NOT NULL,
    descripcion TEXT,
    fecha DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert some default categories
INSERT INTO categoria (nombre) VALUES 
('Alimentación'), ('Transporte'), ('Vivienda'), ('Servicios'), ('Entretenimiento'), ('Salud'), ('Otros')
ON CONFLICT (nombre) DO NOTHING;

-- Insert some default establishments
INSERT INTO establecimientos (nombre) VALUES 
('Supermercado'), ('Restaurante'), ('Gasolinera'), ('Farmacia'), ('Tienda online'), ('Otros')
ON CONFLICT (nombre) DO NOTHING;
