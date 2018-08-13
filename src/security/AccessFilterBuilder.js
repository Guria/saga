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

  // eslint-disable-next-line complexity
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
        return `_type == "article" && (${capabilities.isVenueEditor} || ${
          capabilities.isEditorInArticleTrack
        } || ${capabilities.isEditorInArticleIssues} || ${capabilities.isSubmitterInArticle})`
      case 'comment':
        return `_type == "comment" && (${capabilities.isCommentAuthor} || ${
          capabilities.isVenueEditor
        } || ${capabilities.isEditorInTrackWithArticleInComment} || ${
          capabilities.isEditorInIssueWithArticleInComment
        })`
      case 'reviewProcess':
        return `_type == "reviewProcess" && (${capabilities.isVenueEditor} || ${
          capabilities.isEditorInIssueWithArticleInReviewProcess
        } || ${capabilities.isEditorInTrackWithArticleInReviewProcess})`
      case 'reviewItem':
        return `_type == "reviewItem" && (${capabilities.isVenueEditor} || ${
          capabilities.isReviewer
        } || ${capabilities.isEditorInIssueWithArticleInReviewItem} || ${
          capabilities.isEditorInTrackWithArticleInReviewItem
        })`
      case 'reviewPolicy':
        return '_type == "reviewPolicy"'
      case 'featureConfig':
        return '_type == "featureConfig"'
      case 'featureState':
        return `_type == "featureState" && (${capabilities.isVenueEditor} || ${
          capabilities.isSubmitterInArticleInFeatureState
        } || ${capabilities.isEditorInIssueWithArticleInFeatureState}) || ${
          capabilities.isEditorInTrackWithArticleInFeatureState
        }`
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
    // console.log('----->', this.userCapabilities.read)

    return {
      read: uniq(documentTypes.map(type => this.canRead(type))).join(' || '),
      create: uniq(documentTypes.map(type => this.canCreate(type))).join(' || '),
      update: uniq(documentTypes.map(type => this.canUpdate(type))).join(' || '),
      delete: uniq(documentTypes.map(type => this.canDelete(type))).join(' || ')
    }
  }
}

module.exports = AccessFilterBuilder
