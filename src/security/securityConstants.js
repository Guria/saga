const actions = ['read', 'create', 'update', 'delete']
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

const noAccessFilterExpressions = {
  create: 'false',
  read: 'false',
  update: 'false',
  delete: 'false'
}

const fullAccessFilterExpressions = {
  create: 'true',
  read: 'true',
  update: 'true',
  delete: 'true'
}

const noPermissions = {
  filters: noAccessFilterExpressions,
  grants: {
    read: documentTypes.reduce((obj, documentType) => ({...obj, [documentType]: false}), {}),
    create: documentTypes.reduce((obj, documentType) => ({...obj, [documentType]: false}), {}),
    update: documentTypes.reduce((obj, documentType) => ({...obj, [documentType]: false}), {}),
    delete: documentTypes.reduce((obj, documentType) => ({...obj, [documentType]: false}), {})
  },
  capabilities: {isLoggedInUser: [false]}
}

const adminPermissions = {
  filters: fullAccessFilterExpressions,
  grants: {
    read: documentTypes.reduce((obj, documentType) => ({...obj, [documentType]: true}), {}),
    create: documentTypes.reduce((obj, documentType) => ({...obj, [documentType]: true}), {}),
    update: documentTypes.reduce((obj, documentType) => ({...obj, [documentType]: true}), {}),
    delete: documentTypes.reduce((obj, documentType) => ({...obj, [documentType]: true}), {})
  },
  capabilities: {isLoggedInUser: [true], isAdminUser: [true]}
}

module.exports = {
  adminPermissions,
  noPermissions,
  noAccessFilterExpressions,
  fullAccessFilterExpressions,
  actions,
  documentTypes
}