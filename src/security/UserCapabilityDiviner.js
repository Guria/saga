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

  isVenueEditor() {
    const query = `*[_type=="venue" && references($userId)][0]{
      _id, _type,
      "editor": defined(editors) && length(editors[_ref == $userId])>0,
    }.editor`
    return this.performQuery(query, {userId: this.userId})
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

  isCreator() {
    return `_createdBy == "${this.userId}"`
  }

  runAll() {
    return Promise.all([
      this.isVenueEditor(),
      this.isEditorInArticleTrack(),
      this.isEditorInArticleIssues(),
      this.isSubmitterInArticle(),
      this.isCreator()
    ]).then(
      ([
        isVenueEditor,
        isEditorInArticleTrack,
        isEditorInArticleIssues,
        isSubmitterInArticle,
        isCreator
      ]) => {
        return {
          isVenueEditor: !!isVenueEditor,
          isEditorInArticleTrack,
          isEditorInArticleIssues,
          isSubmitterInArticle,
          isCreator
        }
      }
    )
  }
}

module.exports = UserCapabilityDiviner
