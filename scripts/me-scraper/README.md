# Description

Scraper for Magic Eden data.
The scraper is able to send requests to Magic Eden `rpc` endpoint which
takes a custom query as an input.

This endpoint is guarded by cloudflare anti-bot protection.
In order to get past the protection the script uses `puppeteer`
library which uses browser binaries from the browser installed in the host OS.

The fact that it uses browser binaries which cannot be obtained through
npm makes it hard to package this script into a lambda function.

The script is run manually for now.

The script writes the scraped data into 2 files:
* `collectionMetadata.json` - ME collections metadata
* `collectionNFTs.json` - all the NFTs and their metadata for each collection from the collections metadata file

*Note: The script does no type checking whatsoever, its only purpose is scraping and saving the raw ME data.*

# Usage
First install the required npm packages:
```
npm install
```

Then install the browser that puppeteer needs to use with your prefered package manager:

```
sudo apt install google-chrome-stable
```

Then install all the required binaries required by `puppeteer`:
```
sudo apt-get install -yq --no-install-recommends libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 libnss3
```

Finally, run the scraper:
```
npm run start
```