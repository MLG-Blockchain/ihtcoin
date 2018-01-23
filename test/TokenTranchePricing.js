'use strict';

const assertJump = require('./helpers/assertJump');
var Pricing = artifacts.require("./TokenTranchePricing.sol");

function etherInWei(x) {
    return web3.toBigNumber(web3.toWei(x, 'ether')).toNumber();
}


function tokenPriceInWeiFromTokensPerEther(x) {
    if (x == 0) return 0;
    return Math.floor(web3.toWei(1, 'ether') / x);
}

function tokenInSmallestUnit(tokens, _tokenDecimals) {
    return tokens * Math.pow(10, _tokenDecimals);
}

contract('TokenTranchePricing', function(accounts) {
    var _tokenDecimals = 8;
    var _tranches = [
        tokenInSmallestUnit(0,_tokenDecimals), tokenPriceInWeiFromTokensPerEther(1500),
        tokenInSmallestUnit(5000,_tokenDecimals), tokenPriceInWeiFromTokensPerEther(1300),
        tokenInSmallestUnit(20000,_tokenDecimals), tokenPriceInWeiFromTokensPerEther(1100),
        tokenInSmallestUnit(50000,_tokenDecimals), tokenPriceInWeiFromTokensPerEther(1050),
        tokenInSmallestUnit(75000,_tokenDecimals), tokenPriceInWeiFromTokensPerEther(0)
    ];

    var pricingInstance;

    beforeEach(async() => {
        pricingInstance = await Pricing.new(_tranches);
    });

    it('Creation: Pricing tranches count must be able to initialize properly.', async function() {
        assert.equal(await pricingInstance.trancheCount.call(), _tranches.length / 2);
        // assert.equal(2,2);
    });

    it('Creation: Pricing tranches must be able to initialized properly.', async function() {
        var i = 0;
        for (i = 0; i < _tranches.length / 2; i = i + 1) {
            var data = await pricingInstance.tranches.call(i);
            assert.equal(web3.toBigNumber(data[0]).toNumber(), _tranches[i * 2]);
            assert.equal(web3.toBigNumber(data[1]).toNumber(), _tranches[i * 2 + 1]);
        }
    });

    it('PreICOAddress: Owner must be able to set pre ICO address.', async function() {
        await pricingInstance.setPreicoAddress(accounts[3], tokenPriceInWeiFromTokensPerEther(2000));
    });

    it('PreICOAddress: Non-Onwer must be not able to set pre ICO address.', async function() {
        try {
            await pricingInstance.setPreicoAddress(accounts[3], tokenPriceInWeiFromTokensPerEther(2000), { from: accounts[2] });
        } catch (error) {
            return assertJump(error);
        }
        assert.fail('should have thrown exception before');
    });

    it('Calculation: Pricing must be calculated properly.', async function() {
        var value;
        var weiRaised;
        var tokensSold;
        var buyer = accounts[2];
        var slab = 0;

        value = etherInWei(1);
        weiRaised = 0;
        tokensSold = 0;
        buyer = accounts[2];
        slab = 0;

        assert.equal(web3.toBigNumber(await pricingInstance.calculatePrice(value, weiRaised, tokensSold, buyer, _tokenDecimals)).toNumber(), Math.floor(tokenInSmallestUnit(value / _tranches[2 * slab + 1], _tokenDecimals)));

        value = etherInWei(1);
        weiRaised = etherInWei(2);
        tokensSold = tokenInSmallestUnit(3000, _tokenDecimals);
        buyer = accounts[2];
        slab = 0;

        assert.equal(web3.toBigNumber(await pricingInstance.calculatePrice(value, weiRaised, tokensSold, buyer, _tokenDecimals)).toNumber(), Math.floor(tokenInSmallestUnit(value / _tranches[2 * slab + 1], _tokenDecimals)));

        value = etherInWei(3);
        weiRaised = etherInWei(7);
        tokensSold = tokenInSmallestUnit(10100, _tokenDecimals);
        buyer = accounts[2];
        slab = 1;

        assert.equal(web3.toBigNumber(await pricingInstance.calculatePrice(value, weiRaised, tokensSold, buyer, _tokenDecimals)).toNumber(), Math.floor(tokenInSmallestUnit(value / _tranches[2 * slab + 1], _tokenDecimals)));
    });

    it('Calculation: Pricing for pre ico user must be calculated properly.', async function() {
        await pricingInstance.setPreicoAddress(accounts[3], tokenPriceInWeiFromTokensPerEther(2000));
        var value = etherInWei(3);
        var weiRaised = etherInWei(7);
        var tokensSold = tokenInSmallestUnit(10100, _tokenDecimals);
        var buyer = accounts[3];
        assert.equal(web3.toBigNumber(await pricingInstance.calculatePrice(value, weiRaised, tokensSold, buyer, _tokenDecimals)).toNumber(), Math.floor(tokenInSmallestUnit(value / tokenPriceInWeiFromTokensPerEther(2000), _tokenDecimals)));
    });

    it('Transfer: ether transfer to pricing address should fail.', async function() {

        try {
            await web3.eth.sendTransaction({ from: accounts[0], to: pricingInstance.address, value: web3.toWei("10", "Ether") });
        } catch (error) {
            return assertJump(error);
        }
        assert.fail('should have thrown exception before');
    });




});