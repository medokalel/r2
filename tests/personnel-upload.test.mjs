// Run: npm test  (or: node --test tests/personnel-upload.test.mjs)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadSource } from './helpers/loadSource.mjs'
import { createHarness } from './helpers/personnelFormHarness.mjs'

const rules = loadSource('lib/personnelProfile.ts')
const uploadField = (form, title = 'cab.competence.qualCategories.academic') =>
  form.find((node) => node.props?.onSelectFile && node.props.title === title).props

test('qualification files over 20 MB are rejected before upload', async () => {
  assert.equal(rules.QUALIFICATION_FILE_MAX_BYTES, 20 * 1024 * 1024)
  assert.equal(rules.isQualificationFileTooLarge({ size: 20 * 1024 * 1024 }), false)
  assert.equal(rules.isQualificationFileTooLarge({ size: 20 * 1024 * 1024 + 1 }), true)

  const form = createHarness()
  await form.mount()
  await uploadField(form).onSelectFile({ name: 'huge.pdf', size: 21 * 1024 * 1024 })
  assert.match(form.alertText(), /cab\.competence\.profileForm\.fileTooLarge/, 'the 20 MB limit message is shown')
  assert.equal(uploadField(form).files.length, 0, 'the oversized file is not queued')
})

test('failed documents remain retryable without duplicating the employee; existing documents reload', async () => {
  assert.equal(rules.personnelSaveErrorMessage(undefined, 'Boom'), 'Boom')
  assert.match(rules.personnelSaveErrorMessage('employee-1', 'Boom'), /saving is incomplete: Boom/)

  const form = createHarness()
  await form.mount()
  form.setForm({ name: 'Test', email: 'test@example.test' })
  await uploadField(form).onSelectFile({ name: 'certificate.pdf', size: 100 })
  assert.equal(uploadField(form).files[0].dateLabel, 'Pending save', 'queued until Save')

  form.control.failUpload = true
  await form.submit()
  assert.equal(form.calls.create.length, 1)
  assert.equal(form.calls.saved.length, 0)
  assert.match(form.alertText(), /saving is incomplete: Upload unavailable/)

  form.control.failUpload = false
  await form.submit()
  assert.equal(form.calls.create.length, 1, 'the retry does not create a second employee')
  assert.equal(form.calls.update.length, 1)
  assert.equal(form.calls.update[0].id, 'employee-1')
  assert.deepEqual(form.calls.uploads.map((upload) => upload.id), ['employee-1', 'employee-1'])
  assert.equal(form.calls.uploads[1].category, 'ACADEMIC')
  assert.equal(form.calls.saved.length, 1)
  assert.equal(form.calls.saved[0].id, 'employee-1')
  assert.equal(uploadField(form).files[0].url, '/uploads/certificate.pdf', 'the pending file is replaced by the stored one')

  // A fresh visit to the saved person reloads its stored documents into their categories.
  form.control.qualifications = [
    { id: 'doc-1', originalName: 'certificate.pdf', fileUrl: '/uploads/certificate.pdf', uploadedAt: '2026-10-21', documentType: 'ACADEMIC' },
    { id: 'doc-2', originalName: 'licence.pdf', fileUrl: '/uploads/licence.pdf', documentType: 'Professional licences' },
  ]
  await form.mount({ id: 'employee-1', name: 'Test' })
  assert.equal(uploadField(form).files[0].url, '/uploads/certificate.pdf')
  assert.equal(uploadField(form, 'Professional licences').files[0].name, 'licence.pdf', 'custom categories come back as saved')
})
