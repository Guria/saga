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
  // const user = {_id: 'user_fQBT3AjTPdHRUq0YDX9jCoRMspxruPYv'}
  // result.capabilities = {
  //   isAuthorInComment: ['author._ref', [user._id]],
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
  //   isReviewerInReviewItem: ['reviewer._ref', [user._id]],
  //   isSubmitterInArticle: ['_id', ['5aecff85-57b7-414e-9508-b93bb08a5c46']],
  //   isSubmitterInArticleInFeatureState: [false],
  //   isSubmitterInArticleWithComment: [false]
  // }
  // result.update.issue = true
  res.json(result)
}
