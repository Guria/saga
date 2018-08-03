// A collection of queries used by AccessFilterBuilder
// They all assume that query params will include {userId: userId}
class UserQueries {
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

  isArticleSubmitter() {
    return '$userId in submitters[]._ref'
  }

  isVenueAdministrator() {
    return this.performQuery(
      `*[_type=="venue" && references($userId)][0]{
      _id, _type,
      "administrator": defined(administrators) && length(administrators[_ref == $userId])>0,
    }.administrator`,
      {userId: this.userId}
    )
  }

  isVenueEditor() {
    return this.performQuery(
      `*[_type=="venue" && references($userId)][0]{
      _id, _type,
      "editor": defined(editors) && length(editors[_ref == $userId])>0,
    }.editor`,
      {userId: this.userId}
    )
  }

  isVenueCopyEditor() {
    return this.performQuery(
      `*[_type=="venue" && references($userId)][0]{
      _id, _type,
      "copyEditor": defined(copyEditors) && length(copyEditors[_ref == $userId])>0,
    }.copyEditor`,
      {userId: this.userId}
    )
  }

  trackIdsWhereUserIsEditor() {
    // find all tracks user is editor for
    const query = `*[_type == "track" && references($userId)]{
        _id,
        _type,
        "editor": defined(editors) && length(editors[_ref == $userId])>0,
        "copyEditor": defined(copyEditors) && length(copyEditors[_ref == $userId])>0
      }
    `
    return this.performQuery(query, {userId: this.userId}).then(tracks => {
      return tracks.filter(track => !!track.editor).map(track => track._id)
    })
  }

  // does article.track reference any of those tracks
  // isEditorInArticleTrack() {
  //   const trackIds = await trackIdsWhereUserIsEditor()
  //   return `track._ref in ${trackIds}`
  // }

  async runAll() {
    return Promise.all([this.isVenueAdministrator()]).then(
      ([isVenueAdministrator, isVenueEditor, isVenueCopyEditor]) => {
        return {
          isVenueAdministrator: !!isVenueAdministrator,
          isVenueEditor: !!isVenueEditor,
          isVenueCopyEditor: !!isVenueCopyEditor
        }
      }
    )
  }
}

module.exports = UserQueries
