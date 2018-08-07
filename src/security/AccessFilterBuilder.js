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
        return `_type == "article" && (${capabilities.isVenueEditor} || ${
          capabilities.isEditorInArticleTrack
        } || ${capabilities.isEditorInArticleIssues}) || ${capabilities.isSubmitterInArticle})`
      case 'comment':
        // TODO: editor in article.track or any issues to which the article belong
        return `_type == "comment" && (${capabilities.isCreator} || ${capabilities.isVenueEditor})`
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

    return {
      read: uniq(documentTypes.map(type => this.canRead(type))).join(' || '),
      create: uniq(documentTypes.map(type => this.canCreate(type))).join(' || '),
      update: uniq(documentTypes.map(type => this.canUpdate(type))).join(' || '),
      delete: uniq(documentTypes.map(type => this.canDelete(type))).join(' || ')
    }
  }
}

module.exports = AccessFilterBuilder
