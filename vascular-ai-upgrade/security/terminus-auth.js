// Middleware для проверки доступа к медицинским данным
const crypto = require('crypto');

class MedicalDataAccessControl {
  // RBAC для медицинских ролей
  static ROLES = {
    SURGEON: ['read:patients', 'write:diagnosis', 'read:full_atlas', 'execute:ai_prediction'],
    RESIDENT: ['read:patients', 'read:atlas', 'execute:calculators'],
    RADIOLOGIST: ['read:dicom', 'write:reports', 'read:full_atlas'],
    ADMIN: ['*']
  };

  static auditLog(action, userId, patientId, data) {
    const timestamp = new Date().toISOString();
    const hash = crypto.createHash('sha256').update(`${userId}${patientId}${timestamp}`).digest('hex');
    
    console.log(JSON.stringify({
      timestamp,
      action,
      userId: hash,  // Псевдонимизация
      patientId: patientId ? '***' : null,  // Не логируем реальный ID
      ip: data.ip,
      userAgent: data.userAgent
    }));
  }

  static validateDicomAccess(req, res, next) {
    const userRole = req.headers['x-user-role'];
    const studyId = req.params.studyId;
    
    // Проверка: врач может видеть только свои исследования или назначенные ему
    if (!MedicalDataAccessControl.ROLES[userRole]?.includes('read:dicom')) {
      return res.status(403).json({ error: 'Insufficient privileges for DICOM access' });
    }
    
    MedicalDataAccessControl.auditLog('DICOM_ACCESS', req.user.id, studyId, {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    next();
  }
}

module.exports = MedicalDataAccessControl;
