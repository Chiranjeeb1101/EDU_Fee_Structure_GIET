require('dotenv').config({ override: true });
const authService = require('./services/auth.service');
const supabase = require('./config/supabase');

async function testUpdateProfileInternal() {
  try {
    const { data: user } = await supabase.from('users').select('id, email, full_name').limit(1).single();
    if (!user) {
      console.log('No users found in database');
      return;
    }
    
    console.log(`Testing internal AuthService.updateProfile for user: ${user.full_name} (${user.id})`);
    
    const mockPic = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Qf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Qf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8Qf//Z";
    
    const result = await authService.updateProfile(user.id, {
      profile_picture: mockPic
    });
    
    console.log('✅ Result:', result.profile_picture);
    
    if (result.profile_picture && result.profile_picture.startsWith('http')) {
       console.log('🎉 Profile picture uploaded successfully and returned a URL!');
    } else {
       console.log('❌ Failed: return profile picture is not a URL:', result.profile_picture);
    }

  } catch (error) {
    console.error('❌ Internal error:', error.message);
  }
}

testUpdateProfileInternal();
