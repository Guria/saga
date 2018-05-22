module.exports = (req, res, next) => {
  res.json({
    document: {
      _id: 'image-FNjkangjn-100x100-jpg',
      _type: 'sanity.imageAsset',
      url: 'https://foo.bar.baz/images/dataset/foo.jpg'
    }
  })
}
