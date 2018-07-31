* [ ] Make mapJoin correctly correlate parent values to results
* [ ] Validate that a typical block text cacophony of joins etc works
* [ ] Consider detecting equivalent join queries, perhaps cleverly passing through un-optimizable queries so that exotic joins work, albeit slowly

* [ ] Refactor boxing. Make general container type? Need to keep track of start-index for collections even after unboxing
* [x] a[]->

* [x] Order by arbitrary expression
* [x] Exec pipelines in constraint expressions
* [x] Joins
* [ ] Implement correct array accessors a[].b[].c
* [ ] Optimizer rewrites x in 1...2 to (x >= 1 && x < 2)
* [ ] Fix string collation in relation to inequality operators
* [ ] Implement match
* [ ] Make optimizer
* [ ] Cache constant expressions during evaluation
* [ ] Helpful error messages refering back to GROQ-src
* [ ] Propagate helpful error messages from parser
* [ ] Generalize source caching to cache all constant subexprs

* [ ] Implement Deep Equals for == and in
* [ ] Support inline join *[_id=="refs"][0].refs[]->{_id, _type}

Always just naïvely expand joins, then leave to optimizer to write efficient constraints?

*{"a": *[_createdAt < ^._createdAt>]} => _createdAt < v1 || _createdAt < v2 || _createdAt < v3 ===> _createdAt < max(v1,v2,v3)

ref[] | (*[_id == ^._ref][0]) => ref[] | ((*[_id in all(^._ref)]))
