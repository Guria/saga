const Joi = require('joi')
const express = require('express')
const {celebrate} = require('celebrate')

const router = express.Router()

const validation = celebrate({
  params: Joi.object({
    token: Joi.string()
      .token()
      .required()
  }),
  query: Joi.object({
    journalId: Joi.string().optional(),
    origin: Joi.string()
      .uri()
      .optional()
  })
})

/**
 * Fetch specific invitation
 */
router.get('/:token', validation, require('./getInvitation'))

/**
 * Accept an invitation
 */
router.get('/claim/:token', validation, require('./claimInvitation'))

module.exports = router
