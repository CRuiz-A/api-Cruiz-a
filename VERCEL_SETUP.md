# 🚀 Configuración de Vercel para Nest.js + Turnstile

## Variables de Entorno Requeridas

Para que la aplicación funcione correctamente en Vercel, necesitas configurar las siguientes variables de entorno:

### 1. JWT Configuration
```
JWT_ACCESS_SECRET=your-super-secret-jwt-access-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-key-change-in-production
JWT_AUDIENCE=your-app-name
JWT_ISSUER=your-app-name
```

### 2. Database Configuration
```
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

### 3. Turnstile Configuration
```
TURNSTILE_SECRET_KEY=0x4AAAAAABnyQAC0I2WRq8rXOGQKSmPZuy8
```

### 4. Application Configuration
```
NODE_ENV=production
PORT=3000
```

## 🔧 Cómo Configurar en Vercel

1. Ve a tu proyecto en el Dashboard de Vercel
2. Navega a **Settings** → **Environment Variables**
3. Agrega cada variable de entorno:

### Variables Críticas para Reparar el Error Actual:

```bash
# JWT Secrets (genera claves fuertes para producción)
JWT_ACCESS_SECRET=abcdef123456789supersecretaccesskey
JWT_REFRESH_SECRET=ghijkl987654321supersecretrefreshkey
JWT_AUDIENCE=nest-app
JWT_ISSUER=nest-app

# Database (configura tu base de datos real)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Turnstile
TURNSTILE_SECRET_KEY=0x4AAAAAABnyQAC0I2WRq8rXOGQKSmPZuy8

# App Config
NODE_ENV=production
```

## 🐛 Solucionando Errores Actuales

### Error: "Empty key given at NodeRSA.importKey"
- **Causa**: Variables JWT no configuradas
- **Solución**: Agregar JWT_ACCESS_SECRET y JWT_REFRESH_SECRET

### Error: "No exports found in module /var/task/index.js"
- **Causa**: Funciones de prueba ejecutándose en producción
- **Solución**: Modificar main.ts para saltar pruebas en producción

## 🚀 Pasos para Desplegar

1. Configurar todas las variables de entorno en Vercel
2. Hacer push del código arreglado
3. Vercel re-desplegará automáticamente
4. Probar el endpoint: `https://tu-app.vercel.app/api/validate-captcha`

## 📝 Generar Claves JWT Seguras

Para producción, genera claves seguras:

```bash
# Método 1: Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Método 2: OpenSSL
openssl rand -hex 64
```

## ✅ Verificación Post-Despliegue

Una vez configurado, verifica que funcione:

```bash
curl -X POST https://tu-app.vercel.app/api/validate-captcha \
  -H "Content-Type: application/json" \
  -d '{"captchaToken":"test_token"}'
```

Debería devolver:
```json
{"success":false,"message":"CAPTCHA inválido","errors":["invalid-input-response"]}
``` 