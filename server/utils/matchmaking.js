// Matchmaking scores. PURE functions: data in, ranking out, so they're easy to unit test.
//   +2 per skill the volunteer has that the child needs
//   +1 per shared day
//   -1 per OTHER child the volunteer already has (workload)

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function scoreVolunteer(child, volunteer, allChildren) {
  const needs = child.needs || []
  const volunteerDays = volunteer.availability || []

  const matchedSkills = (volunteer.skills || []).filter((s) => needs.includes(s))

  // Children don't store days yet, so every day the volunteer is free counts as shared.
  // If a child.availability field is added later, this starts using it automatically.
  const childDays = child.availability?.length ? child.availability : DAYS
  const sharedDays = volunteerDays.filter((d) => childDays.includes(d))

  // Exclude THIS child, otherwise an already-assigned volunteer is penalised for this very child.
  const workload = allChildren.filter(
    (c) => c.id !== child.id && (c.volunteerIds || []).includes(volunteer.id),
  ).length

  const breakdown = { skills: 2 * matchedSkills.length, days: sharedDays.length, workload: -workload }

  return {
    volunteerId: volunteer.id,
    name: volunteer.name,
    availability: volunteerDays,
    score: breakdown.skills + breakdown.days + breakdown.workload,
    breakdown,
    matchedSkills,
    sharedDays,
    workload,
    assigned: (child.volunteerIds || []).includes(volunteer.id),
    scheduledDays: (child.schedule || []).filter((s) => s.volunteerId === volunteer.id).map((s) => s.day),
  }
}

// Highest score first. Ties: more matched skills, then alphabetical.
export function rankVolunteers(child, volunteers, allChildren) {
  return volunteers
    .map((v) => scoreVolunteer(child, v, allChildren))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.matchedSkills.length - a.matchedSkills.length ||
        a.name.localeCompare(b.name),
    )
}