// Form checks for sign up.   Owner: Kai Sen
// Kept as plain functions (no Vue) so they are easy to unit test (see __tests__/validation.spec.js).
// The server checks the same rules again in server/routes/auth.js.

export const MIN_PASSWORD_LENGTH = 8

// Something@something.something, with no spaces
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Returns an object with one message per field that has a problem.
// An empty object {} means the form is fine.
export function validateSignup(form) {
  const errors = {}

  if (!form.name.trim()) {
    errors.name = 'Please enter your full name.'
  }

  if (!form.email.trim()) {
    errors.email = 'Please enter your email.'
  } else if (!isValidEmail(form.email.trim())) {
    errors.email = 'Please enter a valid email, e.g. name@example.com.'
  }

  if (form.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }

  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  // Volunteers must pick at least one skill and one day, otherwise matchmaking
  // can never suggest them for a child. Parents don't see these questions.
  if (form.role === 'volunteer') {
    if (!form.skills || form.skills.length === 0) {
      errors.skills = 'Pick at least one skill you can help with.'
    }
    if (!form.availability || form.availability.length === 0) {
      errors.availability = 'Pick at least one day you can come in.'
    }
  }

  return errors
}