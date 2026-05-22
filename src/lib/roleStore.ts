export type ClassroomRole = 'parent' | 'student';

const ROLE_STORAGE_KEY = 'classroom-active-role';
const ROLE_PASSWORD_KEY = 'classroom-parent-password';

// Get active role, default is 'parent' so teacher can configure initially, or let them switch easily
export function getActiveRole(): ClassroomRole {
  try {
    const role = localStorage.getItem(ROLE_STORAGE_KEY);
    return (role === 'student' || role === 'parent') ? role : 'parent';
  } catch (e) {
    return 'parent';
  }
}

// Set active role and dispatch custom event
export function setActiveRole(role: ClassroomRole) {
  try {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
    window.dispatchEvent(new Event('classroom-role-changed'));
  } catch (e) {
    console.error('Failed to save role:', e);
  }
}

// Simple pin-code/password for parent/teacher mode to protect rewards
// If user sets a password, they can prevent kids from clicking. Default password is none or simple math quiz.
export function getParentPassword(): string {
  try {
    return localStorage.getItem(ROLE_PASSWORD_KEY) || '';
  } catch (e) {
    return '';
  }
}

export function setParentPassword(password: string) {
  try {
    localStorage.setItem(ROLE_PASSWORD_KEY, password);
    window.dispatchEvent(new Event('classroom-role-changed'));
  } catch (e) {
    console.error('Failed to save password:', e);
  }
}
