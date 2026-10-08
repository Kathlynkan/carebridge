<!-- =============================================================
  Manage children (CRUD)                              Owner: Kai Sen
  -------------------------------------------------------------
  Done: table of all children, "Add child" modal -> POST /children
  TODO (Kai Sen):
    [ ] edit (PUT) + delete (DELETE, with confirm)
    [ ] create the child's login + a "child code" for the parent to link
    [ ] search + responsive table (.table-responsive) / cards on mobile
============================================================= -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api, { errorMessage } from '@/services/api'
import { LEVELS, SKILL_OPTIONS } from '@/utils/constants'
import PageHeader from '@/components/PageHeader.vue'
import StateMessage from '@/components/StateMessage.vue'
import TodoPanel from '@/components/TodoPanel.vue'

// ---------- Table of children ----------
const children = ref([])
const parents = ref([]) // parent accounts, for the "Parent" dropdown in the form
const loading = ref(true)
const error = ref('')
const successMessage = ref('')

onMounted(async () => {
  try {
    // Load both lists at the same time
    const [childRes, parentRes] = await Promise.all([
      api.get('/children'),
      api.get('/users', { params: { role: 'parent' } }),
    ])
    children.value = childRes.data
    parents.value = parentRes.data
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
})

// ---------- "Add child" modal ----------
const emptyForm = () => ({ name: '', level: '', school: '', parentId: '', needs: [] })

const showModal = ref(false)
const form = ref(emptyForm())
const submitted = ref(false) // only show red errors after the first Save click
const saving = ref(false)
const saveError = ref('')

// Client-side checks (the server checks again - never trust only the browser)
const nameInvalid = computed(() => submitted.value && !form.value.name)
const levelInvalid = computed(() => submitted.value && !form.value.level)

function openModal() {
  form.value = emptyForm()
  submitted.value = false
  saveError.value = ''
  showModal.value = true
}

function closeModal() {
  if (!saving.value) showModal.value = false
}

async function addChild() {
  submitted.value = true
  saveError.value = ''
  if (!form.value.name || !form.value.level) return // stop here, the red messages show

  saving.value = true
  try {
    const res = await api.post('/children', form.value)
    // Show the new child right away, kept in A-Z order like the server's list
    children.value = [...children.value, res.data].sort((a, b) => a.name.localeCompare(b.name))
    successMessage.value = `${res.data.name} was added.`
    showModal.value = false
  } catch (err) {
    saveError.value = errorMessage(err) // e.g. "Level must be P1 to P6." from the server
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="container py-4">
    <PageHeader title="Children" subtitle="Everyone enrolled at the centre.">
      <button class="btn btn-primary" data-test="add-child" @click="openModal">
        <i class="bi bi-plus-lg me-1"></i>Add child
      </button>
    </PageHeader>
    <TodoPanel
      owner="Kai Sen"
      :items="['Edit / delete', 'Child login + parent link code', 'Search, mobile layout']"
    />

    <div v-if="successMessage" class="alert alert-success small" data-test="add-child-success">
      {{ successMessage }}
    </div>

    <StateMessage v-if="loading" type="loading" />
    <StateMessage v-else-if="error" type="error" :message="error" />

    <div v-else class="cb-card table-responsive">
      <table class="table align-middle mb-0">
        <thead>
          <tr>
            <th>Child</th>
            <th>Level</th>
            <th>Needs</th>
            <th>Volunteers</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in children" :key="c.id" data-test="child-row">
            <td>{{ c.avatar }} {{ c.name }}</td>
            <td>{{ c.level }}</td>
            <td>
              <span v-for="n in c.needs" :key="n" class="badge badge-soft me-1">{{ n }}</span>
            </td>
            <td>
              <span v-if="c.volunteerIds.length">{{ c.volunteerIds.length }}</span>
              <span v-else class="badge badge-danger-soft">Unassigned</span>
            </td>
            <td class="text-end">
              <RouterLink
                :to="{ name: 'child-profile', params: { id: c.id } }"
                class="btn btn-sm btn-outline-primary"
              >
                View
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add child modal.
         Bootstrap's modal look, but Vue decides when it shows (v-if),
         so we don't need Bootstrap's JavaScript to open or close it. -->
    <template v-if="showModal">
      <div
        class="modal d-block"
        tabindex="-1"
        role="dialog"
        aria-labelledby="addChildTitle"
        @click.self="closeModal"
      >
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <form
            class="modal-content"
            novalidate
            data-test="add-child-form"
            @submit.prevent="addChild"
          >
            <div class="modal-header">
              <h2 id="addChildTitle" class="modal-title h5">Add a child</h2>
              <button
                type="button"
                class="btn-close"
                aria-label="Close"
                @click="closeModal"
              ></button>
            </div>

            <div class="modal-body">
              <div v-if="saveError" class="alert alert-danger small" data-test="add-child-error">
                {{ saveError }}
              </div>

              <div class="mb-3">
                <label for="child-name" class="form-label">Full name</label>
                <input
                  id="child-name"
                  v-model.trim="form.name"
                  class="form-control"
                  :class="{ 'is-invalid': nameInvalid }"
                  data-test="child-name"
                />
                <div class="invalid-feedback">Please enter the child's name.</div>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-sm-4">
                  <label for="child-level" class="form-label">Level</label>
                  <select
                    id="child-level"
                    v-model="form.level"
                    class="form-select"
                    :class="{ 'is-invalid': levelInvalid }"
                    data-test="child-level"
                  >
                    <option value="" disabled>Choose...</option>
                    <option v-for="l in LEVELS" :key="l" :value="l">{{ l }}</option>
                  </select>
                  <div class="invalid-feedback">Pick a level.</div>
                </div>
                <div class="col-sm-8">
                  <label for="child-school" class="form-label"
                    >School <span class="text-muted-cb">(optional)</span></label
                  >
                  <input
                    id="child-school"
                    v-model.trim="form.school"
                    class="form-control"
                    data-test="child-school"
                  />
                </div>
              </div>

              <div class="mb-3">
                <label for="child-parent" class="form-label"
                  >Parent <span class="text-muted-cb">(optional)</span></label
                >
                <select
                  id="child-parent"
                  v-model="form.parentId"
                  class="form-select"
                  data-test="child-parent"
                >
                  <option value="">No parent account yet</option>
                  <option v-for="p in parents" :key="p.id" :value="p.id">
                    {{ p.name }} ({{ p.email }})
                  </option>
                </select>
              </div>

              <fieldset>
                <legend class="form-label fs-6">Needs help with</legend>
                <div class="d-flex flex-wrap gap-2">
                  <template v-for="(skill, i) in SKILL_OPTIONS" :key="skill">
                    <input
                      :id="`need-${i}`"
                      v-model="form.needs"
                      type="checkbox"
                      class="btn-check"
                      :value="skill"
                      autocomplete="off"
                    />
                    <label class="btn btn-sm btn-outline-primary" :for="`need-${i}`">{{
                      skill
                    }}</label>
                  </template>
                </div>
              </fieldset>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                :disabled="saving"
                @click="closeModal"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="saving"
                data-test="save-child"
              >
                <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                Save child
              </button>
            </div>
          </form>
        </div>
      </div>
      <div class="modal-backdrop show"></div>
    </template>
  </div>
</template>