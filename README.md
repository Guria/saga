# Saga

Backend for Vega.

# About the name

Saga is an abbreviation of Sagittarus A\* which is the radio source likely to be the supermassive black hole at the center of the milky way galaxy ♐

# Security

`src/security/SecurityManager.js` is where we establishe who can perform what kind of CRUD action. Briefly, what happens is that a filter is applied to the queries or mutations a user wants to perform. Say we have a user who is submitter on article `article-123`, a simplified filter might look like this:

```
{
  read: '(_type == "article" && _id in ["article-123"]) || (_type == "venue")',
  update: '(_type == "article" && _id in ["article-123"])',
  create: 'false',
  delete: 'false'
}
```

(There will also be filters concerning the other docment types, not included here for brevity)

This filter is applied to any actions the user performs, giving her read access to her own article and all venues. She also has update access to her own article, but not the venue. Create and delete access is denied on all articles and venues.

Under the hood the, `src/security/AccessFilterBuilder.js` decides which capabilities a user needs to perform CRUD actions on the various document types. Which capabilities a given user has is determined by `src/security/UserCapabilityDiviner.js`

UserCapabilityDiviner has extensive tests. If something seems amiss, this is probably good place to start debugging.
