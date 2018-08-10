import {flatten} from 'lodash'

function quote(item) {
  return `"${item}"`
}

function quoteItems(items) {
  return `[${items.map(quote).join(',')}]`
}

// A collection of queries used by AccessFilterBuilder
// They all assume that query params will include {userId: userId}
class UserCapabilityDiviner {
  constructor(userId, dataStore, venueId) {
    this.userId = userId
    this.venueId = venueId
    this.dataStore = dataStore
  }

  async getScopedDataStore() {
    if (!this.scopedDataStore) {
      this.scopedDataStore = await (this.venueId
        ? this.dataStore.forDataset(this.venueId)
        : this.dataStore.connect())
    }
    return this.scopedDataStore
  }

  async performQuery(query, params = {}) {
    try {
      const store = await this.getScopedDataStore()
      const results = store.fetch(query, params)
      return typeof results === 'undefined' ? [] : results
    } catch (err) {
      console.error('☠ performQuery failed', query, params, err) // eslint-disable-line no-console
      throw err
    }
  }

  articlesInTracks(trackIds) {
    const query = `*[_type=="article" && track._ref in ${quoteItems(trackIds)}]{
      _id, _type
    }`
    return this.performQuery(query)
  }

  isVenueEditor() {
    const query = `*[_type=="venue" && references($userId)][0]{
      _id, _type,
      "editor": defined(editors) && length(editors[_ref == $userId])>0,
    }.editor`
    return this.performQuery(query, {userId: this.userId})
  }

  isReviewer() {
    return `reviewer._ref == "${this.userId}"`
  }

  // Find all tracks where user is editor
  tracksWhereUserIsEditor() {
    const query = `*[_type == "track" && references($userId)]{
        _id,
        _type,
        "editor": defined(editors) && length(editors[_ref == $userId])>0
      }
    `
    return this.performQuery(query, {userId: this.userId}).then(tracks => {
      return tracks.filter(track => !!track.editor)
    })
  }

  articlesWhereUserIsSubmitter() {
    const query = `*[_type == "article" && references($userId)]{
        _id,
        _type,
        "submitter": defined(submitters) && length(submitters[_ref == $userId])>0
      }
    `
    return this.performQuery(query, {userId: this.userId}).then(articles => {
      return articles.filter(article => !!article.submitter)
    })
  }

  // Find all issues where user is editor. Bring along articleIds
  issuesWhereUserIsEditor() {
    const query = `*[_type == "issue" && references($userId)]{
        _id,
        _type,
        "editor": defined(editors) && length(editors[_ref == $userId])>0,
        "articleIds": content[].articles[]._ref
      }
    `
    return this.performQuery(query, {userId: this.userId}).then(issues => {
      return issues.filter(issue => !!issue.editor)
    })
  }

  // does article.track reference any of these tracks
  isEditorInArticleTrack() {
    return this.tracksWhereUserIsEditor().then(tracks => {
      return `track._ref in ${quoteItems(tracks.map(track => track._id))}`
    })
  }

  // Do any of these issues also reference article
  isEditorInArticleIssues() {
    return this.issuesWhereUserIsEditor()
      .then(issues => issues.map(issue => issue.articleIds))
      .then(articleIds => {
        const flattenedArticleIds = flatten(articleIds)
        return `_id in ${quoteItems(flattenedArticleIds)}`
      })
  }

  isSubmitterInArticle() {
    return this.articlesWhereUserIsSubmitter().then(articles => {
      return `_id in ${quoteItems(articles.map(article => article._id))}`
    })
  }

  isSubmitterInArticleInFeatureState() {
    return this.articlesWhereUserIsSubmitter().then(articles => {
      return `article._ref in ${quoteItems(articles.map(article => article._id))}`
    })
  }

  isCommentAuthor() {
    return `author._ref == "${this.userId}"`
  }

  isEditorInIssueWithArticleInReviewProcess() {
    return this.issuesWhereUserIsEditor()
      .then(issues => issues.map(issue => issue.articleIds))
      .then(articleIds => {
        const flattenedArticleIds = flatten(articleIds)
        return `article._ref in ${quoteItems(flattenedArticleIds)}`
      })
  }

  isEditorInIssueWithArticleInReviewItem() {
    return this.issuesWhereUserIsEditor()
      .then(issues => issues.map(issue => issue.articleIds))
      .then(articleIds => {
        const flattenedArticleIds = flatten(articleIds)
        // PICKUP HERE reviewprocessess for article ids
        return `article._ref in ${quoteItems(flattenedArticleIds)}`
      })
  }

  isEditorInTrackWithArticleInReviewProcess() {
    return this.tracksWhereUserIsEditor().then(tracks => {
      // user is editor in these tracks
      const trackIds = tracks.map(track => track._id)
      return this.articlesInTracks(trackIds).then(articles => {
        // articles in aforementioned tracks
        const articleIds = articles.map(article => article._id)
        // reviewProcess reffing those articles
        return `article._ref in ${quoteItems(articleIds)}`
      })
    })
  }

  isEditorInIssueWithArticleInComment() {
    return this.issuesWhereUserIsEditor()
      .then(issues => issues.map(issue => issue.articleIds))
      .then(articleIds => {
        const flattenedArticleIds = flatten(articleIds)
        return `subject._ref in ${quoteItems(flattenedArticleIds)}`
      })
  }

  isEditorInTrackWithArticleInComment() {
    return this.tracksWhereUserIsEditor().then(tracks => {
      // user is editor in these tracks
      const trackIds = tracks.map(track => track._id)
      return this.articlesInTracks(trackIds).then(articles => {
        // articles in aforementioned tracks
        const articleIds = articles.map(article => article._id)
        // comment reffing any of those articles
        return `subject._ref in ${quoteItems(articleIds)}`
      })
    })
  }

  runAll() {
    return Promise.all([
      this.isVenueEditor(),
      this.isEditorInArticleTrack(),
      this.isEditorInArticleIssues(),
      this.isSubmitterInArticle(),
      this.isCommentAuthor(),
      this.isEditorInIssueWithArticleInComment(),
      this.isEditorInTrackWithArticleInComment(),
      this.isEditorInIssueWithArticleInReviewProcess(),
      this.isEditorInTrackWithArticleInReviewProcess(),
      this.isReviewer(),
      this.isEditorInIssueWithArticleInReviewItem(),
      this.isSubmitterInArticleInFeatureState()
    ]).then(
      ([
        isVenueEditor,
        isEditorInArticleTrack,
        isEditorInArticleIssues,
        isSubmitterInArticle,
        isCommentAuthor,
        isEditorInIssueWithArticleInComment,
        isEditorInTrackWithArticleInComment,
        isEditorInIssueWithArticleInReviewProcess,
        isEditorInTrackWithArticleInReviewProcess,
        isReviewer,
        isEditorInIssueWithArticleInReviewItem,
        isSubmitterInArticleInFeatureState
      ]) => {
        return {
          isVenueEditor: !!isVenueEditor,
          isEditorInArticleTrack,
          isEditorInArticleIssues,
          isSubmitterInArticle,
          isCommentAuthor,
          isEditorInIssueWithArticleInComment,
          isEditorInTrackWithArticleInComment,
          isEditorInIssueWithArticleInReviewProcess,
          isEditorInTrackWithArticleInReviewProcess,
          isReviewer,
          isEditorInIssueWithArticleInReviewItem,
          isSubmitterInArticleInFeatureState
        }
      }
    )
  }
}

module.exports = UserCapabilityDiviner
