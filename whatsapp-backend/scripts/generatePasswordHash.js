// scripts/generatePasswordHash.js
const bcrypt = require('bcryptjs');

// Obtener contraseña de argumentos de línea de comandos
const password = process.argv[2];

if (!password) {
  console.log('❌ Por favor proporciona una contraseña');
  console.log('Uso: node scripts/generatePasswordHash.js "TuContraseñaSegura123!"');
  process.exit(1);
}

// Validar contraseña
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`La contraseña debe tener al menos ${minLength} caracteres`);
  }
  if (!hasUpperCase) {
    errors.push('Debe contener al menos una letra mayúscula');
  }
  if (!hasLowerCase) {
    errors.push('Debe contener al menos una letra minúscula');
  }
  if (!hasNumbers) {
    errors.push('Debe contener al menos un número');
  }
  if (!hasSpecialChar) {
    errors.push('Debe contener al menos un carácter especial (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generar hash
async function generateHash() {
  console.log('\n🔐 Generador de Hash de Contraseña\n');
  console.log(`Contraseña: ${password}`);
  
  // Validar
  const validation = validatePassword(password);
  
  if (!validation.isValid) {
    console.log('\n❌ La contraseña no cumple con los requisitos:');
    validation.errors.forEach(error => console.log(`   - ${error}`));
    process.exit(1);
  }
  
  console.log('✅ La contraseña es válida\n');
  
  // Generar hash
  console.log('Generando hash...');
  const hash = await bcrypt.hash(password, 10);
  
  console.log('\n📋 Hash generado:');
  console.log('=====================================');
  console.log(hash);
  console.log('=====================================\n');
  
  console.log('📝 Para usar este hash:');
  console.log('1. Abre el archivo data/users.json');
  console.log('2. Reemplaza el valor de "password" con el hash generado');
  console.log('3. Guarda el archivo');
  console.log('\n⚠️  IMPORTANTE: Nunca compartas el hash ni lo subas a git');
}

generateHash();