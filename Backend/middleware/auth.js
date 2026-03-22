const supabase = require('../config/supabase');

/**
 * Middleware to verify Supabase JWT token and attach user data to req.user.
 */
exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token; // Support tokens in query string for downloads

    if (!authHeader && !queryToken) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization denied.',
      });
    }

    const token = authHeader ? authHeader.split(' ')[1] : queryToken;

    // 1. Verify token with Supabase Auth
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      console.error('Auth verification failed:', authError?.message || 'No user found');
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }

    // 2. Fetch full user details from our `users` table
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id, auth_id, college_id, role, full_name, email')
      .eq('auth_id', authUser.id)
      .single();

    if (dbError || !dbUser) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found in database.',
      });
    }

    // 3. Attach consolidated user object to request
    req.user = {
      ...dbUser, // id (user_id), auth_id, college_id, role, full_name, email
      token,
    };

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware to restrict route access to specific roles.
 * Must be used AFTER `authenticate`.
 *
 * Usage: authorize('admin', 'system')
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user?.role || 'none'}) is not authorized to access this route.`,
      });
    }
    next();
  };
};
