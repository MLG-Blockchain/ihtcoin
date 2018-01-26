require('babel-register');
require('babel-polyfill');


module.exports = {
    networks: {
        testrpc: {
            host: "localhost",
            port: 8590,
            network_id: "*",
            gas: 4712388
        },
        kovan: {
            host: "localhost",
            port: 8180,
            network_id: "3",
            from: "0x00FcEf22b8e9c3741B0082a8E16DD92c2FE63A32"
            // gas: 1512388
        },
        ropsten: {
            host: "localhost",
            port: 8545,
            network_id: "2",
            from: "0x00F131eD217EC029732235A96EEEe044555CEd4d"
        },
        mainnet: {
            host: "localhost",
            port: 8545,
            network_id: "1"
        }
    }
};