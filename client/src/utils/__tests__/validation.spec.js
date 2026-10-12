// Unit tests for the sign-up checks.   Owner: Kai Sen
// Run:  pnpm test:unit
import { describe, it, expect } from 'vitest'
import { isValidEmail, validateSignup } from '../validation'

// A form that passes every check; each test changes one thing
const goodForm = () => ({
  name: 'Tan Ah Kow',
  email: 'ahkow@example.com',
  password: 'secret123',
  confirmPassword: 'secret123',
})

describe('isValidEmail', () => {
  it('accepts a normal email', () => {
    expect(isValidEmail('ahkow@example.com')).toBe(true)
  })

  it('rejects emails without @, without a dot, or with spaces', () => {
    expect(isValidEmail('ahkow.example.com')).toBe(false)
    expect(isValidEmail('ahkow@example')).toBe(false)
    expect(isValidEmail('ah kow@example.com')).toBe(false)
  })
})

describe('validateSignup', () => {
  it('returns no errors for a correct form', () => {
    expect(validateSignup(goodForm())).toEqual({})
  })

  it('needs a name', () => {
    expect(validateSignup({ ...goodForm(), name: '   ' }).name).toBeTruthy()
  })

  it('needs a valid email', () => {
    expect(validateSignup({ ...goodForm(), email: '' }).email).toBe('Please enter your email.')
    expect(validateSignup({ ...goodForm(), email: 'hello' }).email).toContain('valid email')
  })

  it('needs a password of at least 8 characters', () => {
    const form = { ...goodForm(), password: 'short', confirmPassword: 'short' }
    expect(validateSignup(form).password).toContain('at least 8')
  })

  it('accepts a password of exactly 8 characters', () => {
    const form = { ...goodForm(), password: '12345678', confirmPassword: '12345678' }
    expect(validateSignup(form)).toEqual({})
  })

  it('needs the two passwords to match', () => {
    const form = { ...goodForm(), confirmPassword: 'different1' }
    expect(validateSignup(form).confirmPassword).toBe('Passwords do not match.')
  })
})