const requiredCapabilities = {
  read: {
    venue: ['isLoggedInUser'],
    issue: ['isLoggedInUser'],
    track: ['isLoggedInUser'],
    stage: ['isLoggedInUser'],
    user: ['isLoggedInUser'],
    article: [
      'isEditorInVenue',
      'isEditorInTrackWithArticle',
      'isEditorInIssueWithArticle',
      'isSubmitterInArticle'
    ],
    comment: [
      'isAuthorInComment',
      'isEditorInVenue',
      'isSubmitterInArticleWithComment',
      'isEditorInTrackWithArticleWithComment',
      'isEditorInIssueWithArticleWithComment'
    ],
    reviewProcess: [
      'isEditorInVenue',
      'isEditorInIssueWithArticleInReviewProcess',
      'isEditorInTrackWithArticleInReviewProcess'
    ],
    reviewItem: [
      'isEditorInVenue',
      'isReviewerInReviewItem',
      'isEditorInIssueWithArticleInReviewItem',
      'isEditorInTrackWithArticleInReviewItem'
    ],
    featureConfig: ['isLoggedInUser'],
    featureState: [
      'isEditorInVenue',
      'isSubmitterInArticleInFeatureState',
      'isEditorInIssueWithArticleInFeatureState',
      'isEditorInTrackWithArticleInFeatureState'
    ]
  },
  create: {
    venue: [],
    issue: ['isEditorInVenue'],
    track: ['isEditorInVenue'],
    stage: ['isEditorInVenue'],
    user: ['isEditorInVenue', 'isEditorInAnyIssue', 'isEditorInAnyTrack'],
    article: ['isEditorInVenue', 'isEditorInAnyIssue', 'isEditorInAnyTrack'],
    comment: ['isAuthorInComment'],
    reviewProcess: ['isEditorInVenue', 'isEditorInAnyIssue', 'isEditorInAnyTrack'],
    reviewItem: [
      'isEditorInVenue',
      'isEditorInIssueWithArticleInReviewProcess',
      'isEditorInTrackWithArticleInReviewProcess'
    ],
    featureConfig: ['isEditorInVenue'],
    featureState: ['isEditorInVenue']
  },
  update: {
    venue: ['isEditorInVenue'],
    issue: ['isEditorInVenue', 'isEditorInIssue'],
    track: ['isEditorInVenue', 'isEditorInTrack'],
    stage: ['isEditorInVenue'],
    user: ['isEditorInVenue'],
    article: [
      'isEditorInVenue',
      'isEditorInTrackWithArticle',
      'isEditorInIssueWithArticle',
      'isSubmitterInArticle'
    ],
    comment: [
      'isAuthorInComment',
      'isEditorInVenue',
      'isEditorInTrackWithArticleWithComment',
      'isEditorInIssueWithArticleWithComment'
    ],
    reviewProcess: [
      'isEditorInVenue',
      'isEditorInIssueWithArticleInReviewProcess',
      'isEditorInTrackWithArticleInReviewProcess'
    ],
    reviewItem: [
      'isEditorInVenue',
      'isReviewerInReviewItem',
      'isEditorInIssueWithArticleInReviewItem',
      'isEditorInTrackWithArticleInReviewItem'
    ],
    featureConfig: ['isEditorInVenue'],
    featureState: ['isEditorInVenue']
  },
  delete: {
    venue: [],
    issue: ['isEditorInVenue'],
    track: ['isEditorInVenue'],
    stage: ['isEditorInVenue'],
    user: ['isEditorInVenue'],
    article: ['isEditorInVenue', 'isEditorInTrackWithArticle', 'isEditorInIssueWithArticle'],
    comment: [
      'isAuthorInComment',
      'isEditorInVenue',
      'isEditorInTrackWithArticleWithComment',
      'isEditorInIssueWithArticleWithComment'
    ],
    reviewProcess: [
      'isEditorInVenue',
      'isEditorInIssueWithArticleInReviewProcess',
      'isEditorInTrackWithArticleInReviewProcess'
    ],
    reviewItem: [
      'isEditorInVenue',
      'isReviewerInReviewItem',
      'isEditorInIssueWithArticleInReviewItem',
      'isEditorInTrackWithArticleInReviewItem'
    ],
    featureConfig: ['isEditorInVenue'],
    featureState: ['isEditorInVenue']
  }
}
module.exports = requiredCapabilities
