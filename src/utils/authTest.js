/**
 * Authentication Flow Test Utility
 * 
 * This utility provides functions to test the authentication flow and session persistence.
 * It can be imported and used in the browser console to verify authentication works correctly.
 */

import { api } from '../services/api';
import * as authService from '../services/authService';

/**
 * Tests the complete authentication flow
 */
export const testAuthFlow = async () => {
  console.group('🔒 Authentication Flow Test');
  
  try {
    // Step 1: Check initial authentication state
    console.log('1. Checking initial authentication state...');
    const initialAuth = authService.isAuthenticated();
    console.log(`   Initial auth state: ${initialAuth ? 'Authenticated ✅' : 'Not authenticated ❌'}`);
    
    // Step 2: Test session persistence with backend verification
    console.log('2. Testing session persistence with backend verification...');
    const verifyResult = await authService.verifyAuth();
    console.log(`   Backend verification: ${verifyResult ? 'Session valid ✅' : 'Session invalid ❌'}`);
    
    // Step 3: Test API calls with authentication
    console.log('3. Testing authenticated API call...');
    try {
      const response = await api.get('/auth/profile', { withCredentials: true });
      console.log('   API call successful ✅');
      console.log('   User data:', response.data);
    } catch (error) {
      console.error('   API call failed ❌', error.response?.status || error.message);
    }
    
    // Step 4: Test localStorage data integrity
    console.log('4. Testing localStorage data integrity...');
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    console.log(`   User data in localStorage: ${userData ? '✅' : '❌'}`);
    if (userData) {
      console.log('   User role:', userData.role);
      console.log('   User email:', userData.email);
    }
    
    console.log('✅ Authentication flow test completed');
  } catch (error) {
    console.error('❌ Authentication flow test failed:', error);
  }
  
  console.groupEnd();
  return 'Authentication flow test completed';
};

/**
 * Tests the OAuth redirect flow
 */
export const testOAuthRedirect = () => {
  console.group('🔄 OAuth Redirect Test');
  
  try {
    // Simulate Google OAuth redirect
    console.log('1. Simulating Google OAuth redirect...');
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://book-by-truf-backend.onrender.com';
    const redirectUrl = `${API_BASE}/api/oauth2/authorization/google`;
    
    console.log(`   Redirect URL: ${redirectUrl}`);
    console.log('   To test OAuth flow, open this URL in your browser');
    
    // Check if redirect cookie is set correctly
    console.log('2. Setting redirect cookie...');
    document.cookie = "auth_redirect=dashboard; path=/; max-age=300; SameSite=None; Secure";
    console.log('   Redirect cookie set ✅');
    
    console.log('✅ OAuth redirect test setup completed');
  } catch (error) {
    console.error('❌ OAuth redirect test failed:', error);
  }
  
  console.groupEnd();
  return 'OAuth redirect test completed';
};

/**
 * Tests the logout flow
 */
export const testLogout = async () => {
  console.group('🚪 Logout Test');
  
  try {
    // Test logout functionality
    console.log('1. Testing logout functionality...');
    await authService.logout();
    
    // Verify user is logged out
    console.log('2. Verifying user is logged out...');
    const isStillAuthenticated = authService.isAuthenticated();
    console.log(`   Authentication state after logout: ${isStillAuthenticated ? 'Still authenticated ❌' : 'Successfully logged out ✅'}`);
    
    console.log('✅ Logout test completed');
  } catch (error) {
    console.error('❌ Logout test failed:', error);
  }
  
  console.groupEnd();
  return 'Logout test completed';
};

// Export a simple function to run all tests
export const runAllTests = async () => {
  console.log('🧪 Running all authentication tests...');
  await testAuthFlow();
  testOAuthRedirect();
  await testLogout();
  return 'All tests completed';
};

// Instructions for manual testing in browser console
console.log(`
To test authentication flow in browser console:
1. Import the test utilities:
   import * as authTest from './utils/authTest';

2. Run individual tests:
   authTest.testAuthFlow();
   authTest.testOAuthRedirect();
   authTest.testLogout();

3. Or run all tests:
   authTest.runAllTests();
`);