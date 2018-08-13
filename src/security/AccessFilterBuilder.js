/* eslint-disable complexity */

import {uniq} from 'lodash'
const UserCapabilityDiviner = require('./UserCapabilityDiviner')
const documentTypes = [
  'venue',
  'issue',
  'track',
  'stage',
  'user',
  'article',
  'comment',
  'reviewProcess',
  'reviewItem',
  'reviewPolicy',
  'featureConfig',
  'featureState'
]

function parenthesisify(item) {
  return `(${item})`
}

function querifyItems(items) {
  const uniqeItems = uniq(items).filter(Boolean)
  return `(${uniqeItems
    .map(item => (uniqeItems.length === 1 ? item : parenthesisify(item)))
    .join(' || ')})`
}

class AccessFilterBuilder {
  constructor(userId, dataStore, venueId) {
    this.userId = userId
    this.venueId = venueId
    this.dataStore = dataStore
  }

  async prefetchAllCapabilities() {
    if (!this.userCapabilities) {
      const userCapabilities = new UserCapabilityDiviner(this.userId, this.dataStore, this.venueId)
      this.userCapabilities = await userCapabilities.runAll()
    }
    return this.userCapabilities
  }

  canRead(type) {
    const capabilities = this.userCapabilities
    switch (type) {
      case 'venue':
        return '_type == "venue"'
      case 'issue':
        return '_type == "issue"'
      case 'track':
        return '_type == "track"'
      case 'stage':
        return '_type == "stage"'
      case 'user':
        return '_type == "user"'
      case 'article':
        return `_type == "article" && ${querifyItems([
          capabilities.isVenueEditor,
          capabilities.isEditorInArticleTrack,
          capabilities.isEditorInArticleIssues,
          capabilities.isSubmitterInArticle
        ])}`
      case 'comment':
        return `_type == "comment" && ${querifyItems([
          capabilities.isCommentAuthor,
          capabilities.isVenueEditor,
          capabilities.isEditorInTrackWithArticleInComment,
          capabilities.isEditorInIssueWithArticleInComment
        ])}`
      case 'reviewProcess':
        return `_type == "reviewProcess" && ${querifyItems([
          capabilities.isVenueEditor,
          capabilities.isEditorInIssueWithArticleInReviewProcess,
          capabilities.isEditorInTrackWithArticleInReviewProcess
        ])}`
      case 'reviewItem':
        return `_type == "reviewItem" && ${querifyItems([
          capabilities.isVenueEditor,
          capabilities.isReviewer,
          capabilities.isEditorInIssueWithArticleInReviewItem,
          capabilities.isEditorInTrackWithArticleInReviewItem
        ])}`
      case 'reviewPolicy':
        return '_type == "reviewPolicy"'
      case 'featureConfig':
        return '_type == "featureConfig"'
      case 'featureState':
        return `_type == "featureState" && ${querifyItems([
          capabilities.isVenueEditor,
          capabilities.isSubmitterInArticleInFeatureState,
          capabilities.isEditorInIssueWithArticleInFeatureState,
          capabilities.isEditorInTrackWithArticleInFeatureState
        ])}`
      default:
        return 'false'
    }
  }

  canCreate(type) {
    return 'false'
  }

  canUpdate(type) {
    return 'false'
  }

  canDelete(type) {
    return 'false'
  }

  async determineFilters() {
    await this.prefetchAllCapabilities()

    const result = {
      read: querifyItems(documentTypes.map(type => this.canRead(type))),
      create: querifyItems(documentTypes.map(type => this.canCreate(type))),
      update: querifyItems(documentTypes.map(type => this.canUpdate(type))),
      delete: querifyItems(documentTypes.map(type => this.canDelete(type)))
    }
    //console.log('----->', result)
    return result
  }
}

module.exports = AccessFilterBuilder
