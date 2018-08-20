const requiredCapabilities = {
  read: {
    venue: ['isLoggedInUser'],
    issue: ['isLoggedInUser'],
    track: ['isLoggedInUser'],
    stage: ['isLoggedInUser'],
    user: ['isLoggedInUser'],
    article: [
      'isVenueEditor',
      'isEditorInArticleTrack',
      'isEditorInArticleIssues',
      'isSubmitterInArticle'
    ],
    comment: [
      'isCommentAuthor',
      'isVenueEditor',
      'isSubmitterInArticleWithComment',
      'isEditorInTrackWithArticleInComment',
      'isEditorInIssueWithArticleInComment'
    ],
    reviewProcess: [
      'isVenueEditor',
      'isEditorInIssueWithArticleInReviewProcess',
      'isEditorInTrackWithArticleInReviewProcess'
    ],
    reviewItem: [
      'isVenueEditor',
      'isReviewer',
      'isEditorInIssueWithArticleInReviewItem',
      'isEditorInTrackWithArticleInReviewItem'
    ],
    featureConfig: ['isLoggedInUser'],
    featureState: [
      'isVenueEditor',
      'isSubmitterInArticleInFeatureState',
      'isEditorInIssueWithArticleInFeatureState',
      'isEditorInTrackWithArticleInFeatureState'
    ]
  },
  create: {
    venue: [],
    issue: ['isVenueEditor'],
    track: ['isVenueEditor'],
    stage: ['isVenueEditor'],
    user: ['isVenueEditor', 'isEditorInAnyIssue', 'isEditorInAnyTrack'],
    article: ['isVenueEditor', 'isEditorInAnyIssue', 'isEditorInAnyTrack'],
    comment: ['isCommentAuthor'],
    reviewProcess: ['isVenueEditor', 'isEditorInAnyIssue', 'isEditorInAnyTrack'],
    reviewItem: [
      'isVenueEditor',
      'isEditorInIssueWithArticleInReviewProcess',
      'isEditorInTrackWithArticleInReviewProcess'
    ],
    featureConfig: ['isVenueEditor'],
    featureState: ['isVenueEditor']
  },
  update: {
    venue: ['isVenueEditor'],
    issue: ['isVenueEditor', 'isIssueEditor'],
    track: ['isVenueEditor', 'isTrackEditor'],
    stage: ['isVenueEditor'],
    user: ['isVenueEditor'],
    article: [
      'isVenueEditor',
      'isEditorInArticleTrack',
      'isEditorInArticleIssues',
      'isSubmitterInArticle'
    ],
    comment: [
      'isCommentAuthor',
      'isVenueEditor',
      'isEditorInTrackWithArticleInComment',
      'isEditorInIssueWithArticleInComment'
    ],
    reviewProcess: [
      'isVenueEditor',
      'isEditorInIssueWithArticleInReviewProcess',
      'isEditorInTrackWithArticleInReviewProcess'
    ],
    reviewItem: [
      'isVenueEditor',
      'isReviewer',
      'isEditorInIssueWithArticleInReviewItem',
      'isEditorInTrackWithArticleInReviewItem'
    ],
    featureConfig: ['isVenueEditor'],
    featureState: ['isVenueEditor']
  },
  delete: {
    venue: [],
    issue: ['isVenueEditor'],
    track: ['isVenueEditor'],
    stage: ['isVenueEditor'],
    user: ['isVenueEditor'],
    article: ['isVenueEditor', 'isEditorInArticleTrack', 'isEditorInArticleIssues'],
    comment: [
      'isCommentAuthor',
      'isVenueEditor',
      'isEditorInTrackWithArticleInComment',
      'isEditorInIssueWithArticleInComment'
    ],
    reviewProcess: [
      'isVenueEditor',
      'isEditorInIssueWithArticleInReviewProcess',
      'isEditorInTrackWithArticleInReviewProcess'
    ],
    reviewItem: [
      'isVenueEditor',
      'isReviewer',
      'isEditorInIssueWithArticleInReviewItem',
      'isEditorInTrackWithArticleInReviewItem'
    ],
    featureConfig: ['isVenueEditor'],
    featureState: ['isVenueEditor']
  }
}
module.exports = requiredCapabilities
