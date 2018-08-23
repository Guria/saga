module.exports = async (req, res, next) => {
  const {dataset} = req.params
  const {securityManager} = req.app.services

  const userGrants = await securityManager.getFilterExpressionsForUser(
    dataset,
    req.user && req.user.id
  )
  const grants = userGrants.grants || {read: {}, update: {}, create: {}, delete: {}}
  const result = {
    read: grants.read,
    update: grants.update,
    create: grants.create,
    delete: grants.delete,
    capabilities: userGrants.capabilities || {}
  }
  // result.capabilities = {
  //   isAuthorInComment: [true],
  //   isEditorInAnyIssue: [false],
  //   isEditorInAnyTrack: [false],
  //   isEditorInIssue: [false],
  //   isEditorInIssueWithArticle: [false],
  //   isEditorInIssueWithArticleInFeatureState: [false],
  //   isEditorInIssueWithArticleInReviewItem: [false],
  //   isEditorInIssueWithArticleInReviewProcess: [false],
  //   isEditorInIssueWithArticleWithComment: [false],
  //   isEditorInTrack: [false],
  //   isEditorInTrackWithArticle: [false],
  //   isEditorInTrackWithArticleInFeatureState: [false],
  //   isEditorInTrackWithArticleInReviewItem: [false],
  //   isEditorInTrackWithArticleInReviewProcess: [false],
  //   isEditorInTrackWithArticleWithComment: [false],
  //   isEditorInVenue: [true],
  //   isLoggedInUser: [true],
  //   isReviewerInReviewItem: [true],
  //   isSubmitterInArticle: [true],
  //   isSubmitterInArticleInFeatureState: [false],
  //   isSubmitterInArticleWithComment: [false]
  // }
  // result.update.issue = true
  // result.update.article = true
  // result.read.comment = true
  console.log(JSON.stringify(result, null, 2))
  res.json(result)
}
