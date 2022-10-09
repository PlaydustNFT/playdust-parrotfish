import * as OS from '@opensearch-project/opensearch';
import { Search } from '@opensearch-project/opensearch/api/requestParams';

const host =
    'search-nft-data-fx2hlja7rigtidnfanjzx7km4m.us-east-1.es.amazonaws.com/';
const protocol = 'https';
const auth = 'user:123Asdfg!';

const client = new OS.Client({
    node: protocol + '://' + auth + '@' + host
});

export async function fetchCollections(collectionIDs: string[]) {
    const index = 'nft-collection';
    const body = {
        size: 10000,
        query: {
            bool: {
                should: collectionIDs.map(collectionID => {
                    return {
                        match: {
                            id: collectionID
                        }
                    }
                })
            }
        }
    };

    // Set scroll timeout to 40 seconds.
    const options: Search = {
        index,
        body,
        scroll: '40s'
    };
    const mapper = (collection) => collection._source;

    let result = await scrollFetch(options, mapper);
    return result;
}

export async function fetchCollectionNFTs(collectionID: string) {
    const index = 'nft-metadata';
}

async function scrollFetch(options: Search, mapper) {
    const cumulativeResult = [];
    for await (const document of client.helpers.scrollSearch(options)) {
        cumulativeResult.push(...document.body.hits.hits.map(mapper));
    }
    return cumulativeResult;
}