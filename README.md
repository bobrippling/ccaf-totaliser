# Files

`index.html` - all the "code" lives here, including hardcoded counts for attempts, fails and passes

`update-counts.js` - a hacky script to update the counts in `index.html`. Run it and it'll tell you how to call it

`tailwind.js` - vendored this in since there were a few transient problems with `unpkg` and tailwind's CDN


# Deployment

Pushes to `main` trigger GH actions which deploys automatically (to GH pages)
