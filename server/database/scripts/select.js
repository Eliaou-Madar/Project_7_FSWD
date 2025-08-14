// server/scripts/select.js
import connection from '../connection.js';

async function selectUsers() {
  try {
    const [rows] = await connection.query('SELECT * FROM users');
    console.log('📋 Liste des utilisateurs :');
    console.table(rows);
  } catch (err) {
    console.error('❌ Erreur lors de la récupération des utilisateurs :', err);
  } finally {
    await connection.end();
  }
}

selectUsers();
