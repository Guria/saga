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
    venueId: Joi.string().optional(),
    origin: Joi.string()
      .uri()
      .optional()
  })
})

/**
 * Get the root invitation token for a brand new vega/saga installation
 */
router.get('/root', require('./getRootInvite'))

/**
 * Accept an invitation
 */
router.post('/claim/:token', validation, require('./claimInvitation'))

/**
 * Fetch specific invitation
 */
router.get('/:token', validation, require('./getInvitation'))

module.exports = router
