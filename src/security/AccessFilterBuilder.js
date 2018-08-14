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

// This class defines which capabilities a given user must have in order
// to gain access to a document type.
// The filters produced here are applied in SecurityManager
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
    const capabilities = this.userCapabilities
    switch (type) {
      case 'venue':
        return `_type == "venue" && ${querifyItems([capabilities.isVenueEditor])}`
      case 'issue':
        return `_type == "issue" && ${querifyItems([capabilities.isVenueEditor])}`
      case 'track':
        return `_type == "track" && ${querifyItems([capabilities.isVenueEditor])}`
      case 'stage':
        return `_type == "stage" && ${querifyItems([capabilities.isVenueEditor])}`
      case 'user':
        return `_type == "user" && ${querifyItems([
          capabilities.isVenueEditor,
          capabilities.isEditorInAnyIssue,
          capabilities.isEditorInAnyTrack
        ])}`
      case 'article':
        return `_type == "article" && ${querifyItems([
          capabilities.isVenueEditor,
          capabilities.isEditorInAnyIssue,
          capabilities.isEditorInAnyTrack
        ])}`
      case 'comment':
        return '_type == "comment"'
      case 'reviewProcess':
        return `_type == "reviewProcess" && ${querifyItems([
          capabilities.isVenueEditor,
          capabilities.isEditorInAnyIssue,
          capabilities.isEditorInAnyTrack
        ])}`
      case 'reviewItem':
        return `_type == "reviewItem" && ${querifyItems([
          capabilities.isVenueEditor,
          capabilities.isEditorInIssueWithArticleInReviewProcess,
          capabilities.isEditorInTrackWithArticleInReviewProcess
        ])}`
      case 'featureConfig':
        return `_type == "featureConfig" && ${querifyItems([capabilities.isVenueEditor])}`
      case 'featureState':
        return `_type == "featureState" && ${querifyItems([capabilities.isVenueEditor])}`
      default:
        return 'false'
    }
  }

  canUpdate(type) {
    const capabilities = this.userCapabilities
    switch (type) {
      case 'venue':
        return `_type == "venue" && ${querifyItems([capabilities.isVenueEditor])}`
      case 'issue':
        return `_type == "issue" && ${querifyItems([
          capabilities.isVenueEditor,
          capabilities.isIssueEditor
        ])}`
      case 'track':
        return `_type == "track" && ${querifyItems([
          capabilities.isVenueEditor,
          capabilities.isTrackEditor
        ])}`
      case 'stage':
        return `_type == "stage" && ${querifyItems([capabilities.isVenueEditor])}`
      case 'user':
        return `_type == "user" && ${querifyItems([capabilities.isVenueEditor])}`
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
      case 'featureConfig':
        return `_type == "featureConfig" && ${querifyItems([capabilities.isVenueEditor])}`
      case 'featureState':
        return `_type == "featureState" && ${querifyItems([capabilities.isVenueEditor])}`
      default:
        return 'false'
    }
  }

  canDelete(type) {
    const capabilities = this.userCapabilities
    switch (type) {
      case 'venue':
        return 'false'
      case 'issue':
        return `_type == "issue" && ${querifyItems([capabilities.isVenueEditor])}`
      case 'track':
        return `_type == "track" && ${querifyItems([capabilities.isVenueEditor])}`
      case 'stage':
        return `_type == "stage" && ${querifyItems([capabilities.isVenueEditor])}`
      case 'user':
        return `_type == "user" && ${querifyItems([capabilities.isVenueEditor])}`
      case 'article':
        return `_type == "article" && ${querifyItems([
          capabilities.isVenueEditor,
          capabilities.isEditorInArticleTrack,
          capabilities.isEditorInArticleIssues
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
      case 'featureConfig':
        return `_type == "featureConfig" && ${querifyItems([capabilities.isVenueEditor])}`
      case 'featureState':
        return `_type == "featureState" && ${querifyItems([capabilities.isVenueEditor])}`
      default:
        return 'false'
    }
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
