*[^.title == title]
=>






^ = parent, source = parent siblings



^._ref == _id
_id in $[]._ref

_createdAt > ^._createdAt
_createdAt > min(source[]._createdAt)

_createdAt < ^._createdAt
_createdAt < max(source[].created)

tag in ^.tags
tag in union(...source[].tags)

category != ^.category
!(category in uniq(source[].category))

priority != ^.priority
!(priority in uniq(source[].priority))


ref->
*[ref._ref == _id][0]

*{
  authors[]->
}
*{
  "authors": authors[] | *[^._ref == _id][0]
}
*{
  "authors": *[_id in ^.authors[]._ref]
}


ref[]->title



map(ref[], (*[_id in source[].ref[]._ref])[_id == ^._ref][0].title)

ref[] | (*[_id == ^._ref][0].title)


map(ref[]._ref, *[_id in ^^[].ref[]._ref]



ref[]->name
=>
((*[_id in glob(ref[]._ref)]))


ref[] | source(_id in glob(^.ref[]._ref)) | [_id == ^._ref]

ref[] | *[^._ref == _id][0]


ref[]->name

ref[] | (*[_id in ^.[].ref[]._ref])) | [^._ref == _id][0].name

(*|mapJoin(ref[]))


