const requiredCapabilities = {
  read: {
    venue: ['isLoggedInUser'],
    issue: ['isLoggedInUser'],
    track: ['isLoggedInUser'],
    stage: ['isLoggedInUser'],
    user: ['isLoggedInUser'],
    article: [
      'isAdminUser',
      'isEditorInVenue',
      'isEditorInTrackWithArticle',
      'isEditorInIssueWithArticle',
      'isSubmitterInArticle'
    ],
    comment: [
      'isAdminUser',
      'isAuthorInComment',
      'isEditorInVenue',
      'isSubmitterInArticleWithComment',
      'isEditorInTrackWithArticleWithComment',
      'isEditorInIssueWithArticleWithComment'
    ],
    reviewProcess: [
      'isAdminUser',
      'isEditorInVenue',
      'isEditorInIssueWithArticleInReviewProcess',
      'isEditorInTrackWithArticleInReviewProcess'
    ],
    reviewItem: [
      'isAdminUser',
      'isEditorInVenue',
      'isReviewerInReviewItem',
      'isEditorInIssueWithArticleInReviewItem',
      'isEditorInTrackWithArticleInReviewItem'
    ],
    featureConfig: ['isLoggedInUser'],
    featureState: [
      'isAdminUser',
      'isEditorInVenue',
      'isSubmitterInArticleInFeatureState',
      'isEditorInIssueWithArticleInFeatureState',
      'isEditorInTrackWithArticleInFeatureState'
    ]
  },
  create: {
    venue: [],
    issue: ['isAdminUser', 'isEditorInVenue'],
    track: ['isAdminUser', 'isEditorInVenue'],
    stage: ['isAdminUser', 'isEditorInVenue'],
    user: ['isAdminUser', 'isEditorInVenue', 'isEditorInAnyIssue', 'isEditorInAnyTrack'],
    article: ['isAdminUser', 'isEditorInVenue', 'isEditorInAnyIssue', 'isEditorInAnyTrack'],
    comment: ['isAdminUser', 'isAuthorInComment'],
    reviewProcess: ['isAdminUser', 'isEditorInVenue', 'isEditorInAnyIssue', 'isEditorInAnyTrack'],
    reviewItem: [
      'isAdminUser',
      'isEditorInVenue',
      'isEditorInIssueWithArticleInReviewProcess',
      'isEditorInTrackWithArticleInReviewProcess'
    ],
    featureConfig: ['isAdminUser', 'isEditorInVenue'],
    featureState: ['isAdminUser', 'isEditorInVenue']
  },
  update: {
    venue: ['isAdminUser', 'isEditorInVenue'],
    issue: ['isAdminUser', 'isEditorInVenue', 'isEditorInIssue'],
    track: ['isAdminUser', 'isEditorInVenue', 'isEditorInTrack'],
    stage: ['isAdminUser', 'isEditorInVenue'],
    user: ['isAdminUser', 'isEditorInVenue'],
    article: [
      'isAdminUser',
      'isEditorInVenue',
      'isEditorInTrackWithArticle',
      'isEditorInIssueWithArticle',
      'isSubmitterInArticle'
    ],
    comment: [
      'isAdminUser',
      'isAuthorInComment',
      'isEditorInVenue',
      'isEditorInTrackWithArticleWithComment',
      'isEditorInIssueWithArticleWithComment'
    ],
    reviewProcess: [
      'isAdminUser',
      'isEditorInVenue',
      'isEditorInIssueWithArticleInReviewProcess',
      'isEditorInTrackWithArticleInReviewProcess'
    ],
    reviewItem: [
      'isAdminUser',
      'isEditorInVenue',
      'isReviewerInReviewItem',
      'isEditorInIssueWithArticleInReviewItem',
      'isEditorInTrackWithArticleInReviewItem'
    ],
    featureConfig: ['isAdminUser', 'isEditorInVenue'],
    featureState: ['isAdminUser', 'isEditorInVenue']
  },
  delete: {
    venue: [],
    issue: ['isAdminUser', 'isEditorInVenue'],
    track: ['isAdminUser', 'isEditorInVenue'],
    stage: ['isAdminUser', 'isEditorInVenue'],
    user: ['isAdminUser', 'isEditorInVenue'],
    article: [
      'isAdminUser',
      'isEditorInVenue',
      'isEditorInTrackWithArticle',
      'isEditorInIssueWithArticle'
    ],
    comment: [
      'isAdminUser',
      'isAuthorInComment',
      'isEditorInVenue',
      'isEditorInTrackWithArticleWithComment',
      'isEditorInIssueWithArticleWithComment'
    ],
    reviewProcess: [
      'isAdminUser',
      'isEditorInVenue',
      'isEditorInIssueWithArticleInReviewProcess',
      'isEditorInTrackWithArticleInReviewProcess'
    ],
    reviewItem: [
      'isAdminUser',
      'isEditorInVenue',
      'isReviewerInReviewItem',
      'isEditorInIssueWithArticleInReviewItem',
      'isEditorInTrackWithArticleInReviewItem'
    ],
    featureConfig: ['isAdminUser', 'isEditorInVenue'],
    featureState: ['isAdminUser', 'isEditorInVenue']
  }
}
module.exports = requiredCapabilities
