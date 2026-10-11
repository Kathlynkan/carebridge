// Unit tests for the handover helpers   Owner: Yuqi
import { describe, it, expect } from 'vitest'
import { findRecurring, buildFallbackHandover } from '../handover.js'

// fake sessions, newest first (same shape as MongoDB)
const sessions = [
  { subject: 'Math', topic: 'Fractions', correct: 4, attempted: 5, struggles: ['Mixed numbers'], whatWorked: 'Pizza drawings', nextStep: 'Word problems' },
  { subject: 'Math', topic: 'Fractions', correct: 3, attempted: 5, struggles: ['Common denominators'], whatWorked: '', nextStep: '' },
  { subject: 'Math', topic: 'Fractions', correct: 1, attempted: 5, struggles: ['Common denominators'], whatWorked: '', nextStep: '' },
]

describe('findRecurring', () => {
  it('finds struggles that appear 2 or more times', () => {
    expect(findRecurring(sessions)).toEqual(['Common denominators'])
  })

  it('returns an empty list when nothing repeats', () => {
    expect(findRecurring([sessions[0]])).toEqual([])
  })
})

describe('buildFallbackHandover', () => {
  it('uses the newest session for volunteers', () => {
    const result = buildFallbackHandover(sessions, 'volunteer')
    expect(result.lastResult).toBe('4/5 correct')
    expect(result.source).toBe('fallback')
  })

  it('uses friendly words for parents', () => {
    const result = buildFallbackHandover(sessions, 'parent')
    expect(result.lastResult).toBe('Got 4 out of 5 right')
  })

  it('handles a child with no sessions', () => {
    const result = buildFallbackHandover([], 'volunteer')
    expect(result.continueTopic).toBe('No sessions yet')
  })
})