const studentService = require('../services/student.service');

exports.getDashboard = async (req, res) => {
  // `req.user.id` is the `id` from the `users` table, populated by our auth middleware
  const userId = req.user.id;

  const dashboardData = await studentService.getDashboardData(userId);

  res.status(200).json({
    success: true,
    data: dashboardData,
  });
};

exports.getNotifications = async (req, res) => {
  const userId = req.user.id;
  const notifications = await studentService.getNotifications(userId);

  res.status(200).json({
    success: true,
    data: notifications,
  });
};

exports.markNotificationRead = async (req, res) => {
  const userId = req.user.id;
  const { id: notificationId } = req.params;
  
  await studentService.markNotificationRead(userId, notificationId);

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
  });
};

exports.getDocuments = async (req, res) => {
  const userId = req.user.id;
  const docs = await studentService.getDocuments(userId);
  res.status(200).json({ success: true, data: docs });
};

exports.addDocument = async (req, res) => {
  const userId = req.user.id;
  
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  // 1. Upload to Supabase Storage bucket 'attachments'
  const fileExt = req.file.originalname.split('.').pop();
  const filePath = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  // We need the supabase client from the service to do the upload
  const supabase = require('../config/supabase'); // we need to check if this exports the client

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(filePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true
    });

  if (uploadError) {
    throw Object.assign(new Error('Failed to upload file to storage: ' + uploadError.message), { statusCode: 500 });
  }

  // 2. Get Public URL
  const { data: { publicUrl } } = supabase.storage
    .from('attachments')
    .getPublicUrl(filePath);

  // 3. Save metadata
  const docData = {
    title: req.body.title || req.file.originalname,
    format: fileExt.toUpperCase(),
    size: (req.file.size / (1024 * 1024)).toFixed(2) + ' MB',
    file_url: publicUrl,
    icon: req.body.icon || 'description'
  };

  const newDoc = await studentService.addDocument(userId, docData);
  res.status(201).json({ success: true, data: newDoc });
};

exports.deleteDocument = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  await studentService.deleteDocument(userId, id);
  res.status(200).json({ success: true, message: 'Document deleted' });
};
