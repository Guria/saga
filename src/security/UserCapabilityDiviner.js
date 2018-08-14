import {flatten} from 'lodash'

function quote(item) {
  return `"${item}"`
}

function quoteItems(items) {
  return `[${items.map(quote).join(',')}]`
}

function isValueInArrayQuery(valueName, ids = []) {
  return ids.length > 0 ? `${valueName} in ${quoteItems(ids)}` : 'false'
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

  reviewProcessesByArticles(articleIds) {
    const query = `*[_type=="reviewProcess" && article._ref in ${quoteItems(articleIds)}]{
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

  tracksWhereUserIsEditor() {
    const query = `*[_type == "track" && references($userId)]{
        _id,
        _type,
        "editor": defined(editors) && length(editors[_ref == $userId])>0
      }`
    return this.performQuery(query, {userId: this.userId}).then(tracks =>
      tracks.filter(track => !!track.editor)
    )
  }

  articlesWhereUserIsSubmitter() {
    const query = `*[_type == "article" && references($userId)]{
        _id,
        _type,
        "submitter": defined(submitters) && length(submitters[_ref == $userId])>0
      }`
    return this.performQuery(query, {userId: this.userId}).then(articles =>
      articles.filter(article => !!article.submitter)
    )
  }

  // Find all issues where user is editor. Bring along articleIds
  issuesWhereUserIsEditor() {
    const query = `*[_type == "issue" && references($userId)]{
        _id,
        _type,
        "editor": defined(editors) && length(editors[_ref == $userId])>0,
        "articleIds": content[].articles[]._ref
      }`
    return this.performQuery(query, {userId: this.userId}).then(issues =>
      issues.filter(issue => !!issue.editor)
    )
  }

  isEditorInArticleTrack() {
    return this.tracksWhereUserIsEditor()
      .then(tracks => tracks.map(track => track._id))
      .then(trackIds => isValueInArrayQuery('track._ref', trackIds))
  }

  isEditorInArticleIssues() {
    return this.issuesWhereUserIsEditor()
      .then(issues => issues.map(issue => issue.articleIds))
      .then(nestedArticleIds => flatten(nestedArticleIds))
      .then(articleIds => isValueInArrayQuery('_id', articleIds))
  }

  isSubmitterInArticle() {
    return this.articlesWhereUserIsSubmitter()
      .then(articles => articles.map(article => article._id))
      .then(articleIds => isValueInArrayQuery('_id', articleIds))
  }

  isSubmitterInArticleInFeatureState() {
    return this.articlesWhereUserIsSubmitter()
      .then(articles => articles.map(article => article._id))
      .then(articleIds => isValueInArrayQuery('article._ref', articleIds))
  }

  isReviewer() {
    return `reviewer._ref == "${this.userId}"`
  }

  isCommentAuthor() {
    return `author._ref == "${this.userId}"`
  }

  isEditorInIssueWithArticleInReviewProcess() {
    return this.issuesWhereUserIsEditor()
      .then(issues => issues.map(issue => issue.articleIds))
      .then(nestedArticleIds => flatten(nestedArticleIds))
      .then(articleIds => isValueInArrayQuery('article._ref', articleIds))
  }

  isEditorInIssueWithArticleInReviewItem() {
    return this.issuesWhereUserIsEditor()
      .then(issues => issues.map(issue => issue.articleIds))
      .then(nestedArticleIds => flatten(nestedArticleIds))
      .then(articleIds => this.reviewProcessesByArticles(articleIds))
      .then(reviewProcesses => reviewProcesses.map(rp => rp._id))
      .then(reviewProcessIds => isValueInArrayQuery('reviewProcess._ref', reviewProcessIds))
  }

  isEditorInTrackWithArticleInReviewProcess() {
    return this.tracksWhereUserIsEditor()
      .then(tracks => tracks.map(track => track._id))
      .then(trackIds => this.articlesInTracks(trackIds))
      .then(articles => articles.map(article => article._id))
      .then(articleIds => isValueInArrayQuery('article._ref', articleIds))
  }

  isEditorInTrackWithArticleInReviewItem() {
    return this.tracksWhereUserIsEditor()
      .then(tracks => tracks.map(track => track._id))
      .then(trackIds => this.articlesInTracks(trackIds))
      .then(articles => articles.map(article => article._id))
      .then(articleIds => this.reviewProcessesByArticles(articleIds))
      .then(reviewProcesses => reviewProcesses.map(rp => rp._id))
      .then(reviewProcessIds => isValueInArrayQuery('reviewProcess._ref', reviewProcessIds))
  }

  isEditorInIssueWithArticleInComment() {
    return this.issuesWhereUserIsEditor()
      .then(issues => issues.map(issue => issue.articleIds))
      .then(nestedArticleIds => flatten(nestedArticleIds))
      .then(articleIds => isValueInArrayQuery('subject._ref', articleIds))
  }

  isEditorInTrackWithArticleInComment() {
    return this.tracksWhereUserIsEditor()
      .then(tracks => tracks.map(track => track._id))
      .then(trackIds => this.articlesInTracks(trackIds))
      .then(articles => articles.map(article => article._id))
      .then(articleIds => isValueInArrayQuery('subject._ref', articleIds))
  }

  isEditorInIssueWithArticleInFeatureState() {
    return this.issuesWhereUserIsEditor()
      .then(issues => issues.map(issue => issue.articleIds))
      .then(nestedArticleIds => flatten(nestedArticleIds))
      .then(articleIds => isValueInArrayQuery('article._ref', articleIds))
  }

  isEditorInTrackWithArticleInFeatureState() {
    return this.tracksWhereUserIsEditor()
      .then(tracks => tracks.map(track => track._id))
      .then(trackIds => this.articlesInTracks(trackIds))
      .then(articles => articles.map(article => article._id))
      .then(articleIds => isValueInArrayQuery('article._ref', articleIds))
  }

  isEditorInAnyIssue() {
    return this.issuesWhereUserIsEditor().then(issues => issues.length > 0)
  }

  isEditorInAnyTrack() {
    return this.tracksWhereUserIsEditor().then(tracks => tracks.length > 0)
  }

  isIssueEditor() {
    return this.issuesWhereUserIsEditor()
      .then(issues => issues.map(issue => issue._id))
      .then(issueIds => isValueInArrayQuery('_id', issueIds))
  }

  isTrackEditor() {
    return this.tracksWhereUserIsEditor()
      .then(tracks => tracks.map(track => track._id))
      .then(trackIds => isValueInArrayQuery('_id', trackIds))
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
      this.isEditorInTrackWithArticleInReviewItem(),
      this.isSubmitterInArticleInFeatureState(),
      this.isEditorInIssueWithArticleInFeatureState(),
      this.isEditorInTrackWithArticleInFeatureState(),
      this.isEditorInAnyIssue(),
      this.isEditorInAnyTrack(),
      this.isIssueEditor(),
      this.isTrackEditor()
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
        isEditorInTrackWithArticleInReviewItem,
        isSubmitterInArticleInFeatureState,
        isEditorInIssueWithArticleInFeatureState,
        isEditorInTrackWithArticleInFeatureState,
        isEditorInAnyIssue,
        isEditorInAnyTrack,
        isIssueEditor,
        isTrackEditor
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
          isEditorInTrackWithArticleInReviewItem,
          isSubmitterInArticleInFeatureState,
          isEditorInIssueWithArticleInFeatureState,
          isEditorInTrackWithArticleInFeatureState,
          isEditorInAnyIssue,
          isEditorInAnyTrack,
          isIssueEditor,
          isTrackEditor
        }
      }
    )
  }
}

module.exports = UserCapabilityDiviner
