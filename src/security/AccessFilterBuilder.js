import {uniq} from 'lodash'
const UserQueries = require('./UserQueries')
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

  async prefetchAllQueries() {
    if (!this.queries) {
      const userQueries = new UserQueries(this.userId, this.dataStore, this.venueId)
      this.queries = await userQueries.runAll()
    }
    return this.queries
  }

  canRead(type) {
    const queries = this.queries
    console.log('GOT queries', queries)
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
        return `_type == "article" && (${queries.isVenueAdministrator} || ${
          queries.isVenueEditor
        } || ${queries.isVenueCopyEditor})`
      default:
        return 'false'
    }
  }
  // ${this.queries.isVenueEditor} ||
  // ${this.queries.isVenueCopyEditor} ||
  // ${this.queries.isArticleSubmitter} ||
  // ${this.queries.isEditorInArticlTrack} ||
  // ${this.queries.isIssueEditor}
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
    await this.prefetchAllQueries()

    return {
      read: uniq(documentTypes.map(type => this.canRead(type))).join(' || '),
      create: uniq(documentTypes.map(type => this.canCreate(type))).join(' || '),
      update: uniq(documentTypes.map(type => this.canUpdate(type))).join(' || '),
      delete: uniq(documentTypes.map(type => this.canDelete(type))).join(' || ')
    }
  }
}

module.exports = AccessFilterBuilder
