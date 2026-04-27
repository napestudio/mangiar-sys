# Guía de Configuración de Facturación Electrónica ARCA

## Requisitos previos

Antes de comenzar, el restaurant necesita:

- **CUIT** activo (11 dígitos)
- **Clave Fiscal nivel 3** en ARCA (la más alta — permite usar servicios web)
- **Situación fiscal** en orden: inscripto como Responsable Inscripto, Monotributista o Exento

> Si la Clave Fiscal es nivel 2, hay que elevarla a nivel 3. Esto se hace presencialmente en una agencia de ARCA o por turnos web en [arca.gob.ar](https://www.arca.gob.ar).

---

## Parte 1: Pasos en ARCA

### Paso 1 — Autorizar el servicio de Facturación Electrónica

1. Ingresar a [https://auth.afip.gob.ar](https://auth.afip.gob.ar) con CUIT y Clave Fiscal
2. Ir a **"Administrador de Relaciones de Clave Fiscal"** (en el menú principal)
3. Hacer clic en **"Adherir Servicio"**
4. Seleccionar: **"AFIP"** → **"WebServices"** → **"Facturación Electrónica"** (`wsfe`)
5. Confirmar la adhesión

> Este paso autoriza al CUIT a emitir facturas electrónicas a través de servicios web (que es lo que usa el sistema).

---

### Paso 2 — Crear un Punto de Venta

1. En ARCA, buscar **"ABM Puntos de Venta"** o ir al servicio **"Comprobantes en línea"**
2. Crear un nuevo Punto de Venta con:
   - **Tipo**: `Factura electrónica - Servidor de Intercambio de Información con Contribuyentes (SIIC/RECE)`
   - **Número**: elegir un número (por ejemplo, `1`). Anotar este número — se usará en el sistema.
3. Guardar

> El número de Punto de Venta identifica el local desde donde se emiten las facturas. Se puede tener más de uno (por sucursal, por ejemplo).

---

### Paso 3 — Generar el Certificado Digital

El sistema necesita un certificado digital para autenticarse con ARCA. Se compone de dos archivos:

- **Clave privada** (`.key`): se genera en tu computadora, **nunca se sube a ARCA**
- **Certificado** (`.crt`): lo emite ARCA a partir de tu clave privada

#### 3a. Generar la clave privada y el CSR con OpenSSL

Abrir una terminal (en Windows: PowerShell o Git Bash) y ejecutar:

```bash
# Generar la clave privada (2048 bits)
openssl genrsa -out clave_privada.key 2048

# Generar el CSR (Certificate Signing Request)
openssl req -new -key clave_privada.key -out solicitud.csr
```

Al ejecutar el segundo comando, OpenSSL pedirá algunos datos. Completar con la información del negocio:

```
Country Name (2 letter code): AR
State or Province Name: [provincia, ej: Buenos Aires]
Locality Name: [ciudad, ej: CABA]
Organization Name: [razón social, ej: Mi Resto S.R.L.]
Organizational Unit Name: [dejar en blanco o poner el CUIT]
Common Name: [nombre o CUIT]
Email Address: [email de contacto]
```

> `clave_privada.key` es el archivo que va a la sección "Clave privada" del sistema. **Guardarlo en un lugar seguro y no compartirlo.**

#### 3b. Obtener el certificado de ARCA

1. Ir a ARCA → **"Certificados Digitales"** (en el Administrador de Relaciones de Clave Fiscal)
2. Hacer clic en **"Agregar Alias"** o **"Nuevo Certificado"**
3. Asignar un alias (nombre descriptivo, ej: `mi-resto-facturacion`)
4. Subir el archivo `solicitud.csr` generado en el paso anterior
5. ARCA genera y permite descargar el **certificado** (archivo `.crt` o `.cer`)

> Los certificados ARCA tienen una vigencia de **2 años**. Recordar renovarlos antes del vencimiento.

#### 3c. Verificar el contenido de los archivos

Abrir los archivos con un editor de texto (Notepad, VSCode, etc.) y verificar que:

- `clave_privada.key` empiece con: `-----BEGIN PRIVATE KEY-----` o `-----BEGIN RSA PRIVATE KEY-----`
- `certificado.crt` empiece con: `-----BEGIN CERTIFICATE-----`

Si los archivos tienen otro formato (binario, Base64 sin encabezados), consultar con soporte técnico.

---

## Parte 2: Pasos en el Sistema

### Paso 4 — Ingresar los Datos Fiscales

1. En el dashboard, ir a **Configuración → Facturación**
2. En la pestaña **"Datos Fiscales"**, completar:
   - **Razón social**: nombre legal del negocio
   - **CUIT**: 11 dígitos, sin guiones
   - **Dirección fiscal**: domicilio registrado en ARCA
   - **Inicio de actividad**: fecha de inicio según constancia de ARCA
   - **Ingresos brutos**: número de inscripción provincial (si aplica)
   - **Situación fiscal**: elegir la opción correcta:
     - **Responsable Inscripto**: emitirá Facturas A y B
     - **Monotributo**: emitirá solo Facturas C
     - **Exento**: emitirá solo Facturas C
   - **Tipo de factura predeterminado**: se ajusta automáticamente según la situación fiscal
3. Hacer clic en **"Guardar configuración"**

---

### Paso 5 — Cargar los Certificados

1. Ir a la pestaña **"Certificados"**
2. Seleccionar el **Ambiente**:
   - **Prueba / Homologación**: para hacer tests sin emitir facturas reales
   - **Producción**: para emitir facturas reales (usar solo cuando todo esté funcionando)
3. En el campo **"Certificado digital (.crt)"**: abrir el archivo `certificado.crt` con un editor de texto, copiar **todo el contenido** (incluyendo las líneas `-----BEGIN CERTIFICATE-----` y `-----END CERTIFICATE-----`) y pegarlo en el campo
4. En el campo **"Clave privada (.key)"**: abrir el archivo `clave_privada.key` con un editor de texto, copiar **todo el contenido** (incluyendo las líneas `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`) y pegarlo en el campo
5. Hacer clic en **"Guardar certificados"**

> Una vez guardados, los campos mostrarán "Certificado configurado ✓". El contenido nunca se muestra nuevamente por seguridad.

---

### Paso 6 — Configurar el Punto de Venta

1. Ir a la pestaña **"Puntos de Venta"**
2. Ingresar el número del Punto de Venta creado en el Paso 2 de ARCA
3. Hacer clic en **"Guardar configuración"**

> Opcionalmente, usar el botón **"Sincronizar con ARCA"** para ver todos los puntos de venta autorizados para ese CUIT y confirmar que el número ingresado es correcto.

---

### Paso 7 — Habilitar y Probar

1. Volver a la pestaña **"Datos Fiscales"**
2. Activar el switch **"Habilitar facturación electrónica"**
3. Guardar
4. Ir a la pestaña **"Pruebas"** y hacer clic en **"Probar conexión"**
5. El resultado debe mostrar:
   - ✓ **Conexión exitosa**
   - El CUIT del restaurant (confirma que se usa la config correcta)
   - El ambiente (Prueba o Producción)

Si la conexión falla, verificar:
- Que el certificado y la clave privada se pegaron completos (con las líneas BEGIN/END)
- Que los certificados no estén vencidos
- Que el servicio `wsfe` esté autorizado en ARCA (Paso 1)
- Que haya acceso a internet desde el servidor

---

## Parte 3: Emitir Facturas

Una vez configurado y habilitado, las facturas se emiten desde dos lugares:

### Desde una orden completada

1. Ir a una orden en estado **"Completada"**
2. Hacer clic en **"Generar factura"**
3. Completar los datos del cliente:
   - **Tipo de documento**: CUIT (para Factura A), DNI o Consumidor Final (para B/C)
   - **Número de documento**: el número correspondiente
   - **Nombre o razón social**
4. Seleccionar el **tipo de factura** (A, B o C según corresponda)
5. Confirmar — el sistema consulta el próximo número de comprobante a ARCA, emite la factura y guarda el **CAE** (Código de Autorización Electrónico)

### Manual (sin orden asociada)

Ir a **Facturación** en el menú → botón **"Nueva factura"** → completar los ítems y datos del cliente.

---

## Parte 4: Descargar y Verificar

- **PDF**: desde la lista de facturas, descargar el PDF. Incluye todos los datos obligatorios y un **código QR** para verificación
- **QR**: al escanear el código QR de la factura, se abre el portal oficial de ARCA donde cualquier persona puede verificar la autenticidad de la factura
- **Estado de la factura**: las facturas pueden estar en estado `Emitida` (con CAE), `Fallida` (ARCA la rechazó) o `Cancelada` (anulada con nota de crédito)

---

## Renovación del Certificado

Los certificados ARCA vencen cada 2 años. Antes del vencimiento:

1. Generar una nueva clave privada y CSR (repetir el Paso 3a)
2. Obtener el nuevo certificado de ARCA (repetir el Paso 3b)
3. En el sistema → Configuración → Facturación → pestaña "Certificados" → hacer clic en **"Reemplazar"** y pegar el nuevo contenido
4. Probar la conexión para confirmar que todo funciona

---

## Glosario

| Término | Descripción |
|---|---|
| **CUIT** | Código Único de Identificación Tributaria (11 dígitos) |
| **Clave Fiscal** | Contraseña de acceso a los servicios de ARCA |
| **CAE** | Código de Autorización Electrónico — confirma que ARCA autorizó la factura |
| **Punto de Venta** | Número que identifica el local o canal de venta (ej: 1, 2, 3...) |
| **wsfe** | Web Service de Facturación Electrónica — el servicio de ARCA que usa el sistema |
| **CSR** | Certificate Signing Request — solicitud para que ARCA emita un certificado |
| **PEM** | Formato de texto para certificados (empieza con `-----BEGIN...-----`) |
| **Factura A** | Para Responsables Inscriptos (requiere CUIT del cliente) |
| **Factura B** | Para consumidores finales, monotributistas o sin discriminar IVA |
| **Factura C** | Para monotributistas y exentos que emiten (sin IVA) |
| **Nota de Crédito** | Comprobante que cancela/revierte una factura emitida |
