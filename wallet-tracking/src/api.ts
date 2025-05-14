import axios from 'axios';

const getTxInfo = async (tx_hash: string) => {
    const config = {
        method: 'get',
        url: `https://api-v2.solscan.io/v2/transaction/detail`,
        params: {
            tx: tx_hash
        },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'Origin': 'https://solscan.io',
            'Referer': 'https://solscan.io/',
            'sol-aut': 'Ql=4CPPmh2wNLSdXh0JvxQGo7cUhB9dls0fK=Gri',
        },
    };
    const data = await axios(config)

    return data.data
}

export {
    getTxInfo
}