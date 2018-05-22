module.exports = (req, res, next) => {
  res.json({
    document: {
      _id: 'file-foo',
      _type: 'sanity.fileAsset',
      url: 'https://foo.bar.baz/files/dataset/priv.pdf'
    }
  })
}
